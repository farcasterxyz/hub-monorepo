import { Factories } from '~/factories';
import { CastShort, IDRegistryEvent } from '~/types';
import {
  ContactInfoContent,
  decodeMessage,
  encodeMessage,
  GossipMessage,
  IDRegistryContent,
  UserContent,
} from '~/network/protocol';
import { isGossipMessage } from '~/network/typeguards';

let cast: CastShort;
let idRegistryEvent: IDRegistryEvent;

beforeAll(async () => {
  cast = await Factories.CastShort.create();
  idRegistryEvent = await Factories.IDRegistryEvent.create();
});

describe('gossip protocol', () => {
  test('constructs a Gossip Message from a cast', () => {
    const message: GossipMessage<UserContent> = {
      content: {
        message: cast,
        root: '',
        count: 0,
      },
      topics: [],
    };
    expect(message).toBeDefined();
  });

  test('constructs a Gossip Message from an IDRegistryEvent', () => {
    const message: GossipMessage<IDRegistryContent> = {
      content: {
        message: idRegistryEvent,
        root: '',
        count: 0,
      },
      topics: [],
    };
    expect(message).toBeDefined();
  });
});

describe('encode/decode', () => {
  test('fails to encode/decode an invalid message', () => {
    const invalid: any = {
      content: {
        message: { notARealMessage: 'test data' },
      },
    };
    expect(isGossipMessage(invalid)).toBeFalsy();
    // since encoding is just JSON stringify, it always succeeds
    const encoded = encodeMessage(invalid);
    expect(encoded.isErr()).toBeTruthy();
    const fake_encoded = JSON.stringify(invalid);
    // however, decode is strongly typed so it should fail.
    const decoded = decodeMessage(new TextEncoder().encode(fake_encoded));
    expect(decoded.isErr()).toBeTruthy();
  });

  test('encode and decode a cast message', () => {
    const message: GossipMessage<UserContent> = {
      content: {
        message: cast,
        root: '',
        count: 0,
      },
      topics: [],
    };
    expect(isGossipMessage(message)).toBeTruthy();
    const encoded = encodeMessage(message);
    expect(encoded.isOk()).toBeTruthy();
    expect(encoded._unsafeUnwrap()).toBeDefined();
    const decoded = decodeMessage(encoded._unsafeUnwrap());
    expect(decoded.isOk()).toBeTruthy();
    expect(decoded._unsafeUnwrap()).toStrictEqual(message);
  });

  test('encode and decode a IDRegistry message', () => {
    const message: GossipMessage<IDRegistryContent> = {
      content: {
        message: idRegistryEvent,
        root: '',
        count: 0,
      },
      topics: [],
    };
    expect(isGossipMessage(message)).toBeTruthy();
    const encoded = encodeMessage(message);
    expect(encoded.isOk()).toBeTruthy();
    expect(encoded._unsafeUnwrap()).toBeDefined();
    const decoded = decodeMessage(encoded._unsafeUnwrap());
    expect(decoded.isOk()).toBeTruthy();
    expect(decoded._unsafeUnwrap()).toStrictEqual(message);
  });

  test('encode and decode a ContactInfo message', () => {
    const message: GossipMessage<ContactInfoContent> = {
      content: {
        peerId: '',
      },
      topics: [],
    };
    expect(isGossipMessage(message)).toBeTruthy();
    const encoded = encodeMessage(message);
    expect(encoded.isOk()).toBeTruthy();
    expect(encoded._unsafeUnwrap()).toBeDefined();
    const decoded = decodeMessage(encoded._unsafeUnwrap());
    expect(decoded.isOk()).toBeTruthy();
    expect(decoded._unsafeUnwrap()).toStrictEqual(message);
  });
});
