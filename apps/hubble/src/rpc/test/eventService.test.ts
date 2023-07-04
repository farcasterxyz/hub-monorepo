/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  Message,
  FarcasterNetwork,
  IdRegistryEvent,
  NameRegistryEvent,
  SignerAddMessage,
  CastAddMessage,
  ReactionAddMessage,
  HubEventType,
  HubEvent,
  SubscribeRequest,
  isMergeMessageHubEvent,
  isPruneMessageHubEvent,
  isRevokeMessageHubEvent,
  isMergeIdRegistryEventHubEvent,
  isMergeNameRegistryEventHubEvent,
  Factories,
  getInsecureHubRpcClient,
  HubRpcClient,
  ClientReadableStream,
  UserNameProof,
  isMergeUsernameProofHubEvent,
} from "@farcaster/hub-nodejs";
import Server from "../server.js";
import { jestRocksDB } from "../../storage/db/jestUtils.js";
import Engine from "../../storage/engine/index.js";
import { MockHub } from "../../test/mocks.js";
import { sleep } from "../../utils/crypto.js";

const db = jestRocksDB("rpc.eventService.test");
const engine = new Engine(db, FarcasterNetwork.TESTNET);
const hub = new MockHub(db, engine);

let server: Server;
let client: HubRpcClient;

beforeAll(async () => {
  server = new Server(hub, engine);
  const port = await server.start();
  client = getInsecureHubRpcClient(`127.0.0.1:${port}`);
});

afterAll(async () => {
  await server.stop();
  await engine.stop();
});

const fid = Factories.Fid.build();
const fname = Factories.Fname.build();
const signer = Factories.Ed25519Signer.build();
const custodySigner = Factories.Eip712Signer.build();
let custodyEvent: IdRegistryEvent;
let usernameProof: UserNameProof;
let signerAdd: SignerAddMessage;
let castAdd: CastAddMessage;
let reactionAdd: ReactionAddMessage;
let events: [HubEventType, any][];
let stream: ClientReadableStream<HubEvent>;

beforeEach(async () => {
  events = [];
});

afterEach(() => {
  if (stream) {
    stream.cancel();
  }
});

beforeAll(async () => {
  const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  custodyEvent = Factories.IdRegistryEvent.build({ to: custodySignerKey, fid });
  usernameProof = Factories.UserNameProof.build({ owner: custodySignerKey, name: fname });
  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, signerAddBody: { signer: signerKey } } },
    { transient: { signer: custodySigner } },
  );
  castAdd = await Factories.CastAddMessage.create({ data: { fid } }, { transient: { signer } });
  reactionAdd = await Factories.ReactionAddMessage.create({ data: { fid } }, { transient: { signer } });
});

const setupSubscription = async (
  events: [HubEventType, any][],
  options: { eventTypes?: HubEventType[]; fromId?: number } = {},
): Promise<ClientReadableStream<HubEvent>> => {
  const request = SubscribeRequest.create(options);

  const streamResult = await client.subscribe(request);
  expect(streamResult.isOk()).toBeTruthy();
  const stream = streamResult._unsafeUnwrap();

  stream.on("data", (event: HubEvent) => {
    if (isMergeMessageHubEvent(event)) {
      events.push([event.type, Message.toJSON(event.mergeMessageBody.message!)]);
    } else if (isPruneMessageHubEvent(event)) {
      events.push([event.type, Message.toJSON(event.pruneMessageBody.message!)]);
    } else if (isRevokeMessageHubEvent(event)) {
      events.push([event.type, Message.toJSON(event.revokeMessageBody.message!)]);
    } else if (isMergeIdRegistryEventHubEvent(event)) {
      events.push([event.type, IdRegistryEvent.toJSON(event.mergeIdRegistryEventBody.idRegistryEvent!)]);
    } else if (isMergeNameRegistryEventHubEvent(event)) {
      events.push([event.type, NameRegistryEvent.toJSON(event.mergeNameRegistryEventBody.nameRegistryEvent!)]);
    } else if (isMergeUsernameProofHubEvent(event)) {
      events.push([event.type, UserNameProof.toJSON(event.mergeUsernameProofBody.usernameProof!)]);
    }
  });

  await sleep(100); // Wait for server to start listeners

  return stream;
};

