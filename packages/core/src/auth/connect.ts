import { SiweMessage, SiweResponse, SiweError } from "siwe";
import { Result, ResultAsync, err, ok } from "neverthrow";
import { HubAsyncResult, HubError, HubResult } from "../errors";
import { Hex } from "viem";
import { Provider } from "ethers";

type UserDataTypeParam = "pfp" | "display" | "bio" | "url" | "username";
type ConnectResourceParams = {
  fid: number;
  userDataParams?: UserDataTypeParam[];
};
type ConnectParams = Partial<SiweMessage> & ConnectResourceParams;
type ConnectOpts = {
  fidVerifier: (custody: Hex) => Promise<BigInt>;
  provider?: Provider;
};

type ConnectResponse = SiweResponse & ConnectResourceParams;

const FID_URI_REGEX = /^farcaster:\/\/fid\/([1-9]\d*)\/?$/;
const USER_DATA_URI_REGEX =
  /^farcaster:\/\/fid\/([1-9]\d*)\/userdata\?((pfp|display|bio|url|username)(?:&(pfp|display|bio|url|username))*)$/;
const STATEMENT = "Farcaster Connect";
const CHAIN_ID = 10;

const voidFidVerifier = (_custody: Hex) => Promise.reject(new Error("Not implemented: Must provide an fid verifier"));

/**
 * Build a Farcaster Connect message from the provided parameters. Message
 * parameters are a superset of SIWE message parameters, plus fid and requested
 * userData fields.
 */
export const build = (params: ConnectParams): HubResult<SiweMessage> => {
  const { fid, userDataParams, ...siweParams } = params;
  const resources = siweParams.resources ?? [];
  siweParams.statement = STATEMENT;
  siweParams.chainId = CHAIN_ID;
  siweParams.resources = [...buildResources(fid, userDataParams), ...resources];
  return validate(siweParams);
};

/**
 * Verify signature of a Farcaster Connect message. Returns an error if the
 * message is invalid or the signature is invalid.
 */
export const verify = async (
  message: string | Partial<SiweMessage>,
  signature: string,
  options: ConnectOpts = {
    fidVerifier: voidFidVerifier,
  },
): HubAsyncResult<ConnectResponse> => {
  const { fidVerifier, provider } = options;
  const valid = validate(message);
  if (valid.isErr()) return err(valid.error);

  const siwe = (await verifySiweMessage(valid.value, signature, provider)).andThen(mergeResources);
  if (siwe.isErr()) return err(siwe.error);
  if (!siwe.value.success) {
    const errMessage = siwe.value.error?.type ?? "Unknown error";
    return err(new HubError("unauthorized", errMessage));
  }

  const fid = await verifyFidOwner(siwe.value, fidVerifier);
  if (fid.isErr()) return err(fid.error);
  if (!fid.value.success) {
    const errMessage = siwe.value.error?.type ?? "Unknown error";
    return err(new HubError("unauthorized", errMessage));
  }
  return ok(fid.value);
};

/**
 * Validate a Farcaster Connect message. Checks that the message is a valid
 * Farcaster Connect and SIWE message, but does not verify the signature.
 * Use verify for message authentication.
 */
export const validate = (params: string | Partial<SiweMessage>): HubResult<SiweMessage> => {
  return Result.fromThrowable(
    // SiweMessage validates itself when constructed
    () => new SiweMessage(params),
    // If construction time validation fails, propagate the error
    (e) => new HubError("bad_request.validation_failure", e as Error),
  )()
    .andThen(validateStatement)
    .andThen(validateChainId)
    .andThen(validateResources);
};

/**
 * Parse fid and UserData resources from a Farcaster Connect message.
 */
export const parseResources = (message: SiweMessage): HubResult<ConnectResourceParams> => {
  const fid = parseFid(message);
  if (fid.isErr()) return err(fid.error);

  const userDataParams = parseUserData(message);
  if (userDataParams.isErr()) return err(userDataParams.error);

  if (userDataParams.value) {
    if (userDataParams.value.fid === fid.value) {
      return ok(userDataParams.value);
    }
  }
  return ok({ fid: fid.value });
};

/**
 * Parse associated fid resource from a Farcaster Connect message.
 */
