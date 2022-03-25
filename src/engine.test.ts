import Engine, { Signer } from '~/engine';
import { Factories } from '~/factories';
import { Root } from '~/types';
import Faker from 'faker';

const engine = new Engine();
const username = 'alice';

describe('addRoot', () => {
  let rootA110: Root;
  let rootA120: Root;
  let rootA130: Root;
  let rootA130B: Root;
  let rootB140: Root;
  let rootC90: Root;

  let alicePrivateKey: string;
  let aliceAddress: string;

  beforeAll(async () => {
    const keypair = await Factories.EthAddress.create({});
    alicePrivateKey = keypair.privateKey;
    aliceAddress = keypair.address;

    rootC90 = await Factories.Root.create(
      { message: { rootBlock: 90, username: 'alice' } },
      { transient: { privateKey: alicePrivateKey } }
    );

    rootA110 = await Factories.Root.create(
      { message: { rootBlock: 110, username: 'alice' } },
      { transient: { privateKey: alicePrivateKey } }
    );

    rootA120 = await Factories.Root.create(
      {
        message: {
          rootBlock: 120,
          username: 'alice',
          body: { prevRootBlockHash: rootA110.message.body.blockHash },
        },
        signer: keypair.address,
      },
      { transient: { privateKey: alicePrivateKey } }
    );

    rootA130 = await Factories.Root.create(
      {
        message: {
          rootBlock: 130,
          username: 'alice',
          body: { prevRootBlockHash: rootA120.message.body.blockHash },
        },
      },
      { transient: { privateKey: alicePrivateKey } }
    );

    rootA130B = await Factories.Root.create(
      {
        message: {
          rootBlock: 130,
          username: 'alice',
          body: rootA130.message.body,
          signedAt: rootA130.message.signedAt + 1,
        },
      },
      { transient: { privateKey: alicePrivateKey } }
    );

    rootB140 = await Factories.Root.create(
      {
        message: {
          rootBlock: 140,
          username: 'alice',
        },
      },
      { transient: { privateKey: alicePrivateKey } }
    );
  });

  beforeEach(() => {
    engine.resetChains();
    engine.resetUsers();

    const aliceRegistrationSignerChange = {
      blockNumber: 99,
      blockHash: Faker.datatype.hexaDecimal(64).toLowerCase(),
      logIndex: 0,
      address: aliceAddress,
    };

    engine.addSignerChange('alice', aliceRegistrationSignerChange);
  });

  const subject = () => engine.getChains(username);

  describe('fails with invalid inputs', () => {
    test('of string', async () => {
      const invalidTypeRes = engine.addRoot('bar' as unknown as Root);
      expect(invalidTypeRes.isErr()).toBe(true);
      expect(invalidTypeRes._unsafeUnwrapErr()).toBe('Invalid root');
    });

    test('of Cast', async () => {
      // valid cast is passed in.
      const cast = await Factories.Cast.create();
      const castRes = engine.addRoot(cast as unknown as Root);
      expect(castRes.isErr()).toBe(true);
      expect(castRes._unsafeUnwrapErr()).toBe('Invalid root');
    });

    // TODO: test with Reactions, Follows
  });

  describe('fails with invalid signers', () => {
    test('fails if the signer is unknown', async () => {
      const root = await Factories.Root.create(
        { message: { rootBlock: 100, username: 'alice' } },
        { transient: { privateKey: Faker.datatype.hexaDecimal(64).toLowerCase() } }
      );
      const result = engine.addRoot(root);

      expect(result.isOk()).toBe(false);
      expect(result._unsafeUnwrapErr()).toBe('Invalid root');
      expect(subject()).toEqual([]);
    });

    test('fails if the signer was valid before this block', async () => {
      const changeSigner = {
        blockNumber: 99,
        blockHash: Faker.datatype.hexaDecimal(64).toLowerCase(),
        logIndex: 1,
        address: Faker.datatype.hexaDecimal(40).toLowerCase(),
      };

      engine.addSignerChange('alice', changeSigner);
      const result = engine.addRoot(rootA110);
      expect(result.isOk()).toBe(false);
      expect(result._unsafeUnwrapErr()).toBe('Invalid root');
      expect(subject()).toEqual([]);
    });

    test('fails if the signer was valid after this block', async () => {
      const result = engine.addRoot(rootC90);
      expect(result.isOk()).toBe(false);
      expect(result._unsafeUnwrapErr()).toBe('Invalid root');
      expect(subject()).toEqual([]);
    });
  });

  test('fails without mutating state if Root is an invalid message', async () => {
    const root = await Factories.Root.create(
      { message: { rootBlock: 100, username: 'alice' } },
      { transient: { privateKey: alicePrivateKey } }
    );
    engine.addRoot(root);
    expect(subject()).toEqual([[root]]);

    const invalidRootB110 = JSON.parse(JSON.stringify(rootA110)) as Root;
    invalidRootB110.hash = '0x0';
    engine.addRoot(invalidRootB110);
    expect(subject()).toEqual([[root]]);
  });

  test('fails if the username is unknown, even if the signer is known', async () => {
    const root = await Factories.Root.create(
      { message: { rootBlock: 100, username: 'rob' } },
      { transient: { privateKey: alicePrivateKey } }
    );
    const rootRes = engine.addRoot(root);

    expect(rootRes.isOk()).toBe(false);
    expect(rootRes._unsafeUnwrapErr()).toBe('Invalid root');
    expect(subject()).toEqual([]);
  });

  describe('where root is the latest root for a known user ', () => {
    test('succeeds and erases previous roots if it has no prevRootBlockHash', async () => {
      engine.addRoot(rootA110);
      expect(subject()).toEqual([[rootA110]]);
      engine.addRoot(rootB140);
      expect(subject()).toEqual([[rootB140]]);
    });

    test('fails and does not erase previous roots if it has an unknown prevRootBlockHash', async () => {
      engine.addRoot(rootA110);
      expect(subject()).toEqual([[rootA110]]);
      engine.addRoot(rootA130);
      expect(subject()).toEqual([[rootA110]]);
    });

    test('succeeds and merges with previous roots if prevRootBlockHash matches BlockHash of latest root', async () => {
      engine.addRoot(rootA110);
      expect(subject()).toEqual([[rootA110]]);
      engine.addRoot(rootA120);
      expect(subject()).toEqual([[rootA110], [rootA120]]);
      engine.addRoot(rootA130);
      expect(subject()).toEqual([[rootA110], [rootA120], [rootA130]]);
    });

    test('fails if the root is a duplicate of an existing root', async () => {
      engine.addRoot(rootA110);
      expect(subject()).toEqual([[rootA110]]);
      engine.addRoot(rootA110);
      expect(subject()).toEqual([[rootA110]]);
    });

    test('fails if the root is a conflict of an existing root', async () => {
      engine.addRoot(rootA110);
      engine.addRoot(rootA120);
      engine.addRoot(rootA130);
      expect(subject()).toEqual([[rootA110], [rootA120], [rootA130]]);

      engine.addRoot(rootA130B);
      expect(subject()).toEqual([[rootA110], [rootA120], [rootA130]]);
    });

    // TODO: write tests once stitching is implemented.
  });

  describe('where root is not latest root for a known user ', () => {
    test('fails if its blockHash is disjoint', async () => {
      engine.addRoot(rootA130);
      expect(subject()).toEqual([[rootA130]]);

      // Adding a disjoint root should not change the chain.
      engine.addRoot(rootA110);
      expect(subject()).toEqual([[rootA130]]);
    });

    test('fails if it is a duplicate of an existing root', async () => {
      engine.addRoot(rootA130);
      engine.addRoot(rootA120);
      expect(subject()).toEqual([[rootA120], [rootA130]]);

      // Adding a duplicate root should not change the chain.
      engine.addRoot(rootA120);
      expect(subject()).toEqual([[rootA120], [rootA130]]);
    });

    test('fails if it conflicts an existing root', async () => {
      engine.addRoot(rootA130);
      engine.addRoot(rootA120);
      engine.addRoot(rootA110);
      expect(subject()).toEqual([[rootA110], [rootA120], [rootA130]]);

      // Adding a conflicting root should not change the chain.
      engine.addRoot(rootA130B);
      expect(subject()).toEqual([[rootA110], [rootA120], [rootA130]]);
    });

    test('only adds roots if they are provided in the right sequence', async () => {
      engine.addRoot(rootA130);
      engine.addRoot(rootA110);
      engine.addRoot(rootA120);

      // Only 120 and 130 were accepted because they were received in order.
      expect(subject()).toEqual([[rootA120], [rootA130]]);

      // 110 is accepted correctly if it is seen after 120.
      engine.addRoot(rootA110);
      expect(subject()).toEqual([[rootA110], [rootA120], [rootA130]]);
    });

    test('succeeds if it has no prevRootBlockHash but its blockHash is the prevRootBlockHash of the oldest root', async () => {
      engine.addRoot(rootA120);
      expect(subject()).toEqual([[rootA120]]);
      engine.addRoot(rootA110);
      expect(subject()).toEqual([[rootA110], [rootA120]]);
    });

    test('succeeds if it has a prevRootBlockHash and its blockHash is the prevRootBlockHash of the oldest root', async () => {
      engine.addRoot(rootA130);
      expect(subject()).toEqual([[rootA130]]);
      engine.addRoot(rootA120);
      expect(subject()).toEqual([[rootA120], [rootA130]]);
    });

    // TODO: Write tests once stitching is implemented.
  });
});

