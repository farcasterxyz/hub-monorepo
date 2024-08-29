import semver from "semver";
import { APP_VERSION } from "../../hubble.js";
import { applyNetworkConfig } from "./networkConfig.js";

describe("networkConfig", () => {
  const network = 2;
  const defaultNetworkConfig = {
    network: 2,
    allowedPeers: [],
    deniedPeers: [],
    minAppVersion: APP_VERSION,
    storageRegistryAddress: undefined,
    keyRegistryAddress: undefined,
    idRegistryAddress: undefined,
    allowlistedImmunePeers: undefined,
    strictContactInfoValidation: undefined,
    strictNoSign: undefined,
    keyRegistryV2Address: undefined,
    idRegistryV2Address: undefined,
    solanaVerificationsEnabled: undefined,
    bundleGossipPercent: undefined,
    useStreaming: undefined,
  };

  test("no change", () => {
    const existingPeerIds = ["1", "2", "3"];

    const networkConfig = {
      ...defaultNetworkConfig,
    };

    const result = applyNetworkConfig(
      networkConfig,
      existingPeerIds,
      [],
      network,
      [],
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(result.allowedPeerIds).toEqual(["1", "2", "3"]);
    expect(result.shouldExit).toEqual(false);
  });

  test("no change with undefined", () => {
    const networkConfig = {
      ...defaultNetworkConfig,
      allowedPeers: undefined,
      deniedPeers: [],
    };

    const result = applyNetworkConfig(
      networkConfig,
      undefined,
      [],
      network,
      [],
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(result.allowedPeerIds).toEqual(undefined);
    expect(result.deniedPeerIds).toEqual([]);
    expect(result.shouldExit).toEqual(false);
  });

  test("change from undefined", () => {
    const existingPeerIds = undefined;

    const networkConfig = {
      ...defaultNetworkConfig,
      allowedPeers: ["1", "2", "3"],
      deniedPeers: [],
      solanaVerificationsEnabled: true,
    };

    const result = applyNetworkConfig(
      networkConfig,
      existingPeerIds,
      [],
      network,
      [],
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(result.allowedPeerIds).toEqual(["1", "2", "3"]);
    expect(result.deniedPeerIds).toEqual([]);
    expect(result.shouldExit).toEqual(false);
    expect(result.solanaVerificationsEnabled).toEqual(true);
  });

  test("add peerIDs", () => {
    const existingPeerIds = ["1", "2", "3"];

    const networkConfig = {
      ...defaultNetworkConfig,
      allowedPeers: ["4", "5"],
      deniedPeers: [],
    };

    const result = applyNetworkConfig(
      networkConfig,
      existingPeerIds,
      [],
      network,
      [],
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(result.allowedPeerIds).toEqual(["1", "2", "3", "4", "5"]);
    expect(result.shouldExit).toEqual(false);
  });

  test("remove peerIDs", () => {
    const existingPeerIds = ["1", "2", "3", "4", "5"];

    const networkConfig = {
      ...defaultNetworkConfig,
      allowedPeers: [],
      deniedPeers: ["4", "5"],
      minAppVersion: APP_VERSION,
    };

    const result = applyNetworkConfig(
      networkConfig,
      existingPeerIds,
      [],
      network,
      [],
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(result.allowedPeerIds).toEqual(["1", "2", "3"]);
    expect(result.deniedPeerIds).toEqual(["4", "5"]);
    expect(result.shouldExit).toEqual(false);
  });

  test("duplicate peerIDs", () => {
    const existingPeerIds = ["1", "2", "3"];

    const networkConfig = {
      ...defaultNetworkConfig,
      allowedPeers: ["1", "2", "3", "4"],
      deniedPeers: [],
    };

    const result = applyNetworkConfig(
      networkConfig,
      existingPeerIds,
      [],
      network,
      [],
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(result.allowedPeerIds).toEqual(["1", "2", "3", "4"]);
    expect(result.shouldExit).toEqual(false);
  });

  test("denied peerIDs", () => {
    const networkConfig = {
      ...defaultNetworkConfig,
      allowedPeers: undefined,
      deniedPeers: ["1", "2", "3"],
    };

    const result = applyNetworkConfig(
      networkConfig,
      undefined,
      [],
      network,
      [],
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(result.allowedPeerIds).toEqual(undefined);
    expect(result.deniedPeerIds).toEqual(["1", "2", "3"]);
    expect(result.shouldExit).toEqual(false);
  });

  test("network mismatch", () => {
    const existingPeerIds = ["1", "2", "3"];

    const networkConfig = {
      ...defaultNetworkConfig,
      network: 1,
      allowedPeers: ["4", "5"],
      deniedPeers: [],
    };

    const result = applyNetworkConfig(
      networkConfig,
      existingPeerIds,
      [],
      network,
      [],
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(result.allowedPeerIds).toEqual(["1", "2", "3"]);
    expect(result.shouldExit).toEqual(false);
  });

  test("min app version", () => {
    const networkConfig = {
      ...defaultNetworkConfig,
      allowedPeers: [],
      deniedPeers: [],
      minAppVersion: semver.inc(APP_VERSION, "patch") ?? "",
    };

    const result = applyNetworkConfig(networkConfig, [], [], network, [], undefined, undefined, undefined, undefined);
    expect(result.shouldExit).toEqual(true);

    const prevVer = `${semver.major(APP_VERSION)}.${semver.minor(APP_VERSION)}.${semver.patch(APP_VERSION) - 1}`;
    const networkConfig2 = {
      ...defaultNetworkConfig,
      allowedPeers: [],
      deniedPeers: [],
      minAppVersion: prevVer,
    };

    const result2 = applyNetworkConfig(networkConfig2, [], [], network, [], undefined, undefined, undefined, undefined);
    expect(result2.shouldExit).toEqual(false);
  });

  test("strict contact info enabled at network overrides local", () => {
    const existingPeerIds = ["1", "2", "3"];

    const networkConfig = {
      ...defaultNetworkConfig,
      allowedPeers: ["4", "5"],
      deniedPeers: [],
      strictContactInfoValidation: true,
    };

    const result1 = applyNetworkConfig(
      networkConfig,
      existingPeerIds,
      [],
      network,
      [],
      undefined,
      undefined,
      undefined,
      undefined,
    );
    const result2 = applyNetworkConfig(
      networkConfig,
      existingPeerIds,
      [],
      network,
      [],
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(result1.strictContactInfoValidation).toEqual(true);
    expect(result2.strictContactInfoValidation).toEqual(true);
    expect(result1.shouldExit).toEqual(false);
    expect(result2.shouldExit).toEqual(false);
  });

  test("strict no sign enabled at network overrides local", () => {
    const existingPeerIds = ["1", "2", "3"];

    const networkConfig = {
      ...defaultNetworkConfig,
      allowedPeers: ["4", "5"],
      deniedPeers: [],
      strictNoSign: true,
    };

    const result1 = applyNetworkConfig(
      networkConfig,
      existingPeerIds,
      [],
      network,
      [],
      undefined,
      undefined,
      undefined,
      undefined,
    );
    const result2 = applyNetworkConfig(
      networkConfig,
      existingPeerIds,
      [],
      network,
      [],
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(result1.strictNoSign).toEqual(true);
    expect(result2.strictNoSign).toEqual(true);
    expect(result1.shouldExit).toEqual(false);
    expect(result2.shouldExit).toEqual(false);
  });
});
