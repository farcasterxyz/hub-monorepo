import { Cast, Root, RootMessageBody, SignedCastChain, SignedMessage } from '~/types';
import { hashFCObject, hashMessage } from '~/utils';
import { utils } from 'ethers';
import { ok, err, Result } from 'neverthrow';
import { isCast, isCastNew, isRoot } from '~/types/typeguards';

export interface ChainFingerprint {
  rootBlockNum: number;
  rootBlockHash: string;
  lastMessageIndex: number | undefined;
  lastMessageHash: string | undefined;
}

export interface Signer {
  address: string;
  blockHash: string;
  blockNumber: number;
  logIndex: number;
}

/** The Engine receives messages and determines the current state Farcaster network */
class Engine {
  /** Mapping of usernames to their casts, which are stored as a series of signed chains */
  private _castChains: Map<string, SignedCastChain[]>;
  private _users: Map<string, Signer[]>;

  constructor() {
    this._castChains = new Map();
    this._users = new Map();
  }

  getSigners(username: string): Signer[] | undefined {
    return this._users.get(username);
  }

  getChains(username: string): SignedCastChain[] {
    const chainList = this._castChains.get(username);
    return chainList || [];
  }

  /** Get a specific valid SignedCastChain from a user */
  getChain(username: string, rootBlockNum: number): SignedCastChain | undefined {
    const chainList = this._castChains.get(username);
    return chainList?.find((chain) => chain[0].message.rootBlock === rootBlockNum);
  }

  /** Get the most recent, valid SignedCastChain from a user */
  getLastChain(username: string): SignedCastChain | undefined {
    const chainList = this._castChains.get(username);
    return chainList ? chainList[chainList.length - 1] : undefined;
  }

  /** Get the most recent, valid Cast from a user */
  getLastMessage(username: string): SignedMessage | undefined {
    const chain = this.getLastChain(username);
    return chain ? chain[chain.length - 1] : undefined;
  }

  getChainFingerprints(username: string): ChainFingerprint[] {
    const chains = this._castChains.get(username);
    if (!chains) {
      return [];
    }

    const fingerprints = chains.map((chain) => {
      const root = chain[0];
      const length = chain.length;
      const lastMessage = chain[length - 1];

      // TODO: Consider returning a zero value for these or otherwise changing the data structure.
      const lastMessageIndex = length > 1 ? lastMessage.message.index : undefined;
      const lastMessageHash = length > 1 ? lastMessage.hash : undefined;

      return {
        rootBlockNum: root.message.rootBlock,
        rootBlockHash: root.message.body.blockHash,
        lastMessageIndex,
        lastMessageHash,
      };
    });

    return fingerprints;
  }

  /** Add a new Root into a user's current SignedCastChain[], if valid */
  addRoot(root: Root): Result<void, string> {
    if (!isRoot(root) || !this.validateMessage(root)) {
      return err('Invalid root');
    }

    let chains = this._castChains.get(root.message.username);

    // If the user's map entry hasn't been initialized yet, set it to an empty array.
    if (!chains) {
      chains = [];
      this._castChains.set(root.message.username, chains);
    }

    const rootChain = chains.map((chain) => chain[0]);
    const index = this.rootIndex(root, rootChain);
    const nextIndex = this.nextRootIndex(root, rootChain);
    const prevIndex = this.prevRootIndex(root, rootChain);

    // Replace all roots with the new root.
    if (index === rootChain.length && prevIndex === 'none') {
      this._castChains.set(root.message.username, [[root]]);
      return ok(undefined);
    }

    // Insert root at the end, keeping all roots.
    if (index === rootChain.length && prevIndex === rootChain.length - 1) {
      chains.push([root]);
      return ok(undefined);
    }

    // Insert root at the beginning of the chain, keeping all roots.
    if (index === 0 && (prevIndex === 'none' || prevIndex === 'unknown')) {
      // Since root must go at beginning and has no prevIndex, let's make sure that that the chain is emppty
      // or that the nextIndex is the earliest root in the current chain.
      if (nextIndex === 0 || chains.length === 0) {
        chains.unshift([root]);
        return ok(undefined);
      }
    }

    return err('No valid location');

    // TODO: Handle conflicts by killing a user's state.
    // TODO: Handle stitch messages.
    // TODO: Should we be enforcing the signedAt property ordering with roots? (we do with casts...)
  }

  /** Add a new Cast into an existing user's SignedCastChain[], if valid */
  addCast(cast: Cast): Result<void, string> {
    const username = cast.message.username;

    const signerChanges = this._users.get(username);
    if (!signerChanges) {
      return err('addCast: unknown user');
    }

    const castChains = this._castChains.get(username);

    if (!castChains || castChains.length === 0) {
      return err('addCast: unknown chain');
    }

    const matchingChain = castChains.find((chain) => chain[0].message.rootBlock === cast.message.rootBlock);
    // TODO: If there is a stitch block on the next root, make sure it hasn't prevented the ingestion of new
    // messages on this chain.

    if (!matchingChain) {
      return err('addCast: unknown chain');
    }

    if (!this.validateMessageChain(cast, matchingChain[matchingChain.length - 1])) {
      return err('addCast: invalid message');
    }
    matchingChain.push(cast);

    // TODO: If it was a delete, inspect all chains and remove the text of the cast cast.

    return ok(undefined);
  }

