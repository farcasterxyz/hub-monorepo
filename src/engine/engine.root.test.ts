import Engine from '~/engine';
import { Factories } from '~/factories';
import { Cast, MessageFactoryTransientParams, MessageSigner, Root } from '~/types';
import { hashCompare, generateEd25519Signer, generateEthereumSigner } from '~/utils';
import Faker from 'faker';

const engine = new Engine();
const username = 'alice';

describe('mergeRoot', () => {
  let root100: Root;
  let root110: Root;
  let root90: Root;
  let root200_1: Root;
  let root200_2: Root;
  let transient: { transient: MessageFactoryTransientParams };

  let aliceSigner: MessageSigner;
  let aliceAddress: string;
  const subject = () => engine.getRoot(username);

  beforeAll(async () => {
    // Randomly generate either an Ed25519 or Ethereum signer
    if (Math.random() > 0.5) {
      aliceSigner = await generateEd25519Signer();
    } else {
      aliceSigner = await generateEthereumSigner();
    }
    aliceAddress = aliceSigner.signerKey;
    transient = { transient: { signer: aliceSigner } };

    root100 = await Factories.Root.create({ data: { rootBlock: 100, username: 'alice' } }, transient);

    root110 = await Factories.Root.create(
      {
        data: {
          rootBlock: 110,
          username: 'alice',
        },
      },
      transient
    );

    root90 = await Factories.Root.create({ data: { rootBlock: 90, username: 'alice' } }, transient);

    // Note that for root200_1 and root200_2 we change the signedAt to generate different hashes for the
    // test regarding processing of hashes
    root200_1 = await Factories.Root.create(
      {
        data: { rootBlock: 200, username: 'alice', signedAt: Date.now() },
      },
      transient
    );

    root200_2 = await Factories.Root.create(
      {
        data: { rootBlock: 200, username: 'alice', signedAt: Date.now() + 5 * 60 * 1000 },
      },
      transient
    );
  });

  // Every test should start with a valid signer for alice.
  beforeEach(() => {
    engine._reset();

    // Register the Ethereum address as a valid signer for @alice at block 99
    const aliceRegistrationSignerChange = {
      blockNumber: 99,
      blockHash: Faker.datatype.hexaDecimal(64).toLowerCase(),
      logIndex: 0,
      address: aliceAddress,
    };
    engine.addSignerChange('alice', aliceRegistrationSignerChange);
  });

  describe('input validation: ', () => {
    test('bad type (string) should fail', async () => {
      const invalidTypeRes = await engine.mergeRoot('bar' as unknown as Root);
      expect(invalidTypeRes._unsafeUnwrapErr()).toBe('mergeRoot: invalid root');
    });

    test('incorrect type (cast) should fail', async () => {
      const cast = await Factories.Cast.create();
      const castRes = await engine.mergeRoot(cast as unknown as Root);
      expect(castRes._unsafeUnwrapErr()).toBe('mergeRoot: invalid root');
    });

    // TODO: test with Reactions, Follows
  });

  describe('signer validation:', () => {
    test('fails if there are no known signers', async () => {
      engine._resetSigners();
      const result = await engine.mergeRoot(root100);
      expect(result._unsafeUnwrapErr()).toBe('validateMessage: invalid signer');
      expect(subject()).toEqual(undefined);
    });

    test('fails if the signer was valid, but it changed before this block', async () => {
      const changeSigner = {
        blockNumber: 99,
        blockHash: Faker.datatype.hexaDecimal(64).toLowerCase(),
        logIndex: 1,
        address: Faker.datatype.hexaDecimal(40).toLowerCase(),
      };
      engine.addSignerChange('alice', changeSigner);

      expect((await engine.mergeRoot(root100))._unsafeUnwrapErr()).toBe('validateMessage: invalid signer');
      expect(subject()).toEqual(undefined);
    });

    test('fails if the signer was valid, but only after this block', async () => {
      engine._resetSigners();
      const changeSigner = {
        blockNumber: 101,
        blockHash: Faker.datatype.hexaDecimal(64).toLowerCase(),
        logIndex: 0,
        address: aliceAddress,
      };

      engine.addSignerChange('alice', changeSigner);

      const result = await engine.mergeRoot(root100);
      expect(result._unsafeUnwrapErr()).toBe('validateMessage: invalid signer');
      expect(subject()).toEqual(undefined);
    });

    test('fails if the signer was not valid', async () => {
      // Calling Factory without specifying a signing key makes Faker choose a random one
      const invalidSigner = await Factories.Root.create({ data: { rootBlock: 100, username: 'alice' } });

      expect((await engine.mergeRoot(invalidSigner))._unsafeUnwrapErr()).toBe('validateMessage: invalid signer');
      expect(subject()).toEqual(undefined);
    });

    test('fails if the signer was valid, but the username was invalid', async () => {
      const root = await Factories.Root.create({ data: { rootBlock: 100, username: 'rob' } }, transient);

      expect((await engine.mergeRoot(root))._unsafeUnwrapErr()).toBe('validateMessage: invalid signer');
      expect(subject()).toEqual(undefined);
    });

    test('succeeds if the signer was valid, even if it changes in a later block', async () => {
      const signerChange2 = {
        blockNumber: 150,
        blockHash: Faker.datatype.hexaDecimal(64).toLowerCase(),
        logIndex: 0,
        address: Faker.datatype.hexaDecimal(40).toLowerCase(),
      };

      engine.addSignerChange('alice', signerChange2);

      expect((await engine.mergeRoot(root100)).isOk()).toBe(true);
      expect(subject()).toEqual(root100);
    });
  });

  describe('message validation: ', () => {
    test('fails if root has an invalid hash', async () => {
      const invalidHash = JSON.parse(JSON.stringify(root100)) as Root;
      invalidHash.hash = '0xd4126acebadb14b41943fc10599c00e2e3627f1e38672c8476277ecf17accb48';

      expect((await engine.mergeRoot(invalidHash))._unsafeUnwrapErr()).toBe('validateMessage: invalid hash');
      expect(subject()).toEqual(undefined);
    });

    test('fails if the signature is invalid', async () => {
      const invalidSignature = JSON.parse(JSON.stringify(root100)) as Cast;
      invalidSignature.signature =
        '0x5b699d494b515b22258c01ad19710d44c3f12235f0c01e91d09a1e4e2cd25d80c77026a7319906da3b8ce62abc18477c19e444a02949a0dde54f8cadef889502';
      expect((await engine.mergeCast(invalidSignature))._unsafeUnwrapErr()).toBe('validateMessage: invalid signature');
      expect(subject()).toEqual(undefined);
    });

    test('fails if signedAt is > current time + safety margin', async () => {
      const elevenMinutesAhead = Date.now() + 11 * 60 * 1000;
      const futureRoot = await Factories.Root.create(
        { data: { rootBlock: 120, username: 'alice', signedAt: elevenMinutesAhead } },
        transient
      );
      expect((await engine.mergeRoot(futureRoot))._unsafeUnwrapErr()).toEqual(
        'validateMessage: signedAt more than 10 mins in the future'
      );
    });
  });

  describe('eth block validation: ', () => {
    // test('fails if the block number does not point to a valid ethereum block', async () => {});
    // test('fails if it the block hash does not point to a valid ethereum block', async () => {});
    // test("fails if signedAt is < eth block's timestamp", async () => {});
  });

  describe('merge: ', () => {
    let cast: Cast;

    beforeEach(async () => {
      await engine.mergeRoot(root100);

      cast = await Factories.Cast.create(
        {
          data: {
            rootBlock: root100.data.rootBlock,
            username,
            signedAt: root100.data.signedAt + 1,
          },
        },
        transient
      );
      await engine.mergeCast(cast);
    });

    test('succeeds and wipes messages if the root block is higher', async () => {
      expect(engine._getCastAdds(username)).toEqual([cast]);
      await engine.mergeRoot(root110);
      expect(subject()).toEqual(root110);
      expect(engine._getCastAdds(username)).toEqual([]);
    });

    test('fails if the root block is identical but lexicographical hash value is lower', async () => {
      if (hashCompare(root200_1.hash, root200_2.hash) > 0) {
        expect((await engine.mergeRoot(root200_1)).isOk()).toEqual(true);
        expect((await engine.mergeRoot(root200_2))._unsafeUnwrapErr()).toEqual(
          'mergeRoot: newer root was present (lexicographically higher hash)'
        );
        expect(subject()).toEqual(root200_1);
      } else {
        expect((await engine.mergeRoot(root200_2)).isOk()).toEqual(true);
        expect((await engine.mergeRoot(root200_1))._unsafeUnwrapErr()).toEqual(
          'mergeRoot: newer root was present (lexicographically higher hash)'
        );
        expect(subject()).toEqual(root200_2);
      }
    });

    test('succeeds if the root block is identical but lexicographical hash value is higher', async () => {
      if (hashCompare(root200_1.hash, root200_2.hash) < 0) {
        expect((await engine.mergeRoot(root200_1)).isOk()).toEqual(true);
        expect((await engine.mergeRoot(root200_2)).isOk()).toEqual(true);
        expect(subject()).toEqual(root200_2);
      } else {
        expect((await engine.mergeRoot(root200_2)).isOk()).toEqual(true);
        expect((await engine.mergeRoot(root200_1)).isOk()).toEqual(true);
        expect(subject()).toEqual(root200_1);
      }
    });

    test('fails if the root is a duplicate', async () => {
      expect((await engine.mergeRoot(root100))._unsafeUnwrapErr()).toEqual('mergeRoot: provided root was a duplicate');
      expect(subject()).toEqual(root100);
      expect(engine._getCastAdds(username)).toEqual([cast]);
    });

    test("fails and preserves messages if the root block is older than the last know root's block", async () => {
      // ensure that alices signer is valid at block 90
      const changeSigner = {
        blockNumber: 90,
        blockHash: Faker.datatype.hexaDecimal(64).toLowerCase(),
        logIndex: 0,
        address: aliceAddress,
      };
      engine.addSignerChange('alice', changeSigner);

      // try to add a valid root at 90, when there is already a root at 100.
      expect((await engine.mergeRoot(root90))._unsafeUnwrapErr()).toEqual(
        'mergeRoot: provided root was older (lower block)'
      );
      expect(subject()).toEqual(root100);
      expect(engine._getCastAdds(username)).toEqual([cast]);
    });
  });
});
