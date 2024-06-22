import { StoreType } from "./protobufs";

// Protocol version 2024.7.24 includes updated storage limits for casts, reactions, and follows.
// Date is used here to update the limit at a future time so hubs can stay in sync between versions
const CASTS_LINKS_REACTIONS_LIMIT_DATE = new Date("2024-08-21").getTime();

const VERSIONED_LIMTS: { [key in StoreType]?: number } = {
  [StoreType.CASTS]: 4000,
  [StoreType.REACTIONS]: 2000,
  [StoreType.LINKS]: 2000,
};

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
      return Date.now() > CASTS_LINKS_REACTIONS_LIMIT_DATE
        ? VERSIONED_LIMTS[StoreType.CASTS] ?? Math.floor(0.8 * CASTS_SIZE_LIMIT_DEFAULT)
        : CASTS_SIZE_LIMIT_DEFAULT;
    case StoreType.LINKS:
      return Date.now() > CASTS_LINKS_REACTIONS_LIMIT_DATE
        ? VERSIONED_LIMTS[StoreType.LINKS] ?? Math.floor(0.8 * LINKS_SIZE_LIMIT_DEFAULT)
        : LINKS_SIZE_LIMIT_DEFAULT;
    case StoreType.REACTIONS:
      return Date.now() > CASTS_LINKS_REACTIONS_LIMIT_DATE
        ? VERSIONED_LIMTS[StoreType.REACTIONS] ?? Math.floor(0.8 * REACTIONS_SIZE_LIMIT_DEFAULT)
        : REACTIONS_SIZE_LIMIT_DEFAULT;
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
