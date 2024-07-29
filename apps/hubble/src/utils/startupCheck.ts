import fs, { existsSync } from "fs";
import { ResultAsync } from "neverthrow";
import { dirname, resolve } from "path";
import { Chain, createPublicClient, fallback, http } from "viem";
import { getChainId } from "viem/actions";
import { diagnosticReporter } from "./diagnosticReport.js";

export enum StartupCheckStatus {
  OK = "OK",
  WARNING = "WARNING",
  ERROR = "ERROR",
}

class StartupCheck {
  private anyFailed = false;

  anyFailedChecks(): boolean {
    return this.anyFailed;
  }

  printStartupCheckStatus(status: StartupCheckStatus, message: string, helpUrl?: string): void {
    switch (status) {
      case StartupCheckStatus.OK:
        console.log(`✅ | ${message}`);
        break;
      case StartupCheckStatus.WARNING:
        console.log(`⚠️  | ${message}`);
        if (helpUrl) {
          console.log(`   | Please see help at ${helpUrl}`);
        }

        break;
      case StartupCheckStatus.ERROR:
        console.log(`❌ | ${message}`);
        if (helpUrl) {
          console.log(`   | Please see help at ${helpUrl}`);
        }
        this.anyFailed = true;
        break;
    }
  }

  directoryWritable(directory: string) {
    // Ensure that the DB_Directory is writable
    const dbDir = resolve(directory);
    try {
      // If the directory exists, check that it is writable
      if (existsSync(dbDir)) {
        fs.accessSync(dbDir, fs.constants.W_OK | fs.constants.R_OK);
        this.printStartupCheckStatus(StartupCheckStatus.OK, `Directory ${dbDir} is writable`);
      } else {
        // If the directory does not exist, check that the parent directory is writable
        const parentDir = dirname(dbDir);
        this.directoryWritable(parentDir);
      }
    } catch (err) {
      this.printStartupCheckStatus(
        StartupCheckStatus.ERROR,
        `Directory ${dbDir} is not writable.\nPlease run 'chmod 777 ${dbDir}'\n\n`,
      );
      throw new Error(`Directory ${dbDir} is not writable`);
    }
  }

  async rpcCheck(
    rpcUrl: string | undefined,
    chain: Chain,
    prefix = "",
    chainId?: number,
    status = StartupCheckStatus.ERROR,
  ) {
    const type = chain.name;
    if (!rpcUrl) {
      this.printStartupCheckStatus(
        status,
        `No ${prefix} ${type} node configured.`,
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
    const chainIdResult = await ResultAsync.fromPromise(getChainId(publicClient), (err) => err);

    if (chainIdResult.isErr() || chainIdResult.value !== (chainId ?? chain.id)) {
      console.log(chainIdResult);
      this.printStartupCheckStatus(
        status,
        `Failed to connect to ${prefix} ${type} node.`,
        "https://www.thehubble.xyz/intro/install.html#installing-hubble",
      );
    } else {
      this.printStartupCheckStatus(StartupCheckStatus.OK, `Connected to ${prefix} ${type} node`);
    }
  }
}

export const startupCheck = new StartupCheck();
