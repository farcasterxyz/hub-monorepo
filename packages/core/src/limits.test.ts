import {
  getDefaultStoreLimit,
  getStorageExpiryTimestampFromBlockTimestamp,
  getStoreLimit,
  getStoreLimits,
  LEGACY_STORAGE_UNIT_CUTOFF_TIMESTAMP,
  UNIT_TYPE_2024__CUTOFF_TIMESTAMP,
} from "./limits";
import { StorageUnitType, StoreType } from "./protobufs";

describe("getDefaultStoreLimit", () => {
  test("returns correct defaults", () => {
    expect(getDefaultStoreLimit(StoreType.CASTS, StorageUnitType.UNIT_TYPE_LEGACY)).toEqual(5000);
    expect(getDefaultStoreLimit(StoreType.CASTS, StorageUnitType.UNIT_TYPE_2024)).toEqual(2000);

    expect(getDefaultStoreLimit(StoreType.LINKS, StorageUnitType.UNIT_TYPE_LEGACY)).toEqual(2500);
    expect(getDefaultStoreLimit(StoreType.LINKS, StorageUnitType.UNIT_TYPE_2024)).toEqual(1000);

    expect(getDefaultStoreLimit(StoreType.REACTIONS, StorageUnitType.UNIT_TYPE_LEGACY)).toEqual(2500);
    expect(getDefaultStoreLimit(StoreType.REACTIONS, StorageUnitType.UNIT_TYPE_2024)).toEqual(1000);

    expect(getDefaultStoreLimit(StoreType.USER_DATA, StorageUnitType.UNIT_TYPE_LEGACY)).toEqual(50);
    expect(getDefaultStoreLimit(StoreType.USER_DATA, StorageUnitType.UNIT_TYPE_2024)).toEqual(50);

    expect(getDefaultStoreLimit(StoreType.USERNAME_PROOFS, StorageUnitType.UNIT_TYPE_LEGACY)).toEqual(5);
    expect(getDefaultStoreLimit(StoreType.USERNAME_PROOFS, StorageUnitType.UNIT_TYPE_2024)).toEqual(5);

    expect(getDefaultStoreLimit(StoreType.VERIFICATIONS, StorageUnitType.UNIT_TYPE_LEGACY)).toEqual(25);
    expect(getDefaultStoreLimit(StoreType.VERIFICATIONS, StorageUnitType.UNIT_TYPE_2024)).toEqual(25);
  });
});

describe("getStorageExpiryTimestampFromBlockTimestamp", () => {
  test("calculates correct expiry timestamp for legacy, 2024, and 2025 storage units", () => {
    const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60;
    const legacyTimestamp = LEGACY_STORAGE_UNIT_CUTOFF_TIMESTAMP - 1;
    const unitType2024Timestamp = UNIT_TYPE_2024__CUTOFF_TIMESTAMP - 1;
    const unitType2025Timestamp = UNIT_TYPE_2024__CUTOFF_TIMESTAMP + 1;

    expect(getStorageExpiryTimestampFromBlockTimestamp(legacyTimestamp)).toEqual(
      legacyTimestamp + ONE_YEAR_IN_SECONDS * 3,
    );
    expect(getStorageExpiryTimestampFromBlockTimestamp(unitType2024Timestamp)).toEqual(
      unitType2024Timestamp + ONE_YEAR_IN_SECONDS * 2,
    );
    expect(getStorageExpiryTimestampFromBlockTimestamp(unitType2025Timestamp)).toEqual(
      unitType2025Timestamp + ONE_YEAR_IN_SECONDS,
    );
  });
});

describe("getStoreLimit", () => {
  test("returns correct limits for multiple unit types", () => {
    // single unit type
    expect(getStoreLimit(StoreType.CASTS, [{ unitType: StorageUnitType.UNIT_TYPE_LEGACY, unitSize: 1 }])).toEqual(5000);

    // multiple unit types
    expect(
      getStoreLimit(StoreType.CASTS, [
        { unitType: StorageUnitType.UNIT_TYPE_LEGACY, unitSize: 1 },
        { unitType: StorageUnitType.UNIT_TYPE_2024, unitSize: 2 },
      ]),
    ).toEqual(9000); // 5000 + (2000 * 2)

    // multiple units of the same type
    expect(getStoreLimit(StoreType.LINKS, [{ unitType: StorageUnitType.UNIT_TYPE_2024, unitSize: 3 }])).toEqual(3000); // 1000 * 3

    // mix of unit types and sizes
    expect(
      getStoreLimit(StoreType.REACTIONS, [
        { unitType: StorageUnitType.UNIT_TYPE_LEGACY, unitSize: 2 },
        { unitType: StorageUnitType.UNIT_TYPE_2024, unitSize: 1 },
      ]),
    ).toEqual(6000); // (2500 * 2) + 1000

    // NONE store type
    expect(
      getStoreLimit(StoreType.NONE, [
        { unitType: StorageUnitType.UNIT_TYPE_LEGACY, unitSize: 10 },
        { unitType: StorageUnitType.UNIT_TYPE_2024, unitSize: 10 },
      ]),
    ).toEqual(0);
  });
});

describe("getStoreLimits", () => {
  test("returns correct limits for all store types", () => {
    const unitDetails = [
      { unitType: StorageUnitType.UNIT_TYPE_LEGACY, unitSize: 1 },
      { unitType: StorageUnitType.UNIT_TYPE_2024, unitSize: 2 },
    ];

    const limits = getStoreLimits(unitDetails);

    expect(limits).toHaveLength(6); // Expecting 6 store types (excluding NONE)

    expect(limits).toContainEqual({ storeType: StoreType.CASTS, limit: 9000 }); // 5000 + (2000 * 2)
    expect(limits).toContainEqual({ storeType: StoreType.LINKS, limit: 4500 }); // 2500 + (1000 * 2)
    expect(limits).toContainEqual({ storeType: StoreType.REACTIONS, limit: 4500 }); // 2500 + (1000 * 2)
    expect(limits).toContainEqual({ storeType: StoreType.USER_DATA, limit: 150 }); // 50 + (50 * 2)
    expect(limits).toContainEqual({ storeType: StoreType.USERNAME_PROOFS, limit: 15 }); // 5 + (5 * 2)
    expect(limits).toContainEqual({ storeType: StoreType.VERIFICATIONS, limit: 75 }); // 25 + (25 * 2)
  });

  test("returns zero limits for empty unit details", () => {
    const limits = getStoreLimits([]);

    expect(limits).toHaveLength(6);

    limits.forEach((limit) => {
      expect(limit.limit).toBe(0);
    });
  });

  test("handles single unit type correctly", () => {
    const unitDetails = [{ unitType: StorageUnitType.UNIT_TYPE_2024, unitSize: 3 }];

    const limits = getStoreLimits(unitDetails);

    expect(limits).toContainEqual({ storeType: StoreType.CASTS, limit: 6000 }); // 2000 * 3
    expect(limits).toContainEqual({ storeType: StoreType.LINKS, limit: 3000 }); // 1000 * 3
    expect(limits).toContainEqual({ storeType: StoreType.REACTIONS, limit: 3000 }); // 1000 * 3
    expect(limits).toContainEqual({ storeType: StoreType.USER_DATA, limit: 150 }); // 50 * 3
    expect(limits).toContainEqual({ storeType: StoreType.USERNAME_PROOFS, limit: 15 }); // 5 * 3
    expect(limits).toContainEqual({ storeType: StoreType.VERIFICATIONS, limit: 75 }); // 25 * 3
  });
});
