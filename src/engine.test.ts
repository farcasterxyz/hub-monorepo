import Engine from '~/engine';
import { Factories } from '~/factories';
import { Root } from '~/types';

const engine = new Engine();
const username = 'alice';

describe('addRoot', () => {
  let rootA110: Root;
  let rootA120: Root;
  let rootA130: Root;
  let rootA130B: Root;
  let rootB140: Root;

  beforeAll(async () => {
    rootA110 = await Factories.Root.create({ message: { rootBlock: 110, username: 'alice' } });

    rootA120 = await Factories.Root.create({
      message: {
        rootBlock: 120,
        username: 'alice',
        body: { prevRootBlockHash: rootA110.message.body.blockHash },
      },
    });

    rootA130 = await Factories.Root.create({
      message: {
        rootBlock: 130,
        username: 'alice',
        body: { prevRootBlockHash: rootA120.message.body.blockHash },
      },
    });

    rootA130B = await Factories.Root.create({
      message: {
        rootBlock: 130,
        username: 'alice',
        body: rootA130.message.body,
        signedAt: rootA130.message.signedAt + 1,
      },
    });

    rootB140 = await Factories.Root.create({
      message: {
        rootBlock: 140,
        username: 'alice',
      },
    });
  });

  beforeEach(() => {
    engine.reset();
  });

  const subject = () => engine.getCastChains(username);

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

  test('fails without mutating state if Root is an invalid message', async () => {
    const root = await Factories.Root.create({ message: { rootBlock: 100, username: 'alice' } });
    engine.addRoot(root);
    expect(subject()).toEqual([[root]]);

    const invalidRootB110 = JSON.parse(JSON.stringify(rootA110)) as Root;
    invalidRootB110.hash = '0x0';
    engine.addRoot(invalidRootB110);
    expect(subject()).toEqual([[root]]);
  });

  test('fails if the user is unknown', async () => {
    const root = await Factories.Root.create({ message: { rootBlock: 100, username: 'rob' } });
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
