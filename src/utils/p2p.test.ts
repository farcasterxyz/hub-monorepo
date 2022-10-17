import { parseAddress, checkNodeAddrs } from '~/utils/p2p';

describe('p2p utils tests', () => {
  test('parse a valid multiaddr', async () => {
    const result = parseAddress('/ip4/127.0.0.1/tcp/8080');
    expect(result.isOk()).toBeTruthy();
  });

  test('fail to parse an invalid multiaddr', async () => {
    const result = parseAddress('/ip6/127.0.0.1/8080');
    expect(result.isErr()).toBeTruthy();
  });

  test('check valid node addresses', async () => {
    const result = checkNodeAddrs('/ip4/127.0.0.1/', '/ip4/127.0.0.1/tcp/8080');
    expect(result.isOk()).toBeTruthy();
  });

  test('check invalid node addresses', async () => {
    // invalid IP multiaddr but valid combined multiaddr
    let result = checkNodeAddrs('/ip4/2600:1700:6cf0:990:2052:a166:fb35:830a', '/ip4/127.0.0.1/tcp/8080');
    expect(result.isErr()).toBeTruthy();
    // valid IP multiaddr but invalid combined multiaddr
    result = checkNodeAddrs('/ip4/127.0.0.1/', '/ip4/2600:1700:6cf0:990:2052:a166:fb35:830a/tcp/8080');
    expect(result.isErr()).toBeTruthy();
    // both invalid IP and combined multiaddrs
    result = checkNodeAddrs(
      '/ip4/2600:1700:6cf0:990:2052:a166:fb35:830a',
      '/ip4/2600:1700:6cf0:990:2052:a166:fb35:830a/tcp/8080'
    );
  });
});
