import * as fs from "node:fs";

import { stringify } from "csv-stringify";
import { Writable } from "node:stream";

export const outputWriter = (f: string | fs.WriteStream): Writable => {
  let stream: fs.WriteStream;
  if (typeof f === "string") {
    stream = fs.createWriteStream(f);
  } else {
    stream = f as fs.WriteStream;
  }

  const stringifier = stringify({});
  stringifier.pipe(stream);

  return stringifier;
};

export const yieldToEventLoop = (): Promise<void> => {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
};

export const waitForPromise = (promise: Promise<unknown>) => {
  let finished = false;
  // biome-ignore lint/suspicious/noAssignInExpressions: legacy code, avoid using ignore for new code
  promise.finally(() => (finished = true));

  const pollToFinish = () => {
    if (!finished) {
      setTimeout(pollToFinish, 1000);
    }
  };

  pollToFinish();
};
