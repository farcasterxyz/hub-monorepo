import { Wallet, utils } from 'ethers';
import { err, ok } from 'neverthrow';
import { jestBinaryRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine/flatbuffers';
import IdRegistryEventModel from '~/storage/flatbuffers/idRegistryEventModel';
import MessageModel from '~/storage/flatbuffers/messageModel';
import {
  CastAddModel,
  AmpAddModel,
  ReactionAddModel,
  SignerAddModel,
  SignerRemoveModel,
  UserDataAddModel,
  VerificationAddEthAddressModel,
} from '~/storage/flatbuffers/types';
import AmpStore from '~/storage/sets/flatbuffers/ampStore';
import CastStore from '~/storage/sets/flatbuffers/castStore';
import ReactionStore from '~/storage/sets/flatbuffers/reactionStore';
import SignerStore from '~/storage/sets/flatbuffers/signerStore';
import UserDataStore from '~/storage/sets/flatbuffers/userDataStore';
import VerificationStore from '~/storage/sets/flatbuffers/verificationStore';
import Factories from '~/test/factories/flatbuffer';
import { KeyPair } from '~/types';
import { generateEd25519KeyPair } from '~/utils/crypto';
import { IdRegistryEventType } from '~/utils/generated/id_registry_event_generated';
import { CastId, MessageType } from '~/utils/generated/message_generated';
import { HubError } from '~/utils/hubErrors';

const db = jestBinaryRocksDB('flatbuffers.engine.test');
const engine = new Engine(db);

// init stores for checking state changes from engine
const signerStore = new SignerStore(db, engine.eventHandler);
const castStore = new CastStore(db, engine.eventHandler);
const ampStore = new AmpStore(db, engine.eventHandler);
const reactionStore = new ReactionStore(db, engine.eventHandler);
const verificationStore = new VerificationStore(db, engine.eventHandler);
const userDataStore = new UserDataStore(db, engine.eventHandler);

const fid = Factories.FID.build();

let custodyWallet: Wallet;
let custodyAddress: Uint8Array;
let custodyEvent: IdRegistryEventModel;

let signer: KeyPair;
let signerAdd: SignerAddModel;
let signerRemove: SignerRemoveModel;

let castAdd: CastAddModel;
let ampAdd: AmpAddModel;
let reactionAdd: ReactionAddModel;
let verificationAdd: VerificationAddEthAddressModel;
let userDataAdd: UserDataAddModel;

beforeAll(async () => {
  custodyWallet = new Wallet(utils.randomBytes(32));
  custodyAddress = utils.arrayify(custodyWallet.address);
  custodyEvent = new IdRegistryEventModel(
    await Factories.IdRegistryEvent.create({ fid: Array.from(fid), to: Array.from(custodyAddress) })
  );

  signer = await generateEd25519KeyPair();

  const signerAddData = await Factories.SignerAddData.create({
    fid: Array.from(fid),
    body: Factories.SignerBody.build({ signer: Array.from(signer.publicKey) }),
  });
  const signerAddMessage = await Factories.Message.create(
    { data: Array.from(signerAddData.bb?.bytes() ?? []) },
    { transient: { wallet: custodyWallet } }
  );
  signerAdd = new MessageModel(signerAddMessage) as SignerAddModel;

  const signerRemoveData = await Factories.SignerRemoveData.create({
    fid: Array.from(fid),
    body: Factories.SignerBody.build({ signer: Array.from(signer.publicKey) }),
    timestamp: signerAdd.timestamp() + 1,
  });
  const signerRemoveMessage = await Factories.Message.create(
    { data: Array.from(signerRemoveData.bb?.bytes() ?? []) },
    { transient: { wallet: custodyWallet } }
  );
  signerRemove = new MessageModel(signerRemoveMessage) as SignerRemoveModel;

  const castAddData = await Factories.CastAddData.create({ fid: Array.from(fid) });
  const castAddMessage = await Factories.Message.create(
    { data: Array.from(castAddData.bb?.bytes() ?? []) },
    { transient: { signer } }
  );
  castAdd = new MessageModel(castAddMessage) as CastAddModel;

  const ampAddData = await Factories.AmpAddData.create({ fid: Array.from(fid) });
  const ampAddMessage = await Factories.Message.create(
    { data: Array.from(ampAddData.bb?.bytes() ?? []) },
    { transient: { signer } }
  );
  ampAdd = new MessageModel(ampAddMessage) as AmpAddModel;

  const reactionAddData = await Factories.ReactionAddData.create({ fid: Array.from(fid) });
  const reactionAddMessage = await Factories.Message.create(
    { data: Array.from(reactionAddData.bb?.bytes() ?? []) },
    { transient: { signer } }
  );
  reactionAdd = new MessageModel(reactionAddMessage) as ReactionAddModel;

  const verificationAddBody = await Factories.VerificationAddEthAddressBody.create({}, { transient: { fid } });
  const verificationAddData = await Factories.VerificationAddEthAddressData.create({
    fid: Array.from(fid),
    body: verificationAddBody.unpack(),
  });
  const verificationAddMessage = await Factories.Message.create(
    { data: Array.from(verificationAddData.bb?.bytes() ?? []) },
    { transient: { signer } }
  );
  verificationAdd = new MessageModel(verificationAddMessage) as VerificationAddEthAddressModel;

  const userDataAddData = await Factories.UserDataAddData.create({ fid: Array.from(fid) });
  const userDataAddMessage = await Factories.Message.create(
    { data: Array.from(userDataAddData.bb?.bytes() ?? []) },
    { transient: { signer } }
  );
  userDataAdd = new MessageModel(userDataAddMessage) as UserDataAddModel;
});

describe('mergeIdRegistryEvent', () => {
  test('succeeds', async () => {
    await expect(engine.mergeIdRegistryEvent(custodyEvent)).resolves.toEqual(ok(undefined));
    await expect(signerStore.getCustodyEvent(fid)).resolves.toEqual(custodyEvent);
  });

  test('fails with invalid event type', async () => {
    const invalidEvent = new IdRegistryEventModel(
      await Factories.IdRegistryEvent.create({
        type: 3 as IdRegistryEventType,
        fid: Array.from(fid),
        to: Array.from(custodyAddress),
      })
    );
    const result = await engine.mergeIdRegistryEvent(invalidEvent);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'invalid event type'));
  });
});

