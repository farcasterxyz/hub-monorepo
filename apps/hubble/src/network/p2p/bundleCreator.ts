import { Message, MessageBundle } from "@farcaster/hub-nodejs";
import { GossipPublishResult, LibP2PNode } from "./gossipNodeWorker.js";
import { blake3Truncate160 } from "../../utils/crypto.js";

const MAX_BUNDLE_SIZE = 256;
const DEFAULT_BUNDLE_TIME_MS = 1000;

export class BundleCreator {
  private _maxBundleSize: number;
  private _defaultBundleTimeMs: number;

  private _currentBundle: Message[] = [];
  private _bundleIncomingMessages = false;
  private _libp2pNode: LibP2PNode;

  constructor(libp2pNode: LibP2PNode, maxBundleSize = MAX_BUNDLE_SIZE, defaultBundleTimeMs = DEFAULT_BUNDLE_TIME_MS) {
    this._libp2pNode = libp2pNode;
    this._maxBundleSize = maxBundleSize;
    this._defaultBundleTimeMs = defaultBundleTimeMs;

    this.updateIfBundling();

    setInterval(async () => {
      this.updateIfBundling();
      await this.broadcastBundle();
    }, this._defaultBundleTimeMs);
  }

  // Use the % chance of bundling incoming messages to determine whether to bundle incoming messages
  // for the next second
  updateIfBundling() {
    const bundleGossipPercent = this._libp2pNode.getBundleGossipPercent();
    if (bundleGossipPercent === 0) {
      this._bundleIncomingMessages = false;
    } else if (bundleGossipPercent === 1) {
      this._bundleIncomingMessages = true;
    } else {
      // Update whether to bundle incoming messages based on %chance
      this._bundleIncomingMessages = Math.random() < this._libp2pNode.getBundleGossipPercent();
    }
  }

  async broadcastBundle(): Promise<void> {
    if (this._currentBundle.length > 0) {
      const bundle = this._currentBundle;
      this._currentBundle = [];

      // Calculate the hash of the bundle
      const allHashes = Buffer.concat(bundle.map((message) => message.hash ?? new Uint8Array()));
      const bundleHash = blake3Truncate160(allHashes);

      const messageBundle = MessageBundle.create({
        messages: bundle,
        hash: bundleHash,
      });

      await this._libp2pNode.broadcastBundle(messageBundle);
    }
  }

  async gossipMessage(message: Message): Promise<GossipPublishResult> {
    // If we are currently bundling messages, store them in the bundle, else just broadcast them out
    // via the libp2p node
    if (this._bundleIncomingMessages) {
      this._currentBundle.push(message);

      if (this._currentBundle.length >= this._maxBundleSize) {
        await this.broadcastBundle();
        this._currentBundle = [];
      }

      return { bundled: true, publishResults: undefined };
    } else {
      const publishResults = await this._libp2pNode.broadcastMessage(message);
      return { bundled: false, publishResults };
    }
  }
}
