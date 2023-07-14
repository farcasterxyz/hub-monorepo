import {
  FNameRegistryClientInterface,
  FNameRegistryEventsProvider,
  FNameTransfer,
} from "./fnameRegistryEventsProvider.js";
import { jestRocksDB } from "../storage/db/jestUtils.js";
import Engine from "../storage/engine/index.js";
import { ViemLocalEip712Signer, makeUserNameProofClaim, FarcasterNetwork } from "@farcaster/core";
import { MockHub } from "../test/mocks.js";
import { getUserNameProof } from "../storage/db/nameRegistryEvent.js";
import { utf8ToBytes } from "@noble/curves/abstract/utils";
import { generatePrivateKey, privateKeyToAccount, PrivateKeyAccount, Address } from "viem/accounts";
import { bytesToHex } from "viem";

class MockFnameRegistryClient implements FNameRegistryClientInterface {
  private transfersToReturn: FNameTransfer[][] = [];
  private minimumSince = 0;
  private timesToThrow = 0;
  private account: PrivateKeyAccount;
  private signer: ViemLocalEip712Signer;
  private signerAddress: Address;

  constructor(account: PrivateKeyAccount) {
    this.account = account;
    this.signer = new ViemLocalEip712Signer(account);
    this.signerAddress = account.address;
  }

  setTransfersToReturn(transfers: FNameTransfer[][]) {
    this.transfersToReturn = transfers;
    this.transfersToReturn.flat(2).forEach(async (t) => {
      if (t.server_signature === "") {
        t.server_signature = bytesToHex(
          (
            await this.signer.signUserNameProofClaim(
              makeUserNameProofClaim({
                name: t.username,
                owner: t.owner,
                timestamp: t.timestamp,
              }),
            )
          )._unsafeUnwrap(),
        );
      }
    });
  }

  setMinimumSince(minimumSince: number) {
    this.minimumSince = minimumSince;
  }

  setSignerAddress(address: Address) {
    this.signerAddress = address;
  }

  throwOnce() {
    this.timesToThrow = 1;
  }

  async getTransfers(since: 0): Promise<FNameTransfer[]> {
    if (this.timesToThrow > 0) {
      this.timesToThrow--;
      throw new Error("connection failed");
    }
    expect(since).toBeGreaterThanOrEqual(this.minimumSince);
    const transfers = this.transfersToReturn.shift();
    if (!transfers) {
      return Promise.resolve([]);
    }
    return Promise.resolve(transfers);
  }

  async getSigner(): Promise<string> {
    return this.signerAddress;
  }
}

