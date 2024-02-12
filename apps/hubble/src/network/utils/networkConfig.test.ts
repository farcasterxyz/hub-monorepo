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
      storageRegistryAddress: undefined,
      keyRegistryAddress: undefined,
      idRegistryAddress: undefined,
      allowlistedImmunePeers: undefined,
      strictContactInfoValidation: undefined,
      strictNoSign: undefined,
      keyRegistryV2Address: undefined,
      idRegistryV2Address: undefined,
      solanaVerificationsEnabled: undefined,
    };

    const result = applyNetworkConfig(networkConfig, existingPeerIds, [], network, [], undefined, undefined, undefined);
    expect(result.allowedPeerIds).toEqual(["1", "2", "3"]);
    expect(result.shouldExit).toEqual(false);
  });

  test("no change with undefined", () => {
    const networkConfig = {
      network,
      allowedPeers: undefined,
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
    };

    const result = applyNetworkConfig(networkConfig, undefined, [], network, [], undefined, undefined, undefined);
    expect(result.allowedPeerIds).toEqual(undefined);
    expect(result.deniedPeerIds).toEqual([]);
    expect(result.shouldExit).toEqual(false);
  });

  test("change from undefined", () => {
    const existingPeerIds = undefined;

    const networkConfig = {
      network,
      allowedPeers: ["1", "2", "3"],
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
      solanaVerificationsEnabled: true,
    };

    const result = applyNetworkConfig(networkConfig, existingPeerIds, [], network, [], undefined, undefined, undefined);
    expect(result.allowedPeerIds).toEqual(["1", "2", "3"]);
    expect(result.deniedPeerIds).toEqual([]);
    expect(result.shouldExit).toEqual(false);
    expect(result.solanaVerificationsEnabled).toEqual(true);
  });

  test("add peerIDs", () => {
    const existingPeerIds = ["1", "2", "3"];

    const networkConfig = {
      network,
      allowedPeers: ["4", "5"],
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
    };

    const result = applyNetworkConfig(networkConfig, existingPeerIds, [], network, [], undefined, undefined, undefined);
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
      storageRegistryAddress: undefined,
      keyRegistryAddress: undefined,
      idRegistryAddress: undefined,
      allowlistedImmunePeers: undefined,
      strictContactInfoValidation: undefined,
      strictNoSign: undefined,
      keyRegistryV2Address: undefined,
      idRegistryV2Address: undefined,
      solanaVerificationsEnabled: undefined,
    };

    const result = applyNetworkConfig(networkConfig, existingPeerIds, [], network, [], undefined, undefined, undefined);
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
      storageRegistryAddress: undefined,
      keyRegistryAddress: undefined,
      idRegistryAddress: undefined,
      allowlistedImmunePeers: undefined,
      strictContactInfoValidation: undefined,
      strictNoSign: undefined,
      keyRegistryV2Address: undefined,
      idRegistryV2Address: undefined,
      solanaVerificationsEnabled: undefined,
    };

    const result = applyNetworkConfig(networkConfig, existingPeerIds, [], network, [], undefined, undefined, undefined);
    expect(result.allowedPeerIds).toEqual(["1", "2", "3", "4"]);
    expect(result.shouldExit).toEqual(false);
  });

  test("denied peerIDs", () => {
    const networkConfig = {
      network,
      allowedPeers: undefined,
      deniedPeers: ["1", "2", "3"],
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
    };

    const result = applyNetworkConfig(networkConfig, undefined, [], network, [], undefined, undefined, undefined);
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
      storageRegistryAddress: undefined,
      keyRegistryAddress: undefined,
      idRegistryAddress: undefined,
      allowlistedImmunePeers: undefined,
      strictContactInfoValidation: undefined,
      strictNoSign: undefined,
      keyRegistryV2Address: undefined,
      idRegistryV2Address: undefined,
      solanaVerificationsEnabled: undefined,
    };

    const result = applyNetworkConfig(networkConfig, existingPeerIds, [], network, [], undefined, undefined, undefined);
    expect(result.allowedPeerIds).toEqual(["1", "2", "3"]);
    expect(result.shouldExit).toEqual(false);
  });

  test("min app version", () => {
    const networkConfig = {
      network,
      allowedPeers: [],
      deniedPeers: [],
      minAppVersion: semver.inc(APP_VERSION, "patch") ?? "",
      storageRegistryAddress: undefined,
      keyRegistryAddress: undefined,
      idRegistryAddress: undefined,
      allowlistedImmunePeers: undefined,
      strictContactInfoValidation: undefined,
      strictNoSign: undefined,
      keyRegistryV2Address: undefined,
      idRegistryV2Address: undefined,
      solanaVerificationsEnabled: undefined,
    };

    const result = applyNetworkConfig(networkConfig, [], [], network, [], undefined, undefined, undefined);
    expect(result.shouldExit).toEqual(true);

    const prevVer = `${semver.major(APP_VERSION)}.${semver.minor(APP_VERSION)}.${semver.patch(APP_VERSION) - 1}`;
    const networkConfig2 = {
      network,
      allowedPeers: [],
      deniedPeers: [],
      minAppVersion: prevVer,
      storageRegistryAddress: undefined,
      keyRegistryAddress: undefined,
      idRegistryAddress: undefined,
      allowlistedImmunePeers: undefined,
      strictContactInfoValidation: undefined,
      strictNoSign: undefined,
      keyRegistryV2Address: undefined,
      idRegistryV2Address: undefined,
      solanaVerificationsEnabled: undefined,
    };

    const result2 = applyNetworkConfig(networkConfig2, [], [], network, [], undefined, undefined, undefined);
    expect(result2.shouldExit).toEqual(false);
  });

  test("strict contact info enabled at network overrides local", () => {
    const existingPeerIds = ["1", "2", "3"];

    const networkConfig = {
      network: 2,
      allowedPeers: ["4", "5"],
      deniedPeers: [],
      minAppVersion: APP_VERSION,
      storageRegistryAddress: undefined,
      keyRegistryAddress: undefined,
      idRegistryAddress: undefined,
      allowlistedImmunePeers: undefined,
      strictContactInfoValidation: true,
      strictNoSign: undefined,
      keyRegistryV2Address: undefined,
      idRegistryV2Address: undefined,
      solanaVerificationsEnabled: undefined,
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
    );
    const result2 = applyNetworkConfig(networkConfig, existingPeerIds, [], network, [], false, undefined, undefined);
    expect(result1.strictContactInfoValidation).toEqual(true);
    expect(result2.strictContactInfoValidation).toEqual(true);
    expect(result1.shouldExit).toEqual(false);
    expect(result2.shouldExit).toEqual(false);
  });

  test("strict no sign enabled at network overrides local", () => {
    const existingPeerIds = ["1", "2", "3"];

    const networkConfig = {
      network: 2,
      allowedPeers: ["4", "5"],
      deniedPeers: [],
      minAppVersion: APP_VERSION,
      storageRegistryAddress: undefined,
      keyRegistryAddress: undefined,
      idRegistryAddress: undefined,
      allowlistedImmunePeers: undefined,
      strictContactInfoValidation: undefined,
      strictNoSign: true,
      keyRegistryV2Address: undefined,
      idRegistryV2Address: undefined,
      solanaVerificationsEnabled: undefined,
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
    );
    const result2 = applyNetworkConfig(networkConfig, existingPeerIds, [], network, [], undefined, false, undefined);
    expect(result1.strictNoSign).toEqual(true);
    expect(result2.strictNoSign).toEqual(true);
    expect(result1.shouldExit).toEqual(false);
    expect(result2.shouldExit).toEqual(false);
  });
});
