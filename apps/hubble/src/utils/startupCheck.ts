import fs, { existsSync } from "fs";
import { ResultAsync } from "neverthrow";
import { dirname, resolve } from "path";
import { Chain, createPublicClient, fallback, http } from "viem";

export enum StartupCheckStatus {
  OK = "OK",
  WARNING = "WARNING",
  ERROR = "ERROR",
}

export function printStartupCheckStatus(status: StartupCheckStatus, message: string, helpUrl?: string): void {
  switch (status) {
    case StartupCheckStatus.OK:
      console.log(`✅ | ${message}`);
      break;
    case StartupCheckStatus.WARNING:
      console.log(`⚠️  | ${message}`);
      if (helpUrl) {
        console.log("   | Please see help at");
        console.log(`   | ${helpUrl}`);
      }
      break;
    case StartupCheckStatus.ERROR:
      console.log(`❌ | ${message}`);
      if (helpUrl) {
        console.log("   | Please see help at");
        console.log(`   | ${helpUrl}`);
      }
      break;
  }
}

export class StartupChecks {
  static directoryWritable(directory: string) {
    // Ensure that the DB_Directory is writable
    const dbDir = resolve(directory);
    try {
      // If the directory exists, check that it is writable
      if (existsSync(dbDir)) {
        fs.accessSync(dbDir, fs.constants.W_OK | fs.constants.R_OK);
        printStartupCheckStatus(StartupCheckStatus.OK, `Directory ${dbDir} is writable`);
      } else {
        // If the directory does not exist, check that the parent directory is writable
        const parentDir = dirname(dbDir);
        this.directoryWritable(parentDir);
      }
    } catch (err) {
      printStartupCheckStatus(
        StartupCheckStatus.ERROR,
        `Directory ${dbDir} is not writable.\nPlease run 'chmod 777 ${dbDir}'\n\n`,
      );
      throw new Error(`Directory ${dbDir} is not writable`);
    }
  }

  static async rpcCheck(rpcUrl: string | undefined, chain: Chain, status = StartupCheckStatus.ERROR) {
    const type = chain.name;
    if (!rpcUrl) {
      printStartupCheckStatus(
        status,
        `No ${type} node configured.`,
        "https://www.thehubble.xyz/intro/install.html#installing-hubble",
      );
      return;
    }

    const rpcUrls = rpcUrl.split(",");
    const transports = rpcUrls.map((url) => http(url, { retryCount: 5 }));

    const publicClient = createPublicClient({
      chain,
      transport: fallback(transports),
    });

    // Check that the publicClient is reachable and returns the goerli chainId
    const chainIdResult = await ResultAsync.fromPromise(publicClient.getChainId(), (err) => err);

    if (chainIdResult.isErr() || chainIdResult.value !== chain.id) {
      console.log(chainIdResult);
      printStartupCheckStatus(
        status,
        `Failed to connect to ${type} node.`,
        "https://www.thehubble.xyz/intro/install.html#installing-hubble",
      );
    } else {
      printStartupCheckStatus(StartupCheckStatus.OK, `Connected to ${type} node`);
    }
  }
}
