import { SiweMessage, SiweResponse, SiweError } from "siwe";
import { Result, ResultAsync, err, ok } from "neverthrow";
import { HubAsyncResult, HubError, HubResult } from "../errors";
import { defaultL2PublicClient } from "../eth/clients";
import { Hex, PublicClient } from "viem";

type UserDataTypeParam = "pfp" | "display" | "bio" | "url" | "username";
type ConnectParams = Partial<SiweMessage> & { fid: number; userData?: UserDataTypeParam[] };

type ConnectResponse = SiweResponse & { fid: number };

const FID_URI_REGEX = /^farcaster:\/\/fid\/([1-9]\d*)\/?$/;
const STATEMENT = "Farcaster Connect";
const CHAIN_ID = 10;

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

export async function verify(message: SiweMessage, signature: string): HubAsyncResult<SiweResponse> {
  const siwe = (await verifySiweMessage(message, signature)).andThen(mergeFid);
  if (siwe.isErr()) return err(siwe.error);
  if (!siwe.value.success) {
    const message = siwe.value.error?.type ?? "Unknown error";
    return err(new HubError("unauthorized", message));
  }

  const fid = await verifyFidOwner(siwe.value);
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
    return err(new HubError("bad_request.validation_failure", "Invalid resources"));
  }
  const fid = parseInt(resource.match(FID_URI_REGEX)?.[1] ?? "");
  if (isNaN(fid)) {
    return err(new HubError("bad_request.validation_failure", "Invalid resources"));
  }
  return ok(fid);
}

export function validateStatement(message: SiweMessage): HubResult<SiweMessage> {
  if (message.statement !== STATEMENT) {
    return err(new HubError("bad_request.validation_failure", "Invalid statement"));
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
    return err(new HubError("bad_request.validation_failure", "No fid resource found"));
  } else if (fidResources.length > 1) {
    return err(new HubError("bad_request.validation_failure", "Multiple fid resources"));
  } else {
    return ok(message);
  }
}

async function verifySiweMessage(message: SiweMessage, signature: string): HubAsyncResult<SiweResponse> {
  return ResultAsync.fromPromise(message.verify({ signature }, { suppressExceptions: true }), (e) => {
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
  publicClient: PublicClient = defaultL2PublicClient as PublicClient,
): HubAsyncResult<SiweResponse & { fid: number }> {
  return ResultAsync.fromPromise(
    // TODO: Configure address and abi
    publicClient.readContract({
      address: "0x00000000FcAf86937e41bA038B4fA40BAA4B780A",
      abi: [
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "idOf",
          outputs: [{ internalType: "uint256", name: "fid", type: "uint256" }],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "idOf",
      args: [response.data.address as Hex],
    }),
    (e) => {
      return new HubError("unavailable.network_failure", e as Error);
    },
  ).andThen((fid) => {
    if (fid !== BigInt(response.fid)) {
      response.success = false;
      response.error = new SiweError(
        "Invalid resource: signer is not owner of fid.",
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
