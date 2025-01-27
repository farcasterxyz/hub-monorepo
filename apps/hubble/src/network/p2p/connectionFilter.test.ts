import { mockMultiaddrConnPair } from "@libp2p/interface-compliance-tests/mocks";
import { PeerId } from "@libp2p/interface";
import { createEd25519PeerId } from "@libp2p/peer-id-factory";
import { multiaddr } from "@multiformats/multiaddr";
import { ConnectionFilter } from "./connectionFilter.js";

let allowedPeerId: PeerId;
let blockedPeerId: PeerId;
let localMultiAddrStr: string;
let allowedMultiAddrStr: string;
let filteredMultiAddrStr: string;

describe("connectionFilter tests", () => {
  beforeAll(async () => {
    allowedPeerId = await createEd25519PeerId();
    blockedPeerId = await createEd25519PeerId();
    allowedMultiAddrStr = `/ip4/127.0.0.1/tcp/64454/p2p/${allowedPeerId.toString()}`;
    expect(multiaddr(allowedMultiAddrStr)).toBeDefined();
    filteredMultiAddrStr = `/ip4/127.0.0.1/tcp/64455/p2p/${blockedPeerId.toString()}`;
    expect(multiaddr(filteredMultiAddrStr)).toBeDefined();
    localMultiAddrStr = "/ip4/127.0.0.1/tcp/64456/";
  });

  test("denies all connections by default", async () => {
    const filter = new ConnectionFilter([], []);
    const { outbound: remoteConnection } = mockMultiaddrConnPair({
      addrs: [multiaddr(localMultiAddrStr), multiaddr(allowedMultiAddrStr)],
      remotePeer: allowedPeerId,
    });
    await expect(filter.denyDialPeer(allowedPeerId)).resolves.toBeTruthy();
    await expect(filter.denyDialMultiaddr(multiaddr(allowedMultiAddrStr))).resolves.toBeTruthy();
    // Incipient Inbound Connections are always allowed
    await expect(filter.denyInboundConnection(remoteConnection)).resolves.toBeFalsy();
    await expect(filter.denyInboundEncryptedConnection(allowedPeerId, remoteConnection)).resolves.toBeTruthy();
    await expect(filter.denyInboundUpgradedConnection(allowedPeerId, remoteConnection)).resolves.toBeTruthy();
    await expect(filter.denyOutboundConnection(allowedPeerId, remoteConnection)).resolves.toBeTruthy();
    await expect(filter.denyOutboundEncryptedConnection(allowedPeerId, remoteConnection)).resolves.toBeTruthy();
    await expect(filter.denyOutboundUpgradedConnection(allowedPeerId, remoteConnection)).resolves.toBeTruthy();
    await expect(filter.filterMultiaddrForPeer(allowedPeerId)).resolves.toBeFalsy();
  });

  test("allows selected peers", async () => {
    const filter = new ConnectionFilter([allowedPeerId.toString()], []);
    const { outbound: remoteConnection } = mockMultiaddrConnPair({
      addrs: [multiaddr(localMultiAddrStr), multiaddr(allowedMultiAddrStr)],
      remotePeer: allowedPeerId,
    });
    await expect(filter.denyDialPeer(allowedPeerId)).resolves.toBeFalsy();
    await expect(filter.denyDialMultiaddr(multiaddr(allowedMultiAddrStr))).resolves.toBeFalsy();
    // Incipient Inbound Connections are always allowed
    await expect(filter.denyInboundConnection(remoteConnection)).resolves.toBeFalsy();
    await expect(filter.denyInboundEncryptedConnection(allowedPeerId, remoteConnection)).resolves.toBeFalsy();
    await expect(filter.denyInboundUpgradedConnection(allowedPeerId, remoteConnection)).resolves.toBeFalsy();
    await expect(filter.denyOutboundConnection(allowedPeerId, remoteConnection)).resolves.toBeFalsy();
    await expect(filter.denyOutboundEncryptedConnection(allowedPeerId, remoteConnection)).resolves.toBeFalsy();
    await expect(filter.denyOutboundUpgradedConnection(allowedPeerId, remoteConnection)).resolves.toBeFalsy();
    await expect(filter.filterMultiaddrForPeer(allowedPeerId)).resolves.toBeTruthy();
  });

  test("filters unknown peers", async () => {
    const filter = new ConnectionFilter([allowedPeerId.toString()], []);
    const { outbound: remoteConnection } = mockMultiaddrConnPair({
      addrs: [multiaddr(localMultiAddrStr), multiaddr(filteredMultiAddrStr)],
      remotePeer: blockedPeerId,
    });
    await expect(filter.denyDialPeer(allowedPeerId)).resolves.toBeFalsy();
    await expect(filter.denyDialPeer(blockedPeerId)).resolves.toBeTruthy();
    // Incipient Inbound Connections are always allowed
    await expect(filter.denyInboundConnection(remoteConnection)).resolves.toBeFalsy();
    await expect(filter.denyOutboundConnection(blockedPeerId, remoteConnection)).resolves.toBeTruthy();
    await expect(filter.filterMultiaddrForPeer(blockedPeerId)).resolves.toBeFalsy();
  });

  test("denied peers are not allowed", async () => {
    const filter = new ConnectionFilter(undefined, [blockedPeerId.toString()]);
    const { outbound: remoteConnection } = mockMultiaddrConnPair({
      addrs: [multiaddr(localMultiAddrStr), multiaddr(filteredMultiAddrStr)],
      remotePeer: blockedPeerId,
    });
    await expect(filter.denyDialPeer(allowedPeerId)).resolves.toBeFalsy();
    await expect(filter.denyDialPeer(blockedPeerId)).resolves.toBeTruthy();
    // Incipient Inbound Connections are always allowed
    await expect(filter.denyInboundConnection(remoteConnection)).resolves.toBeFalsy();
    await expect(filter.denyOutboundConnection(blockedPeerId, remoteConnection)).resolves.toBeTruthy();
    await expect(filter.filterMultiaddrForPeer(blockedPeerId)).resolves.toBeFalsy();
  });

  test("denies peer that is both allowed and denied", async () => {
    const filter = new ConnectionFilter([blockedPeerId.toString()], [blockedPeerId.toString()]);
    const { outbound: remoteConnection } = mockMultiaddrConnPair({
      addrs: [multiaddr(localMultiAddrStr), multiaddr(allowedMultiAddrStr)],
      remotePeer: blockedPeerId,
    });
    await expect(filter.denyDialPeer(blockedPeerId)).resolves.toBeTruthy();
    await expect(filter.denyDialMultiaddr(multiaddr(allowedMultiAddrStr))).resolves.toBeTruthy();
    // Incipient Inbound Connections are always allowed
    await expect(filter.denyInboundConnection(remoteConnection)).resolves.toBeFalsy();
    await expect(filter.denyOutboundConnection(blockedPeerId, remoteConnection)).resolves.toBeTruthy();
    await expect(filter.filterMultiaddrForPeer(blockedPeerId)).resolves.toBeFalsy();
  });

  test("no filter allows all", async () => {
    const filter = new ConnectionFilter(undefined, []);
    const { outbound: remoteConnection } = mockMultiaddrConnPair({
      addrs: [multiaddr(localMultiAddrStr), multiaddr(allowedMultiAddrStr)],
      remotePeer: allowedPeerId,
    });
    await expect(filter.denyDialPeer(allowedPeerId)).resolves.toBeFalsy();
    await expect(filter.denyDialPeer(blockedPeerId)).resolves.toBeFalsy();
    // Incipient Inbound Connections are always allowed
    await expect(filter.denyInboundConnection(remoteConnection)).resolves.toBeFalsy();
    await expect(filter.denyOutboundConnection(allowedPeerId, remoteConnection)).resolves.toBeFalsy();
    await expect(filter.filterMultiaddrForPeer(allowedPeerId)).resolves.toBeTruthy();
  });
});
