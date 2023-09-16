import { multiaddr } from "@multiformats/multiaddr/";
import { createEd25519PeerId, createFromProtobuf, exportToProtobuf } from "@libp2p/peer-id-factory";

describe("worker thread message objects", () => {
  test("PeerID can be serialized and deserialized", async () => {
    const peerId = await createEd25519PeerId();

    const serialized = exportToProtobuf(peerId);
    const deserialized = await createFromProtobuf(serialized);

    expect(deserialized).toEqual(peerId);
  });

  test("Multiaddr can be serialized and deserialized", async () => {
    const MultiaddrLocalHost = "/ip4/127.0.0.1";
    const multiaddrLocalHost = multiaddr(MultiaddrLocalHost);

    const serialized = multiaddrLocalHost.bytes;
    const deserialized = multiaddr(serialized);

    expect(deserialized).toEqual(multiaddrLocalHost);
  });

  test("Addressbook can be serialized and deserialized", async () => {});
});
