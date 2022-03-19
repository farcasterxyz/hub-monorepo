import { Cast, isCast, isRoot, Root, SignedCastChain, SignedMessage } from '~/types';
import { hashMessage } from '~/utils';
import { utils } from 'ethers';

/** The Engine receives messages and determines the current state Farcaster network */
class Engine {
  /** Mapping of usernames to their casts, which are stored as a series of signed chains */
  castChains: Map<string, SignedCastChain[]>;

  constructor() {
    this.castChains = new Map();
  }

  /** Get the most recent, valid SignedCastChain from a user */
  getLastChain(username: string): SignedCastChain | undefined {
    const chainList = this.castChains.get(username);
    return chainList ? chainList[chainList.length - 1] : undefined;
  }

  /** Get the most recent, valid Cast from a user */
  getLastMessage(username: string): SignedMessage | undefined {
    const chain = this.getLastChain(username);
    return chain ? chain[chain.length - 1] : undefined;
  }

  /** Add a new Root into a user's current SignedCastChain[], if valid */
  addRoot(root: Root): void {
    if (!isRoot(root) || !this.validateRoot(root)) {
      console.log('invalid root');
      return;
    }

    const chains = this.castChains.get(root.message.username);

    // 1. There are no known chains, so set this as the first one.
    if (!chains) {
      this.castChains.set(root.message.username, [[root]]);
      return;
    }

    // 2. There are known chains, so check that this is the latest.
    const latestChainRoot = chains[chains.length - 1][0];
    if (latestChainRoot.message.rootBlock < root.message.rootBlock) {
      // TODO: If this has no stitch block, discard all previous messages.
      chains.push([root]);
      return;
    }

    // 3. The new root is earlier than previous chains, so insert it if there is
    // a greater root that references it via prevRootBlockHash.
    const roots = chains.map((chain) => chain[0]);
    let idx = 0;

    for (const r of roots) {
      if (
        r.message.rootBlock > root.message.rootBlock &&
        r.message.body.prevRootBlockHash === root.message.body.blockHash
      ) {
        chains.splice(idx, 0, [root]);
      }
      idx++;
    }

    // TODO: Check if there is a conflict (this root has the same blockNum and blockHash as another root).
  }

  /** Add a new Cast into an existing user's SignedCastChain[], if valid */
  addCast(cast: Cast): void {
    const username = cast.message.username;
    const castChains = this.castChains.get(username);

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

  private validateMessageChain(message: SignedMessage, prevMessage?: SignedMessage): boolean {
    const newProps = message.message;

    if (!prevMessage) {
      if (newProps.sequence !== 0 || newProps.prevHash !== '0x0' || newProps.signedAt < 0) {
        return false;
      }

      // TODO: If the previous mesage is a lifeblock, check that the rootBlock is set correctly.
    } else {
      const prevProps = prevMessage.message;

      if (
        newProps.prevHash !== prevMessage.hash ||
        newProps.signedAt < prevProps.signedAt ||
        newProps.rootBlock !== prevProps.rootBlock ||
        newProps.sequence !== prevProps.sequence + 1 ||
        message.signer !== prevMessage.signer
      ) {
        return false;
      }
    }

    return this.validateMessage(message);
  }

  private validateMessage(message: SignedMessage): boolean {
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
    // TODO: Check that the blockHash is a real block and it's block matches rootBlock.
    // TODO: Check that prevRootBlockHash is either 0x0 or root block that we know about.
    return !!root;
  }

  private validateCast(cast: Cast): boolean {
    // TODO: Check that the text value is hashed correctly.
    // TODO: Check that this is a valid cast in chain in strict mode.
    return !!cast;
  }
}

export default Engine;