describe("fnameRegistryEventsProvider", () => {
  const db = jestRocksDB("protobufs.fnameRegistry.test");
  const engine = new Engine(db, FarcasterNetwork.TESTNET);
  const hub = new MockHub(db, engine);
  let provider: FNameRegistryEventsProvider;
  let mockFnameRegistryClient: MockFnameRegistryClient;
  const account = privateKeyToAccount(generatePrivateKey());

  const transferEvents: FNameTransfer[] = [
    {
      id: 1,
      username: "test1",
      from: 0,
      to: 1,
      timestamp: 1686291736947,
      owner: account.address,
      server_signature: "",
    },
    {
      id: 2,
      username: "test2",
      from: 0,
      to: 2,
      timestamp: 1686291740231,
      owner: account.address,
      server_signature: "",
    },
    {
      id: 3,
      username: "test3",
      from: 0,
      to: 3,
      timestamp: 1686291751362,
      owner: account.address,
      server_signature: "",
    },
    {
      id: 4,
      username: "test3",
      from: 3,
      to: 0,
      timestamp: 1686291752129,
      owner: account.address,
      server_signature: "",
    },
  ];

  beforeEach(() => {
    mockFnameRegistryClient = new MockFnameRegistryClient(account);
    mockFnameRegistryClient.setTransfersToReturn([
      transferEvents.slice(0, 1),
      transferEvents.slice(1, 2),
      transferEvents.slice(2),
    ]);
    provider = new FNameRegistryEventsProvider(mockFnameRegistryClient, hub);
  });

  afterEach(async () => {
    await provider.stop();
  });

  describe("syncHistoricalEvents", () => {
    it("fetches all events from the beginning", async () => {
      await provider.start();
      expect(await getUserNameProof(db, utf8ToBytes("test1"))).toBeTruthy();
      expect(await getUserNameProof(db, utf8ToBytes("test2"))).toBeTruthy();
      await expect(getUserNameProof(db, utf8ToBytes("test4"))).rejects.toThrowError("NotFound");
      expect((await hub.getHubState())._unsafeUnwrap().lastFnameProof).toEqual(transferEvents[3]?.id);
    });

    it("fetches events from where it left off", async () => {
      await hub.putHubState({ lastFnameProof: transferEvents[0]?.id ?? 0, lastEthBlock: 0 });
      mockFnameRegistryClient.setMinimumSince(transferEvents[0]?.id ?? 0);
      await provider.start();
      expect(await getUserNameProof(db, utf8ToBytes("test2"))).toBeTruthy();
      expect((await hub.getHubState())._unsafeUnwrap().lastFnameProof).toEqual(transferEvents[3]?.id);
    });

    it("does not fail on errors", async () => {
      mockFnameRegistryClient.throwOnce();
      await provider.start();
    });
  });

  describe("mergeTransfers", () => {
    it("deletes a proof from the db when a username is unregistered", async () => {
      await provider.start();
      await expect(getUserNameProof(db, utf8ToBytes("test3"))).rejects.toThrowError("NotFound");
    });

    it("does not fail if there are errors merging events", async () => {
      // Return duplicate events
      mockFnameRegistryClient.setTransfersToReturn([transferEvents, transferEvents]);
      await provider.start();
      expect(await getUserNameProof(db, utf8ToBytes("test2"))).toBeTruthy();
    });

    it("does not merge when the signature is invalid", async () => {
      const invalidEvent: FNameTransfer = {
        id: 1,
        username: "test1",
        from: 0,
        to: 1,
        timestamp: 1686291736947,
        owner: account.address,
        server_signature: "",
      };
      invalidEvent.server_signature = "0x8773442740c17c9d0f0b87022c722f9a136206ed";
      mockFnameRegistryClient.setTransfersToReturn([[invalidEvent]]);
      await provider.start();
      await expect(getUserNameProof(db, utf8ToBytes("test1"))).rejects.toThrowError("NotFound");
    });

    it("succeeds for a known proof", async () => {
      const proof = {
        id: 1,
        timestamp: 1628882891,
        username: "farcaster",
        owner: "0x8773442740c17c9d0f0b87022c722f9a136206ed" as Address,
        from: 0,
        to: 1,
        user_signature:
          "0xa6fdd2a69deab5633636f32a30a54b21b27dff123e6481532746eadca18cd84048488a98ca4aaf90f4d29b7e181c4540b360ba0721b928e50ffcd495734ef8471b",
        server_signature:
          "0xb7181760f14eda0028e0b647ff15f45235526ced3b4ae07fcce06141b73d32960d3253776e62f761363fb8137087192047763f4af838950a96f3885f3c2289c41b",
      };

      mockFnameRegistryClient.setTransfersToReturn([[proof]]);
      mockFnameRegistryClient.setSignerAddress("0xBc5274eFc266311015793d89E9B591fa46294741");
      await provider.start();
      expect(await getUserNameProof(db, utf8ToBytes("farcaster"))).toBeTruthy();
    });
  });

  test("throws for invalid signer", async () => {
    mockFnameRegistryClient.setSignerAddress("0x");
    await expect(provider.start()).rejects.toThrowError("Failed to parse server address");
  });
});
