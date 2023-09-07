import { HttpAPIServer } from "../httpServer.js";
import { jestRocksDB } from "../../storage/db/jestUtils.js";
import {
  bytesToHexString,
  CastAddMessage,
  Factories,
  FarcasterNetwork,
  IdRegistryEvent,
  LinkAddMessage,
  Message,
  MessageType,
  OnChainEvent,
  onChainEventTypeToJSON,
  ReactionAddMessage,
  ReactionType,
  reactionTypeToJSON,
  SignerAddMessage,
  toFarcasterTime,
  UserDataAddMessage,
  UserDataType,
  UsernameProofMessage,
  UserNameType,
  utf8StringToBytes,
  VerificationAddEthAddressMessage,
} from "@farcaster/hub-nodejs";
import Engine from "../../storage/engine/index.js";
import { MockHub } from "../../test/mocks.js";
import { jest } from "@jest/globals";
import Server from "../server.js";
import SyncEngine from "../../network/sync/syncEngine.js";
import axios from "axios";
import { faker } from "@faker-js/faker";
import { DeepPartial } from "fishery";
import { mergeDeepPartial } from "../../test/utils.js";
import { publicClient } from "../../test/utils.js";

const db = jestRocksDB("httpserver.rpc.server.test");
const network = FarcasterNetwork.TESTNET;
const engine = new Engine(db, network, undefined, publicClient);
const hub = new MockHub(db, engine);

let httpServer: HttpAPIServer;
let httpServerAddress: string;

function getFullUrl(path: string) {
  return `${httpServerAddress}${path}`;
}

beforeAll(async () => {
  const server = new Server(hub, engine, new SyncEngine(hub, db));
  httpServer = new HttpAPIServer(server.getImpl());
  httpServerAddress = (await httpServer.start())._unsafeUnwrap();
});

afterAll(async () => {
  await httpServer.stop();
  await engine.stop();
});

const fid = Factories.Fid.build();
const signer = Factories.Ed25519Signer.build();
const custodySigner = Factories.Eip712Signer.build();

let custodyEvent: IdRegistryEvent;
let signerAdd: SignerAddMessage;

let timestamp = toFarcasterTime(Date.now())._unsafeUnwrap();

