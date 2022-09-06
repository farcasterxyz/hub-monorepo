import { Factories } from '~/factories';
import { CastShort } from '~/types';
import { decodeMessage, encodeMessage, GossipMessage, UserContent } from '~/network/protocol';

let cast: CastShort;

beforeAll(async () => {
  cast = await Factories.CastShort.create();
});

describe('gossip message', () => {
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
});

describe('encode/decode', () => {
  test('encode and decode a message', () => {
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
    expect(decoded).toStrictEqual(message);
  });
});
