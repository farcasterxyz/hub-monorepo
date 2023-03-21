import * as protobufs from '@farcaster/protobufs';
import { bytesToUtf8String, Factories, HubError } from '@farcaster/utils';
import { err, Ok, ok } from 'neverthrow';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import SignerStore from '~/storage/stores/signerStore';
import { sleep } from '~/utils/crypto';
import { getMessage, makeTsHash, typeToSetPostfix } from '../db/message';

const db = jestRocksDB('protobufs.engine.test');
const network = protobufs.FarcasterNetwork.TESTNET;
const engine = new Engine(db, network);

// init signer store for checking state changes from engine
const signerStore = new SignerStore(db, engine.eventHandler);

const fid = Factories.Fid.build();
const fname = Factories.Fname.build();
const signer = Factories.Ed25519Signer.build();
const custodySigner = Factories.Eip712Signer.build();

let custodySignerKey: Uint8Array;
let signerKey: Uint8Array;
let custodyEvent: protobufs.IdRegistryEvent;
let fnameTransfer: protobufs.NameRegistryEvent;
let signerAdd: protobufs.SignerAddMessage;
let signerRemove: protobufs.SignerRemoveMessage;
let castAdd: protobufs.CastAddMessage;
let reactionAdd: protobufs.ReactionAddMessage;
let verificationAdd: protobufs.VerificationAddEthAddressMessage;
let userDataAdd: protobufs.UserDataAddMessage;

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
  verificationAdd = await Factories.VerificationAddEthAddressMessage.create(
    { data: { fid, network } },
    { transient: { signer } }
  );
  userDataAdd = await Factories.UserDataAddMessage.create(
    { data: { fid, network, userDataBody: { type: protobufs.UserDataType.PFP } } },
    { transient: { signer } }
  );
});

afterAll(async () => {
  await engine.stop();
});

describe('mergeIdRegistryEvent', () => {
  test('succeeds', async () => {
    await expect(engine.mergeIdRegistryEvent(custodyEvent)).resolves.toBeInstanceOf(Ok);
    await expect(engine.getIdRegistryEvent(fid)).resolves.toEqual(ok(custodyEvent));
  });

  test('fails with invalid event type', async () => {
    const invalidEvent = Factories.IdRegistryEvent.build({ type: 10 as unknown as protobufs.IdRegistryEventType });
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
    const invalidEvent = Factories.NameRegistryEvent.build({ type: 10 as unknown as protobufs.NameRegistryEventType });
    const result = await engine.mergeNameRegistryEvent(invalidEvent);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'invalid event type'));
  });
});