  /** Add a new SignerChange event into the user's Signer Change array  */
  addSignerChange(username: string, newSignerChange: Signer): Result<void, string> {
    const signerChanges = this._users.get(username);

    if (!signerChanges) {
      this._users.set(username, [newSignerChange]);
      return ok(undefined);
    }

    let signerIdx = 0;

    // Insert the SignerChange into the array such that the array maintains ascending order
    // of blockNumbers, followed by logIndex (for changes that occur within the same block).
    for (const sc of signerChanges) {
      if (sc.blockNumber < newSignerChange.blockNumber) {
        signerIdx++;
      } else if (sc.blockNumber === newSignerChange.blockNumber) {
        if (sc.logIndex < newSignerChange.logIndex) {
          signerIdx++;
        } else if (sc.logIndex === newSignerChange.logIndex) {
          return err(`addSignerChange: duplicate signer change ${sc.blockHash}:${sc.logIndex}`);
        }
      }
    }

    signerChanges.splice(signerIdx, 0, newSignerChange);
    return ok(undefined);
  }

  resetChains(): void {
    this._castChains = new Map();
  }

  resetSigners(): void {
    this._users = new Map();
  }

  private validateMessageChain(message: SignedMessage, prevMessage: SignedMessage): boolean {
    if (isCast(message)) {
      if (isRoot(prevMessage) && prevMessage.message.body.chainType !== 'cast') {
        return false;
      }

      if (!isCast(prevMessage) && !isRoot(prevMessage)) {
        return false;
      }
    }

    const newProps = message.message;
    const prevProps = prevMessage.message;

    if (
      newProps.prevHash !== prevMessage.hash ||
      newProps.signedAt < prevProps.signedAt ||
      newProps.rootBlock !== prevProps.rootBlock ||
      newProps.index !== prevProps.index + 1 ||
      message.signer !== prevMessage.signer
    ) {
      return false;
    }

    return this.validateMessage(message);
  }

  /** Determine the valid signer address for a username at a block */
  private signerForBlock(username: string, blockNumber: number): string | undefined {
    const signerChanges = this._users.get(username);

    if (!signerChanges) {
      return undefined;
    }

    let signer = undefined;

    for (const sc of signerChanges) {
      if (sc.blockNumber <= blockNumber) {
        signer = sc.address;
      }
    }

    return signer;
  }

  private validateMessage(message: SignedMessage): boolean {
    // 1. Check that the signer was valid for the block in question.
    const expectedSigner = this.signerForBlock(message.message.username, message.message.rootBlock);
    if (!expectedSigner || expectedSigner !== message.signer) {
      return false;
    }

    // 2. Check that the hash value of the message was computed correctly.
    const computedHash = hashMessage(message);
    if (message.hash !== computedHash) {
      return false;
    }

    // 3. Check that the signature is valid
    const recoveredAddress = utils.recoverAddress(message.hash, message.signature);
    if (recoveredAddress !== message.signer) {
      return false;
    }

    if (isCast(message)) {
      return this.validateCast(message);
    }

    if (isRoot(message)) {
      return this.validateRoot(message);
    }

    // TODO: check that the schema is a valid and known schema.
    // TODO: check that all required properties are present.
    // TODO: check that username is known to the registry
    // TODO: check that the signer is the owner of the username.
    return false;
  }

  private validateRoot(root: Root): boolean {
    if (root.message.body.blockHash.length !== 66) {
      return false;
    }
    // TODO: Check that the blockHash is a real block and it's block matches rootBlock.
    // TODO: Check that prevRootBlockHash is either 0x0 or root block that we know about.
    // TODO: Validate the chain type.
    return !!root;
  }

  private validateCast(cast: Cast): boolean {
    if (isCastNew(cast)) {
      const text = cast.message.body._text;
      const embed = cast.message.body._embed;

      if (text) {
        const computedTextHash = utils.keccak256(utils.toUtf8Bytes(text));
        if (cast.message.body.textHash !== computedTextHash) {
          return false;
        }

        if (text.length > 280) {
          return false;
        }
      }

      if (embed) {
        const computedEmbedHash = hashFCObject(embed);
        if (cast.message.body.embedHash !== computedEmbedHash) {
          return false;
        }

        if (embed.items.length > 2) {
          return false;
        }
      }
    }
    return !!cast;
  }

  private rootIndex(root: Root, rootChain: SignedMessage<RootMessageBody>[]): number {
    for (let i = 0; i < rootChain.length; i++) {
      if (rootChain[i].message.rootBlock > root.message.rootBlock) return i;
    }
    return rootChain.length;
  }

  private prevRootIndex(root: Root, rootChain: SignedMessage<RootMessageBody>[]): 'none' | 'unknown' | number {
    if (root.message.body.prevRootBlockHash === '0x0') {
      return 'none';
    }

    for (let i = 0; i < rootChain.length; i++) {
      if (rootChain[i].message.body.blockHash === root.message.body.prevRootBlockHash) return i;
    }

    return 'unknown';
  }

  private nextRootIndex(root: Root, rootChain: SignedMessage<RootMessageBody>[]): number | 'none' {
    for (let i = 0; i < rootChain.length; i++) {
      if (rootChain[i].message.body.prevRootBlockHash === root.message.body.blockHash) return i;
    }
    return 'none';
  }
}

export default Engine;
