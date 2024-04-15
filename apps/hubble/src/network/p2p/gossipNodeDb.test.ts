import { GossipNode, GossipNodeConfig } from "./gossipNode.js";
import { jestRocksDB } from "../../storage/db/jestUtils.js";
import { PeerId } from "@libp2p/interface";
import { sleepWhile } from "../../utils/crypto.js";
import { ResultAsync } from "neverthrow";
import { FarcasterNetwork } from "@farcaster/core";

const TEST_TIMEOUT_SHORT = 10 * 1000;
const db = jestRocksDB("network.p2p.gossipNodeDb.test");

describe("GossipNode", () => {
  test(
    "adding peers adds to the DB",
    async () => {
      const config1: GossipNodeConfig = {
        db,
        network: FarcasterNetwork.TESTNET,
      };
      const node1 = new GossipNode(config1);
      await node1.start([]);

      const config2: GossipNodeConfig = {
        network: FarcasterNetwork.TESTNET,
      };
      const node2 = new GossipNode(config2);
      await node2.start([]);

      try {
        const dialResult = await node1.connect(node2);
        expect(dialResult.isOk()).toBeTruthy();

        // Make sure that node1 has node2 in it's DB too
        const dbKey = node1.makePeerKey(node2.peerId()?.toString() || "");
        await sleepWhile(async () => (await ResultAsync.fromPromise(db.get(dbKey), (e) => e)).isErr(), 5 * 1000);
        expect((await db.get(dbKey)).toString("ascii")).toBe(node2.multiaddrs()[0]?.toString());

        // Disconnect
        await node1.removePeerFromAddressBook(node2.peerId() as PeerId);

        // Sleep to allow the connection to be closed
        await sleepWhile(async () => (await node1.getPeerAddresses(node2.peerId() as PeerId)).length > 0, 10 * 1000);

        // Make sure the connection is closed
        const other = await node1.getPeerAddresses(node2.peerId() as PeerId);
        expect(other).toEqual([]);
        expect(await node2.allPeerIds()).toEqual([]);

        // Now connect again using the DB
        await node1.connectToDbPeers();

        const other2 = await node1.getPeerAddresses(node2.peerId() as PeerId);
        const na = node2.multiaddrs()[0]?.nodeAddress();

        other2.map((a) => {
          expect(a.nodeAddress().address).toEqual(na?.address);
          expect(a.nodeAddress().port).toEqual(na?.port);
        });
      } finally {
        await node1.stop();
        await node2.stop();
      }
    },
    TEST_TIMEOUT_SHORT,
  );
});
