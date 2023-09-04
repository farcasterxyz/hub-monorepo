import {
  bytesToHexString,
  bytesToUtf8String,
  CastAddMessage,
  CastId,
  CastRemoveMessage,
  Factories,
  FarcasterNetwork,
  hexStringToBytes,
  HubError,
  HubEvent,
  HubEventType,
  IdRegistryEvent,
  IdRegistryEventType,
  LinkAddMessage,
  MergeMessageHubEvent,
  MergeUserNameProofBody,
  MergeUsernameProofHubEvent,
  Message,
  MessageData,
  MessageType,
  NameRegistryEvent,
  NameRegistryEventType,
  OnChainEventType,
  PruneMessageHubEvent,
  ReactionAddMessage,
  ReactionType,
  RevokeMessageHubEvent,
  SignerAddMessage,
  SignerEventType,
  SignerRemoveMessage,
  toFarcasterTime,
  UserDataAddMessage,
  UserDataType,
  UserNameProof,
  UserNameType,
  utf8StringToBytes,
  VerificationAddEthAddressMessage,
} from "@farcaster/hub-nodejs";
import { err, Ok, ok } from "neverthrow";
import { jestRocksDB } from "../db/jestUtils.js";
import Engine from "../engine/index.js";
import SignerStore from "../stores/signerStore.js";
import { sleep } from "../../utils/crypto.js";
import { getMessage, makeTsHash, typeToSetPostfix } from "../db/message.js";
import { StoreEvents } from "../stores/storeEventHandler.js";
import { makeVerificationEthAddressClaim } from "@farcaster/core";
import { setReferenceDateForTest } from "../../utils/versions.js";
import { getUserNameProof } from "../db/nameRegistryEvent.js";
import { publicClient } from "../../test/utils.js";
import { jest } from "@jest/globals";
import { RevokeMessagesBySignerJobQueue, RevokeMessagesBySignerJobWorker } from "../jobs/revokeMessagesBySignerJob.js";

const db = jestRocksDB("protobufs.engine.test");
const network = FarcasterNetwork.TESTNET;
const engine = new Engine(db, network, undefined, publicClient);

// init signer store for checking state changes from engine
const signerStore = new SignerStore(db, engine.eventHandler);

const fid = Factories.Fid.build();
const fname = Factories.Fname.build();
const signer = Factories.Ed25519Signer.build();
const custodySigner = Factories.Eip712Signer.build();

let custodySignerKey: Uint8Array;
let signerKey: Uint8Array;
let custodyEvent: IdRegistryEvent;
let fnameTransfer: NameRegistryEvent;
let userNameProof: UserNameProof;
let signerAdd: SignerAddMessage;
let signerRemove: SignerRemoveMessage;
let castAdd: CastAddMessage;
let reactionAdd: ReactionAddMessage;
let linkAdd: LinkAddMessage;
let verificationAdd: VerificationAddEthAddressMessage;
let userDataAdd: UserDataAddMessage;

beforeAll(async () => {
  signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySignerKey });

  fnameTransfer = Factories.NameRegistryEvent.build({ fname, to: custodyEvent.to });
  userNameProof = Factories.UserNameProof.build({ name: fname, owner: custodyEvent.to, fid: fid });

  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, network, signerAddBody: { signer: signerKey } } },
    { transient: { signer: custodySigner } },
  );
  signerRemove = await Factories.SignerRemoveMessage.create(
    { data: { fid, network, timestamp: signerAdd.data.timestamp + 1, signerRemoveBody: { signer: signerKey } } },
    { transient: { signer: custodySigner } },
  );

  castAdd = await Factories.CastAddMessage.create({ data: { fid, network } }, { transient: { signer } });
  reactionAdd = await Factories.ReactionAddMessage.create({ data: { fid, network } }, { transient: { signer } });
  linkAdd = await Factories.LinkAddMessage.create({ data: { fid, network } }, { transient: { signer } });
  verificationAdd = await Factories.VerificationAddEthAddressMessage.create(
    { data: { fid, network } },
    { transient: { signer } },
  );
  userDataAdd = await Factories.UserDataAddMessage.create(
    { data: { fid, network, userDataBody: { type: UserDataType.PFP } } },
    { transient: { signer } },
  );
});

describe("mergeIdRegistryEvent", () => {
  test("succeeds", async () => {
    await expect(engine.mergeIdRegistryEvent(custodyEvent)).resolves.toBeInstanceOf(Ok);
    await expect(engine.getIdRegistryEvent(fid)).resolves.toEqual(ok(custodyEvent));
  });

  test("fails with invalid event type", async () => {
    const invalidEvent = Factories.IdRegistryEvent.build({ type: 10 as unknown as IdRegistryEventType });
    const result = await engine.mergeIdRegistryEvent(invalidEvent);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError("bad_request.validation_failure", "invalid event type"));
  });
});

describe("mergeNameRegistryEvent", () => {
  test("succeeds", async () => {
    await expect(engine.mergeNameRegistryEvent(fnameTransfer)).resolves.toBeInstanceOf(Ok);
    await expect(engine.getNameRegistryEvent(fname)).resolves.toEqual(ok(fnameTransfer));
  });

  test("fails with invalid event type", async () => {
    const invalidEvent = Factories.NameRegistryEvent.build({ type: 10 as unknown as NameRegistryEventType });
    const result = await engine.mergeNameRegistryEvent(invalidEvent);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError("bad_request.validation_failure", "invalid event type"));
  });
});

describe("mergeUserNameProof", () => {
  test("succeeds", async () => {
    const userNameProof = Factories.UserNameProof.build();
    await expect(engine.mergeUserNameProof(userNameProof)).resolves.toBeInstanceOf(Ok);
    expect(await getUserNameProof(db, userNameProof.name)).toBeTruthy();
  });
});

