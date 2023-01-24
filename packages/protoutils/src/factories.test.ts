import {
  isAmpAddMessage,
  isAmpRemoveMessage,
  isCastAddMessage,
  isCastRemoveMessage,
  isReactionAddMessage,
  isReactionRemoveMessage,
  isSignerAddMessage,
  isSignerRemoveMessage,
  isUserDataAddMessage,
  isVerificationAddEthAddressMessage,
  isVerificationRemoveMessage,
} from '@farcaster/protobufs';
import { ok } from 'neverthrow';
import { Factories } from './factories';
import * as validations from './validations';

describe('CastAddMessageFactory', () => {
  test('generates a valid CastAdd', async () => {
    const message = await Factories.CastAddMessage.create();
    expect(isCastAddMessage(message)).toBeTruthy();
    expect(validations.validateMessage(message)).resolves.toEqual(ok(message));
  });
});

describe('CastRemoveMessageFactory', () => {
  test('generates a valid CastRemove', async () => {
    const message = await Factories.CastRemoveMessage.create();
    expect(isCastRemoveMessage(message)).toBeTruthy();
    expect(validations.validateMessage(message)).resolves.toEqual(ok(message));
  });
});

describe('ReactionAddMessageFactory', () => {
  test('generates a valid ReactionAdd', async () => {
    const message = await Factories.ReactionAddMessage.create();
    expect(isReactionAddMessage(message)).toBeTruthy();
    expect(validations.validateMessage(message)).resolves.toEqual(ok(message));
  });
});

describe('ReactionRemoveMessageFactory', () => {
  test('generates a valid ReactionRemove', async () => {
    const message = await Factories.ReactionRemoveMessage.create();
    expect(isReactionRemoveMessage(message)).toBeTruthy();
    expect(validations.validateMessage(message)).resolves.toEqual(ok(message));
  });
});

describe('AmpAddMessageFactory', () => {
  test('generates a valid AmpAdd', async () => {
    const message = await Factories.AmpAddMessage.create();
    expect(isAmpAddMessage(message)).toBeTruthy();
    expect(validations.validateMessage(message)).resolves.toEqual(ok(message));
  });
});

describe('AmpRemoveMessageFactory', () => {
  test('generates a valid AmpRemove', async () => {
    const message = await Factories.AmpRemoveMessage.create();
    expect(isAmpRemoveMessage(message)).toBeTruthy();
    expect(validations.validateMessage(message)).resolves.toEqual(ok(message));
  });
});

describe('VerificationAddEthAddressMessageFactory', () => {
  test('generates a valid VerificationAddEthAddress', async () => {
    const message = await Factories.VerificationAddEthAddressMessage.create();
    expect(isVerificationAddEthAddressMessage(message)).toBeTruthy();
    expect(validations.validateMessage(message)).resolves.toEqual(ok(message));
  });
});

describe('VerificationRemoveMessageFactory', () => {
  test('generates a valid VerificationRemove', async () => {
    const message = await Factories.VerificationRemoveMessage.create();
    expect(isVerificationRemoveMessage(message)).toBeTruthy();
    expect(validations.validateMessage(message)).resolves.toEqual(ok(message));
  });
});

describe('SignerAddMessageFactory', () => {
  test('generates a valid SignerAdd', async () => {
    const message = await Factories.SignerAddMessage.create();
    expect(isSignerAddMessage(message)).toBeTruthy();
    expect(validations.validateMessage(message)).resolves.toEqual(ok(message));
  });
});

describe('SignerRemoveMessageFactory', () => {
  test('generates a valid SignerRemove', async () => {
    const message = await Factories.SignerRemoveMessage.create();
    expect(isSignerRemoveMessage(message)).toBeTruthy();
    expect(validations.validateMessage(message)).resolves.toEqual(ok(message));
  });
});

describe('UserDataAddMessageFactory', () => {
  test('generates a valid UserDataAdd', async () => {
    const message = await Factories.UserDataAddMessage.create();
    expect(isUserDataAddMessage(message)).toBeTruthy();
    expect(validations.validateMessage(message)).resolves.toEqual(ok(message));
  });
});
