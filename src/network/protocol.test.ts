import { Factories } from '~/factories';
import { CastShort, IDRegistryEvent } from '~/types';
import { decodeMessage, encodeMessage, GossipMessage, IDRegistryContent, UserContent } from '~/network/protocol';

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
  test('encode and decode a cast message', () => {
    const message: GossipMessage<UserContent> = {
      content: {
        message: cast,
        root: '',
        count: 0,
      },
      topics: [],
    };
    const encoded = encodeMessage(message);
    expect(encoded).toBeDefined();
    const decoded = decodeMessage(encoded);
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
    const encoded = encodeMessage(message);
    expect(encoded).toBeDefined();
    const decoded = decodeMessage(encoded);
    expect(decoded.isOk()).toBeTruthy();
    expect(decoded._unsafeUnwrap()).toStrictEqual(message);
  });
});
