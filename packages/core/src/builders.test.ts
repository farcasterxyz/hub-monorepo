import { faker } from "@faker-js/faker";
import * as protobufs from "./protobufs";
import { Protocol } from "./protobufs";
import { err, ok } from "neverthrow";
import * as builders from "./builders";
import { bytesToHexString, hexStringToBytes, utf8StringToBytes } from "./bytes";
import { HubError } from "./errors";
import { Factories } from "./factories";
import * as validations from "./validations";
import { makeVerificationAddressClaim, VerificationAddressClaim } from "./verifications";
import { getFarcasterTime, toFarcasterTime } from "./time";
import { makeUserNameProofClaim } from "./userNameProof";
import {
  MAX_KEY_TTL_SECONDS,
  decodeGaslessSignedKeyRequestMetadata,
  verifyGaslessKeyRequest,
  verifyKeyAdd,
  verifyKeyRemove,
} from "./gaslessKeys";

const fid = Factories.Fid.build();
const network = protobufs.FarcasterNetwork.TESTNET;

const ed25519Signer = Factories.Ed25519Signer.build();
const eip712Signer = Factories.Eip712Signer.build();
let ethSignerKey: Uint8Array;
let signerKey: Uint8Array;

beforeAll(async () => {
  [ethSignerKey, signerKey] = (await Promise.all([eip712Signer.getSignerKey(), ed25519Signer.getSignerKey()])).map(
    (res) => res._unsafeUnwrap(),
  );
});

