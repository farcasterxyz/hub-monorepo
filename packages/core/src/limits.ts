import { StoreType } from "./protobufs";

const CASTS_SIZE_LIMIT_DEFAULT = 5_000;
const LINKS_SIZE_LIMIT_DEFAULT = 2_500;
const REACTIONS_SIZE_LIMIT_DEFAULT = 2_500;
const USER_DATA_SIZE_LIMIT_DEFAULT = 50;
const USERNAME_PROOFS_SIZE_LIMIT_DEFAULT = 5;
const VERIFICATIONS_SIZE_LIMIT_DEFAULT = 25;

const CASTS_SIZE_LIMIT_RESIDUAL = 50;
const LINKS_SIZE_LIMIT_RESIDUAL = 500;
const REACTIONS_SIZE_LIMIT_RESIDUAL = 50;
const USER_DATA_SIZE_LIMIT_RESIDUAL = 10;
const USERNAME_PROOFS_SIZE_LIMIT_RESIDUAL = 1;
const VERIFICATIONS_SIZE_LIMIT_RESIDUAL = 10;

export const getStoreLimits = (units: number) => [
  {
    storeType: StoreType.CASTS,
    limit: getStoreLimit(StoreType.CASTS, units),
  },
  {
    storeType: StoreType.LINKS,
    limit: getStoreLimit(StoreType.LINKS, units),
  },
  {
    storeType: StoreType.REACTIONS,
    limit: getStoreLimit(StoreType.REACTIONS, units),
  },
  {
    storeType: StoreType.USER_DATA,
    limit: getStoreLimit(StoreType.USER_DATA, units),
  },
  {
    storeType: StoreType.USERNAME_PROOFS,
    limit: getStoreLimit(StoreType.USERNAME_PROOFS, units),
  },
  {
    storeType: StoreType.VERIFICATIONS,
    limit: getStoreLimit(StoreType.VERIFICATIONS, units),
  },
];

export const getStoreLimit = (storeType: StoreType, units: number) => {
  return units <= 0 ? getResidualStoreLimit(storeType) : getDefaultStoreLimit(storeType) * units;
};

export const getDefaultStoreLimit = (storeType: StoreType) => {
  switch (storeType) {
    case StoreType.CASTS:
      return CASTS_SIZE_LIMIT_DEFAULT;
    case StoreType.LINKS:
      return LINKS_SIZE_LIMIT_DEFAULT;
    case StoreType.REACTIONS:
      return REACTIONS_SIZE_LIMIT_DEFAULT;
    case StoreType.USER_DATA:
      return USER_DATA_SIZE_LIMIT_DEFAULT;
    case StoreType.USERNAME_PROOFS:
      return USERNAME_PROOFS_SIZE_LIMIT_DEFAULT;
    case StoreType.VERIFICATIONS:
      return VERIFICATIONS_SIZE_LIMIT_DEFAULT;
    default:
      throw new Error(`Unknown store type: ${storeType}`);
  }
};

export const getResidualStoreLimit = (storeType: StoreType) => {
  switch (storeType) {
    case StoreType.CASTS:
      return CASTS_SIZE_LIMIT_RESIDUAL;
    case StoreType.LINKS:
      return LINKS_SIZE_LIMIT_RESIDUAL;
    case StoreType.REACTIONS:
      return REACTIONS_SIZE_LIMIT_RESIDUAL;
    case StoreType.USER_DATA:
      return USER_DATA_SIZE_LIMIT_RESIDUAL;
    case StoreType.USERNAME_PROOFS:
      return USERNAME_PROOFS_SIZE_LIMIT_RESIDUAL;
    case StoreType.VERIFICATIONS:
      return VERIFICATIONS_SIZE_LIMIT_RESIDUAL;
    default:
      throw new Error(`Unknown store type: ${storeType}`);
  }
};
