import { StoreType } from "./protobufs";

const CASTS_SIZE_LIMIT_DEFAULT = 5_000;
const LINKS_SIZE_LIMIT_DEFAULT = 2_500;
const REACTIONS_SIZE_LIMIT_DEFAULT = 2_500;
const USER_DATA_SIZE_LIMIT_DEFAULT = 50;
const USERNAME_PROOFS_SIZE_LIMIT_DEFAULT = 5;
const VERIFICATIONS_SIZE_LIMIT_DEFAULT = 25;

export const getStoreLimits = (units: number) => [
  {
    storeType: StoreType.CASTS,
    limit: getDefaultStoreLimit(StoreType.CASTS) * units,
  },
  {
    storeType: StoreType.LINKS,
    limit: getDefaultStoreLimit(StoreType.LINKS) * units,
  },
  {
    storeType: StoreType.REACTIONS,
    limit: getDefaultStoreLimit(StoreType.REACTIONS) * units,
  },
  {
    storeType: StoreType.USER_DATA,
    limit: getDefaultStoreLimit(StoreType.USER_DATA) * units,
  },
  {
    storeType: StoreType.USERNAME_PROOFS,
    limit: getDefaultStoreLimit(StoreType.USERNAME_PROOFS) * units,
  },
  {
    storeType: StoreType.VERIFICATIONS,
    limit: getDefaultStoreLimit(StoreType.VERIFICATIONS) * units,
  },
];
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
