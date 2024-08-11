import { StorageUnitDetails, StorageUnitType, StoreType } from "./protobufs";

const STORAGE_UNIT_DEFAULTS = {
  [StoreType.CASTS]: {
    [StorageUnitType.UNIT_TYPE_LEGACY]: 5000,
    [StorageUnitType.UNIT_TYPE_2024]: 2000,
  },
  [StoreType.LINKS]: {
    [StorageUnitType.UNIT_TYPE_LEGACY]: 2500,
    [StorageUnitType.UNIT_TYPE_2024]: 1000,
  },
  [StoreType.REACTIONS]: {
    [StorageUnitType.UNIT_TYPE_LEGACY]: 2500,
    [StorageUnitType.UNIT_TYPE_2024]: 1000,
  },
  [StoreType.USER_DATA]: {
    [StorageUnitType.UNIT_TYPE_LEGACY]: 50,
    [StorageUnitType.UNIT_TYPE_2024]: 50,
  },
  [StoreType.USERNAME_PROOFS]: {
    [StorageUnitType.UNIT_TYPE_LEGACY]: 5,
    [StorageUnitType.UNIT_TYPE_2024]: 5,
  },
  [StoreType.VERIFICATIONS]: {
    [StorageUnitType.UNIT_TYPE_LEGACY]: 25,
    [StorageUnitType.UNIT_TYPE_2024]: 25,
  },
  [StoreType.NONE]: {
    [StorageUnitType.UNIT_TYPE_LEGACY]: 0,
    [StorageUnitType.UNIT_TYPE_2024]: 0,
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
