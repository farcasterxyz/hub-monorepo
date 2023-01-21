import * as protobufs from '@farcaster/protobufs';
import { ok } from 'neverthrow';
import { Factories } from './factories';
import * as validations from './validations';

describe('MessageFactory', () => {
  let message: protobufs.Message;

  afterEach(async () => {
    const isValid = await validations.validateMessage(message);
    expect(isValid).toEqual(ok(message));
  });

  test('generates valid CastAdd', async () => {
    message = await Factories.Message.create({}, { transient: { data: Factories.CastAddData.build() } });
  });

  test('generates valid CastRemove', async () => {
    message = await Factories.Message.create({}, { transient: { data: Factories.CastRemoveData.build() } });
  });

  test('generates valid ReactionAdd', async () => {
    message = await Factories.Message.create({}, { transient: { data: Factories.ReactionAddData.build() } });
  });

  test('generates valid ReactionRemove', async () => {
    message = await Factories.Message.create({}, { transient: { data: Factories.ReactionRemoveData.build() } });
  });

  test('generates valid AmpAdd', async () => {
    message = await Factories.Message.create({}, { transient: { data: Factories.AmpAddData.build() } });
  });

  test('generates valid AmpRemove', async () => {
    message = await Factories.Message.create({}, { transient: { data: Factories.AmpRemoveData.build() } });
  });

  test('generates valid VerificationAddEthAddress', async () => {
    message = await Factories.Message.create(
      {},
      { transient: { data: Factories.VerificationAddEthAddressData.build() } }
    );
  });

  test('generates valid VerificationRemove', async () => {
    message = await Factories.Message.create({}, { transient: { data: Factories.VerificationRemoveData.build() } });
  });

  test('generates valid SignerAdd', async () => {
    message = await Factories.Message.create({}, { transient: { data: Factories.SignerAddData.build() } });
  });

  test('generates valid SignerRemove', async () => {
    message = await Factories.Message.create({}, { transient: { data: Factories.SignerRemoveData.build() } });
  });

  test('generates valid UserDataAdd', async () => {
    message = await Factories.Message.create({}, { transient: { data: Factories.UserDataAddData.build() } });
  });
});
