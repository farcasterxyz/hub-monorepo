import {
  Message,
  FarcasterNetwork,
  LinkAddMessage,
  LinkRequest,
  LinksByFidRequest,
  LinksByTargetRequest,
  Factories,
  HubError,
  getInsecureHubRpcClient,
  HubRpcClient,
  OnChainEvent,
} from "@farcaster/hub-nodejs";
import SyncEngine from "../../network/sync/syncEngine.js";
import Server from "../../rpc/server.js";
import { jestRocksDB } from "../../storage/db/jestUtils.js";
import Engine from "../../storage/engine/index.js";
import { MockHub } from "../../test/mocks.js";
import { setReferenceDateForTest } from "../../utils/versions.js";
import { beforeAll, afterAll, beforeEach, describe, test, expect } from "@jest/globals";
import { getFarcasterTime } from "../../utils";

const db = jestRocksDB("protobufs.rpc.linkService.test");
const network = FarcasterNetwork.TESTNET;
const engine = new Engine(db, network);
const hub = new MockHub(db, engine);

let syncEngine: SyncEngine;
let server: Server;
let client: HubRpcClient;

beforeAll(async () => {
  syncEngine = new SyncEngine(hub, db);
  await syncEngine.start();
  server = new Server(hub, engine, syncEngine);
  const port = await server.start();
  client = getInsecureHubRpcClient(`127.0.0.1:${port}`);
});

afterAll(async () => {
  client.close();
  await syncEngine.stop();
  await server.stop();
  await engine.stop();
});

const fid = Factories.Fid.build();
const signer = Factories.Ed25519Signer.build();
const custodySigner = Factories.Eip712Signer.build();

let custodyEvent: OnChainEvent;
let signerEvent: OnChainEvent;
let storageEvent: OnChainEvent;

let targetFid: number;
let linkAddFollow: LinkAddMessage;
let linkAddEndorse: LinkAddMessage;

beforeAll(async () => {
  setReferenceDateForTest(100000000000000000000000);
  const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  custodyEvent = Factories.IdRegistryOnChainEvent.build({ fid }, { transient: { to: custodySignerKey } });
  signerEvent = Factories.SignerOnChainEvent.build({ fid }, { transient: { signer: signerKey } });
  storageEvent = Factories.StorageRentOnChainEvent.build({ fid });

  targetFid = Factories.Fid.build();

  linkAddFollow = await Factories.LinkAddMessage.create(
    { data: { fid, linkBody: { type: "follow", targetFid: targetFid } } },
    { transient: { signer } },
  );

  linkAddEndorse = await Factories.LinkAddMessage.create(
    {
      data: {
        fid,
        linkBody: { type: "endorse", targetFid: targetFid },
        timestamp: linkAddFollow.data.timestamp + 1,
      },
    },
    { transient: { signer } },
  );
});