export const parseFid = (message: SiweMessage): HubResult<number> => {
  const resource = (message.resources ?? []).find((resource) => {
    return FID_URI_REGEX.test(resource);
  });
  if (!resource) {
    return err(new HubError("bad_request.validation_failure", "No fid resource provided"));
  }
  const fid = parseInt(resource.match(FID_URI_REGEX)?.[1] ?? "");
  if (isNaN(fid)) {
    return err(new HubError("bad_request.validation_failure", "Invalid fid"));
  }
  return ok(fid);
};

/**
 * Parse associated UserData resource from a Farcaster Connect message.
 */
export const parseUserData = (message: SiweMessage): HubResult<ConnectResourceParams | undefined> => {
  const resource = (message.resources ?? []).find((resource) => {
    return USER_DATA_URI_REGEX.test(resource);
  });
  if (resource) {
    const fid = parseInt(resource.match(USER_DATA_URI_REGEX)?.[1] ?? "");
    const userDataParams = parseUserDataResources(resource.match(USER_DATA_URI_REGEX)?.[2] ?? "");
    if (isNaN(fid)) {
      return err(new HubError("bad_request.validation_failure", "Invalid fid"));
    }
    return ok({ fid, userDataParams });
  } else {
    return ok(undefined);
  }
};

/**
 * Validate a Farcaster Connect message's statement. The statement must be
 * "Farcaster Connect".
 */
export const validateStatement = (message: SiweMessage): HubResult<SiweMessage> => {
  if (message.statement !== STATEMENT) {
    return err(new HubError("bad_request.validation_failure", `Statement must be '${STATEMENT}'`));
  }
  return ok(message);
};

/**
 * Validate a Farcaster Connect message's chain ID. The chain ID must be 10.
 */
export const validateChainId = (message: SiweMessage): HubResult<SiweMessage> => {
  if (message.chainId !== CHAIN_ID) {
    return err(new HubError("bad_request.validation_failure", `Chain ID must be ${CHAIN_ID}`));
  }
  return ok(message);
};

/**
 * Validate a Farcaster Connect message's resources. The message must contain a
 * single fid resource, e.g. "farcaster://fid/123".
 */
export const validateResources = (message: SiweMessage): HubResult<SiweMessage> => {
  const fidResources = (message.resources ?? []).filter((resource) => {
    return FID_URI_REGEX.test(resource);
  });
  if (fidResources.length === 0) {
    return err(new HubError("bad_request.validation_failure", "No fid resource provided"));
  } else if (fidResources.length > 1) {
    return err(new HubError("bad_request.validation_failure", "Multiple fid resources provided"));
  } else {
    return ok(message);
  }
};

const verifySiweMessage = async (
  message: SiweMessage,
  signature: string,
  provider?: Provider,
): HubAsyncResult<SiweResponse> => {
  return ResultAsync.fromPromise(message.verify({ signature }, { provider, suppressExceptions: true }), (e) => {
    return new HubError("unauthorized", e as Error);
  });
};

const mergeResources = (response: SiweResponse): HubResult<ConnectResponse> => {
  return parseResources(response.data).andThen((resources) => {
    return ok({ ...resources, ...response });
  });
};

const verifyFidOwner = async (
  response: ConnectResponse,
  fidVerifier: (custody: Hex) => Promise<BigInt>,
): HubAsyncResult<ConnectResponse> => {
  const signer = response.data.address as Hex;
  return ResultAsync.fromPromise(fidVerifier(signer), (e) => {
    return new HubError("unavailable.network_failure", e as Error);
  }).andThen((fid) => {
    if (fid !== BigInt(response.fid)) {
      response.success = false;
      response.error = new SiweError(
        `Invalid resource: signer ${signer} does not own fid ${response.fid}.`,
        response.fid.toString(),
        fid.toString(),
      );
    }
    return ok(response);
  });
};

const buildResources = (fid: number, userDataParams: UserDataTypeParam[] | undefined): string[] => {
  const userData = userDataParams ?? [];
  if (userData.length === 0) return [buildFidResource(fid)];
  return [buildFidResource(fid), buildUserDataResource(fid, userData)];
};

const buildFidResource = (fid: number): string => {
  return `farcaster://fid/${fid}`;
};

const buildUserDataResource = (fid: number, userData: UserDataTypeParam[]): string => {
  const params = Array.from(new Set(userData)).join("&");
  return `farcaster://fid/${fid}/userdata?${params}`;
};

const parseUserDataResources = (queryString: string) => {
  const isUserDataParam = (param: string): param is UserDataTypeParam =>
    ["pfp", "display", "bio", "url", "username"].includes(param);
  return queryString.split("&").filter(isUserDataParam);
};
