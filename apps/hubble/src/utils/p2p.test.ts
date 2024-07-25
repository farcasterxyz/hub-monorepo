import { createEd25519PeerId } from "@libp2p/peer-id-factory";
import { multiaddr, NodeAddress } from "@multiformats/multiaddr";
import {
  addressInfoFromNodeAddress,
  addressInfoFromParts,
  checkNodeAddrs,
  ipMultiAddrStrFromAddressInfo,
  p2pMultiAddrStr,
  parseAddress,
} from "./p2p.js";

describe("p2p utils tests", () => {
  test("parse a valid multiaddr", async () => {
    const result = parseAddress("/ip4/127.0.0.1/tcp/8080");
    expect(result.isOk()).toBeTruthy();
  });

  test("fail to parse an invalid multiaddr", async () => {
    const error = parseAddress("/ip6/127.0.0.1/8080")._unsafeUnwrapErr();
    expect(error.errCode).toEqual("bad_request.parse_failure");
    expect(error.message).toEqual("'/ip6/127.0.0.1/8080': invalid multiaddr");
  });

  test("fail to parse an empty string", async () => {
    const error = parseAddress("")._unsafeUnwrapErr();
    expect(error.errCode).toEqual("bad_request");
    expect(error.message).toEqual("multiaddr must not be empty");
  });

  test("check valid node addresses", async () => {
    const result = checkNodeAddrs("/ip4/127.0.0.1/", "/ip4/127.0.0.1/tcp/8080");
    expect(result.isOk()).toBeTruthy();
  });

  test("check invalid node addresses", async () => {
    // invalid IP multiaddr but valid combined multiaddr
    let error = checkNodeAddrs(
      "/onion3/2600:1700:6cf0:990:2052:a166:fb35:830a",
      "/ip4/127.0.0.1/tcp/8080",
    )._unsafeUnwrapErr();
    expect(error.errCode).toEqual("bad_request.parse_failure");
    expect(error.message).toEqual("'/onion3/2600:1700:6cf0:990:2052:a166:fb35:830a': invalid multiaddr");

    // valid IP multiaddr but invalid combined multiaddr
    error = checkNodeAddrs(
      "/ip4/127.0.0.1/",
      "/onion3/2600:1700:6cf0:990:2052:a166:fb35:830a/tcp/8080",
    )._unsafeUnwrapErr();
    expect(error.errCode).toEqual("bad_request.parse_failure");
    expect(error.message).toEqual("'/onion3/2600:1700:6cf0:990:2052:a166:fb35:830a/tcp/8080': invalid multiaddr");

    // both invalid IP and combined multiaddrs
    error = checkNodeAddrs(
      "/onion3/2600:1700:6cf0:990:2052:a166:fb35:830a",
      "/onion3/2600:1700:6cf0:990:2052:a166:fb35:830a/tcp/8080",
    )._unsafeUnwrapErr();
    expect(error.errCode).toEqual("bad_request.parse_failure");
    expect(error.message).toEqual("'/onion3/2600:1700:6cf0:990:2052:a166:fb35:830a': invalid multiaddr");
  });

  test("p2p multiaddr formatted string", async () => {
    const peerId = await createEd25519PeerId();
    const ip4Addr = { address: "127.0.0.1", family: "IPv4", port: 1234 };
    const ip6Addr = { address: "2600:1700:6cf0:990:2052:a166:fb35:830a", family: "IPv6", port: 1234 };

    let multiAddrStr = p2pMultiAddrStr(ip4Addr, peerId.toString())._unsafeUnwrap();
    const multiAddr = multiaddr(multiAddrStr);
    expect(multiAddrStr).toBeDefined();
    expect(multiAddr).toBeDefined();

    multiAddrStr = p2pMultiAddrStr(ip6Addr, peerId.toString())._unsafeUnwrap();
    expect(multiAddrStr).toBeDefined();
    expect(multiaddr(multiAddrStr)).toBeDefined();
  });

  test("addressInfo from valid IPv4 inputs", async () => {
    const result = addressInfoFromParts("127.0.0.1", 0);
    expect(result.isOk()).toBeTruthy();
    const info = result._unsafeUnwrap();
    expect(info.address).toEqual("127.0.0.1");
    expect(info.family).toEqual("IPv4");
  });

  test("addressInfo from valid IPv6 inputs", async () => {
    const result = addressInfoFromParts("2600:1700:6cf0:990:2052:a166:fb35:830a", 12345);
    expect(result.isOk()).toBeTruthy();
    const info = result._unsafeUnwrap();
    expect(info.address).toEqual("2600:1700:6cf0:990:2052:a166:fb35:830a");
    expect(info.family).toEqual("IPv6");
  });

  test("addressInfo fails on invalid inputs", async () => {
    const result = addressInfoFromParts("clearlyNotAnIP", 12345);
    expect(result.isErr()).toBeTruthy();
  });

  test("valid multiaddr from addressInfo", async () => {
    const addressInfo = addressInfoFromParts("127.0.0.1", 0);
    expect(addressInfo.isOk()).toBeTruthy();

    const multiAddrStr = ipMultiAddrStrFromAddressInfo(addressInfo._unsafeUnwrap())._unsafeUnwrap();
    expect(multiAddrStr).toEqual("/ip4/127.0.0.1");

    const multiAddr = multiaddr(multiAddrStr);
    expect(multiAddr).toBeDefined();
  });

  test("throws when making multiaddr from invalid addressInfo", () => {
    const addressInfo = addressInfoFromParts("127.0.0.1", 0);
    expect(addressInfo.isOk()).toBeTruthy();

    addressInfo._unsafeUnwrap().family = "ip12";
    const error = ipMultiAddrStrFromAddressInfo(addressInfo._unsafeUnwrap())._unsafeUnwrapErr();
    expect(error.errCode).toEqual("bad_request");
    expect(error.message).toMatch("invalid AddressInfo family");
  });

  test("converts a valid nodeAddress to an addressInfo", () => {
    const nodeAddr: NodeAddress = {
      family: 4,
      address: "127.0.0.1",
      port: 0,
    };

    const addressInfo = addressInfoFromNodeAddress(nodeAddr)._unsafeUnwrap();
    expect(addressInfo.address).toEqual(nodeAddr.address);
    expect(addressInfo.port).toEqual(nodeAddr.port);
    expect(addressInfo.family).toEqual("IPv4");
  });

  test("throws when converting an invalid nodeAddress to an addressInfo", () => {
    const nodeAddr: NodeAddress = {
      family: 21 as 4,
      address: "127.0.0.1",
      port: 0,
    };

    const error = addressInfoFromNodeAddress(nodeAddr)._unsafeUnwrapErr();
    expect(error.errCode).toEqual("bad_request");
    expect(error.message).toMatch("invalid nodeAddress family");
  });
});