describe("getLink", () => {
  beforeEach(async () => {
    await engine.mergeOnChainEvent(custodyEvent);
    await engine.mergeOnChainEvent(signerEvent);
    await engine.mergeOnChainEvent(storageEvent);
  });

  test("succeeds with follow", async () => {
    await engine.mergeMessage(linkAddFollow);

    const result = await client.getLink(
      LinkRequest.create({ fid, linkType: linkAddFollow.data.linkBody.type, targetFid: targetFid }),
    );

    expect(Message.toJSON(result._unsafeUnwrap())).toEqual(Message.toJSON(linkAddFollow));
  });

  test("succeeds with mentor", async () => {
    const timestamp = getFarcasterTime()._unsafeUnwrap();
    const linkAddMentor = await Factories.LinkAddMessage.create(
      { data: { fid, network, timestamp, linkBody: { targetFid, type: "mentor" } } },
      { transient: { signer } },
    );
    await engine.mergeMessage(linkAddMentor);

    const result = await client.getLink(
      LinkRequest.create({ fid, linkType: "mentor", targetFid: targetFid }),
    );

    expect(Message.toJSON(result._unsafeUnwrap())).toEqual(Message.toJSON(linkAddMentor));
  });

  test("succeeds with endorse", async () => {
    await engine.mergeMessage(linkAddEndorse);

    const result = await client.getLink(
      LinkRequest.create({ fid, linkType: linkAddEndorse.data.linkBody.type, targetFid: targetFid }),
    );

    expect(Message.toJSON(result._unsafeUnwrap())).toEqual(Message.toJSON(linkAddEndorse));
  });

  test("fails if link is missing", async () => {
    const result = await client.getLink(
      LinkRequest.create({ fid, linkType: linkAddEndorse.data.linkBody.type, targetFid: targetFid }),
    );
    expect(result._unsafeUnwrapErr().errCode).toEqual("not_found");
  });

  test("fails with invalid link type", async () => {
    const result = await client.getLink(
      LinkRequest.create({
        fid,
        targetFid: targetFid,
      }),
    );

    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError("bad_request.validation_failure", "targetId provided without type"),
    );
  });

  test("fails without fid", async () => {
    const targetFid = Factories.Fid.build();
    const result = await client.getLink(LinkRequest.create({ targetFid: targetFid, linkType: "follow" }));
    expect(result._unsafeUnwrapErr()).toEqual(new HubError("bad_request.validation_failure", "fid is missing"));
  });

  describe("getLinksByFid", () => {
    beforeEach(async () => {
      await engine.mergeOnChainEvent(custodyEvent);
      await engine.mergeOnChainEvent(signerEvent);
      await engine.mergeOnChainEvent(storageEvent);
    });

    describe("with messages", () => {
      beforeEach(async () => {
        await engine.mergeMessage(linkAddFollow);
        await engine.mergeMessage(linkAddEndorse);
      });

      test("succeeds without type", async () => {
        const links = await client.getLinksByFid(LinksByFidRequest.create({ fid }));
        expect(links._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(
          [linkAddFollow, linkAddEndorse].map((m) => Message.toJSON(m)),
        );
      });

      test("succeeds with type Follow", async () => {
        const links = await client.getLinksByFid(LinksByFidRequest.create({ fid, linkType: "follow" }));

        expect(links._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(
          [linkAddFollow].map((m) => Message.toJSON(m)),
        );
      });

      test("succeeds with type Endorse", async () => {
        const links = await client.getLinksByFid(LinksByFidRequest.create({ fid, linkType: "endorse" }));
        expect(links._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(
          [linkAddEndorse].map((m) => Message.toJSON(m)),
        );
      });
    });

    test("returns empty array without messages", async () => {
      const links = await client.getLinksByFid(LinksByFidRequest.create({ fid }));
      expect(links._unsafeUnwrap().messages).toEqual([]);
    });
  });

  describe("getLinksByTarget", () => {
    beforeEach(async () => {
      await engine.mergeOnChainEvent(custodyEvent);
      await engine.mergeOnChainEvent(signerEvent);
      await engine.mergeOnChainEvent(storageEvent);
    });

    describe("with messages", () => {
      beforeEach(async () => {
        await engine.mergeMessage(linkAddFollow);
        await engine.mergeMessage(linkAddEndorse);
      });

      test("succeeds without type", async () => {
        const links = await client.getLinksByTarget(LinksByTargetRequest.create({ targetFid: targetFid }));
        expect(links._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(
          [linkAddFollow, linkAddEndorse].map((m) => Message.toJSON(m)),
        );
      });

      test("succeeds with type Follow", async () => {
        const links = await client.getLinksByTarget(
          LinksByTargetRequest.create({ targetFid: targetFid, linkType: "follow" }),
        );
        expect(links._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(
          [linkAddFollow].map((m) => Message.toJSON(m)),
        );
      });

      test("succeeds with type Endorse", async () => {
        const links = await client.getLinksByTarget(
          LinksByTargetRequest.create({ targetFid: targetFid, linkType: "endorse" }),
        );
        expect(links._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(
          [linkAddEndorse].map((m) => Message.toJSON(m)),
        );
      });
    });

    test("returns empty array without messages", async () => {
      const links = await client.getLinksByTarget(LinksByTargetRequest.create({ targetFid: targetFid }));
      expect(links._unsafeUnwrap().messages).toEqual([]);
    });
  });
});
