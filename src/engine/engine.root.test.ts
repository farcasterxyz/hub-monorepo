import Engine from '~/engine';
import { Factories } from '~/factories';
import { Cast, Root } from '~/types';
import Faker from 'faker';

const engine = new Engine();
const username = 'alice';

describe('addRoot', () => {
  let root100: Root;
  let root110: Root;
  let root90: Root;

  let alicePrivateKey: string;
  let aliceAddress: string;
  const subject = () => engine.getRoot(username);

  beforeAll(async () => {
    const keypair = await Factories.EthAddress.create({});
    alicePrivateKey = keypair.privateKey;
    aliceAddress = keypair.address;
    const transient = { transient: { privateKey: alicePrivateKey } };

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
      const invalidTypeRes = engine.addRoot('bar' as unknown as Root);
      expect(invalidTypeRes._unsafeUnwrapErr()).toBe('addRoot: invalid root');
    });

    test('incorrect type (cast) should fail', async () => {
      const cast = await Factories.Cast.create();
      const castRes = engine.addRoot(cast as unknown as Root);
      expect(castRes._unsafeUnwrapErr()).toBe('addRoot: invalid root');
    });

    // TODO: test with Reactions, Follows
  });

  describe('signer validation:', () => {
    test('fails if there are no known signers', async () => {
      engine._resetSigners();
      const result = engine.addRoot(root100);
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

      expect(engine.addRoot(root100)._unsafeUnwrapErr()).toBe('validateMessage: invalid signer');
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

      const result = engine.addRoot(root100);
      expect(result._unsafeUnwrapErr()).toBe('validateMessage: invalid signer');
      expect(subject()).toEqual(undefined);
    });

    test('fails if the signer was not valid', async () => {
      // Calling Factory without specifying a signing key makes Faker choose a random one
      const invalidSigner = await Factories.Root.create({ data: { rootBlock: 100, username: 'alice' } });

      expect(engine.addRoot(invalidSigner)._unsafeUnwrapErr()).toBe('validateMessage: invalid signer');
      expect(subject()).toEqual(undefined);
    });

    test('fails if the signer was valid, but the username was invalid', async () => {
      const root = await Factories.Root.create(
        { data: { rootBlock: 100, username: 'rob' } },
        { transient: { privateKey: alicePrivateKey } }
      );

      expect(engine.addRoot(root)._unsafeUnwrapErr()).toBe('validateMessage: invalid signer');
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

      expect(engine.addRoot(root100).isOk()).toBe(true);
      expect(subject()).toEqual(root100);
    });
  });

  describe('message validation: ', () => {
    test('fails if root has an invalid hash', async () => {
      const invalidHash = JSON.parse(JSON.stringify(root100)) as Root;
      invalidHash.hash = '0xd4126acebadb14b41943fc10599c00e2e3627f1e38672c8476277ecf17accb48';

      expect(engine.addRoot(invalidHash)._unsafeUnwrapErr()).toBe('validateMessage: invalid hash');
      expect(subject()).toEqual(undefined);
    });

    test('fails if the signature is invalid', async () => {
      const invalidSignature = JSON.parse(JSON.stringify(root100)) as Cast;
      invalidSignature.signature =
        '0x52afdda1d6701e29dcd91dea5539c32cdaa2227de257bc0784b1da04be5be32e6a92c934b5d20dd2cb2989f814e74de6b9e7bc1da130543a660822023f9fd0e91c';

      expect(engine.addCast(invalidSignature)._unsafeUnwrapErr()).toBe('validateMessage: invalid signature');
      expect(subject()).toEqual(undefined);
    });

    test('fails if signedAt is > current time + safety margin', async () => {
      const elevenMinutesAhead = Date.now() + 11 * 60 * 1000;
      const futureRoot = await Factories.Root.create(
        { data: { rootBlock: 120, username: 'alice', signedAt: elevenMinutesAhead } },
        { transient: { privateKey: alicePrivateKey } }
      );
      expect(engine.addRoot(futureRoot)._unsafeUnwrapErr()).toEqual(
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
      engine.addRoot(root100);

      cast = await Factories.Cast.create(
        {
          data: {
            rootBlock: root100.data.rootBlock,
            username,
            signedAt: root100.data.signedAt + 1,
          },
        },
        { transient: { privateKey: alicePrivateKey } }
      );
      engine.addCast(cast);
    });

    test('succeeds and wipes messages if the root block is higher', async () => {
      expect(engine.getCastAdds(username)).toEqual([cast]);
      engine.addRoot(root110);
      expect(subject()).toEqual(root110);
      expect(engine.getCastAdds(username)).toEqual([]);
    });

    // test('succeeds if the root block is identical but lexicographical hash value is greater', async () => {});
    // test('fails if the root block is identical but lexicographical hash value is lower', async () => {});

    test('fails if the root is a duplicate', async () => {
      expect(engine.addRoot(root100)._unsafeUnwrapErr()).toEqual('addRoot: provided root was a duplicate');
      expect(subject()).toEqual(root100);
      expect(engine.getCastAdds(username)).toEqual([cast]);
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
      expect(engine.addRoot(root90)._unsafeUnwrapErr()).toEqual('addRoot: provided root was older (lower block)');
      expect(subject()).toEqual(root100);
      expect(engine.getCastAdds(username)).toEqual([cast]);
    });
  });
});