describe("httpServer", () => {
  beforeAll(async () => {
    const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
    const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
    custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySignerKey });

    signerAdd = await Factories.SignerAddMessage.create(
      { data: { fid, network, signerAddBody: { signer: signerKey } } },
      { transient: { signer: custodySigner } },
    );
  });

  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  describe("cast APIs", () => {
    let castAdd: CastAddMessage;

    beforeAll(async () => {
      castAdd = await Factories.CastAddMessage.create({ data: { fid, network, timestamp } }, { transient: { signer } });
    });

    const newCastAdd = async (params?: DeepPartial<CastAddMessage>) => {
      timestamp++;
      const defaults: DeepPartial<CastAddMessage> = { data: { fid, network, timestamp } };
      const merged = mergeDeepPartial(defaults, params ?? {});
      return await Factories.CastAddMessage.create(merged, { transient: { signer } });
    };

    test("getCast", async () => {
      expect((await engine.mergeMessage(castAdd)).isOk()).toBeTruthy();

      // Get a http client for port 2181
      const hashHex = bytesToHexString(castAdd.hash)._unsafeUnwrap();
      const url = getFullUrl(`/v1/cast/${fid}/${hashHex}`);
      const response = await axiosGet(url);

      expect(response.status).toBe(200);
      expect(response.data).toEqual(Message.toJSON(castAdd));

      // Merge in a new cast
      const newCast = await newCastAdd();
      expect((await engine.mergeMessage(newCast)).isOk()).toBeTruthy();

      // Get the new cast as a part of getAllCasts
      const url2 = getFullUrl(`/v1/casts/${fid}`);
      const response2 = await axiosGet(url2);

      expect(response2.status).toBe(200);
      expect(response2.data.messages).toEqual([Message.toJSON(castAdd), Message.toJSON(newCast)]);

      // Make sure paging works
      const url4 = getFullUrl(`/v1/casts/${fid}?pageSize=1`);
      const response4 = await axiosGet(url4);

      expect(response4.status).toBe(200);
      expect(response4.data.messages).toEqual([Message.toJSON(castAdd)]);

      // get the next page
      const url5 = getFullUrl(`/v1/casts/${fid}?pageToken=${response4.data.nextPageToken}`);
      const response5 = await axiosGet(url5);

      expect(response5.status).toBe(200);
      expect(response5.data.messages).toEqual([Message.toJSON(newCast)]);
      expect(response5.data.nextPageToken).toBe("");

      // Make sure reverse works
      const url3 = getFullUrl(`/v1/casts/${fid}?reverse=true`);
      const response3 = await axiosGet(url3);

      expect(response3.status).toBe(200);
      expect(response3.data.messages).toEqual([Message.toJSON(newCast), Message.toJSON(castAdd)]);
    });

    test("getCastByParent", async () => {
      expect((await engine.mergeMessage(castAdd)).isOk()).toBeTruthy();

      // Get a http client for port 2181
      const parentFid = castAdd.data.castAddBody.parentCastId?.fid;
      const hashHex = bytesToHexString(castAdd.data.castAddBody.parentCastId?.hash ?? new Uint8Array())._unsafeUnwrap();
      const url = getFullUrl(`/v1/casts/parent/${parentFid}/${hashHex}`);
      const response = await axiosGet(url);

      expect(response.status).toBe(200);
      expect(response.data.messages).toEqual([Message.toJSON(castAdd)]);

      // Also try it get it via URL
      const castAdd2 = await newCastAdd({
        data: { castAddBody: { parentCastId: undefined, parentUrl: faker.internet.url() } },
      });
      expect((await engine.mergeMessage(castAdd2)).isOk()).toBeTruthy();

      const encoded = encodeURIComponent(castAdd2.data.castAddBody.parentUrl ?? "");
      const url2 = getFullUrl(`/v1/casts/parent?url=${encoded}`);
      const response2 = await axiosGet(url2);

      expect(response2.status).toBe(200);
      expect(response2.data.messages).toEqual([Message.toJSON(castAdd2)]);
    });

    test("getCastByMention", async () => {
      expect((await engine.mergeMessage(castAdd)).isOk()).toBeTruthy();

      // Get a http client for port 2181
      for (let i = 0; i < castAdd.data.castAddBody.mentions.length; i++) {
        const url = getFullUrl(`/v1/casts/mention/${castAdd.data.castAddBody.mentions[i]}`);
        const response = await axiosGet(url);

        expect(response.status).toBe(200);
        expect(response.data.messages).toEqual([Message.toJSON(castAdd)]);
      }
    });
  });

  describe("reaction APIs", () => {
    let castAdd: CastAddMessage;
    let reaction: Message;

    beforeAll(async () => {
      castAdd = await Factories.CastAddMessage.create({ data: { fid, network, timestamp } }, { transient: { signer } });
      reaction = await Factories.ReactionAddMessage.create(
        { data: { fid, network, timestamp, reactionBody: { targetCastId: { fid, hash: castAdd.hash } } } },
        { transient: { signer } },
      );
    });

    const newReactionAdd = async (params?: DeepPartial<ReactionAddMessage>) => {
      timestamp++;
      const defaults: DeepPartial<ReactionAddMessage> = { data: { fid, network, timestamp } };
      const merged = mergeDeepPartial(defaults, params ?? {});
      return await Factories.ReactionAddMessage.create(merged, { transient: { signer } });
    };

    test("getReaction", async () => {
      expect((await engine.mergeMessage(castAdd)).isOk()).toBeTruthy();
      expect((await engine.mergeMessage(reaction)).isOk()).toBeTruthy();

      // Get a http client for port 2181
      const castHashHex = bytesToHexString(castAdd.hash)._unsafeUnwrap();
      const url = getFullUrl(
        `/v1/reaction/${fid}/${castAdd.data.fid}/${castHashHex}?reactionType=${reaction.data?.reactionBody?.type || 0}`,
      );
      const response = await axiosGet(url);

      expect(response.status).toBe(200);
      expect(response.data).toEqual(Message.toJSON(reaction));

      // Make sure it also works with the string reaction type
      const url2 = getFullUrl(
        `/v1/reaction/${fid}/${castAdd.data.fid}/${castHashHex}?reactionType=${reactionTypeToJSON(
          reaction.data?.reactionBody?.type || 0,
        )}`,
      );
      const response2 = await axiosGet(url2);

      expect(response2.status).toBe(200);
      expect(response2.data).toEqual(Message.toJSON(reaction));

      // Get the reaction by creator's fid
      const url3 = getFullUrl(`/v1/reactions/${fid}?reactionType=${reaction.data?.reactionBody?.type || 0}`);
      const response3 = await axiosGet(url3);

      expect(response3.status).toBe(200);
      expect(response3.data.messages).toEqual([Message.toJSON(reaction)]);

      // Get it by target cast
      const url4 = getFullUrl(
        `/v1/reactions/target/${castAdd.data.fid}/${castHashHex}?reactionType=${
          reaction.data?.reactionBody?.type || 0
        }`,
      );
      const response4 = await axiosGet(url4);

      expect(response4.status).toBe(200);
      expect(response4.data.messages).toEqual([Message.toJSON(reaction)]);
    });

    test("getReactionByTargetURL", async () => {
      expect((await engine.mergeMessage(castAdd)).isOk()).toBeTruthy();

      const targetUrl = faker.internet.url();
      const reaction1 = await newReactionAdd({
        data: { reactionBody: { targetCastId: undefined, targetUrl, type: ReactionType.LIKE } },
      });
      const reaction2 = await newReactionAdd({
        data: { reactionBody: { targetCastId: undefined, targetUrl, type: ReactionType.RECAST } },
      });

      expect((await engine.mergeMessage(reaction1)).isOk()).toBeTruthy();
      expect((await engine.mergeMessage(reaction2)).isOk()).toBeTruthy();

      // Get a http client for port 2181
      const encoded = encodeURIComponent(targetUrl);
      const url = getFullUrl(`/v1/reactions/target?url=${encoded}`);
      const response = await axiosGet(url);

      expect(response.status).toBe(200);
      expect(response.data.messages).toEqual([Message.toJSON(reaction1), Message.toJSON(reaction2)]);

      // Make sure paging works
      const url4 = getFullUrl(`/v1/reactions/target?url=${encoded}&pageSize=1`);
      const response4 = await axiosGet(url4);

      expect(response4.status).toBe(200);
      expect(response4.data.messages).toEqual([Message.toJSON(reaction1)]);

      // get the next page
      const url5 = getFullUrl(`/v1/reactions/target?url=${encoded}&pageToken=${response4.data.nextPageToken}`);
      const response5 = await axiosGet(url5);

      expect(response5.status).toBe(200);
      expect(response5.data.messages).toEqual([Message.toJSON(reaction2)]);

      // Make sure reverse works
      const url3 = getFullUrl(`/v1/reactions/target?url=${encoded}&reverse=true`);
      const response3 = await axiosGet(url3);

      expect(response3.status).toBe(200);
      expect(response3.data.messages).toEqual([Message.toJSON(reaction2), Message.toJSON(reaction1)]);
    });
  });

  describe("Link APIs", () => {
    let linkAdd: LinkAddMessage;
    const targetFid = Factories.Fid.build();

    beforeAll(async () => {
      linkAdd = await Factories.LinkAddMessage.create(
        { data: { fid, network, timestamp, linkBody: { targetFid, type: "follow" } } },
        { transient: { signer } },
      );
    });

    test("getLink", async () => {
      expect((await engine.mergeMessage(linkAdd)).isOk()).toBeTruthy();

      // Get a http client for port 2181
      const url = getFullUrl(`/v1/link/${fid}/${targetFid}?type=${linkAdd.data?.linkBody?.type}`);
      const response = await axiosGet(url);

      expect(response.status).toBe(200);
      expect(response.data).toEqual(Message.toJSON(linkAdd));

      // Get it from the fid
      const url1 = getFullUrl(`/v1/links/${fid}`);
      const response1 = await axiosGet(url1);

      expect(response1.status).toBe(200);
      expect(response1.data.messages).toEqual([Message.toJSON(linkAdd)]);

      // Get it by target fid
      const url2 = getFullUrl(`/v1/links/target/${targetFid}`);
      const response2 = await axiosGet(url2);

      expect(response2.status).toBe(200);
      expect(response2.data.messages).toEqual([Message.toJSON(linkAdd)]);
    });
  });

  describe("UserData APIs", () => {
    let addPfp: UserDataAddMessage;
    let addBio: UserDataAddMessage;

    beforeAll(async () => {
      addPfp = await Factories.UserDataAddMessage.create(
        { data: { fid, userDataBody: { type: UserDataType.PFP } } },
        { transient: { signer } },
      );
      addBio = await Factories.UserDataAddMessage.create(
        { data: { fid, userDataBody: { type: UserDataType.BIO }, timestamp: addPfp.data.timestamp + 1 } },
        { transient: { signer } },
      );
    });

    test("getUserData", async () => {
      expect((await engine.mergeMessage(addPfp)).isOk()).toBeTruthy();
      expect((await engine.mergeMessage(addBio)).isOk()).toBeTruthy();

      // Get it all
      const url = getFullUrl(`/v1/userdata/${fid}`);
      const response = await axiosGet(url);

      expect(response.status).toBe(200);
      expect(response.data.messages).toEqual([Message.toJSON(addPfp), Message.toJSON(addBio)]);

      // Get it by type (pfp)
      const url2 = getFullUrl(`/v1/userdata/${fid}?type=${UserDataType.PFP}`);
      const response2 = await axiosGet(url2);

      expect(response2.status).toBe(200);
      expect(response2.data).toEqual(Message.toJSON(addPfp));

      // Get it by type (bio)
      const url3 = getFullUrl(`/v1/userdata/${fid}?type=${UserDataType.BIO}`);
      const response3 = await axiosGet(url3);

      expect(response3.status).toBe(200);
      expect(response3.data).toEqual(Message.toJSON(addBio));
    });
  });

  describe("Storage APIs", () => {
    test("getStorageLimits", async () => {
      const url = getFullUrl(`/v1/storagelimits/${fid}`);
      const response = await axiosGet(url);

      expect(response.status).toBe(200);
      expect(response.data.limits.length).toBeGreaterThan(0);
    });
  });

  describe("Username proofs", () => {
    let ensProof: UsernameProofMessage;
    let proof: UsernameProofMessage;
    const fname: string = "test.eth";
    let currentFarcasterTime: number;

    beforeAll(async () => {
      const custodyAddress = bytesToHexString(custodyEvent.to)._unsafeUnwrap();
      jest.spyOn(publicClient, "getEnsAddress").mockImplementation(() => {
        return Promise.resolve(custodyAddress);
      });
      const timestampSec = Math.floor(Date.now() / 1000);
      proof = await Factories.UsernameProofMessage.create(
        {
          data: {
            fid,
            usernameProofBody: Factories.UserNameProof.build({
              name: utf8StringToBytes(fname)._unsafeUnwrap(),
              fid,
              owner: custodyEvent.to,
              timestamp: timestampSec,
              type: UserNameType.USERNAME_TYPE_ENS_L1,
            }),
            timestamp: toFarcasterTime(timestampSec * 1000)._unsafeUnwrap(),
            type: MessageType.USERNAME_PROOF,
          },
        },
        { transient: { signer } },
      );
    });

    test("getUsernameProof", async () => {
      expect((await engine.mergeMessage(proof)).isOk()).toBeTruthy();

      const url = getFullUrl(`/v1/usernameproof/${fname}`);
      const response = await axiosGet(url);

      expect(response.status).toBe(200);
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      expect(response.data).toEqual((Message.toJSON(proof) as any).data.usernameProofBody);

      // Get via fid
      const url2 = getFullUrl(`/v1/usernameproofs/${fid}`);
      const response2 = await axiosGet(url2);

      expect(response2.status).toBe(200);
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      expect(response2.data.proofs).toEqual([(Message.toJSON(proof) as any).data.usernameProofBody]);
    });
  });

  describe("verification APIs", () => {
    let verificationAdd: VerificationAddEthAddressMessage;

    beforeAll(async () => {
      verificationAdd = await Factories.VerificationAddEthAddressMessage.create(
        { data: { fid, network } },
        { transient: { signer } },
      );
    });

    test("getVerification", async () => {
      expect((await engine.mergeMessage(verificationAdd)).isOk()).toBeTruthy();

      const address = verificationAdd.data.verificationAddEthAddressBody.address;
      const url = getFullUrl(`/v1/verifications/${fid}?address=${bytesToHexString(address)._unsafeUnwrap()}`);
      const response = await axiosGet(url);

      expect(response.status).toBe(200);
      expect(response.data).toEqual(Message.toJSON(verificationAdd));

      // Get via fid
      const url2 = getFullUrl(`/v1/verifications/${fid}`);
      const response2 = await axiosGet(url2);

      expect(response2.status).toBe(200);
      expect(response2.data.messages).toEqual([Message.toJSON(verificationAdd)]);
    });
  });

  describe("onchain event APIs", () => {
    test("getOnChainEvent", async () => {
      const onChainEvent = Factories.SignerOnChainEvent.build();

      const fid = onChainEvent.fid;
      const signer = bytesToHexString(onChainEvent.signerEventBody.key)._unsafeUnwrap();
      const eventType = onChainEvent.type;

      expect(await engine.mergeOnChainEvent(onChainEvent)).toBeTruthy();

      const url = getFullUrl(`/v1/onchain/signers/${fid}?signer=${signer}`);
      const response = await axiosGet(url);

      expect(response.status).toBe(200);
      expect(response.data).toEqual(OnChainEvent.toJSON(onChainEvent));

      // Get via fid
      const url2 = getFullUrl(`/v1/onchain/signers/${fid}`);
      const response2 = await axiosGet(url2);

      expect(response2.status).toBe(200);
      expect(response2.data.events).toEqual([OnChainEvent.toJSON(onChainEvent)]);

      // Get by type
      const url3 = getFullUrl(`/v1/onchain/events/${fid}?type=${eventType}`);
      const response3 = await axiosGet(url3);

      expect(response3.status).toBe(200);
      expect(response3.data.events).toEqual([OnChainEvent.toJSON(onChainEvent)]);

      // Get by type name
      const url4 = getFullUrl(`/v1/onchain/events/${fid}?type=${onChainEventTypeToJSON(eventType)}`);
      const response4 = await axiosGet(url4);

      expect(response4.status).toBe(200);
      expect(response4.data.events).toEqual([OnChainEvent.toJSON(onChainEvent)]);

      // Also do the IdRegistryEvent
      const idRegistryEvent = Factories.IdRegistryOnChainEvent.build({ fid });
      expect(await engine.mergeOnChainEvent(idRegistryEvent)).toBeTruthy();

      const url5 = getFullUrl(`/v1/onchain/idregistryevent/${idRegistryEvent.idRegisterEventBody.to}`);
      const response5 = await axiosGet(url5);

      expect(response5.status).toBe(200);
      expect(response5.data).toEqual(OnChainEvent.toJSON(idRegistryEvent));
    });
  });
});

async function axiosGet(url: string) {
  try {
    return await axios.get(url);
    // biome-ignore lint/suspicious/noExplicitAny: Catch axios errors
  } catch (error: any) {
    return { status: error?.response?.status, data: error?.response?.data };
  }
}
