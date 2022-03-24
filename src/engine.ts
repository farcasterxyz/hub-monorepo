import { Cast, Root, RootMessageBody, SignedCastChain, SignedMessage } from '~/types';
import { hashMessage } from '~/utils';
import { utils } from 'ethers';
import { ok, err, Result } from 'neverthrow';
import { isCast, isRoot } from '~/types/typeguards';

export interface ChainFingerprint {
  rootBlockNum: number;
  rootBlockHash: string;
  lastMessageIndex: number | undefined;
  lastMessageHash: string | undefined;
}

/** The Engine receives messages and determines the current state Farcaster network */
class Engine {
  /** Mapping of usernames to their casts, which are stored as a series of signed chains */
  private _castChains: Map<string, SignedCastChain[]>;
  private _validUsernames: Array<string>;

  constructor() {
    this._castChains = new Map();
    this._validUsernames = ['alice'];
  }

  getCastChains(username: string): SignedCastChain[] {
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
  addCast(cast: Cast): void {
    const username = cast.message.username;
    const castChains = this._castChains.get(username);

    if (!castChains || castChains.length === 0) {
      console.log("Can't add cast to unknown user");
      return;
    }

    const matchingChain = castChains.find((chain) => chain[0].message.rootBlock === cast.message.rootBlock);
    // TODO: If there is a stitch block on the next root, make sure it hasn't prevented the ingestion of new
    // messages on this chain.

    if (!matchingChain) {
      console.log("Can't add cast to unknown chain");
      return;
    }

    if (this.validateMessageChain(cast, matchingChain[matchingChain.length - 1])) {
      matchingChain.push(cast);
    }
  }

  reset(): void {
    this._castChains = new Map();
  }

  private validateMessageChain(message: SignedMessage, prevMessage?: SignedMessage): boolean {
    const newProps = message.message;

    // TODO: is this necessary?
    if (!prevMessage) {
      if (newProps.index !== 0 || newProps.prevHash !== '0x0' || newProps.signedAt < 0) {
        return false;
      }

      // TODO: If the previous mesage is a root, check that the rootBlock is set correctly.
    } else {
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
    }

    return this.validateMessage(message);
  }

  private validateMessage(message: SignedMessage): boolean {
    if (this._validUsernames.indexOf(message.message.username) === -1) {
      return false;
    }

    // Check that the hash value of the message was computed correctly.
    const computedHash = hashMessage(message);
    if (message.hash !== computedHash) {
      return false;
    }

    // Check that the signature is valid
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
    // TODO: Check that the text value is hashed correctly.
    // TODO: Check that this is a valid cast in chain in strict mode.
    // TODO: Enforce maximum numbber and size of attachments
    // TODO: enforce maximum text length.
    // TODO: enforce correct hashing of values.
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