describe("mergeMessage", () => {
  let mergedMessages: Message[];

  const handleMergeMessage = (event: MergeMessageHubEvent) => {
    mergedMessages.push(event.mergeMessageBody.message);
  };

  beforeAll(async () => {
    engine.eventHandler.on("mergeMessage", handleMergeMessage);
  });

  afterAll(async () => {
    engine.eventHandler.off("mergeMessage", handleMergeMessage);
  });

  beforeEach(() => {
    mergedMessages = [];
  });

  describe("with valid signer", () => {
    beforeEach(async () => {
      await expect(engine.mergeIdRegistryEvent(custodyEvent)).resolves.toBeInstanceOf(Ok);
      await expect(engine.mergeMessage(signerAdd)).resolves.toBeInstanceOf(Ok);
    });

    describe("CastAdd", () => {
      test("succeeds", async () => {
        await expect(engine.mergeMessage(castAdd)).resolves.toBeInstanceOf(Ok);
        await expect(engine.getCast(fid, castAdd.hash)).resolves.toEqual(ok(castAdd));
        expect(mergedMessages).toEqual([signerAdd, castAdd]);
      });
    });

    describe("ReactionAdd", () => {
      test("succeeds", async () => {
        await expect(engine.mergeMessage(reactionAdd)).resolves.toBeInstanceOf(Ok);
        await expect(
          engine.getReaction(
            fid,
            reactionAdd.data.reactionBody.type,
            reactionAdd.data.reactionBody.targetCastId as CastId,
          ),
        ).resolves.toEqual(ok(reactionAdd));
        expect(mergedMessages).toEqual([signerAdd, reactionAdd]);
      });
    });

    describe("LinkAdd", () => {
      test("succeeds", async () => {
        setReferenceDateForTest(100000000000000000000000);
        await expect(engine.mergeMessage(linkAdd)).resolves.toBeInstanceOf(Ok);
        await expect(
          engine.getLink(fid, linkAdd.data.linkBody.type, linkAdd.data.linkBody.targetFid as number),
        ).resolves.toEqual(ok(linkAdd));
        expect(mergedMessages).toEqual([signerAdd, linkAdd]);
      });
    });

    describe("VerificationAddEthAddress", () => {
      test("succeeds", async () => {
        await expect(engine.mergeMessage(verificationAdd)).resolves.toBeInstanceOf(Ok);
        await expect(
          engine.getVerification(fid, verificationAdd.data.verificationAddEthAddressBody.address),
        ).resolves.toEqual(ok(verificationAdd));
        expect(mergedMessages).toEqual([signerAdd, verificationAdd]);
      });

      test("fails when network does not match claim network", async () => {
        const address = custodySignerKey;
        const blockHash = Factories.BlockHash.build();
        const mainnetClaim = await makeVerificationEthAddressClaim(
          fid,
          address,
          FarcasterNetwork.MAINNET,
          blockHash,
        )._unsafeUnwrap();
        const claimSignature = (await custodySigner.signVerificationEthAddressClaim(mainnetClaim))._unsafeUnwrap();
        const testnetVerificationAdd = await Factories.VerificationAddEthAddressMessage.create(
          {
            data: {
              fid,
              network: FarcasterNetwork.TESTNET,
              verificationAddEthAddressBody: { address: address, blockHash: blockHash, ethSignature: claimSignature },
            },
          },
          { transient: { signer: signer, ethSigner: custodySigner } },
        );
        const result = await engine.mergeMessage(testnetVerificationAdd);
        // Signature will not match because we're attempting to recover the address based on the wrong network
        expect(result).toEqual(
          err(new HubError("bad_request.validation_failure", "ethSignature does not match address")),
        );
      });
    });

    describe("UserDataAdd", () => {
      test("succeeds", async () => {
        await expect(engine.mergeMessage(userDataAdd)).resolves.toBeInstanceOf(Ok);
        await expect(engine.getUserData(fid, userDataAdd.data.userDataBody.type)).resolves.toEqual(ok(userDataAdd));
        expect(mergedMessages).toEqual([signerAdd, userDataAdd]);
      });

      describe("with fname", () => {
        let usernameAdd: UserDataAddMessage;

        beforeAll(async () => {
          const nameString = bytesToUtf8String(userNameProof.name)._unsafeUnwrap();
          usernameAdd = await Factories.UserDataAddMessage.create(
            {
              data: {
                fid,
                network,
                userDataBody: { type: UserDataType.USERNAME, value: nameString },
              },
            },
            { transient: { signer } },
          );
        });

        test("succeeds when fname owned by same fid", async () => {
          await expect(engine.mergeUserNameProof(userNameProof)).resolves.toBeInstanceOf(Ok);
          await expect(engine.mergeMessage(usernameAdd)).resolves.toBeInstanceOf(Ok);
        });

        test("succeeds when fname owned by same fid but different custody address", async () => {
          const proof = Factories.UserNameProof.build({
            name: userNameProof.name,
            timestamp: userNameProof.timestamp + 1,
            owner: Factories.EthAddress.build(),
            fid: fid,
          });

          await expect(engine.mergeUserNameProof(proof)).resolves.toBeInstanceOf(Ok);
          await expect(engine.mergeMessage(usernameAdd)).resolves.toBeInstanceOf(Ok);
        });

        test("fails when fname transfer event is missing", async () => {
          const result = await engine.mergeMessage(usernameAdd);
          expect(result).toMatchObject(err({ errCode: "bad_request.validation_failure" }));
          expect(result._unsafeUnwrapErr().message).toMatch("is not registered");
        });

        test("fails when fname is owned by another fid", async () => {
          const proof = Factories.UserNameProof.build({
            name: userNameProof.name,
            timestamp: userNameProof.timestamp + 1,
            owner: Factories.EthAddress.build(),
            fid: Factories.Fid.build(),
          });
          await expect(engine.mergeUserNameProof(proof)).resolves.toBeInstanceOf(Ok);
          const result = await engine.mergeMessage(usernameAdd);
          expect(result).toMatchObject(err({ errCode: "bad_request.validation_failure" }));
          expect(result._unsafeUnwrapErr().message).toMatch("does not match");
        });
      });
    });

    describe("SignerRemove", () => {
      test("succeeds ", async () => {
        await expect(engine.mergeMessage(signerRemove)).resolves.toBeInstanceOf(Ok);
        await expect(signerStore.getSignerRemove(fid, signerKey)).resolves.toEqual(signerRemove);
        expect(mergedMessages).toEqual([signerAdd, signerRemove]);
      });
    });

    test("succeeds with concurrent, conflicting cast messages", async () => {
      const castAdd = await Factories.CastAddMessage.create({ data: { fid } }, { transient: { signer } });

      const generateCastRemove = async (): Promise<CastRemoveMessage> => {
        return Factories.CastRemoveMessage.create(
          { data: { fid, castRemoveBody: { targetHash: castAdd.hash } } },
          { transient: { signer } },
        );
      };

      // Generate 100 cast removes with different timestamps
      const castRemoves: CastRemoveMessage[] = [];
      for (let i = 0; i < 100; i++) {
        const castRemove = await generateCastRemove();
        castRemoves.push(castRemove);
      }

      const messages = [castAdd, ...castRemoves, castAdd, castAdd];

      const results = await Promise.all(messages.map((message) => engine.mergeMessage(message)));
      expect(
        results.every(
          (result) => result.isOk() || (result.isErr() && result.error.errCode !== "unavailable.storage_failure"),
        ),
      ).toBeTruthy();

      const allMessages = await engine.getAllCastMessagesByFid(fid);
      expect(allMessages._unsafeUnwrap().messages.length).toEqual(1);
    });

    test("succeeds with concurrent, conflicting reaction messages", async () => {
      const castId = Factories.CastId.build();
      const body = Factories.ReactionBody.build({
        type: ReactionType.LIKE,
        targetCastId: castId,
      });

      const messages: Message[] = [];
      for (let i = 0; i < 10; i++) {
        if (Math.random() < 0.5) {
          messages.push(
            await Factories.ReactionAddMessage.create(
              { data: { reactionBody: body, fid, network } },
              { transient: { signer } },
            ),
          );
        } else {
          messages.push(
            await Factories.ReactionRemoveMessage.create(
              { data: { reactionBody: body, fid, network } },
              { transient: { signer } },
            ),
          );
        }
      }

      const results = await Promise.all(messages.map((message) => engine.mergeMessage(message)));
      expect(
        results.every(
          (result) => result.isOk() || (result.isErr() && result.error.errCode !== "unavailable.storage_failure"),
        ),
      ).toBeTruthy();

      const allMessages = await engine.getAllReactionMessagesByFid(fid);
      expect(allMessages._unsafeUnwrap().messages.length).toEqual(1);
    });

    test("succeeds with concurrent, conflicting link messages", async () => {
      setReferenceDateForTest(100000000000000000000000);
      const targetFid = Factories.Fid.build();
      const body = Factories.LinkBody.build({
        type: "follow",
        targetFid: targetFid,
      });

      const messages: Message[] = [];
      for (let i = 0; i < 10; i++) {
        if (Math.random() < 0.5) {
          messages.push(
            await Factories.LinkAddMessage.create(
              { data: { linkBody: body, fid, network } },
              { transient: { signer } },
            ),
          );
        } else {
          messages.push(
            await Factories.LinkRemoveMessage.create(
              { data: { linkBody: body, fid, network } },
              { transient: { signer } },
            ),
          );
        }
      }

      const results = await Promise.all(messages.map((message) => engine.mergeMessage(message)));
      expect(
        results.every(
          (result) => result.isOk() || (result.isErr() && result.error.errCode !== "unavailable.storage_failure"),
        ),
      ).toBeTruthy();

      const allMessages = await engine.getAllLinkMessagesByFid(fid);
      expect(allMessages._unsafeUnwrap().messages.length).toEqual(1);
    });
  });

  describe("fails when signer is invalid", () => {
    test("with SignerAdd", async () => {
      await engine.mergeIdRegistryEvent(Factories.IdRegistryEvent.build({ fid }));
      const result = await engine.mergeMessage(signerAdd);
      expect(result).toMatchObject(err({ errCode: "bad_request.validation_failure" }));
      expect(result._unsafeUnwrapErr().message).toMatch("invalid signer");
    });

    test("with ReactionAdd", async () => {
      await engine.mergeIdRegistryEvent(custodyEvent);
      const result = await engine.mergeMessage(reactionAdd);
      expect(result).toMatchObject(err({ errCode: "bad_request.validation_failure" }));
      expect(result._unsafeUnwrapErr().message).toMatch("invalid signer");
    });

    test("with LinkAdd", async () => {
      setReferenceDateForTest(100000000000000000000000);
      await engine.mergeIdRegistryEvent(custodyEvent);
      const result = await engine.mergeMessage(linkAdd);
      expect(result).toMatchObject(err({ errCode: "bad_request.validation_failure" }));
      expect(result._unsafeUnwrapErr().message).toMatch("invalid signer");
    });
  });

  describe("fails when missing both custody address and signer", () => {
    let message: Message;

    afterEach(async () => {
      const result = await engine.mergeMessage(message);
      const err = result._unsafeUnwrapErr();
      expect(err.errCode).toEqual("bad_request.validation_failure");
      expect(err.message).toMatch("unknown fid");
    });

    test("with ReactionAdd", () => {
      message = reactionAdd;
    });

    test("with LinkAdd", () => {
      setReferenceDateForTest(100000000000000000000000);
      message = linkAdd;
    });
  });

  test("fails with mismatched farcaster network", async () => {
    const mainnetEngine = new Engine(db, FarcasterNetwork.MAINNET);
    const result = await mainnetEngine.mergeMessage(reactionAdd);
    expect(result).toEqual(
      err(
        new HubError(
          "bad_request.validation_failure",
          `incorrect network: ${FarcasterNetwork.TESTNET} (expected: ${FarcasterNetwork.MAINNET})`,
        ),
      ),
    );
    await mainnetEngine.stop();
  });

  describe("UsernameProof messages", () => {
    const randomEthAddress = bytesToHexString(Factories.EthAddress.build())._unsafeUnwrap();
    let usernameProofEvents: MergeUserNameProofBody[] = [];

    const handleUsernameProofEvent = (event: MergeUsernameProofHubEvent) => {
      usernameProofEvents.push(event.mergeUsernameProofBody);
    };

    beforeEach(async () => {
      usernameProofEvents = [];
      await engine.mergeIdRegistryEvent(custodyEvent);
      await engine.mergeMessage(signerAdd);
      await engine.eventHandler.syncCache();
      engine.eventHandler.on("mergeUsernameProofEvent", handleUsernameProofEvent);
    });

    afterEach(async () => {
      jest.restoreAllMocks();
      engine.eventHandler.off("mergeUsernameProofEvent", handleUsernameProofEvent);
    });

    const createProof = async (name: string, timestamp?: number | null, owner?: string | null) => {
      // Proof time is in Unix seconds and should match the message time which is in Farcaster milliseconds
      const timestampSec = Math.floor((timestamp || Date.now()) / 1000);
      const ownerAsBytes = owner ? hexStringToBytes(owner)._unsafeUnwrap() : Factories.EthAddress.build();
      return await Factories.UsernameProofMessage.create(
        {
          data: {
            fid,
            usernameProofBody: Factories.UserNameProof.build({
              name: utf8StringToBytes(name)._unsafeUnwrap(),
              fid,
              owner: ownerAsBytes,
              timestamp: timestampSec,
              type: UserNameType.USERNAME_TYPE_ENS_L1,
            }),
            timestamp: toFarcasterTime(timestampSec * 1000)._unsafeUnwrap(),
            type: MessageType.USERNAME_PROOF,
          },
        },
        { transient: { signer } },
      );
    };

    test("fails when not a valid ens name", async () => {
      const result = await engine.mergeMessage(await createProof("no_dot_eth"));
      expect(result).toMatchObject(err({ errCode: "bad_request.validation_failure" }));
      expect(result._unsafeUnwrapErr().message).toMatch("invalid ens name");
    });

    test("fails gracefully when resolving throws an error", async () => {
      const result = await engine.mergeMessage(await createProof("test.eth"));
      expect(result).toMatchObject(err({ errCode: "unavailable.network_failure" }));
      expect(result._unsafeUnwrapErr().message).toMatch("failed to resolve ens name");
    });

    test("fails gracefully when resolving an unregistered name", async () => {
      jest.spyOn(publicClient, "getEnsAddress").mockImplementation(() => {
        return Promise.resolve(null);
      });
      const result = await engine.mergeMessage(await createProof("akjsdhkhaasd.eth"));
      expect(result).toMatchObject(err({ errCode: "bad_request.validation_failure" }));
      expect(result._unsafeUnwrapErr().message).toMatch("no valid address for akjsdhkhaasd.eth");
    });

    test("fails when resolved address does not match proof", async () => {
      const message = await createProof("test.eth");
      jest.spyOn(publicClient, "getEnsAddress").mockImplementation(() => {
        return Promise.resolve(randomEthAddress);
      });
      const result = await engine.mergeMessage(message);
      expect(result).toMatchObject(err({ errCode: "bad_request.validation_failure" }));
      expect(result._unsafeUnwrapErr().message).toMatch(`resolved address ${randomEthAddress} does not match proof`);
    });

    test("fails when resolved address does not match custody address or verification address", async () => {
      await engine.mergeMessage(verificationAdd);
      jest.spyOn(publicClient, "getEnsAddress").mockImplementation(() => {
        return Promise.resolve(randomEthAddress);
      });
      const message = await createProof("test.eth", null, randomEthAddress);
      const result = await engine.mergeMessage(message);
      expect(result).toMatchObject(err({ errCode: "bad_request.validation_failure" }));
      expect(result._unsafeUnwrapErr().message).toMatch("ens name does not belong to fid");
    });

    test("succeeds for valid proof for custody address", async () => {
      const custodyAddress = bytesToHexString(custodyEvent.to)._unsafeUnwrap();
      jest.spyOn(publicClient, "getEnsAddress").mockImplementation(() => {
        return Promise.resolve(custodyAddress);
      });
      const message = await createProof("test.eth", null, custodyAddress);
      const result = await engine.mergeMessage(message);
      expect(result.isOk()).toBeTruthy();

      expect(usernameProofEvents.length).toBe(1);
      expect(usernameProofEvents[0]?.usernameProof).toMatchObject(message.data.usernameProofBody);
      expect(usernameProofEvents[0]?.deletedUsernameProof).toBeUndefined();
    });

    test("succeeds for valid proof for verified eth address", async () => {
      await engine.mergeMessage(verificationAdd);
      const verificationAddress = bytesToHexString(
        verificationAdd.data.verificationAddEthAddressBody.address,
      )._unsafeUnwrap();
      jest.spyOn(publicClient, "getEnsAddress").mockImplementation(() => {
        return Promise.resolve(verificationAddress);
      });
      const message = await createProof("test.eth", null, verificationAddress);
      const result = await engine.mergeMessage(message);
      expect(result.isOk()).toBeTruthy();

      expect(usernameProofEvents.length).toBe(1);
      expect(usernameProofEvents[0]?.usernameProof).toMatchObject(message.data.usernameProofBody);
      expect(usernameProofEvents[0]?.deletedUsernameProof).toBeUndefined();
    });

    test("getUsernameProofsByFid returns all proofs for fid including fname proofs", async () => {
      const custodyAddress = bytesToHexString(custodyEvent.to)._unsafeUnwrap();
      jest.spyOn(publicClient, "getEnsAddress").mockImplementation(() => {
        return Promise.resolve(custodyAddress);
      });
      const message = await createProof("test.eth", null, custodyAddress);
      const result = await engine.mergeMessage(message);
      expect(result.isOk()).toBeTruthy();

      const fnameProof = Factories.UserNameProof.build({ fid });
      await engine.mergeUserNameProof(fnameProof);

      const proofs = (await engine.getUserNameProofsByFid(fid)).unwrapOr([]);
      expect(proofs.length).toBe(2);
      expect(proofs).toContainEqual(message.data.usernameProofBody);
      expect(proofs).toContainEqual(fnameProof);
    });

    test("getUsernameProofsByFid does not fail for empty results", async () => {
      const proofs = (await engine.getUserNameProofsByFid(fid)).unwrapOr([]);
      expect(proofs.length).toBe(0);
    });

    describe("userDataAdd message with an ens name", () => {
      let test1Message: Message;
      let userDataAdd: Message;
      let userDataAdd2: Message;
      beforeEach(async () => {
        const custodyAddress = bytesToHexString(custodyEvent.to)._unsafeUnwrap();
        const verificationAddress = bytesToHexString(
          verificationAdd.data.verificationAddEthAddressBody.address,
        )._unsafeUnwrap();

        jest.spyOn(publicClient, "getEnsAddress").mockImplementation((opts) => {
          if (opts.name === "test.eth") {
            return Promise.resolve(custodyAddress);
          } else if (opts.name === "test123.eth") {
            return Promise.resolve(verificationAddress);
          }
          return Promise.resolve("0x");
        });
        test1Message = await createProof("test.eth", null, custodyAddress);
        const testName = await engine.mergeMessage(test1Message);
        expect(testName.isOk()).toBeTruthy();

        await engine.mergeMessage(verificationAdd);
        const test2Name = await engine.mergeMessage(await createProof("test123.eth", null, verificationAddress));
        expect(test2Name.isOk()).toBeTruthy();

        userDataAdd = await Factories.UserDataAddMessage.create(
          {
            data: {
              fid,
              userDataBody: {
                type: UserDataType.USERNAME,
                value: "test.eth",
              },
            },
          },
          { transient: { signer } },
        );
        userDataAdd2 = await Factories.UserDataAddMessage.create(
          {
            data: {
              fid,
              userDataBody: {
                type: UserDataType.USERNAME,
                value: "test123.eth",
              },
            },
          },
          { transient: { signer } },
        );
      });

      test("succeeds setting name when name is owned by custody address", async () => {
        const result = await engine.mergeMessage(userDataAdd);
        expect(result.isOk()).toBeTruthy();
        expect((await engine.getUserData(fid, UserDataType.USERNAME))._unsafeUnwrap()).toMatchObject(userDataAdd);
      });
      test("succeeds setting name when name is owned by verified address", async () => {
        const result = await engine.mergeMessage(userDataAdd2);
        expect(result.isOk()).toBeTruthy();
        expect((await engine.getUserData(fid, UserDataType.USERNAME))._unsafeUnwrap()).toMatchObject(userDataAdd2);
      });
      test("fails when custody address no longer owns the ens", async () => {
        jest.spyOn(publicClient, "getEnsAddress").mockImplementation(() => {
          return Promise.resolve(randomEthAddress);
        });

        const result = await engine.mergeMessage(userDataAdd);
        expect(result).toMatchObject(err({ errCode: "bad_request.validation_failure" }));
        expect(result._unsafeUnwrapErr().message).toMatch("does not match proof");
      });
      test("fails when verified address no longer owns the ens", async () => {
        // Remove the verification
        const verificationRemove = await Factories.VerificationRemoveMessage.create(
          {
            data: {
              fid,
              timestamp: verificationAdd.data.timestamp + 2,
              verificationRemoveBody: { address: verificationAdd.data.verificationAddEthAddressBody.address },
            },
          },
          { transient: { signer } },
        );
        expect(await engine.mergeMessage(verificationRemove)).toMatchObject(ok({}));
        const result = await engine.mergeMessage(userDataAdd2);
        expect(result).toMatchObject(err({ errCode: "bad_request.validation_failure" }));
        expect(result._unsafeUnwrapErr().message).toMatch("ens name does not belong to fid");
      });
      test("fails when unable to resolve ens name", async () => {
        jest.spyOn(publicClient, "getEnsAddress").mockImplementation(() => {
          throw new Error("Unable to resolve ens name");
        });

        const result = await engine.mergeMessage(userDataAdd);
        expect(result).toMatchObject(err({ errCode: "unavailable.network_failure" }));
        expect(result._unsafeUnwrapErr().message).toMatch("failed to resolve ens");
      });

      test("revokes the user data add when the username proof is revoked", async () => {
        const result = await engine.mergeMessage(userDataAdd);
        expect(result.isOk()).toBeTruthy();
        expect((await engine.getUserData(fid, UserDataType.USERNAME))._unsafeUnwrap()).toMatchObject(userDataAdd);

        jest.spyOn(publicClient, "getEnsAddress").mockImplementation(() => {
          return Promise.resolve(randomEthAddress);
        });
        const revokeResult = await engine.validateOrRevokeMessage(test1Message);
        expect(revokeResult.isOk()).toBeTruthy();

        expect((await engine.getUserData(fid, UserDataType.USERNAME))._unsafeUnwrap()).toMatchObject(userDataAdd);
      });
    });

    describe("validateOrRevokeMessage", () => {
      let mergedMessage: Message;
      beforeEach(async () => {
        const custodyAddress = bytesToHexString(custodyEvent.to)._unsafeUnwrap();
        jest.spyOn(publicClient, "getEnsAddress").mockImplementation(() => {
          return Promise.resolve(custodyAddress);
        });
        mergedMessage = await createProof("test3.eth", null, custodyAddress);
        const result = await engine.mergeMessage(mergedMessage);
        expect(result.isOk()).toBeTruthy();
        usernameProofEvents = [];
      });
      test("revokes an ens message when ens is no longer valid", async () => {
        jest.spyOn(publicClient, "getEnsAddress").mockImplementation(() => {
          return Promise.resolve(randomEthAddress);
        });
        const result = await engine.validateOrRevokeMessage(mergedMessage);
        expect(result.isOk()).toBeTruthy();

        expect(usernameProofEvents.length).toBe(1);
        expect(usernameProofEvents[0]?.deletedUsernameProof).toBeDefined();
        expect(usernameProofEvents[0]?.deletedUsernameProof).toEqual(mergedMessage.data?.usernameProofBody);
        expect(usernameProofEvents[0]?.usernameProof).toBeUndefined();
      });
      test("does not revoke a message when address resolution temporarily fails", async () => {
        jest.spyOn(publicClient, "getEnsAddress").mockImplementation(() => {
          throw new Error("test");
        });
        const result = await engine.validateOrRevokeMessage(mergedMessage);
        expect(result._unsafeUnwrapErr().errCode).toEqual("unavailable.network_failure");
        expect(result._unsafeUnwrapErr().message).toMatch("failed to resolve ens name");

        expect(usernameProofEvents.length).toBe(0);
      });
    });
  });

  describe("signer migration", () => {
    let migratedEngine: Engine;
    describe("after migration", () => {
      beforeEach(async () => {
        // Create a new instance so the isMigrated flag is cleared each time.
        migratedEngine = new Engine(db, network, undefined, publicClient);

        await expect(migratedEngine.mergeIdRegistryEvent(custodyEvent)).resolves.toBeInstanceOf(Ok);
        await expect(migratedEngine.mergeMessage(signerAdd)).resolves.toBeInstanceOf(Ok);
        await migratedEngine.mergeOnChainEvent(Factories.SignerMigratedOnChainEvent.build());
        migratedEngine.eventHandler.on("mergeMessage", handleMergeMessage);
      });
      afterEach(() => {
        migratedEngine.eventHandler.off("mergeMessage", handleMergeMessage);
      });
      test("fails if no l2 id registry event", async () => {
        const result = await migratedEngine.mergeMessage(castAdd);
        expect(result).toMatchObject(err({ errCode: "bad_request.validation_failure" }));
        expect(result._unsafeUnwrapErr().message).toMatch("unknown fid");
      });
      test("fails if no on chain signer", async () => {
        const idRegistryOnChainEvent = Factories.IdRegistryOnChainEvent.build({ fid });
        await migratedEngine.mergeOnChainEvent(idRegistryOnChainEvent);
        const result = await migratedEngine.mergeMessage(castAdd);
        expect(result).toMatchObject(err({ errCode: "bad_request.validation_failure" }));
        expect(result._unsafeUnwrapErr().message).toMatch("invalid signer");
      });
      test("succeeds with l2 id registry event and on chain signer", async () => {
        const idRegistryOnChainEvent = Factories.IdRegistryOnChainEvent.build({ fid });
        const signerEventBody = Factories.SignerEventBody.build({ key: signerAdd.data.signerAddBody.signer });
        const onChainSignerEvent = Factories.SignerOnChainEvent.build({ fid, signerEventBody });
        await migratedEngine.mergeOnChainEvent(idRegistryOnChainEvent);
        await migratedEngine.mergeOnChainEvent(onChainSignerEvent);

        await expect(migratedEngine.mergeMessage(castAdd)).resolves.toBeInstanceOf(Ok);
        await expect(migratedEngine.getCast(fid, castAdd.hash)).resolves.toEqual(ok(castAdd));
        expect(mergedMessages).toEqual([castAdd]);
      });
      test("fails if signer is removed on chain", async () => {
        const idRegistryOnChainEvent = Factories.IdRegistryOnChainEvent.build({ fid });
        const signerEventBody = Factories.SignerEventBody.build({ key: signerAdd.data.signerAddBody.signer });
        const onChainSignerEvent = Factories.SignerOnChainEvent.build({ fid, signerEventBody });

        const signerRemovalBody = Factories.SignerEventBody.build({
          eventType: SignerEventType.REMOVE,
          key: signerAdd.data.signerAddBody.signer,
        });
        const signerRemovalEvent = Factories.SignerOnChainEvent.build({
          fid,
          blockNumber: onChainSignerEvent.blockNumber + 1,
          signerEventBody: signerRemovalBody,
        });

        await migratedEngine.mergeOnChainEvent(idRegistryOnChainEvent);
        await migratedEngine.mergeOnChainEvent(onChainSignerEvent);
        await migratedEngine.mergeOnChainEvent(signerRemovalEvent);

        const result = await migratedEngine.mergeMessage(castAdd);
        expect(result).toMatchObject(err({ errCode: "bad_request.validation_failure" }));
        expect(result._unsafeUnwrapErr().message).toMatch("invalid signer");
      });
      test("isMigrated returns true after migration", async () => {
        expect(engine.isMigrated).toBeFalsy();
        expect(migratedEngine.isMigrated).toBeTruthy();
      });
    });
  });
});

