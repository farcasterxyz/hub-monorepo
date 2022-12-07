import { createEd25519PeerId } from '@libp2p/peer-id-factory';
import { multiaddr } from '@multiformats/multiaddr';
import { ConnectionFilter } from '~/network/p2p/connectionFilter';
import { PeerId } from '@libp2p/interface-peer-id';

let allowedPeerId: PeerId;
let blockedPeerId: PeerId;
let localMultiAddrStr: string;
let allowedMultiAddrStr: string;
let filteredMultiAddrStr: string;

describe('connectionFilter tests', () => {
  beforeAll(async () => {
    allowedPeerId = await createEd25519PeerId();
    blockedPeerId = await createEd25519PeerId();
    allowedMultiAddrStr = `/ip4/127.0.0.1/tcp/64454/p2p/${allowedPeerId.toString()}`;
    expect(multiaddr(allowedMultiAddrStr)).toBeDefined();
    filteredMultiAddrStr = `/ip4/127.0.0.1/tcp/64455/p2p/${blockedPeerId.toString()}`;
    expect(multiaddr(filteredMultiAddrStr)).toBeDefined();
    localMultiAddrStr = `/ip4/127.0.0.1/tcp/64456/`;
  });

  test('denies all connections by default', async () => {
    const filter = new ConnectionFilter([]);
    await expect(filter.denyDialPeer(allowedPeerId)).resolves.toBeTruthy();
    await expect(filter.denyDialMultiaddr(allowedPeerId)).resolves.toBeTruthy();
    // Incepient Inbound Connections are always allowed
    await expect(filter.denyInboundConnection()).resolves.toBeFalsy();
    await expect(filter.denyInboundEncryptedConnection(allowedPeerId)).resolves.toBeTruthy();
    await expect(filter.denyInboundUpgradedConnection(allowedPeerId)).resolves.toBeTruthy();
    await expect(filter.denyOutboundConnection(allowedPeerId)).resolves.toBeTruthy();
    await expect(filter.denyOutboundEncryptedConnection(allowedPeerId)).resolves.toBeTruthy();
    await expect(filter.denyOutboundUpgradedConnection(allowedPeerId)).resolves.toBeTruthy();
    await expect(filter.filterMultiaddrForPeer(allowedPeerId)).resolves.toBeFalsy();
  });

  test('allows selected peers', async () => {
    const filter = new ConnectionFilter([allowedPeerId.toString()]);
    await expect(filter.denyDialPeer(allowedPeerId)).resolves.toBeFalsy();
    await expect(filter.denyDialMultiaddr(allowedPeerId)).resolves.toBeFalsy();
    // Incepient Inbound Connections are always allowed
    await expect(filter.denyInboundConnection()).resolves.toBeFalsy();
    await expect(filter.denyInboundEncryptedConnection(allowedPeerId)).resolves.toBeFalsy();
    await expect(filter.denyInboundUpgradedConnection(allowedPeerId)).resolves.toBeFalsy();
    await expect(filter.denyOutboundConnection(allowedPeerId)).resolves.toBeFalsy();
    await expect(filter.denyOutboundEncryptedConnection(allowedPeerId)).resolves.toBeFalsy();
    await expect(filter.denyOutboundUpgradedConnection(allowedPeerId)).resolves.toBeFalsy();
    await expect(filter.filterMultiaddrForPeer(allowedPeerId)).resolves.toBeTruthy();
  });

  test('filters unknown peers', async () => {
    const filter = new ConnectionFilter([allowedPeerId.toString()]);
    await expect(filter.denyDialPeer(allowedPeerId)).resolves.toBeFalsy();
    await expect(filter.denyDialPeer(blockedPeerId)).resolves.toBeTruthy();
    // Incepient Inbound Connections are always allowed
    await expect(filter.denyInboundConnection()).resolves.toBeFalsy();
    await expect(filter.denyOutboundConnection(blockedPeerId)).resolves.toBeTruthy();
    await expect(filter.filterMultiaddrForPeer(blockedPeerId)).resolves.toBeFalsy();
  });
});
