import {
  bytesToUtf8String,
  CastAddMessage,
  CastId,
  CastRemoveMessage,
  Factories,
  FarcasterNetwork,
  HubError,
  HubEvent,
  HubEventType,
  IdRegistryEvent,
  IdRegistryEventType,
  LinkAddMessage,
  MergeMessageHubEvent,
  Message,
  MessageData,
  NameRegistryEvent,
  NameRegistryEventType,
  PruneMessageHubEvent,
  ReactionAddMessage,
  ReactionType,
  RevokeMessageHubEvent,
  SignerAddMessage,
  SignerRemoveMessage,
  UserDataAddMessage,
  UserDataType,
  VerificationAddEthAddressMessage,
} from '@farcaster/hub-nodejs';
import { err, Ok, ok } from 'neverthrow';
import { jestRocksDB } from '../db/jestUtils.js';
import Engine from '../engine/index.js';
import SignerStore from '../stores/signerStore.js';
import { sleep } from '../../utils/crypto.js';
import { getMessage, makeTsHash, typeToSetPostfix } from '../db/message.js';
import { StoreEvents } from '../stores/storeEventHandler.js';
import { makeVerificationEthAddressClaim } from '@farcaster/core';
import { setReferenceDateForTest } from '../../utils/versions.js';
import { getUserNameProof } from '../db/nameRegistryEvent.js';

const db = jestRocksDB('protobufs.engine.test');
const network = FarcasterNetwork.TESTNET;
const engine = new Engine(db, network);

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

  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, network, signerAddBody: { signer: signerKey } } },
    { transient: { signer: custodySigner } }
  );
  signerRemove = await Factories.SignerRemoveMessage.create(
    { data: { fid, network, timestamp: signerAdd.data.timestamp + 1, signerRemoveBody: { signer: signerKey } } },
    { transient: { signer: custodySigner } }
  );

  castAdd = await Factories.CastAddMessage.create({ data: { fid, network } }, { transient: { signer } });
  reactionAdd = await Factories.ReactionAddMessage.create({ data: { fid, network } }, { transient: { signer } });
  linkAdd = await Factories.LinkAddMessage.create({ data: { fid, network } }, { transient: { signer } });
  verificationAdd = await Factories.VerificationAddEthAddressMessage.create(
    { data: { fid, network } },
    { transient: { signer } }
  );
  userDataAdd = await Factories.UserDataAddMessage.create(
    { data: { fid, network, userDataBody: { type: UserDataType.PFP } } },
    { transient: { signer } }
  );
});

describe('mergeIdRegistryEvent', () => {
  test('succeeds', async () => {
    await expect(engine.mergeIdRegistryEvent(custodyEvent)).resolves.toBeInstanceOf(Ok);
    await expect(engine.getIdRegistryEvent(fid)).resolves.toEqual(ok(custodyEvent));
  });

  test('fails with invalid event type', async () => {
    const invalidEvent = Factories.IdRegistryEvent.build({ type: 10 as unknown as IdRegistryEventType });
    const result = await engine.mergeIdRegistryEvent(invalidEvent);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'invalid event type'));
  });
});

describe('mergeNameRegistryEvent', () => {
  test('succeeds', async () => {
    await expect(engine.mergeNameRegistryEvent(fnameTransfer)).resolves.toBeInstanceOf(Ok);
    await expect(engine.getNameRegistryEvent(fname)).resolves.toEqual(ok(fnameTransfer));
  });

  test('fails with invalid event type', async () => {
    const invalidEvent = Factories.NameRegistryEvent.build({ type: 10 as unknown as NameRegistryEventType });
    const result = await engine.mergeNameRegistryEvent(invalidEvent);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'invalid event type'));
  });
});

describe('mergeUserNameProof', () => {
  test('succeeds', async () => {
    const userNameProof = Factories.UserNameProof.build();
    await expect(engine.mergeUserNameProof(userNameProof)).resolves.toBeInstanceOf(Ok);
    expect(await getUserNameProof(db, userNameProof.name)).toBeTruthy();
  });
});

