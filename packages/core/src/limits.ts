import { StorageRentOnChainEvent, StorageUnitDetails, StorageUnitType, StoreType } from "./protobufs";

export const LEGACY_STORAGE_UNIT_CUTOFF_TIMESTAMP = 1724889600; // 2024-08-29 00:00:00 UTC
export const UNIT_TYPE_2025__CUTOFF_TIMESTAMP = 1752685200; // 2025-07-16 17:00:00 UTC
const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60;

const STORAGE_UNIT_DEFAULTS = {
  [StoreType.CASTS]: {
    [StorageUnitType.UNIT_TYPE_LEGACY]: 5000,
    [StorageUnitType.UNIT_TYPE_2024]: 2000,
    [StorageUnitType.UNIT_TYPE_2025]: 100,
  },
  [StoreType.LINKS]: {
    [StorageUnitType.UNIT_TYPE_LEGACY]: 2500,
    [StorageUnitType.UNIT_TYPE_2024]: 1000,
    [StorageUnitType.UNIT_TYPE_2025]: 200,
  },
  [StoreType.REACTIONS]: {
    [StorageUnitType.UNIT_TYPE_LEGACY]: 2500,
    [StorageUnitType.UNIT_TYPE_2024]: 1000,
    [StorageUnitType.UNIT_TYPE_2025]: 200,
  },
  [StoreType.USER_DATA]: {
    [StorageUnitType.UNIT_TYPE_LEGACY]: 50,
    [StorageUnitType.UNIT_TYPE_2024]: 50,
    [StorageUnitType.UNIT_TYPE_2025]: 25,
  },
  [StoreType.USERNAME_PROOFS]: {
    [StorageUnitType.UNIT_TYPE_LEGACY]: 5,
    [StorageUnitType.UNIT_TYPE_2024]: 5,
    [StorageUnitType.UNIT_TYPE_2025]: 2,
  },
  [StoreType.VERIFICATIONS]: {
    [StorageUnitType.UNIT_TYPE_LEGACY]: 25,
    [StorageUnitType.UNIT_TYPE_2024]: 25,
    [StorageUnitType.UNIT_TYPE_2025]: 5,
  },
  [StoreType.NONE]: {
    [StorageUnitType.UNIT_TYPE_LEGACY]: 0,
    [StorageUnitType.UNIT_TYPE_2024]: 0,
    [StorageUnitType.UNIT_TYPE_2025]: 0,
  },
};

export const getStoreLimits = (unit_details: StorageUnitDetails[]) => [
  {
    storeType: StoreType.CASTS,
    limit: getStoreLimit(StoreType.CASTS, unit_details),
  },
  {
    storeType: StoreType.LINKS,
    limit: getStoreLimit(StoreType.LINKS, unit_details),
  },
  {
    storeType: StoreType.REACTIONS,
    limit: getStoreLimit(StoreType.REACTIONS, unit_details),
  },
  {
    storeType: StoreType.USER_DATA,
    limit: getStoreLimit(StoreType.USER_DATA, unit_details),
  },
  {
    storeType: StoreType.USERNAME_PROOFS,
    limit: getStoreLimit(StoreType.USERNAME_PROOFS, unit_details),
  },
  {
    storeType: StoreType.VERIFICATIONS,
    limit: getStoreLimit(StoreType.VERIFICATIONS, unit_details),
  },
];

export const getStoreLimit = (storeType: StoreType, unit_details: StorageUnitDetails[]) => {
  let limit = 0;
  for (const unit of unit_details) {
    limit += getDefaultStoreLimit(storeType, unit.unitType) * unit.unitSize;
  }
  return limit;
};

export const getDefaultStoreLimit = (storeType: StoreType, unit_type: StorageUnitType) => {
  return STORAGE_UNIT_DEFAULTS[storeType][unit_type];
};

export const getStorageUnitType = (event: StorageRentOnChainEvent) => {
  if (event.blockTimestamp < LEGACY_STORAGE_UNIT_CUTOFF_TIMESTAMP) {
    return StorageUnitType.UNIT_TYPE_LEGACY;
  } else if (event.blockTimestamp < UNIT_TYPE_2025__CUTOFF_TIMESTAMP) {
    return StorageUnitType.UNIT_TYPE_2025;
  } else {
    return StorageUnitType.UNIT_TYPE_2024;
  }
};

export const getStorageUnitExpiry = (event: StorageRentOnChainEvent) => {
  if (event.blockTimestamp < LEGACY_STORAGE_UNIT_CUTOFF_TIMESTAMP) {
    // Legacy storage units expire after 2 years
    return event.blockTimestamp + ONE_YEAR_IN_SECONDS * 3;
  } else if (event.blockTimestamp < UNIT_TYPE_2025__CUTOFF_TIMESTAMP) {
    // 2024 storage units expire after 2 years
    return event.blockTimestamp + ONE_YEAR_IN_SECONDS * 2;
  } else {
    // 2025 storage units expire after 1 year
    return event.blockTimestamp + ONE_YEAR_IN_SECONDS;
  }
};
