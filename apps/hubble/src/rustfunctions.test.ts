import { blake3 } from "@noble/hashes/blake3";
import { nativeBlake3Hash20, nativeEd25519Verify } from "./rustfunctions.js";
import { Factories, ed25519 } from "@farcaster/hub-nodejs";

describe("blake3 tests", () => {
  test("hashes match rust", () => {
    const data = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);

    const rusthash = nativeBlake3Hash20(data);
    const hash = blake3.create({ dkLen: 20 }).update(data).digest();

    expect(rusthash).toEqual(hash);
  });

  test("hashes match rust for empty data", () => {
    const data = new Uint8Array([]);

    const rusthash = nativeBlake3Hash20(data);
    const hash = blake3(data, { dkLen: 20 });

    expect(rusthash).toEqual(hash);
  });
});

describe("ed25519 tests", () => {
  test("create and verify signature", async () => {
    const signer = Factories.Ed25519Signer.build();
    const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
    const hash = Factories.Bytes.build({}, { transient: { length: 32 } });
    const signature = (await signer.signMessageHash(hash))._unsafeUnwrap();

    expect((await ed25519.verifyMessageHashSignature(signature, hash, signerKey))._unsafeUnwrap()).toBeTruthy();
    expect(await nativeEd25519Verify(signature, hash, signerKey)).toBeTruthy();
  });

  test("bad signature fails", async () => {
    const signer = Factories.Ed25519Signer.build();
    const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
    const hash = Factories.Bytes.build({}, { transient: { length: 32 } });
    const signature = (await signer.signMessageHash(hash))._unsafeUnwrap();

    const badHash = Factories.Bytes.build({}, { transient: { length: 32 } });

    expect((await ed25519.verifyMessageHashSignature(signature, badHash, signerKey))._unsafeUnwrap()).toBeFalsy();
    expect(await nativeEd25519Verify(signature, badHash, signerKey)).toBeFalsy();
  });

  test("bad signer fails", async () => {
    const signer = Factories.Ed25519Signer.build();
    const hash = Factories.Bytes.build({}, { transient: { length: 32 } });
    const signature = (await signer.signMessageHash(hash))._unsafeUnwrap();

    const badSigner = Factories.Bytes.build({}, { transient: { length: 32 } });

    expect((await ed25519.verifyMessageHashSignature(signature, hash, badSigner))._unsafeUnwrap()).toBeFalsy();
    expect(await nativeEd25519Verify(signature, hash, badSigner)).toBeFalsy();
  });

  test("bad signature fails", async () => {
    const signer = Factories.Ed25519Signer.build();
    const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
    const hash = Factories.Bytes.build({}, { transient: { length: 32 } });

    const badSignature = Factories.Bytes.build({}, { transient: { length: 64 } });

    expect((await ed25519.verifyMessageHashSignature(badSignature, hash, signerKey))._unsafeUnwrap()).toBeFalsy();
    expect(await nativeEd25519Verify(badSignature, hash, signerKey)).toBeFalsy();
  });

  test("0 length data fails", async () => {
    const signer = Factories.Ed25519Signer.build();
    const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
    const hash = Factories.Bytes.build({}, { transient: { length: 32 } });
    const signature = (await signer.signMessageHash(hash))._unsafeUnwrap();

    const empty = new Uint8Array([]);

    expect(await nativeEd25519Verify(empty, hash, signerKey)).toBeFalsy();
    expect(await nativeEd25519Verify(signature, empty, signerKey)).toBeFalsy();
    expect(await nativeEd25519Verify(signature, hash, empty)).toBeFalsy();
  });
});