describe('mergeMessage', () => {
  let mergedMessages: Message[];

  const handleMergeMessage = (event: MergeMessageHubEvent) => {
    mergedMessages.push(event.mergeMessageBody.message);
  };

  beforeAll(async () => {
    engine.eventHandler.on('mergeMessage', handleMergeMessage);
  });

  afterAll(async () => {
    engine.eventHandler.off('mergeMessage', handleMergeMessage);
  });

  beforeEach(() => {
    mergedMessages = [];
  });

  describe('with valid signer', () => {
    beforeEach(async () => {
      await expect(engine.mergeIdRegistryEvent(custodyEvent)).resolves.toBeInstanceOf(Ok);
      await expect(engine.mergeMessage(signerAdd)).resolves.toBeInstanceOf(Ok);
    });

    describe('CastAdd', () => {
      test('succeeds', async () => {
        await expect(engine.mergeMessage(castAdd)).resolves.toBeInstanceOf(Ok);
        await expect(engine.getCast(fid, castAdd.hash)).resolves.toEqual(ok(castAdd));
        expect(mergedMessages).toEqual([signerAdd, castAdd]);
      });
    });

    describe('ReactionAdd', () => {
      test('succeeds', async () => {
        await expect(engine.mergeMessage(reactionAdd)).resolves.toBeInstanceOf(Ok);
        await expect(
          engine.getReaction(
            fid,
            reactionAdd.data.reactionBody.type,
            reactionAdd.data.reactionBody.targetCastId as CastId
          )
        ).resolves.toEqual(ok(reactionAdd));
        expect(mergedMessages).toEqual([signerAdd, reactionAdd]);
      });
    });

    describe('LinkAdd', () => {
      test('succeeds', async () => {
        setReferenceDateForTest(100000000000000000000000);
        await expect(engine.mergeMessage(linkAdd)).resolves.toBeInstanceOf(Ok);
        await expect(
          engine.getLink(fid, linkAdd.data.linkBody.type, linkAdd.data.linkBody.targetFid as number)
        ).resolves.toEqual(ok(linkAdd));
        expect(mergedMessages).toEqual([signerAdd, linkAdd]);
      });
    });

    describe('VerificationAddEthAddress', () => {
      test('succeeds', async () => {
        await expect(engine.mergeMessage(verificationAdd)).resolves.toBeInstanceOf(Ok);
        await expect(
          engine.getVerification(fid, verificationAdd.data.verificationAddEthAddressBody.address)
        ).resolves.toEqual(ok(verificationAdd));
        expect(mergedMessages).toEqual([signerAdd, verificationAdd]);
      });

      test('fails when network does not match claim network', async () => {
        const address = custodySignerKey;
        const blockHash = Factories.BlockHash.build();
        const mainnetClaim = await makeVerificationEthAddressClaim(
          fid,
          address,
          FarcasterNetwork.MAINNET,
          blockHash
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
          { transient: { signer: signer, ethSigner: custodySigner } }
        );
        const result = await engine.mergeMessage(testnetVerificationAdd);
        // Signature will not match because we're attempting to recover the address based on the wrong network
        expect(result).toEqual(
          err(new HubError('bad_request.validation_failure', 'ethSignature does not match address'))
        );
      });
    });

    describe('UserDataAdd', () => {
      test('succeeds', async () => {
        await expect(engine.mergeMessage(userDataAdd)).resolves.toBeInstanceOf(Ok);
        await expect(engine.getUserData(fid, userDataAdd.data.userDataBody.type)).resolves.toEqual(ok(userDataAdd));
        expect(mergedMessages).toEqual([signerAdd, userDataAdd]);
      });

      describe('with fname', () => {
        let fnameAdd: UserDataAddMessage;

        beforeAll(async () => {
          const fnameString = bytesToUtf8String(fnameTransfer.fname)._unsafeUnwrap();
          fnameAdd = await Factories.UserDataAddMessage.create(
            {
              data: {
                fid,
                network,
                userDataBody: { type: UserDataType.FNAME, value: fnameString },
              },
            },
            { transient: { signer } }
          );
        });

        test('succeeds when fname owned by custody address', async () => {
          await expect(engine.mergeNameRegistryEvent(fnameTransfer)).resolves.toBeInstanceOf(Ok);
          await expect(engine.mergeMessage(fnameAdd)).resolves.toBeInstanceOf(Ok);
        });

        test('fails when fname transfer event is missing', async () => {
          const result = await engine.mergeMessage(fnameAdd);
          expect(result).toMatchObject(err({ errCode: 'bad_request.validation_failure' }));
          expect(result._unsafeUnwrapErr().message).toMatch('is not registered');
        });

        test('fails when fname is owned by another custody address', async () => {
          const fnameEvent = Factories.NameRegistryEvent.build({
            ...fnameTransfer,
            to: Factories.EthAddress.build(),
          });
          await expect(engine.mergeNameRegistryEvent(fnameEvent)).resolves.toBeInstanceOf(Ok);
          const result = await engine.mergeMessage(fnameAdd);
          expect(result).toMatchObject(err({ errCode: 'bad_request.validation_failure' }));
          expect(result._unsafeUnwrapErr().message).toMatch('does not match');
        });
      });
    });

    describe('SignerRemove', () => {
      test('succeeds ', async () => {
        await expect(engine.mergeMessage(signerRemove)).resolves.toBeInstanceOf(Ok);
        await expect(signerStore.getSignerRemove(fid, signerKey)).resolves.toEqual(signerRemove);
        expect(mergedMessages).toEqual([signerAdd, signerRemove]);
      });
    });

    test('succeeds with concurrent, conflicting cast messages', async () => {
      const castAdd = await Factories.CastAddMessage.create({ data: { fid } }, { transient: { signer } });

      const generateCastRemove = async (): Promise<CastRemoveMessage> => {
        return Factories.CastRemoveMessage.create(
          { data: { fid, castRemoveBody: { targetHash: castAdd.hash } } },
          { transient: { signer } }
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
          (result) => result.isOk() || (result.isErr() && result.error.errCode !== 'unavailable.storage_failure')
        )
      ).toBeTruthy();

      const allMessages = await engine.getAllCastMessagesByFid(fid);
      expect(allMessages._unsafeUnwrap().messages.length).toEqual(1);
    });

    test('succeeds with concurrent, conflicting reaction messages', async () => {
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
              { transient: { signer } }
            )
          );
        } else {
          messages.push(
            await Factories.ReactionRemoveMessage.create(
              { data: { reactionBody: body, fid, network } },
              { transient: { signer } }
            )
          );
        }
      }

      const results = await Promise.all(messages.map((message) => engine.mergeMessage(message)));
      expect(
        results.every(
          (result) => result.isOk() || (result.isErr() && result.error.errCode !== 'unavailable.storage_failure')
        )
      ).toBeTruthy();

      const allMessages = await engine.getAllReactionMessagesByFid(fid);
      expect(allMessages._unsafeUnwrap().messages.length).toEqual(1);
    });

    test('succeeds with concurrent, conflicting link messages', async () => {
      setReferenceDateForTest(100000000000000000000000);
      const targetFid = Factories.Fid.build();
      const body = Factories.LinkBody.build({
        type: 'follow',
        targetFid: targetFid,
      });

      const messages: Message[] = [];
      for (let i = 0; i < 10; i++) {
        if (Math.random() < 0.5) {
          messages.push(
            await Factories.LinkAddMessage.create({ data: { linkBody: body, fid, network } }, { transient: { signer } })
          );
        } else {
          messages.push(
            await Factories.LinkRemoveMessage.create(
              { data: { linkBody: body, fid, network } },
              { transient: { signer } }
            )
          );
        }
      }

      const results = await Promise.all(messages.map((message) => engine.mergeMessage(message)));
      expect(
        results.every(
          (result) => result.isOk() || (result.isErr() && result.error.errCode !== 'unavailable.storage_failure')
        )
      ).toBeTruthy();

      const allMessages = await engine.getAllLinkMessagesByFid(fid);
      expect(allMessages._unsafeUnwrap().messages.length).toEqual(1);
    });
  });

  describe('fails when signer is invalid', () => {
    test('with SignerAdd', async () => {
      await engine.mergeIdRegistryEvent(Factories.IdRegistryEvent.build({ fid }));
      const result = await engine.mergeMessage(signerAdd);
      expect(result).toMatchObject(err({ errCode: 'bad_request.validation_failure' }));
      expect(result._unsafeUnwrapErr().message).toMatch('invalid signer');
    });

    test('with ReactionAdd', async () => {
      await engine.mergeIdRegistryEvent(custodyEvent);
      const result = await engine.mergeMessage(reactionAdd);
      expect(result).toMatchObject(err({ errCode: 'bad_request.validation_failure' }));
      expect(result._unsafeUnwrapErr().message).toMatch('invalid signer');
    });

    test('with LinkAdd', async () => {
      setReferenceDateForTest(100000000000000000000000);
      await engine.mergeIdRegistryEvent(custodyEvent);
      const result = await engine.mergeMessage(linkAdd);
      expect(result).toMatchObject(err({ errCode: 'bad_request.validation_failure' }));
      expect(result._unsafeUnwrapErr().message).toMatch('invalid signer');
    });
  });

  describe('fails when missing both custody address and signer', () => {
    let message: Message;

    afterEach(async () => {
      const result = await engine.mergeMessage(message);
      const err = result._unsafeUnwrapErr();
      expect(err.errCode).toEqual('bad_request.validation_failure');
      expect(err.message).toMatch('unknown fid');
    });

    test('with ReactionAdd', () => {
      message = reactionAdd;
    });

    test('with LinkAdd', () => {
      setReferenceDateForTest(100000000000000000000000);
      message = linkAdd;
    });
  });

  test('fails with mismatched farcaster network', async () => {
    const mainnetEngine = new Engine(db, FarcasterNetwork.MAINNET);
    const result = await mainnetEngine.mergeMessage(reactionAdd);
    expect(result).toEqual(
      err(
        new HubError(
          'bad_request.validation_failure',
          `incorrect network: ${FarcasterNetwork.TESTNET} (expected: ${FarcasterNetwork.MAINNET})`
        )
      )
    );
    await mainnetEngine.stop();
  });
});