describe("mergeOnChainEvent", () => {
  test("does not merge invalid event type", async () => {
    const event = Factories.OnChainEvent.build({ type: OnChainEventType.EVENT_TYPE_NONE });
    const result = await engine.mergeOnChainEvent(event);
    expect(result).toMatchObject(err({ errCode: "bad_request.validation_failure" }));
  });
});

describe("mergeMessages", () => {
  let mergedMessages: Message[];
  const handleMergeMessage = (event: MergeMessageHubEvent) => {
    mergedMessages.push(event.mergeMessageBody.message);
  };

  beforeAll(() => {
    engine.eventHandler.on("mergeMessage", handleMergeMessage);
  });

  afterAll(() => {
    engine.eventHandler.off("mergeMessage", handleMergeMessage);
  });

  beforeEach(async () => {
    mergedMessages = [];
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test("succeeds and merges messages in parallel", async () => {
    const results = await engine.mergeMessages([
      castAdd,
      reactionAdd,
      linkAdd,
      userDataAdd,
      verificationAdd,
      signerRemove,
    ]);
    for (const result of results) {
      expect(result).toBeInstanceOf(Ok);
    }
    expect(new Set(mergedMessages)).toEqual(
      new Set([signerAdd, castAdd, reactionAdd, linkAdd, userDataAdd, verificationAdd, signerRemove]),
    );
  });
});

describe("revokeMessagesBySigner", () => {
  let revokedMessages: Message[];
  const handleRevokedMessage = (event: RevokeMessageHubEvent) => {
    revokedMessages.push(event.revokeMessageBody.message);
  };

  beforeAll(() => {
    engine.eventHandler.on("revokeMessage", handleRevokedMessage);
  });

  afterAll(() => {
    engine.eventHandler.off("revokeMessage", handleRevokedMessage);
  });

  beforeEach(async () => {
    revokedMessages = [];
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
    await engine.mergeMessage(castAdd);
    await engine.mergeMessage(reactionAdd);
    await engine.mergeMessage(linkAdd);
    await engine.mergeMessage(verificationAdd);
    await engine.mergeMessage(userDataAdd);
  });

  const checkMessage = (message: Message): Promise<Message> => {
    const data = message.data as MessageData;
    const tsHash = makeTsHash(data.timestamp, message.hash)._unsafeUnwrap();
    return getMessage(db, data.fid, typeToSetPostfix(data.type), tsHash);
  };

  test("revokes messages signed by EIP-712 signer", async () => {
    const signerMessages = [signerAdd];
    for (const message of signerMessages) {
      await expect(checkMessage(message)).resolves.toEqual(message);
    }
    await expect(engine.revokeMessagesBySigner(fid, custodySignerKey)).resolves.toBeInstanceOf(Ok);
    for (const message of signerMessages) {
      await expect(checkMessage(message)).rejects.toThrow();
    }
    expect(revokedMessages).toEqual(signerMessages);
  });

  test("revokes messages signed by Ed25519 signer", async () => {
    const signerMessages = [castAdd, reactionAdd, linkAdd, verificationAdd, userDataAdd];
    for (const message of signerMessages) {
      await expect(checkMessage(message)).resolves.toEqual(message);
    }
    await expect(engine.revokeMessagesBySigner(fid, signerKey)).resolves.toBeInstanceOf(Ok);
    for (const message of signerMessages) {
      await expect(checkMessage(message)).rejects.toThrow();
    }
    expect(revokedMessages).toEqual(signerMessages);
  });
});

describe("with listeners and workers", () => {
  let liveEngine: Engine;
  setReferenceDateForTest(100000000000000000000000);

  let revokedMessages: Message[];

  const handleRevokeMessage = (event: RevokeMessageHubEvent) => {
    revokedMessages.push(event.revokeMessageBody.message);
  };

  beforeEach(async () => {
    revokedMessages = [];
    liveEngine = new Engine(db, FarcasterNetwork.TESTNET);
    liveEngine.eventHandler.on("revokeMessage", handleRevokeMessage);
    await liveEngine.start();
  });

  afterEach(async () => {
    liveEngine.eventHandler.off("revokeMessage", handleRevokeMessage);
    await liveEngine.stop();
  });

  describe("with messages", () => {
    beforeEach(async () => {
      await liveEngine.mergeIdRegistryEvent(custodyEvent);
      await liveEngine.mergeMessage(signerAdd);
      await liveEngine.mergeMessages([castAdd, reactionAdd, linkAdd]);
      expect(await liveEngine.getCast(fid, castAdd.hash)).toEqual(ok(castAdd));
      expect(
        await liveEngine.getReaction(
          fid,
          reactionAdd.data.reactionBody.type,
          reactionAdd.data.reactionBody.targetCastId as CastId,
        ),
      ).toEqual(ok(reactionAdd));
      setReferenceDateForTest(100000000000000000000000);
      expect(
        await liveEngine.getLink(fid, linkAdd.data.linkBody.type, linkAdd.data.linkBody.targetFid as number),
      ).toEqual(ok(linkAdd));
    });

    test("revokes messages when SignerRemove is merged", async () => {
      await liveEngine.mergeMessage(signerRemove);
      expect(revokedMessages).toEqual([]);
      await sleep(200); // Wait for engine to revoke messages
      expect(revokedMessages).toEqual([castAdd, reactionAdd, linkAdd]);
    });

    test("revokes messages when fid is transferred", async () => {
      const custodyTransfer = Factories.IdRegistryEvent.build({
        fid,
        from: custodyEvent.to,
        blockNumber: custodyEvent.blockNumber + 1,
      });
      await liveEngine.mergeIdRegistryEvent(custodyTransfer);
      await sleep(200);
      // Does not immediately revoke messages, will wait 1 hr
      expect(revokedMessages).toEqual([]);

      // Manually trigger the job
      const queue = new RevokeMessagesBySignerJobQueue(db);
      const worker = new RevokeMessagesBySignerJobWorker(queue, db, liveEngine);
      await worker.processJobs(Date.now() + 1000 * 10 * 60 + 5000);
      expect(revokedMessages).toEqual([]); // No messages revoked yet, after 10 mins

      // Revokes messages after 1 hr
      await worker.processJobs(Date.now() + 1000 * 60 * 60 + 5000);
      expect(revokedMessages).toContainEqual(signerAdd);
    });

    test("revokes messages when onchain signer is removed", async () => {
      const idRegistryOnChainEvent = Factories.IdRegistryOnChainEvent.build({ fid });
      const signerEventBody = Factories.SignerEventBody.build({ key: signerAdd.data.signerAddBody.signer });
      const onChainSignerEvent = Factories.SignerOnChainEvent.build({ fid, signerEventBody });

      await liveEngine.mergeOnChainEvent(idRegistryOnChainEvent);
      await liveEngine.mergeOnChainEvent(onChainSignerEvent);
      await liveEngine.mergeOnChainEvent(Factories.SignerMigratedOnChainEvent.build());

      const signerRemovalBody = Factories.SignerEventBody.build({
        eventType: SignerEventType.REMOVE,
        key: signerEventBody.key,
      });
      const signerRemovalEvent = Factories.SignerOnChainEvent.build({ fid, signerEventBody: signerRemovalBody });
      await liveEngine.mergeOnChainEvent(signerRemovalEvent);

      expect(revokedMessages).toEqual([]);
      await sleep(200); // Wait for engine to revoke messages
      expect(revokedMessages).toEqual([castAdd, reactionAdd, linkAdd]);
    });

    test("does not revoke UserDataAdd when fname is transferred to different address but same fid", async () => {
      const fname = Factories.Fname.build();
      const nameProof = Factories.UserNameProof.build({
        name: fname,
        fid,
        owner: custodyEvent.to,
      });
      const anotherNameProof = Factories.UserNameProof.build({
        name: Factories.Fname.build(),
        fid,
        owner: custodyEvent.to,
      });
      await expect(liveEngine.mergeUserNameProof(nameProof)).resolves.toBeInstanceOf(Ok);
      await expect(liveEngine.mergeUserNameProof(anotherNameProof)).resolves.toBeInstanceOf(Ok);
      const fnameAdd = await Factories.UserDataAddMessage.create(
        {
          data: {
            userDataBody: { type: UserDataType.USERNAME, value: bytesToUtf8String(fname)._unsafeUnwrap() },
            fid,
          },
        },
        { transient: { signer } },
      );
      await expect(liveEngine.mergeMessage(fnameAdd)).resolves.toBeInstanceOf(Ok);
      const nameTransferToDifferentOwnerAddress = Factories.UserNameProof.build({
        name: fname,
        fid,
        owner: Factories.EthAddress.build(),
        timestamp: nameProof.timestamp + 1,
      });
      const nameTransferToDifferentFid = Factories.UserNameProof.build({
        name: fname,
        fid: Factories.Fid.build(),
        owner: Factories.EthAddress.build(),
        timestamp: nameProof.timestamp + 2,
      });
      const anotherNameTransfer = Factories.UserNameProof.build({
        name: anotherNameProof.name,
        fid,
        owner: Factories.EthAddress.build(),
        timestamp: anotherNameProof.timestamp + 1,
      });
      await expect(liveEngine.mergeUserNameProof(anotherNameTransfer)).resolves.toBeInstanceOf(Ok);
      expect(revokedMessages).toEqual([]);
      await sleep(200); // Wait for engine to revoke messages
      // Does not revoke name because current username has not been transferred yet
      expect(revokedMessages).toEqual([]);

      await expect(liveEngine.mergeUserNameProof(nameTransferToDifferentOwnerAddress)).resolves.toBeInstanceOf(Ok);
      expect(revokedMessages).toEqual([]);
      await sleep(200); // Wait for engine to revoke messages
      // Does not revoke name because username belongs to the same fid
      expect(revokedMessages).toEqual([]);

      await expect(liveEngine.mergeUserNameProof(nameTransferToDifferentFid)).resolves.toBeInstanceOf(Ok);
      expect(revokedMessages).toEqual([]);
      await sleep(200); // Wait for engine to revoke messages
      // Revokes because fid does not own the name anymore
      expect(revokedMessages).toEqual([fnameAdd]);
    });
  });
});

describe("stop", () => {
  test("removes all event listeners", async () => {
    const eventNames: (keyof StoreEvents)[] = ["mergeMessage", "mergeIdRegistryEvent"];
    const scopedEngine = new Engine(db, FarcasterNetwork.TESTNET);
    for (const eventName of eventNames) {
      expect(scopedEngine.eventHandler.listenerCount(eventName)).toEqual(0);
    }
    await scopedEngine.start();
    for (const eventName of eventNames) {
      expect(scopedEngine.eventHandler.listenerCount(eventName)).toEqual(1);
    }
    await scopedEngine.stop();
    for (const eventName of eventNames) {
      expect(scopedEngine.eventHandler.listenerCount(eventName)).toEqual(0);
    }
  });
});
