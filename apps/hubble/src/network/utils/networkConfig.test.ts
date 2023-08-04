import semver from "semver";
import { APP_VERSION } from "../../hubble.js";
import { applyNetworkConfig } from "./networkConfig.js";

describe("networkConfig", () => {
  const network = 2;

  test("no change", () => {
    const existingPeerIds = ["1", "2", "3"];

    const networkConfig = {
      network,
      allowedPeers: [],
      deniedPeers: [],
      minAppVersion: APP_VERSION,
    };

    const result = applyNetworkConfig(networkConfig, existingPeerIds, [], network);
    expect(result.allowedPeerIds).toEqual(["1", "2", "3"]);
    expect(result.shouldExit).toEqual(false);
  });

  test("no change with undefined", () => {
    const networkConfig = {
      network,
      allowedPeers: undefined,
      deniedPeers: [],
      minAppVersion: APP_VERSION,
    };

    const result = applyNetworkConfig(networkConfig, undefined, [], network);
    expect(result.allowedPeerIds).toEqual(undefined);
    expect(result.deniedPeerIds).toEqual([]);
    expect(result.shouldExit).toEqual(false);
  });

  test("add peerIDs", () => {
    const existingPeerIds = ["1", "2", "3"];

    const networkConfig = {
      network,
      allowedPeers: ["4", "5"],
      deniedPeers: [],
      minAppVersion: APP_VERSION,
    };

    const result = applyNetworkConfig(networkConfig, existingPeerIds, [], network);
    expect(result.allowedPeerIds).toEqual(["1", "2", "3", "4", "5"]);
    expect(result.shouldExit).toEqual(false);
  });

  test("remove peerIDs", () => {
    const existingPeerIds = ["1", "2", "3", "4", "5"];

    const networkConfig = {
      network,
      allowedPeers: [],
      deniedPeers: ["4", "5"],
      minAppVersion: APP_VERSION,
    };

    const result = applyNetworkConfig(networkConfig, existingPeerIds, [], network);
    expect(result.allowedPeerIds).toEqual(["1", "2", "3"]);
    expect(result.deniedPeerIds).toEqual(["4", "5"]);
    expect(result.shouldExit).toEqual(false);
  });

  test("duplicate peerIDs", () => {
    const existingPeerIds = ["1", "2", "3"];

    const networkConfig = {
      network,
      allowedPeers: ["1", "2", "3", "4"],
      deniedPeers: [],
      minAppVersion: APP_VERSION,
    };

    const result = applyNetworkConfig(networkConfig, existingPeerIds, [], network);
    expect(result.allowedPeerIds).toEqual(["1", "2", "3", "4"]);
    expect(result.shouldExit).toEqual(false);
  });

  test("denied peerIDs", () => {
    const networkConfig = {
      network,
      allowedPeers: undefined,
      deniedPeers: ["1", "2", "3"],
      minAppVersion: APP_VERSION,
    };

    const result = applyNetworkConfig(networkConfig, undefined, [], network);
    expect(result.allowedPeerIds).toEqual(undefined);
    expect(result.deniedPeerIds).toEqual(["1", "2", "3"]);
    expect(result.shouldExit).toEqual(false);
  });

  test("network mismatch", () => {
    const existingPeerIds = ["1", "2", "3"];

    const networkConfig = {
      network: 1,
      allowedPeers: ["4", "5"],
      deniedPeers: [],
      minAppVersion: APP_VERSION,
    };

    const result = applyNetworkConfig(networkConfig, existingPeerIds, [], network);
    expect(result.allowedPeerIds).toEqual(["1", "2", "3"]);
    expect(result.shouldExit).toEqual(false);
  });

  test("min app version", () => {
    const networkConfig = {
      network,
      allowedPeers: [],
      deniedPeers: [],
      minAppVersion: semver.inc(APP_VERSION, "patch") ?? "",
    };

    const result = applyNetworkConfig(networkConfig, [], [], network);
    expect(result.shouldExit).toEqual(true);

    const prevVer = `${semver.major(APP_VERSION)}.${semver.minor(APP_VERSION)}.${semver.patch(APP_VERSION) - 1}`;
    const networkConfig2 = {
      network,
      allowedPeers: [],
      deniedPeers: [],
      minAppVersion: prevVer,
    };

    const result2 = applyNetworkConfig(networkConfig2, [], [], network);
    expect(result2.shouldExit).toEqual(false);
  });
});