describe('mergeMessage', () => {
  let mergedMessages: protobufs.Message[];
  let revokedMessages: protobufs.Message[];

  const handleMergeMessage = (event: protobufs.MergeMessageHubEvent) => {
    mergedMessages.push(event.mergeMessageBody.message);
  };

  const handleRevokeMessage = (event: protobufs.RevokeMessageHubEvent) => {
    revokedMessages.push(event.revokeMessageBody.message);
  };

  beforeAll(() => {
    engine.eventHandler.on('mergeMessage', handleMergeMessage);
    engine.eventHandler.on('revokeMessage', handleRevokeMessage);
  });

  afterAll(() => {
    engine.eventHandler.off('mergeMessage', handleMergeMessage);
    engine.eventHandler.off('revokeMessage', handleRevokeMessage);
  });

  beforeEach(() => {
    mergedMessages = [];
    revokedMessages = [];
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
            reactionAdd.data.reactionBody.targetCastId as protobufs.CastId
          )
        ).resolves.toEqual(ok(reactionAdd));
        expect(mergedMessages).toEqual([signerAdd, reactionAdd]);
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
    });

    describe('UserDataAdd', () => {
      test('succeeds', async () => {
        await expect(engine.mergeMessage(userDataAdd)).resolves.toBeInstanceOf(Ok);
        await expect(engine.getUserData(fid, userDataAdd.data.userDataBody.type)).resolves.toEqual(ok(userDataAdd));
        expect(mergedMessages).toEqual([signerAdd, userDataAdd]);
      });

      describe('with fname', () => {
        let fnameAdd: protobufs.UserDataAddMessage;

        beforeAll(async () => {
          const fnameString = bytesToUtf8String(fnameTransfer.fname)._unsafeUnwrap();
          fnameAdd = await Factories.UserDataAddMessage.create(
            {
              data: {
                fid,
                network,
                userDataBody: { type: protobufs.UserDataType.FNAME, value: fnameString },
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

      test('revokes messages signed by the removed signer asynchronously', async () => {
        await engine.mergeMessages([castAdd, reactionAdd]);
        expect(await engine.getCast(fid, castAdd.hash)).toEqual(ok(castAdd));
        expect(
          await engine.getReaction(
            fid,
            reactionAdd.data.reactionBody.type,
            reactionAdd.data.reactionBody.targetCastId as protobufs.CastId
          )
        ).toEqual(ok(reactionAdd));
        await engine.mergeMessage(signerRemove);
        expect(revokedMessages).toEqual([]);
        await sleep(100); // Wait for engine to revoke messages
        expect(revokedMessages).toEqual([castAdd, reactionAdd]);
      });
    });

    test('succeeds with concurrent, conflicting cast messages', async () => {
      const castAdd = await Factories.CastAddMessage.create({ data: { fid } }, { transient: { signer } });

      const generateCastRemove = async (): Promise<protobufs.CastRemoveMessage> => {
        return Factories.CastRemoveMessage.create(
          { data: { fid, castRemoveBody: { targetHash: castAdd.hash } } },
          { transient: { signer } }
        );
      };

      // Generate 100 cast removes with different timestamps
      const castRemoves: protobufs.CastRemoveMessage[] = [];
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
        type: protobufs.ReactionType.LIKE,
        targetCastId: castId,
      });

      const messages: protobufs.Message[] = [];
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
  });

  describe('fails when missing both custody address and signer', () => {
    let message: protobufs.Message;

    afterEach(async () => {
      const result = await engine.mergeMessage(message);
      const err = result._unsafeUnwrapErr();
      expect(err.errCode).toEqual('bad_request.validation_failure');
      expect(err.message).toMatch('unknown fid');
    });

    test('with ReactionAdd', () => {
      message = reactionAdd;
    });
  });

  test('fails with mismatched farcaster network', async () => {
    const mainnetEngine = new Engine(db, protobufs.FarcasterNetwork.MAINNET);
    const result = await mainnetEngine.mergeMessage(reactionAdd);
    expect(result).toEqual(
      err(
        new HubError(
          'bad_request.validation_failure',
          `incorrect network: ${protobufs.FarcasterNetwork.TESTNET} (expected: ${protobufs.FarcasterNetwork.MAINNET})`
        )
      )
    );
    await mainnetEngine.stop();
  });
});

describe('mergeMessages', () => {
  let mergedMessages: protobufs.Message[];
  const handleMergeMessage = (event: protobufs.MergeMessageHubEvent) => {
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
    const results = await engine.mergeMessages([castAdd, reactionAdd, userDataAdd, verificationAdd, signerRemove]);
    for (const result of results) {
      expect(result).toBeInstanceOf(Ok);
    }
    expect(new Set(mergedMessages)).toEqual(
      new Set([signerAdd, castAdd, reactionAdd, userDataAdd, verificationAdd, signerRemove])
    );
  });
});

describe('revokeMessagesBySigner', () => {
  let revokedMessages: protobufs.Message[];
  const handleRevokedMessage = (event: protobufs.RevokeMessageHubEvent) => {
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
    await engine.mergeMessage(verificationAdd);
    await engine.mergeMessage(userDataAdd);
  });

  const checkMessage = (message: protobufs.Message): Promise<protobufs.Message> => {
    const data = message.data as protobufs.MessageData;
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
    const signerMessages = [castAdd, reactionAdd, verificationAdd, userDataAdd];
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
