import { SiweMessage, SiweResponse } from "siwe";
import { Result, ResultAsync, err, ok, okAsync } from "neverthrow";
import { HubAsyncResult, HubError, HubResult } from "../errors";

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
  return (await verifySiweMessage(message, signature)).andThen(verifyFidOwner);
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

function verifyFidOwner(response: SiweResponse): HubResult<SiweResponse & { fid: number }> {
  const message = response.data;
  return parseFid(message).andThen((fid) => {
    return ok({ fid, ...response });
  });
}