describe("makeCastAddData", () => {
  test("succeeds", async () => {
    const data = await builders.makeCastAddData(
      protobufs.CastAddBody.create({
        text: faker.random.alphaNumeric(200),
        mentions: [Factories.Fid.build(), Factories.Fid.build()],
        mentionsPositions: [10, 20],
        parentCastId: { fid: Factories.Fid.build(), hash: Factories.MessageHash.build() },
        embeds: [{ url: faker.internet.url() }, { castId: Factories.CastId.build() }],
      }),
      { fid, network },
    );
    expect(data.isOk()).toBeTruthy();
    const isValid = await validations.validateMessageData(data._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe("makeCastRemoveData", () => {
  test("succeeds", async () => {
    const data = await builders.makeCastRemoveData({ targetHash: Factories.MessageHash.build() }, { fid, network });
    expect(data.isOk()).toBeTruthy();
    const isValid = await validations.validateMessageData(data._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe("makeCastAdd", () => {
  test("succeeds", async () => {
    const message = await builders.makeCastAdd(
      protobufs.CastAddBody.create({
        text: faker.random.alphaNumeric(200),
        mentions: [Factories.Fid.build(), Factories.Fid.build()],
        mentionsPositions: [10, 20],
        parentCastId: { fid: Factories.Fid.build(), hash: Factories.MessageHash.build() },
        embeds: [{ url: faker.internet.url() }, { castId: Factories.CastId.build() }],
      }),
      { fid, network },
      ed25519Signer,
    );
    expect(message.isOk()).toBeTruthy();
    const isValid = await validations.validateMessage(message._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe("makeCastRemove", () => {
  test("succeeds", async () => {
    const message = await builders.makeCastRemove(
      { targetHash: Factories.MessageHash.build() },
      { fid, network },
      ed25519Signer,
    );
    expect(message.isOk()).toBeTruthy();
    const isValid = await validations.validateMessage(message._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe("makeReactionAddData", () => {
  test("succeeds", async () => {
    const data = await builders.makeReactionAddData(
      { type: Factories.ReactionType.build(), targetCastId: { fid, hash: Factories.MessageHash.build() } },
      { fid, network },
    );
    expect(data.isOk()).toBeTruthy();
    const isValid = await validations.validateMessageData(data._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe("makeReactionRemoveData", () => {
  test("succeeds", async () => {
    const data = await builders.makeReactionRemoveData(
      { type: Factories.ReactionType.build(), targetCastId: { fid, hash: Factories.MessageHash.build() } },
      { fid, network },
    );
    expect(data.isOk()).toBeTruthy();
    const isValid = await validations.validateMessageData(data._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe("makeReactionAdd", () => {
  test("succeeds", async () => {
    const message = await builders.makeReactionAdd(
      protobufs.ReactionBody.create({
        type: Factories.ReactionType.build(),
        targetCastId: { fid, hash: Factories.MessageHash.build() },
      }),
      { fid, network },
      ed25519Signer,
    );
    expect(message.isOk()).toBeTruthy();
    const isValid = await validations.validateMessage(message._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe("makeReactionRemove", () => {
  test("succeeds", async () => {
    const message = await builders.makeReactionRemove(
      { type: Factories.ReactionType.build(), targetCastId: { fid, hash: Factories.MessageHash.build() } },
      { fid, network },
      ed25519Signer,
    );
    expect(message.isOk()).toBeTruthy();
    const isValid = await validations.validateMessage(message._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe("makeVerificationAddEthAddressData", () => {
  const blockHash = Factories.BlockHash.build();
  let ethSignature: Uint8Array;
  let claim: VerificationAddressClaim;

  beforeAll(async () => {
    claim = makeVerificationAddressClaim(fid, ethSignerKey, network, blockHash, Protocol.ETHEREUM)._unsafeUnwrap();
    const signature = (await eip712Signer.signVerificationEthAddressClaim(claim))._unsafeUnwrap();
    expect(signature).toBeTruthy();
    ethSignature = signature;
  });

  test("succeeds", async () => {
    const data = await builders.makeVerificationAddEthAddressData(
      {
        address: ethSignerKey,
        blockHash: blockHash,
        claimSignature: ethSignature,
        protocol: Protocol.ETHEREUM,
      },
      { fid, network },
    );
    expect(data.isOk()).toBeTruthy();
    const isValid = await validations.validateMessageData(data._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe("makeVerificationRemoveData", () => {
  test("succeeds", async () => {
    const data = await builders.makeVerificationRemoveData(
      {
        address: ethSignerKey,
        protocol: Protocol.ETHEREUM,
      },
      { fid, network },
    );
    expect(data.isOk()).toBeTruthy();
    const isValid = await validations.validateMessageData(data._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe("makeVerificationAddEthAddress", () => {
  const blockHash = Factories.BlockHash.build();
  let ethSignature: Uint8Array;
  let claim: VerificationAddressClaim;

  beforeAll(async () => {
    claim = makeVerificationAddressClaim(fid, ethSignerKey, network, blockHash, Protocol.ETHEREUM)._unsafeUnwrap();
    const signatureHex = (await eip712Signer.signVerificationEthAddressClaim(claim))._unsafeUnwrap();
    expect(signatureHex).toBeTruthy();
    ethSignature = signatureHex;
  });

  test("succeeds", async () => {
    const message = await builders.makeVerificationAddEthAddress(
      {
        address: ethSignerKey,
        blockHash: blockHash,
        claimSignature: ethSignature,
        protocol: Protocol.ETHEREUM,
      },
      { fid, network },
      ed25519Signer,
    );
    const isValid = await validations.validateMessage(message._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe("makeVerificationRemove", () => {
  test("succeeds", async () => {
    const message = await builders.makeVerificationRemove(
      { address: ethSignerKey, protocol: Protocol.ETHEREUM },
      { fid, network },
      ed25519Signer,
    );
    const isValid = await validations.validateMessage(message._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe("makeUserDataAddData", () => {
  test("succeeds", async () => {
    const data = await builders.makeUserDataAddData(
      { type: protobufs.UserDataType.BIO, value: faker.lorem.word() },
      { fid, network },
    );
    const isValid = await validations.validateMessageData(data._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe("makeUserDataAdd", () => {
  test("succeeds", async () => {
    const message = await builders.makeUserDataAdd(
      { type: protobufs.UserDataType.PFP, value: faker.random.alphaNumeric(100) },
      { fid, network },
      ed25519Signer,
    );
    const isValid = await validations.validateMessage(message._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe("makeMessageHash", () => {
  test("succeeds", async () => {
    const body = protobufs.CastAddBody.create({
      text: faker.random.alphaNumeric(200),
    });
    const message = await builders.makeCastAdd(body, { fid, network }, ed25519Signer);
    expect(message.isOk()).toBeTruthy();
    const data = await builders.makeCastAddData(body, { fid, network });
    expect(data.isOk()).toBeTruthy();
    const hash = await builders.makeMessageHash(data._unsafeUnwrap());
    expect(hash).toEqual(ok(message._unsafeUnwrap().hash));
  });
});

describe("makeMessageWithSignature", () => {
  test("succeeds", async () => {
    const body = protobufs.CastAddBody.create({ text: "test" });
    const timestamp = getFarcasterTime()._unsafeUnwrap();
    const castAdd = await builders.makeCastAdd(body, { fid, network, timestamp }, ed25519Signer);

    const data = await builders.makeCastAddData(body, { fid, network, timestamp });
    const hash = await builders.makeMessageHash(data._unsafeUnwrap());
    const signature = (await ed25519Signer.signMessageHash(hash._unsafeUnwrap()))._unsafeUnwrap();
    const message = await builders.makeMessageWithSignature(data._unsafeUnwrap(), {
      signer: (await ed25519Signer.getSignerKey())._unsafeUnwrap(),
      signatureScheme: ed25519Signer.scheme,
      signature: signature,
    });

    const isValid = await validations.validateMessage(message._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();

    expect(message).toEqual(castAdd);
  });

  test("fails with invalid signature", async () => {
    const signature = hexStringToBytes(
      "0xf8dc77d52468483806addab7d397836e802551bfb692604e2d7df4bc4820556c63524399a63d319ae4b027090ce296ade08286878dc1f414b62412f89e8bc4e01b",
    )._unsafeUnwrap();
    const data = await builders.makeCastAddData(protobufs.CastAddBody.create({ text: "test" }), { fid, network });
    expect(data.isOk()).toBeTruthy();
    const message = await builders.makeMessageWithSignature(data._unsafeUnwrap(), {
      signer: (await ed25519Signer.getSignerKey())._unsafeUnwrap(),
      signatureScheme: ed25519Signer.scheme,
      signature,
    });
    expect(message).toEqual(err(new HubError("bad_request.validation_failure", "invalid signature")));
  });
});

describe("makeLinkAddData", () => {
  test("succeeds", async () => {
    const targetFid = Factories.Fid.build();
    const type = "follow";
    const displayTimestamp = getFarcasterTime()._unsafeUnwrap();
    const data = await builders.makeLinkAddData(
      protobufs.LinkBody.create({
        targetFid,
        type,
        displayTimestamp,
      }),
      { fid, network },
    );
    expect(data.isOk()).toBeTruthy();
    expect(data._unsafeUnwrap().linkBody.targetFid).toEqual(targetFid);
    expect(data._unsafeUnwrap().linkBody.type).toEqual(type);
    expect(data._unsafeUnwrap().linkBody.displayTimestamp).toEqual(displayTimestamp);
    const isValid = await validations.validateMessageData(data._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe("makeLinkRemoveData", () => {
  test("succeeds", async () => {
    const targetFid = Factories.Fid.build();
    const type = "follow";
    const displayTimestamp = getFarcasterTime()._unsafeUnwrap();
    const data = await builders.makeLinkRemoveData(
      protobufs.LinkBody.create({
        targetFid,
        type,
        displayTimestamp,
      }),
      { fid, network },
    );
    expect(data.isOk()).toBeTruthy();
    expect(data._unsafeUnwrap().linkBody.targetFid).toEqual(targetFid);
    expect(data._unsafeUnwrap().linkBody.type).toEqual(type);
    expect(data._unsafeUnwrap().linkBody.displayTimestamp).toEqual(displayTimestamp);
    const isValid = await validations.validateMessageData(data._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe("makeLinkAdd", () => {
  test("succeeds", async () => {
    const message = await builders.makeLinkAdd(
      protobufs.LinkBody.create({
        targetFid: Factories.Fid.build(),
        type: "follow",
        displayTimestamp: getFarcasterTime()._unsafeUnwrap(),
      }),
      { fid, network },
      ed25519Signer,
    );
    expect(message.isOk()).toBeTruthy();
    const isValid = await validations.validateMessage(message._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe("makeLinkRemove", () => {
  test("succeeds", async () => {
    const message = await builders.makeLinkRemove(
      protobufs.LinkBody.create({
        targetFid: Factories.Fid.build(),
        type: "follow",
        displayTimestamp: getFarcasterTime()._unsafeUnwrap(),
      }),
      { fid, network },
      ed25519Signer,
    );
    expect(message.isOk()).toBeTruthy();
    const isValid = await validations.validateMessage(message._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe("username proof", () => {
  const fid = Factories.Fid.build();
  const proofTimestamp = Math.floor(Date.now() / 1000);
  const messageTimestamp = toFarcasterTime(proofTimestamp * 1000)._unsafeUnwrap();
  const name = "test.eth";

  let proof: protobufs.UserNameProof;

  beforeAll(async () => {
    const claim = makeUserNameProofClaim({
      name,
      owner: bytesToHexString(ethSignerKey)._unsafeUnwrap(),
      timestamp: proofTimestamp,
    });
    const signature = (await eip712Signer.signUserNameProofClaim(claim))._unsafeUnwrap();
    expect(signature).toBeTruthy();
    proof = {
      timestamp: proofTimestamp,
      name: utf8StringToBytes(name)._unsafeUnwrap(),
      owner: ethSignerKey,
      signature,
      fid,
      type: protobufs.UserNameType.USERNAME_TYPE_ENS_L1,
    };
  });

  describe("makeUsernameProofData", () => {
    test("succeeds", async () => {
      const data = await builders.makeUsernameProofData(proof, { fid, network, timestamp: messageTimestamp });
      const isValid = await validations.validateMessageData(data._unsafeUnwrap());
      expect(isValid.isOk()).toBeTruthy();
    });
  });

  describe("makeUsernameProof", () => {
    test("succeeds", async () => {
      const message = await builders.makeUsernameProof(
        proof,
        { fid, network, timestamp: messageTimestamp },
        ed25519Signer,
      );
      const isValid = await validations.validateMessage(message._unsafeUnwrap());
      expect(isValid.isOk()).toBeTruthy();
    });
  });
});

describe("makeFrameAction", () => {
  test("succeeds", async () => {
    const message = await builders.makeFrameAction(
      protobufs.FrameActionBody.create({
        buttonIndex: 1,
        url: Buffer.from("https://example.com"),
        castId: { fid, hash: Factories.MessageHash.build() },
      }),
      { fid, network },
      ed25519Signer,
    );
    const isValid = await validations.validateMessage(message._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe("gasless signers", () => {
  const keyAddOptions = () => ({
    fid: BigInt(fid),
    key: signerKey,
    scopes: [protobufs.MessageType.CAST_ADD, protobufs.MessageType.REACTION_ADD],
    ttl: 30 * 24 * 60 * 60,
    nonce: 1,
    deadline: getFarcasterTime()._unsafeUnwrap() + 60 * 60,
  });

  describe("makeKeyAddBody", () => {
    test("succeeds", async () => {
      const body = await builders.makeKeyAddBody(keyAddOptions(), eip712Signer);
      expect(body.isOk()).toBeTruthy();

      const value = body._unsafeUnwrap();
      expect(value.key).toEqual(signerKey);
      expect(value.keyType).toEqual(1);
      expect(value.metadataType).toEqual(1);
      expect(value.custodySignature.length).toEqual(65);

      // The custody signature must bind every authorized field.
      const valid = await verifyKeyAdd(
        {
          fid: BigInt(fid),
          key: value.key,
          keyType: value.keyType,
          scopes: value.scopes,
          ttl: value.ttl,
          nonce: value.nonce,
          deadline: BigInt(value.deadline),
        },
        value.custodySignature,
        ethSignerKey,
      );
      expect(valid).toEqual(ok(true));
    });

    test("embeds a SignedKeyRequest recoverable to the request signer", async () => {
      const body = (await builders.makeKeyAddBody(keyAddOptions(), eip712Signer))._unsafeUnwrap();
      const metadata = decodeGaslessSignedKeyRequestMetadata(body.metadata)._unsafeUnwrap();

      expect(metadata.requestFid).toEqual(BigInt(fid));
      expect(metadata.requestSigner.toLowerCase()).toEqual(bytesToHexString(ethSignerKey)._unsafeUnwrap());

      const valid = await verifyGaslessKeyRequest(
        { requestFid: metadata.requestFid, key: body.key, deadline: metadata.deadline },
        metadata.signature,
        ethSignerKey,
      );
      expect(valid).toEqual(ok(true));
    });

    test("uses a separate request signer when the app differs from the user", async () => {
      const appSigner = Factories.Eip712Signer.build();
      const appSignerKey = (await appSigner.getSignerKey())._unsafeUnwrap();
      const appFid = Factories.Fid.build();

      const body = (
        await builders.makeKeyAddBody({ ...keyAddOptions(), requestFid: BigInt(appFid) }, eip712Signer, appSigner)
      )._unsafeUnwrap();
      const metadata = decodeGaslessSignedKeyRequestMetadata(body.metadata)._unsafeUnwrap();

      expect(metadata.requestFid).toEqual(BigInt(appFid));
      expect(metadata.requestSigner.toLowerCase()).toEqual(bytesToHexString(appSignerKey)._unsafeUnwrap());
    });

    test("fails with a scope a signer may never hold", async () => {
      const body = await builders.makeKeyAddBody(
        { ...keyAddOptions(), scopes: [protobufs.MessageType.KEY_ADD] },
        eip712Signer,
      );
      expect(body).toEqual(err(new HubError("bad_request.validation_failure", "invalid scope: 16")));
    });

    test("fails with empty scopes", async () => {
      const body = await builders.makeKeyAddBody({ ...keyAddOptions(), scopes: [] }, eip712Signer);
      expect(body).toEqual(err(new HubError("bad_request.validation_failure", "scopes is required")));
    });

    test("fails when the signed key request has already expired", async () => {
      const body = await builders.makeKeyAddBody(
        { ...keyAddOptions(), deadline: getFarcasterTime()._unsafeUnwrap() - 60 },
        eip712Signer,
      );
      expect(body).toEqual(err(new HubError("bad_request.validation_failure", "signed key request has expired")));
    });

    test("fails when the metadata blob is not a valid SignedKeyRequest", async () => {
      const body = validations.validateKeyAddBody(
        protobufs.KeyAddBody.create({
          key: signerKey,
          keyType: 1,
          custodySignature: new Uint8Array(65),
          deadline: getFarcasterTime()._unsafeUnwrap() + 3600,
          nonce: 1,
          metadata: new Uint8Array([1, 2, 3]),
          metadataType: 1,
          scopes: [protobufs.MessageType.CAST_ADD],
          ttl: 3600,
        }),
      );
      expect(body).toEqual(
        err(new HubError("bad_request.validation_failure", "metadata is not a valid SignedKeyRequest")),
      );
    });

    test("fails with a ttl beyond the maximum", async () => {
      const body = await builders.makeKeyAddBody({ ...keyAddOptions(), ttl: MAX_KEY_TTL_SECONDS + 1 }, eip712Signer);
      expect(body.isErr()).toBeTruthy();
      expect(body._unsafeUnwrapErr().message).toMatch("ttl must be");
    });
  });

  describe("makeKeyAdd", () => {
    test("succeeds and validates as a message", async () => {
      const body = (await builders.makeKeyAddBody(keyAddOptions(), eip712Signer))._unsafeUnwrap();
      const message = await builders.makeKeyAdd(body, { fid, network }, ed25519Signer);
      expect(message.isOk()).toBeTruthy();

      const value = message._unsafeUnwrap();
      expect(value.data.type).toEqual(protobufs.MessageType.KEY_ADD);
      // The envelope signer is the key being added — proof of possession.
      expect(value.signer).toEqual(signerKey);

      const isValid = await validations.validateMessage(value);
      expect(isValid.isOk()).toBeTruthy();
    });
  });

  describe("makeKeyRemoveBody", () => {
    test("succeeds with a custody signature", async () => {
      const body = await builders.makeKeyRemoveBody(
        { fid: BigInt(fid), key: signerKey, nonce: 2, deadline: getFarcasterTime()._unsafeUnwrap() + 60 * 60 },
        eip712Signer,
      );
      expect(body.isOk()).toBeTruthy();

      const value = body._unsafeUnwrap();
      expect(value.signatureType).toEqual(1);

      const valid = await verifyKeyRemove(
        { fid: BigInt(fid), key: value.key, nonce: value.nonce, deadline: BigInt(value.deadline) },
        value.signature,
        ethSignerKey,
      );
      expect(valid).toEqual(ok(true));
    });

    test("accepts a past deadline, matching the node", async () => {
      // KeyRemoveBody has no metadata blob and the node never compares body.deadline to the
      // message timestamp, so rejecting this here would fail messages the network merges.
      const body = await builders.makeKeyRemoveBody(
        { fid: BigInt(fid), key: signerKey, nonce: 2, deadline: getFarcasterTime()._unsafeUnwrap() - 60 },
        eip712Signer,
      );
      expect(body.isOk()).toBeTruthy();
    });
  });

  describe("makeKeyRemoveBodySelfRevoke", () => {
    test("succeeds without a custody signature", async () => {
      const body = builders.makeKeyRemoveBodySelfRevoke({
        key: signerKey,
        nonce: 3,
        deadline: getFarcasterTime()._unsafeUnwrap() + 60 * 60,
      });
      expect(body.isOk()).toBeTruthy();
      expect(body._unsafeUnwrap().signatureType).toEqual(2);
      expect(body._unsafeUnwrap().signature.length).toEqual(0);
    });
  });

  describe("makeKeyRemove", () => {
    test("succeeds and validates as a message", async () => {
      const body = builders
        .makeKeyRemoveBodySelfRevoke({
          key: signerKey,
          nonce: 3,
          deadline: getFarcasterTime()._unsafeUnwrap() + 60 * 60,
        })
        ._unsafeUnwrap();
      const message = await builders.makeKeyRemove(body, { fid, network }, ed25519Signer);
      expect(message.isOk()).toBeTruthy();
      expect(message._unsafeUnwrap().data.type).toEqual(protobufs.MessageType.KEY_REMOVE);

      const isValid = await validations.validateMessage(message._unsafeUnwrap());
      expect(isValid.isOk()).toBeTruthy();
    });
  });
});