describe("subscribe", () => {
  describe("without type filters", () => {
    test("emits events", async () => {
      stream = await setupSubscription(events);
      await engine.mergeIdRegistryEvent(custodyEvent);
      await engine.mergeMessage(signerAdd);
      await engine.mergeMessage(castAdd);
      await sleep(100); // Wait for server to send events over stream
      expect(events).toEqual([
        [HubEventType.MERGE_ID_REGISTRY_EVENT, IdRegistryEvent.toJSON(custodyEvent)],
        [HubEventType.MERGE_MESSAGE, Message.toJSON(signerAdd)],
        [HubEventType.MERGE_MESSAGE, Message.toJSON(castAdd)],
      ]);
    });
  });

  describe("with one type filter", () => {
    test("emits events", async () => {
      stream = await setupSubscription(events, {
        eventTypes: [HubEventType.MERGE_MESSAGE],
      });

      await engine.mergeIdRegistryEvent(custodyEvent);
      await engine.mergeUserNameProof(usernameProof);
      await engine.mergeMessage(signerAdd);
      await engine.mergeMessage(castAdd);
      await sleep(100); // Wait for server to send events over stream
      expect(events).toEqual([
        [HubEventType.MERGE_MESSAGE, Message.toJSON(signerAdd)],
        [HubEventType.MERGE_MESSAGE, Message.toJSON(castAdd)],
      ]);
    });
  });

  describe("with multiple type filters", () => {
    test("emits events", async () => {
      stream = await setupSubscription(events, {
        eventTypes: [
          HubEventType.MERGE_MESSAGE,
          HubEventType.MERGE_USERNAME_PROOF,
          HubEventType.MERGE_ID_REGISTRY_EVENT,
        ],
      });

      await engine.mergeIdRegistryEvent(custodyEvent);
      await engine.mergeUserNameProof(usernameProof);
      await engine.mergeMessage(signerAdd);
      await engine.mergeMessage(castAdd);
      await sleep(100); // Wait for server to send events over stream
      expect(events).toEqual([
        [HubEventType.MERGE_ID_REGISTRY_EVENT, IdRegistryEvent.toJSON(custodyEvent)],
        [HubEventType.MERGE_USERNAME_PROOF, UserNameProof.toJSON(usernameProof)],
        [HubEventType.MERGE_MESSAGE, Message.toJSON(signerAdd)],
        [HubEventType.MERGE_MESSAGE, Message.toJSON(castAdd)],
      ]);
    });
  });

  describe("with fromId", () => {
    test("emits events from id onwards", async () => {
      await engine.mergeIdRegistryEvent(custodyEvent);
      const idResult = await engine.mergeMessage(signerAdd);
      await engine.mergeMessage(castAdd);
      stream = await setupSubscription(events, { fromId: idResult._unsafeUnwrap() });
      await engine.mergeUserNameProof(usernameProof);
      await engine.mergeMessage(reactionAdd);
      await sleep(100);
      expect(events).toEqual([
        [HubEventType.MERGE_MESSAGE, Message.toJSON(signerAdd)],
        [HubEventType.MERGE_MESSAGE, Message.toJSON(castAdd)],
        [HubEventType.MERGE_USERNAME_PROOF, UserNameProof.toJSON(usernameProof)],
        [HubEventType.MERGE_MESSAGE, Message.toJSON(reactionAdd)],
      ]);
    });

    test("emits events with early id", async () => {
      await engine.mergeIdRegistryEvent(custodyEvent);
      await engine.mergeMessage(signerAdd);

      stream = await setupSubscription(events, { fromId: 1 });

      expect(events).toEqual([
        [HubEventType.MERGE_ID_REGISTRY_EVENT, IdRegistryEvent.toJSON(custodyEvent)],
        [HubEventType.MERGE_MESSAGE, Message.toJSON(signerAdd)],
      ]);
    });

    test("emits events with fromId of 0", async () => {
      await engine.mergeIdRegistryEvent(custodyEvent);
      await engine.mergeMessage(signerAdd);

      stream = await setupSubscription(events, { fromId: 0 });

      expect(events).toEqual([
        [HubEventType.MERGE_ID_REGISTRY_EVENT, IdRegistryEvent.toJSON(custodyEvent)],
        [HubEventType.MERGE_MESSAGE, Message.toJSON(signerAdd)],
      ]);
    });
  });

  describe("with fromId and type filters", () => {
    test("emits events", async () => {
      const nameResult = await engine.mergeUserNameProof(usernameProof);
      await engine.mergeIdRegistryEvent(custodyEvent);
      stream = await setupSubscription(events, {
        fromId: nameResult._unsafeUnwrap(),
        eventTypes: [HubEventType.MERGE_MESSAGE, HubEventType.MERGE_ID_REGISTRY_EVENT],
      });
      await engine.mergeMessage(signerAdd);
      await engine.mergeMessage(castAdd);
      await engine.mergeMessage(reactionAdd);
      await sleep(100);
      expect(events).toEqual([
        [HubEventType.MERGE_ID_REGISTRY_EVENT, IdRegistryEvent.toJSON(custodyEvent)],
        [HubEventType.MERGE_MESSAGE, Message.toJSON(signerAdd)],
        [HubEventType.MERGE_MESSAGE, Message.toJSON(castAdd)],
        [HubEventType.MERGE_MESSAGE, Message.toJSON(reactionAdd)],
      ]);
    });
  });
});
