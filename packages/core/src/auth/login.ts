import { SiweMessage, SiweResponse, SiweError } from "siwe";
import { Result, ResultAsync, err, ok } from "neverthrow";
import { HubAsyncResult, HubError, HubResult } from "../errors";
import { defaultL2PublicClient } from "../eth/clients";
import { Hex, PublicClient } from "viem";

const FID_URI_REGEX = /^farcaster:\/\/fids\/([1-9]\d*)\/?$/;

export function build(params: string | Partial<SiweMessage>): HubResult<SiweMessage> {
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
  const verify = (await verifySiweMessage(message, signature)).andThen(mergeFid);
  if (verify.isErr()) return err(verify.error);
  if (!verify.value.success) {
    return ok(verify.value);
  }

  return verifyFidOwner(verify.value);
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

function validateStatement(message: SiweMessage): HubResult<SiweMessage> {
  if (message.statement !== "Log in With Farcaster") {
    return err(new HubError("bad_request.validation_failure", "Invalid statement"));
  }
  return ok(message);
}

function validateChainId(message: SiweMessage): HubResult<SiweMessage> {
  if (message.chainId !== 10) {
    return err(new HubError("bad_request.validation_failure", "Chain ID must be 10"));
  }
  return ok(message);
}

function validateResources(message: SiweMessage): HubResult<SiweMessage> {
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

function mergeFid(response: SiweResponse): HubResult<SiweResponse & { fid: number }> {
  const message = response.data;
  return parseFid(message).andThen((fid) => {
    return ok({ fid, ...response });
  });
}

async function verifyFidOwner(
  response: SiweResponse & { fid: number },
  publicClient: PublicClient = defaultL2PublicClient as PublicClient,
): HubAsyncResult<SiweResponse & { fid: number }> {
  return ResultAsync.fromPromise(
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
        "Invalid resource: fid does not belong to signer",
        response.fid.toString(),
        fid.toString(),
      );
    }
    return ok(response);
  });
}