describe('mergeMessages', () => {
  let mergedMessages: Message[];
  const handleMergeMessage = (event: MergeMessageHubEvent) => {
    mergedMessages.push(event.mergeMessageBody.message);
  };

  beforeAll(() => {
    engine.eventHandler.on('mergeMessage', handleMergeMessage);
  });

  afterAll(() => {
    engine.eventHandler.off('mergeMessage', handleMergeMessage);
  });

  beforeEach(async () => {
    mergedMessages = [];
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test('succeeds and merges messages in parallel', async () => {
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
      new Set([signerAdd, castAdd, reactionAdd, linkAdd, userDataAdd, verificationAdd, signerRemove])
    );
  });
});

describe('revokeMessagesBySigner', () => {
  let revokedMessages: Message[];
  const handleRevokedMessage = (event: RevokeMessageHubEvent) => {
    revokedMessages.push(event.revokeMessageBody.message);
  };

  beforeAll(() => {
    engine.eventHandler.on('revokeMessage', handleRevokedMessage);
  });

  afterAll(() => {
    engine.eventHandler.off('revokeMessage', handleRevokedMessage);
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

  test('revokes messages signed by EIP-712 signer', async () => {
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

  test('revokes messages signed by Ed25519 signer', async () => {
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

describe('with listeners and workers', () => {
  const liveEngine = new Engine(db, FarcasterNetwork.TESTNET);
  setReferenceDateForTest(100000000000000000000000);

  let revokedMessages: Message[];

  const handleRevokeMessage = (event: RevokeMessageHubEvent) => {
    revokedMessages.push(event.revokeMessageBody.message);
  };

  beforeAll(async () => {
    liveEngine.eventHandler.on('revokeMessage', handleRevokeMessage);
  });

  afterAll(async () => {
    liveEngine.eventHandler.off('revokeMessage', handleRevokeMessage);
  });

  beforeEach(async () => {
    revokedMessages = [];
    await liveEngine.start();
  });

  afterEach(async () => {
    await liveEngine.stop();
  });

  describe('with messages', () => {
    beforeEach(async () => {
      await liveEngine.mergeIdRegistryEvent(custodyEvent);
      await liveEngine.mergeMessage(signerAdd);
      await liveEngine.mergeMessages([castAdd, reactionAdd, linkAdd]);
      expect(await liveEngine.getCast(fid, castAdd.hash)).toEqual(ok(castAdd));
      expect(
        await liveEngine.getReaction(
          fid,
          reactionAdd.data.reactionBody.type,
          reactionAdd.data.reactionBody.targetCastId as CastId
        )
      ).toEqual(ok(reactionAdd));
      setReferenceDateForTest(100000000000000000000000);
      expect(
        await liveEngine.getLink(fid, linkAdd.data.linkBody.type, linkAdd.data.linkBody.targetFid as number)
      ).toEqual(ok(linkAdd));
    });

    test('revokes messages when SignerRemove is merged', async () => {
      await liveEngine.mergeMessage(signerRemove);
      expect(revokedMessages).toEqual([]);
      await sleep(200); // Wait for engine to revoke messages
      expect(revokedMessages).toEqual([castAdd, reactionAdd, linkAdd]);
    });

    test('revokes messages when fid is transferred', async () => {
      const custodyTransfer = Factories.IdRegistryEvent.build({
        fid,
        from: custodyEvent.to,
        blockNumber: custodyEvent.blockNumber + 1,
      });
      await liveEngine.mergeIdRegistryEvent(custodyTransfer);
      expect(revokedMessages).toEqual([]);
      await sleep(200); // Wait for engine to revoke messages
      expect(revokedMessages).toEqual([signerAdd, castAdd, reactionAdd, linkAdd]);
    });

    test('revokes messages when SignerAdd is pruned', async () => {
      const event = HubEvent.create({
        type: HubEventType.PRUNE_MESSAGE,
        pruneMessageBody: { message: signerAdd },
      });
      liveEngine.eventHandler.emit('pruneMessage', event as PruneMessageHubEvent); // Hack to force prune
      expect(revokedMessages).toEqual([]);
      await sleep(200); // Wait for engine to revoke messages
      expect(revokedMessages).toEqual([castAdd, reactionAdd, linkAdd]);
    });

    test('revokes messages when SignerAdd is revoked', async () => {
      const event = HubEvent.create({
        type: HubEventType.REVOKE_MESSAGE,
        revokeMessageBody: { message: signerAdd },
      });
      liveEngine.eventHandler.emit('revokeMessage', event as RevokeMessageHubEvent); // Hack to force revoke
      expect(revokedMessages).toEqual([signerAdd]);
      await sleep(200); // Wait for engine to revoke messages
      expect(revokedMessages).toEqual([signerAdd, castAdd, reactionAdd, linkAdd]);
    });

    test('revokes UserDataAdd when fname is transferred', async () => {
      const fname = Factories.Fname.build();
      const nameEvent = Factories.NameRegistryEvent.build({
        fname,
        to: custodyEvent.to,
        type: NameRegistryEventType.TRANSFER,
      });
      await expect(liveEngine.mergeNameRegistryEvent(nameEvent)).resolves.toBeInstanceOf(Ok);
      const fnameAdd = await Factories.UserDataAddMessage.create(
        {
          data: {
            userDataBody: { type: UserDataType.FNAME, value: bytesToUtf8String(fname)._unsafeUnwrap() },
            fid,
          },
        },
        { transient: { signer } }
      );
      await expect(liveEngine.mergeMessage(fnameAdd)).resolves.toBeInstanceOf(Ok);
      const nameTransfer = Factories.NameRegistryEvent.build({
        fname,
        from: custodySignerKey,
        type: NameRegistryEventType.TRANSFER,
        blockNumber: nameEvent.blockNumber + 1,
      });
      await expect(liveEngine.mergeNameRegistryEvent(nameTransfer)).resolves.toBeInstanceOf(Ok);
      expect(revokedMessages).toEqual([]);
      await sleep(200); // Wait for engine to revoke messages
      expect(revokedMessages).toEqual([fnameAdd]);
    });

    test('revokes UserDataAdd when fid is transferred', async () => {
      const fname = Factories.Fname.build();
      const nameEvent = Factories.NameRegistryEvent.build({
        fname,
        to: custodyEvent.to,
        type: NameRegistryEventType.TRANSFER,
      });
      await expect(liveEngine.mergeNameRegistryEvent(nameEvent)).resolves.toBeInstanceOf(Ok);
      const fnameAdd = await Factories.UserDataAddMessage.create(
        {
          data: {
            userDataBody: { type: UserDataType.FNAME, value: bytesToUtf8String(fname)._unsafeUnwrap() },
            fid,
          },
        },
        { transient: { signer } }
      );
      await expect(liveEngine.mergeMessage(fnameAdd)).resolves.toBeInstanceOf(Ok);
      const custodyTransfer = Factories.IdRegistryEvent.build({
        fid,
        from: custodyEvent.to,
        blockNumber: custodyEvent.blockNumber + 1,
      });
      await expect(liveEngine.mergeIdRegistryEvent(custodyTransfer)).resolves.toBeInstanceOf(Ok);
      expect(revokedMessages).toEqual([]);
      await sleep(200); // Wait for engine to revoke messages
      expect(revokedMessages).toContainEqual(fnameAdd);
    });
  });
});

describe('stop', () => {
  test('removes all event listeners', async () => {
    const eventNames: (keyof StoreEvents)[] = ['mergeMessage', 'mergeIdRegistryEvent', 'pruneMessage', 'revokeMessage'];
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