describe('mergeMessage', () => {
  let mergedMessages: MessageModel[];
  const handleMergeMessage = (message: MessageModel) => {
    mergedMessages.push(message);
  };

  beforeAll(() => {
    engine.eventHandler.on('mergeMessage', handleMergeMessage);
  });

  afterAll(() => {
    engine.eventHandler.off('mergeMessage', handleMergeMessage);
  });

  beforeEach(() => {
    mergedMessages = [];
  });

  describe('with valid signer', () => {
    beforeEach(async () => {
      await engine.mergeIdRegistryEvent(custodyEvent);
      await engine.mergeMessage(signerAdd);
    });

    test('fails with invalid message type', async () => {
      const data = await Factories.MessageData.create({ type: 12 as MessageType, fid: Array.from(fid) });
      const message = new MessageModel(
        await Factories.Message.create(
          { data: Array.from(data.bb?.bytes() ?? new Uint8Array()) },
          { transient: { signer } }
        )
      );
      const result = await engine.mergeMessage(message);
      expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request', 'unknown message type'));
      expect(mergedMessages).toEqual([signerAdd]);
    });

    describe('CastAdd', () => {
      test('succeeds', async () => {
        await expect(engine.mergeMessage(castAdd)).resolves.toEqual(ok(undefined));
        await expect(castStore.getCastAdd(fid, castAdd.tsHash())).resolves.toEqual(castAdd);
        expect(mergedMessages).toEqual([signerAdd, castAdd]);
      });
    });

    describe('AmpAdd', () => {
      test('succeeds', async () => {
        await expect(engine.mergeMessage(ampAdd)).resolves.toEqual(ok(undefined));
        await expect(ampStore.getAmpAdd(fid, ampAdd.body().user()?.fidArray() ?? new Uint8Array())).resolves.toEqual(
          ampAdd
        );
        expect(mergedMessages).toEqual([signerAdd, ampAdd]);
      });
    });

    describe('ReactionAdd', () => {
      test('succeeds', async () => {
        await expect(engine.mergeMessage(reactionAdd)).resolves.toEqual(ok(undefined));
        await expect(
          reactionStore.getReactionAdd(fid, reactionAdd.body().type(), reactionAdd.body().cast() as CastId)
        ).resolves.toEqual(reactionAdd);
        expect(mergedMessages).toEqual([signerAdd, reactionAdd]);
      });
    });

    describe('VerificationAddEthAddress', () => {
      test('succeeds', async () => {
        await expect(engine.mergeMessage(verificationAdd)).resolves.toEqual(ok(undefined));
        await expect(
          verificationStore.getVerificationAdd(fid, verificationAdd.body().addressArray() ?? new Uint8Array())
        ).resolves.toEqual(verificationAdd);
        expect(mergedMessages).toEqual([signerAdd, verificationAdd]);
      });
    });

    describe('UserDataAdd', () => {
      test('succeeds', async () => {
        await expect(engine.mergeMessage(userDataAdd)).resolves.toEqual(ok(undefined));
        await expect(userDataStore.getUserDataAdd(fid, userDataAdd.body().type())).resolves.toEqual(userDataAdd);
        expect(mergedMessages).toEqual([signerAdd, userDataAdd]);
      });
    });

    describe('SignerRemove', () => {
      test('succeeds ', async () => {
        await expect(engine.mergeMessage(signerRemove)).resolves.toEqual(ok(undefined));
        await expect(signerStore.getSignerRemove(fid, signer.publicKey)).resolves.toEqual(signerRemove);
        expect(mergedMessages).toEqual([signerAdd, signerRemove]);
      });
    });
  });

  describe('fails when missing signer', () => {
    let message: MessageModel;

    beforeEach(async () => {
      await engine.mergeIdRegistryEvent(custodyEvent);
    });

    afterEach(async () => {
      expect(await engine.mergeMessage(message)).toEqual(
        err(new HubError('bad_request.validation_failure', 'invalid signer'))
      );
    });

    test('with CastAdd', () => {
      message = castAdd;
    });
  });

  describe('fails when missing both custody address and signer', () => {
    let message: MessageModel;

    afterEach(async () => {
      expect(await engine.mergeMessage(message)).toEqual(
        err(new HubError('bad_request.validation_failure', 'unknown user'))
      );
    });

    test('with CastAdd', () => {
      message = castAdd;
    });
  });
});

