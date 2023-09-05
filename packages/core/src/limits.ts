import { StoreType } from "./protobufs";

export const CASTS_SIZE_LIMIT_DEFAULT = 5_000;
export const LINKS_SIZE_LIMIT_DEFAULT = 1_250;
export const REACTIONS_SIZE_LIMIT_DEFAULT = 2_500;
export const USER_DATA_SIZE_LIMIT_DEFAULT = 50;
export const USERNAME_PROOFS_SIZE_LIMIT_DEFAULT = 5;
export const VERIFICATIONS_SIZE_LIMIT_DEFAULT = 25;

export const getStoreLimits = (units: number) => [
  {
    storeType: StoreType.CASTS,
    limit: CASTS_SIZE_LIMIT_DEFAULT * units,
  },
  {
    storeType: StoreType.LINKS,
    limit: LINKS_SIZE_LIMIT_DEFAULT * units,
  },
  {
    storeType: StoreType.REACTIONS,
    limit: REACTIONS_SIZE_LIMIT_DEFAULT * units,
  },
  {
    storeType: StoreType.USER_DATA,
    limit: USER_DATA_SIZE_LIMIT_DEFAULT * units,
  },
  {
    storeType: StoreType.USERNAME_PROOFS,
    limit: USERNAME_PROOFS_SIZE_LIMIT_DEFAULT * units,
  },
  {
    storeType: StoreType.VERIFICATIONS,
    limit: VERIFICATIONS_SIZE_LIMIT_DEFAULT * units,
  },
];