describe('addSignerChange', () => {
  // Change @charlie's signer at block 100.
  const signerChange: Signer = {
    address: Faker.datatype.hexaDecimal(40).toLowerCase(),
    blockHash: Faker.datatype.hexaDecimal(64).toLowerCase(),
    blockNumber: 100,
    logIndex: 12,
  };

  // Change charlie's signer at block 200.
  const signerChange200 = JSON.parse(JSON.stringify(signerChange)) as Signer;
  signerChange200.blockHash = Faker.datatype.hexaDecimal(64).toLowerCase();
  signerChange200.blockNumber = signerChange.blockNumber + 100;

  // Change charlie's signer at block 50.
  const signerChange50A = JSON.parse(JSON.stringify(signerChange)) as Signer;
  signerChange50A.blockHash = Faker.datatype.hexaDecimal(64).toLowerCase();
  signerChange50A.blockNumber = signerChange.blockNumber - 10;

  // Change charlie's signer at block 50, at a higher index.
  const signerChange50B = JSON.parse(JSON.stringify(signerChange50A)) as Signer;
  signerChange50B.logIndex = signerChange.logIndex + 1;

  const duplicateSignerChange50B = JSON.parse(JSON.stringify(signerChange50B)) as Signer;

  const username = 'charlie';
  const subject = () => engine.getSigners(username);

  test('signer changes are added correctly', async () => {
    const result = engine.addSignerChange(username, signerChange);
    expect(result.isOk()).toBe(true);
    expect(subject()).toEqual([signerChange]);
  });

  test('signer changes from later blocks are added after current blocks', async () => {
    const result = engine.addSignerChange(username, signerChange200);
    expect(result.isOk()).toBe(true);
    expect(subject()).toEqual([signerChange, signerChange200]);
  });

  test('signer changes from earlier blocks are before current blocks', async () => {
    const result = engine.addSignerChange(username, signerChange50A);
    expect(result.isOk()).toBe(true);
    expect(subject()).toEqual([signerChange50A, signerChange, signerChange200]);
  });

  test('signer changes in the same block are ordered by index', async () => {
    const result = engine.addSignerChange(username, signerChange50B);
    expect(result.isOk()).toBe(true);
    expect(subject()).toEqual([signerChange50A, signerChange50B, signerChange, signerChange200]);
  });

  test('adding a duplicate signer change fails', async () => {
    const result = engine.addSignerChange(username, duplicateSignerChange50B);
    expect(result.isOk()).toBe(false);
    expect(result._unsafeUnwrapErr()).toBe(
      `addSignerChange: duplicate signer change ${signerChange50B.blockHash}:${signerChange50B.logIndex}`
    );
    expect(subject()).toEqual([signerChange50A, signerChange50B, signerChange, signerChange200]);
  });
});
