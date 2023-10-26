import { SiweMessage, SiweResponse, SiweError } from "siwe";
import { Result, ResultAsync, err, ok } from "neverthrow";
import { HubAsyncResult, HubError, HubResult } from "../errors";
import { Hex } from "viem";
import { Provider } from "ethers";

type UserDataTypeParam = "pfp" | "display" | "bio" | "url" | "username";
type ConnectParams = Partial<SiweMessage> & { fid: number; userData?: UserDataTypeParam[] };
type ConnectOpts = {
  fidVerifier: (custody: Hex) => Promise<BigInt>;
  provider?: Provider;
};

type ConnectResponse = SiweResponse & { fid: number };

const FID_URI_REGEX = /^farcaster:\/\/fid\/([1-9]\d*)\/?$/;
const STATEMENT = "Farcaster Connect";
const CHAIN_ID = 10;

const voidFidVerifier = (_custody: Hex) => Promise.reject(new Error("Not implemented: Must provide an fid verifier"));

export function build(params: ConnectParams): HubResult<SiweMessage> {
  const { fid, userData, ...siweParams } = params;
  const resources = siweParams.resources ?? [];
  siweParams.statement = STATEMENT;
  siweParams.chainId = CHAIN_ID;
  siweParams.resources = [...buildResources(fid, userData), ...resources];
  return validate(siweParams);
}

export function validate(params: string | Partial<SiweMessage>): HubResult<SiweMessage> {
  return Result.fromThrowable(
    // SiweMessage validates itself when constructed
    () => new SiweMessage(params),
    // If construction time validation fails, propagate the error
    (e) => new HubError("bad_request.validation_failure", e as Error),
  )()
    .andThen(validateStatement)
    .andThen(validateChainId)
    .andThen(validateResources);
}

export async function verify(
  message: SiweMessage,
  signature: string,
  options: ConnectOpts = {
    fidVerifier: voidFidVerifier,
  },
): HubAsyncResult<SiweResponse> {
  const { fidVerifier, provider } = options;
  const siwe = (await verifySiweMessage(message, signature, provider)).andThen(mergeFid);
  if (siwe.isErr()) return err(siwe.error);
  if (!siwe.value.success) {
    const message = siwe.value.error?.type ?? "Unknown error";
    return err(new HubError("unauthorized", message));
  }

  const fid = await verifyFidOwner(siwe.value, fidVerifier);
  if (fid.isErr()) return err(fid.error);
  if (!fid.value.success) {
    const message = siwe.value.error?.type ?? "Unknown error";
    return err(new HubError("unauthorized", message));
  }
  return ok(fid.value);
}

export function parseFid(message: SiweMessage): HubResult<number> {
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
}

export function validateStatement(message: SiweMessage): HubResult<SiweMessage> {
  if (message.statement !== STATEMENT) {
    return err(new HubError("bad_request.validation_failure", `Statement must be '${STATEMENT}'`));
  }
  return ok(message);
}

export function validateChainId(message: SiweMessage): HubResult<SiweMessage> {
  if (message.chainId !== CHAIN_ID) {
    return err(new HubError("bad_request.validation_failure", `Chain ID must be ${CHAIN_ID}`));
  }
  return ok(message);
}

export function validateResources(message: SiweMessage): HubResult<SiweMessage> {
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
}

async function verifySiweMessage(
  message: SiweMessage,
  signature: string,
  provider?: Provider,
): HubAsyncResult<SiweResponse> {
  return ResultAsync.fromPromise(message.verify({ signature }, { provider, suppressExceptions: true }), (e) => {
    return new HubError("unauthorized", e as Error);
  });
}

function mergeFid(response: SiweResponse): HubResult<ConnectResponse> {
  return parseFid(response.data).andThen((fid) => {
    return ok({ fid, ...response });
  });
}

async function verifyFidOwner(
  response: ConnectResponse,
  fidVerifier: (custody: Hex) => Promise<BigInt>,
): HubAsyncResult<SiweResponse & { fid: number }> {
  const signer = response.data.address as Hex;
  return ResultAsync.fromPromise(fidVerifier(signer), (e) => {
    return new HubError("unavailable.network_failure", e as Error);
  }).andThen((fid) => {
    if (fid !== BigInt(response.fid)) {
      response.success = false;
      response.error = new SiweError(
        `Invalid resource: signer ${signer} does not own fid ${fid}.`,
        response.fid.toString(),
        fid.toString(),
      );
    }
    return ok(response);
  });
}

function buildResources(fid: number, userDataParams: UserDataTypeParam[] | undefined): string[] {
  const userData = userDataParams ?? [];
  if (userData.length === 0) return [buildFidResource(fid)];
  return [buildFidResource(fid), buildUserDataResource(fid, userData)];
}

function buildFidResource(fid: number): string {
  return `farcaster://fid/${fid}`;
}

function buildUserDataResource(fid: number, userData: UserDataTypeParam[]): string {
  const params = Array.from(new Set(userData)).join("&");
  return `farcaster://fid/${fid}/userdata?${params}`;
}
