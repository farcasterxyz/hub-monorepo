import { blake3 } from "@noble/hashes/blake3";
import { createEd25519PeerId } from "@libp2p/peer-id-factory";
import { unmarshalPrivateKey } from "@libp2p/crypto/keys";
import { rsBlake3Hash20, rsEd25519SignMessageHash, rsEd25519Verify } from "./rustfunctions.js";
import { Factories, ed25519 } from "@farcaster/hub-nodejs";

describe("blake3 tests", () => {
  test("hashes match rust", () => {
    const data = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);

    const rusthash = rsBlake3Hash20(data);
    const hash = blake3.create({ dkLen: 20 }).update(data).digest();

    expect(rusthash).toEqual(hash);
  });

  test("hashes match rust for empty data", () => {
    const data = new Uint8Array([]);

    const rusthash = rsBlake3Hash20(data);
    const hash = blake3(data, { dkLen: 20 });

    expect(rusthash).toEqual(hash);
  });
});

describe("ed25519 tests", () => {
  test("native signing with peer key and verification", async () => {
    const peerId = await createEd25519PeerId();
    const hash = Factories.Bytes.build({}, { transient: { length: 32 } });
    const privateKey = peerId.privateKey;
    if (!privateKey) {
      fail("peerid does not contain private key");
    }

    const rawPrivKey = await unmarshalPrivateKey(privateKey);
    const nativeSignature = await rsEd25519SignMessageHash(hash, rawPrivKey.marshal());

    expect(
      (await ed25519.verifyMessageHashSignature(nativeSignature, hash, rawPrivKey.public.marshal()))._unsafeUnwrap(),
    ).toBeTruthy();
    expect(await rsEd25519Verify(nativeSignature, hash, rawPrivKey.public.marshal())).toBeTruthy();
  });

  test("create and verify signature", async () => {
    const signer = Factories.Ed25519Signer.build();
    const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
    const hash = Factories.Bytes.build({}, { transient: { length: 32 } });
    const signature = (await signer.signMessageHash(hash))._unsafeUnwrap();

    expect((await ed25519.verifyMessageHashSignature(signature, hash, signerKey))._unsafeUnwrap()).toBeTruthy();
    expect(await rsEd25519Verify(signature, hash, signerKey)).toBeTruthy();
  });

  test("bad signature fails", async () => {
    const signer = Factories.Ed25519Signer.build();
    const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
    const hash = Factories.Bytes.build({}, { transient: { length: 32 } });
    const signature = (await signer.signMessageHash(hash))._unsafeUnwrap();

    const badHash = Factories.Bytes.build({}, { transient: { length: 32 } });

    expect((await ed25519.verifyMessageHashSignature(signature, badHash, signerKey))._unsafeUnwrap()).toBeFalsy();
    expect(await rsEd25519Verify(signature, badHash, signerKey)).toBeFalsy();
  });

  test("bad signer fails", async () => {
    const signer = Factories.Ed25519Signer.build();
    const hash = Factories.Bytes.build({}, { transient: { length: 32 } });
    const signature = (await signer.signMessageHash(hash))._unsafeUnwrap();

    const badSigner = Factories.Bytes.build({}, { transient: { length: 32 } });

    expect((await ed25519.verifyMessageHashSignature(signature, hash, badSigner))._unsafeUnwrap()).toBeFalsy();
    expect(await rsEd25519Verify(signature, hash, badSigner)).toBeFalsy();
  });

  test("bad signature fails", async () => {
    const signer = Factories.Ed25519Signer.build();
    const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
    const hash = Factories.Bytes.build({}, { transient: { length: 32 } });

    const badSignature = Factories.Bytes.build({}, { transient: { length: 64 } });

    expect((await ed25519.verifyMessageHashSignature(badSignature, hash, signerKey))._unsafeUnwrap()).toBeFalsy();
    expect(await rsEd25519Verify(badSignature, hash, signerKey)).toBeFalsy();
  });

  test("0 length data fails", async () => {
    const signer = Factories.Ed25519Signer.build();
    const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
    const hash = Factories.Bytes.build({}, { transient: { length: 32 } });
    const signature = (await signer.signMessageHash(hash))._unsafeUnwrap();

    const empty = new Uint8Array([]);

    expect(await rsEd25519Verify(empty, hash, signerKey)).toBeFalsy();
    expect(await rsEd25519Verify(signature, empty, signerKey)).toBeFalsy();
    expect(await rsEd25519Verify(signature, hash, empty)).toBeFalsy();
  });
});
