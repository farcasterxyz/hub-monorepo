import Engine, { Signer } from '~/engine';
import { Factories } from '~/factories';
import { Cast, Root } from '~/types';
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
    engine.resetSigners();

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

describe('addCast', () => {
  let alicePrivateKey: string;
  let aliceAddress: string;
  let root: Root;
  let cast: Cast;
  const subject = () => engine.getChains(username);

  beforeAll(async () => {
    const keypair = await Factories.EthAddress.create({});
    alicePrivateKey = keypair.privateKey;
    aliceAddress = keypair.address;

    root = await Factories.Root.create(
      { message: { rootBlock: 100, username: 'alice' } },
      { transient: { privateKey: alicePrivateKey } }
    );

    cast = await Factories.Cast.create(
      {
        message: {
          index: 1,
          prevHash: root.hash,
          rootBlock: root.message.rootBlock,
          username: 'alice',
          signedAt: root.message.signedAt + 1,
        },
      },
      { transient: { privateKey: alicePrivateKey } }
    );

    engine.resetSigners();
  });

  // Every test should start with a valid signer and root for alice's chain.
  beforeEach(() => {
    engine.resetChains();

    const aliceRegistrationSignerChange = {
      blockNumber: 99,
      blockHash: Faker.datatype.hexaDecimal(64).toLowerCase(),
      logIndex: 0,
      address: aliceAddress,
    };

    engine.addSignerChange('alice', aliceRegistrationSignerChange);
    engine.addRoot(root);
  });

  /** Signed Chain Test */

  test('fails if the signer is unknown', async () => {
    engine.resetSigners();

    const result = engine.addCast(cast);
    expect(result._unsafeUnwrapErr()).toBe('addCast: unknown user');
    expect(subject()).toEqual([[root]]);
  });

  test('fails if the root of the signed chain is missing', async () => {
    engine.resetChains();

    // Add a new root with a different block number.
    const otherRoot = await Factories.Root.create(
      { message: { rootBlock: 120, username: 'alice' } },
      { transient: { privateKey: alicePrivateKey } }
    );
    expect(engine.addRoot(otherRoot).isOk()).toBe(true);

    const result = engine.addCast(cast);
    expect(result._unsafeUnwrapErr()).toBe('addCast: unknown chain');
    expect(subject()).toEqual([[otherRoot]]);
  });

  test('fails if it does not match the type of the chain', async () => {
    engine.resetChains();

    // Add a root with a different type.
    const root = await Factories.Root.create(
      { message: { rootBlock: 100, username: 'alice', body: { chainType: 'follow' } } },
      { transient: { privateKey: alicePrivateKey } }
    );
    expect(engine.addRoot(root).isOk()).toBe(true);

    const result = engine.addCast(cast);
    expect(result._unsafeUnwrapErr()).toBe('addCast: invalid message');
    expect(subject()).toEqual([[root]]);
  });

  test('fails if it the rootBlock does not match the previous message', async () => {
    const castInvalidRootBlock = JSON.parse(JSON.stringify(cast)) as Cast;
    castInvalidRootBlock.message.rootBlock += 1;

    const result = engine.addCast(castInvalidRootBlock);
    expect(result._unsafeUnwrapErr()).toBe('addCast: unknown chain');
    expect(subject()).toEqual([[root]]);
  });

  test('fails if the index was not incremented correcty', async () => {
    // Index too high
    const castInvalidIdxHigh = JSON.parse(JSON.stringify(cast)) as Cast;
    castInvalidIdxHigh.message.index += 1;

    const resultHigh = engine.addCast(castInvalidIdxHigh);
    expect(resultHigh._unsafeUnwrapErr()).toBe('addCast: invalid message');
    expect(subject()).toEqual([[root]]);

    // Index too low
    const castInvalidIdxLow = JSON.parse(JSON.stringify(cast)) as Cast;
    castInvalidIdxLow.message.index -= 1;

    const resultLow = engine.addCast(castInvalidIdxLow);
    expect(resultLow._unsafeUnwrapErr()).toBe('addCast: invalid message');
    expect(subject()).toEqual([[root]]);
  });

  test('fails if the cast is a duplicate', async () => {
    expect(engine.addCast(cast).isOk()).toBe(true);
    expect(subject()).toEqual([[root, cast]]);

    const castDuplicate = JSON.parse(JSON.stringify(cast)) as Cast;
    const resultLow = engine.addCast(castDuplicate);
    expect(resultLow._unsafeUnwrapErr()).toBe('addCast: invalid message');
    expect(subject()).toEqual([[root, cast]]);
  });

  // TODO: When duplicate proofs are implemented, this test should be updated accordingly
  test('fails if the cast conflicts with another cast', async () => {
    expect(engine.addCast(cast).isOk()).toBe(true);
    expect(subject()).toEqual([[root, cast]]);

    const castConflict = await Factories.Cast.create(
      {
        message: {
          index: 1,
          prevHash: root.hash,
          rootBlock: root.message.rootBlock,
          username: 'alice',
          signedAt: root.message.signedAt + 1,
        },
      },
      { transient: { privateKey: alicePrivateKey } }
    );

    const result = engine.addCast(castConflict);
    expect(result._unsafeUnwrapErr()).toBe('addCast: invalid message');
    expect(subject()).toEqual([[root, cast]]);
  });

  test('fails if prevHash does not match the previous message hash', async () => {
    const castInvalidPrevHash = JSON.parse(JSON.stringify(cast)) as Cast;
    castInvalidPrevHash.message.prevHash = Faker.datatype.hexaDecimal(64).toLowerCase();

    const result = engine.addCast(castInvalidPrevHash);
    expect(result._unsafeUnwrapErr()).toBe('addCast: invalid message');
    expect(subject()).toEqual([[root]]);
  });

  test('fails if the timestamp was older than the previous message timestamp', async () => {
    const castInvalidSignedAt = JSON.parse(JSON.stringify(cast)) as Cast;
    castInvalidSignedAt.message.signedAt = cast.message.signedAt - 1;

    const result = engine.addCast(castInvalidSignedAt);
    expect(result._unsafeUnwrapErr()).toBe('addCast: invalid message');
    expect(subject()).toEqual([[root]]);
  });

  test('fails if the username does not match the previous value', async () => {
    // TODO: this might be better suited for a unit test because it is dependent on so much state above.
  });

  test('fails if the signer does not match the previous message signer', async () => {
    // We change the signer by creating a new cast with all the same parameters, except the private key.
    // Faker will automatically generate a keypair, which is used as the signer and to create the signature.
    const castInvalidSigner = await Factories.Cast.create({
      message: {
        index: 1,
        prevHash: root.hash,
        rootBlock: root.message.rootBlock,
        username: 'alice',
        signedAt: root.message.signedAt + 1,
      },
    });

    const result = engine.addCast(castInvalidSigner);
    expect(result._unsafeUnwrapErr()).toBe('addCast: invalid message');
    expect(subject()).toEqual([[root]]);
  });

  test('fails if the signature is invalid', async () => {
    const castInvalidSignature = JSON.parse(JSON.stringify(cast)) as Cast;
    castInvalidSignature.signature =
      '0x52afdda1d6701e29dcd91dea5539c32cdaa2227de257bc0784b1da04be5be32e6a92c934b5d20dd2cb2989f814e74de6b9e7bc1da130543a660822023f9fd0e91c';

    const result = engine.addCast(castInvalidSignature);
    expect(result._unsafeUnwrapErr()).toBe('addCast: invalid message');
    expect(subject()).toEqual([[root]]);
  });

  /** Cast New */
  test('fails if _text is greater than 280 chars', async () => {
    const castLongText = await Factories.Cast.create(
      {
        message: {
          index: 1,
          prevHash: root.hash,
          rootBlock: root.message.rootBlock,
          username: 'alice',
          signedAt: root.message.signedAt + 1,
          body: {
            _text: 'a'.repeat(281),
          },
        },
      },
      { transient: { privateKey: alicePrivateKey } }
    );
    const result = engine.addCast(castLongText);

    expect(result.isOk()).toBe(false);
    expect(result._unsafeUnwrapErr()).toBe('addCast: invalid message');
    expect(subject()).toEqual([[root]]);
  });

  test('fails if the _text was not hashed correctly', async () => {
    const castInvalidTextHash = await Factories.Cast.create(
      {
        message: {
          index: 1,
          prevHash: root.hash,
          rootBlock: root.message.rootBlock,
          username: 'alice',
          signedAt: root.message.signedAt + 1,
          body: {
            _text: 'hello world!',
            textHash: Faker.datatype.hexaDecimal(64).toLowerCase(),
          },
        },
      },
      { transient: { privateKey: alicePrivateKey } }
    );
    const result = engine.addCast(castInvalidTextHash);

    expect(result.isOk()).toBe(false);
    expect(result._unsafeUnwrapErr()).toBe('addCast: invalid message');
    expect(subject()).toEqual([[root]]);
  });

  // TODO: test that the attachement object is correctly structured

  test('fails if there are more than two embeds', async () => {
    const castThreeEmbeds = await Factories.Cast.create(
      {
        message: {
          index: 1,
          prevHash: root.hash,
          rootBlock: root.message.rootBlock,
          username: 'alice',
          signedAt: root.message.signedAt + 1,
          body: {
            _embed: { items: ['a', 'b', 'c'] },
          },
        },
      },
      { transient: { privateKey: alicePrivateKey } }
    );

    const result = engine.addCast(castThreeEmbeds);
    expect(result._unsafeUnwrapErr()).toBe('addCast: invalid message');
    expect(subject()).toEqual([[root]]);
  });

  test('fails if _embed was not hashed correctly', async () => {
    const castInvalidAttachmentHash = await Factories.Cast.create(
      {
        message: {
          index: 1,
          prevHash: root.hash,
          rootBlock: root.message.rootBlock,
          username: 'alice',
          signedAt: root.message.signedAt + 1,
          body: {
            _embed: { items: ['a', 'b'] },
            embedHash: Faker.datatype.hexaDecimal(64).toLowerCase(),
          },
        },
      },
      { transient: { privateKey: alicePrivateKey } }
    );

    const result = engine.addCast(castInvalidAttachmentHash);
    expect(result._unsafeUnwrapErr()).toBe('addCast: invalid message');
    expect(subject()).toEqual([[root]]);
  });

  test('succeeds if a cast-new is added', async () => {
    expect(engine.addCast(cast).isOk()).toBe(true);
    expect(subject()).toEqual([[root, cast]]);
  });

  test('succeeds if a message is added without the text', async () => {
    const castNoText = JSON.parse(JSON.stringify(cast));
    castNoText.message.body._text = undefined;

    expect(engine.addCast(castNoText).isOk()).toBe(true);
    expect(subject()).toEqual([[root, castNoText]]);
  });

  /** Cast Delete */
  // test('fails if uri is invalid', async () => {});
  // test('adds a cast-delete correctly and deletes cast text if known', async () => {});

  test('adds a cast-delete correctly and does nothing if unknown', async () => {
    expect(engine.addCast(cast).isOk()).toBe(true);

    const castDelete = await Factories.CastDelete.create(
      {
        message: {
          index: 2,
          prevHash: cast.hash,
          rootBlock: root.message.rootBlock,
          username: 'alice',
          signedAt: cast.message.signedAt + 1,
        },
      },
      { transient: { privateKey: alicePrivateKey } }
    );

    const result = engine.addCast(castDelete);
    expect(result.isOk()).toBe(true);
    expect(subject()).toEqual([[root, cast, castDelete]]);
  });

  /** Cast Recast */
  // test('fails-recast if uri is invalid', async () => {});

  test('adds a cast-recast correctly', async () => {
    expect(engine.addCast(cast).isOk()).toBe(true);

    const castRecast = await Factories.CastRecast.create(
      {
        message: {
          index: 2,
          prevHash: cast.hash,
          rootBlock: root.message.rootBlock,
          username: 'alice',
          signedAt: cast.message.signedAt + 1,
        },
      },
      { transient: { privateKey: alicePrivateKey } }
    );

    expect(engine.addCast(castRecast).isOk()).toBe(true);
    expect(subject()).toEqual([[root, cast, castRecast]]);
  });

  /** Other  */
  test('fails to add a root, reaction or follow when passed in here', async () => {
    expect(engine.addCast(root as unknown as Cast).isOk()).toBe(false);
    expect(subject()).toEqual([[root]]);
    // TODO: Add reactions and follows once implemented.
  });

  test('succeeds even after receiving a signer change event', async () => {
    const signerChange2 = {
      blockNumber: 150,
      blockHash: Faker.datatype.hexaDecimal(64).toLowerCase(),
      logIndex: 0,
      address: aliceAddress,
    };

    engine.addSignerChange('alice', signerChange2);

    expect(engine.addCast(cast).isOk()).toBe(true);
    expect(subject()).toEqual([[root, cast]]);
    // TODO: Add reactions and follows once implemented.
  });
});

// TODO: Mixed chain test (try adding a cast and then a reaction)