describe('mergeMessages', () => {
  let mergedMessages: MessageModel[];
  const handleMergeMessage = (message: MessageModel) => {
    mergedMessages.push(message);
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

  describe('MergeMultipleMessages', () => {
    test('succeeds', async () => {
      await expect(
        engine.mergeMessages([castAdd, ampAdd, reactionAdd, verificationAdd, userDataAdd, signerRemove])
      ).resolves.toEqual([ok(undefined), ok(undefined), ok(undefined), ok(undefined), ok(undefined), ok(undefined)]);
      expect(mergedMessages).toEqual([
        signerAdd,
        castAdd,
        ampAdd,
        reactionAdd,
        verificationAdd,
        userDataAdd,
        signerRemove,
      ]);
    });
  });
});

describe('revokeMessagesBySigner', () => {
  let revokedMessages: MessageModel[];
  const handleRevokedMessage = (message: MessageModel) => {
    revokedMessages.push(message);
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
    await engine.mergeMessage(ampAdd);
    await engine.mergeMessage(reactionAdd);
    await engine.mergeMessage(verificationAdd);
    await engine.mergeMessage(userDataAdd);
  });

  test('revokes messages signed by EIP-712 signer', async () => {
    const signerMessages = [signerAdd];
    for (const message of signerMessages) {
      const getMessage = MessageModel.get(db, message.fid(), message.setPostfix(), message.tsHash());
      await expect(getMessage).resolves.toEqual(message);
    }
    await expect(engine.revokeMessagesBySigner(fid, custodyAddress)).resolves.toEqual(ok(undefined));
    for (const message of signerMessages) {
      const getMessage = MessageModel.get(db, message.fid(), message.setPostfix(), message.tsHash());
      await expect(getMessage).rejects.toThrow();
    }
    expect(revokedMessages).toEqual(signerMessages);
  });

  test('revokes messages signed by Ed25519 signer', async () => {
    const signerMessages = [castAdd, ampAdd, reactionAdd, verificationAdd, userDataAdd];
    for (const message of signerMessages) {
      const getMessage = MessageModel.get(db, message.fid(), message.setPostfix(), message.tsHash());
      await expect(getMessage).resolves.toEqual(message);
    }
    await expect(engine.revokeMessagesBySigner(fid, signer.publicKey)).resolves.toEqual(ok(undefined));
    for (const message of signerMessages) {
      const getMessage = MessageModel.get(db, message.fid(), message.setPostfix(), message.tsHash());
      await expect(getMessage).rejects.toThrow();
    }
    expect(revokedMessages).toEqual(signerMessages);
  });
});
