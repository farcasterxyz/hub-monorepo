import { OnChainEventPostfix, RootPrefix, UserMessagePostfixMax, UserPostfix } from "../storage/db/types.js";
import { logger } from "../utils/logger.js";
import RocksDB from "../storage/db/rocksdb.js";
import { createWriteStream, unlinkSync } from "fs";
import { Result } from "neverthrow";
import { HubError, OnChainEvent, OnChainEventType, toFarcasterTime } from "@farcaster/core";
import { once } from "events";

const currentFarcasterTimestamp = (): number => {
  return toFarcasterTime(Date.now())._unsafeUnwrap();
};

// biome-ignore lint/suspicious/noExplicitAny: Generic check for enums needs 'any'
function getMaxValue(enumType: any): number {
  let maxValue = 0;

  for (const key in enumType) {
    if (enumType[key] > maxValue) {
      maxValue = enumType[key];
    }
  }
  return maxValue;
}

// Pretty print a number with K/M/B/T suffixes
export function formatNumber(num?: number): string {
  if (num === undefined) return "";

  if (Math.abs(num) >= 1.0e12) return `${(Math.abs(num) / 1.0e12).toFixed(1)}T`;
  else if (Math.abs(num) >= 1.0e9) return `${(Math.abs(num) / 1.0e9).toFixed(1)}B`;
  else if (Math.abs(num) >= 1.0e6) return `${(Math.abs(num) / 1.0e6).toFixed(1)}M`;
  else if (Math.abs(num) >= 1.0e3) return `${(Math.abs(num) / 1.0e3).toFixed(1)}K`;
  else {
    if (num.toString().includes(".")) {
      return num.toFixed(2);
    } else {
      return num.toString();
    }
  }
}

export function formatTime(numMs?: number): string {
  if (numMs === undefined) return "";

  if (numMs >= 1000 * 60 * 60) {
    return `${(numMs / (1000 * 60 * 60)).toFixed(1)}h`;
  } else if (numMs >= 1000 * 60) {
    return `${(numMs / (1000 * 60)).toFixed(1)}m`;
  } else if (numMs >= 1000) {
    return `${(numMs / 1000).toFixed(1)}s`;
  } else {
    return `${numMs.toFixed(1)}ms`;
  }
}

// Pretty print a percentage
export function formatPercentage(num?: number): string {
  if (num === undefined) return "";

  return `${(num * 100).toFixed(2)}%`;
}

// A class to track usage of key/value bytes in the DB
class KeysProfile {
  count: number;
  keyBytes: number;
  valueBytes: number;

  label: string;

  constructor(label = "") {
    this.count = 0;
    this.keyBytes = 0;
    this.valueBytes = 0;

    this.label = label;
  }

  toString() {
    return `count=${formatNumber(this.count)}, keyBytes=${formatNumber(this.keyBytes)}, valueBytes=${formatNumber(
      this.valueBytes,
    )}`;
  }
}

class ValueStats {
  count: number;
  min: number;
  max: number;
  average: number;
  sum: number;

  allValues: number[];

  label: string;

  constructor(label = "") {
    this.count = 0;
    this.min = Number.MAX_SAFE_INTEGER;
    this.max = Number.MIN_SAFE_INTEGER;
    this.average = 0;
    this.sum = 0;
    this.allValues = [];

    this.label = label;
  }

  addValue(value: number) {
    this.count++;

    if (value < this.min) {
      this.min = value;
    }
    if (value > this.max) {
      this.max = value;
    }
    this.sum += value;
    this.average = this.sum === 0 ? 0 : this.sum / this.count;
  }
}

// Return a string that can printed to console of a table with the data
export function prettyPrintTable(data: (string | number)[][]): string {
  // First, calculate the maximum width of each column
  const columnWidths =
    data[0]?.map((_, columnIndex) => Math.max(...data.map((row) => row[columnIndex]?.toString().length || 0))) || [];

  // Then, create a string representation of each row, padding each cell as necessary
  let rows = data.map((row) => row.map((cell, i) => cell.toString().padStart(columnWidths[i] || 0)).join(" | "));

  const totalWidth = rows[0]?.length || 0;

  // Finally, join all the rows together with line breaks
  rows = [rows[0] as string, "-".repeat(totalWidth), ...rows.slice(1)];
  return rows.join("\n");
}

// Format the keys profiles into a printable table
function KeysProfileToPrettyPrintObject(keysProfile: KeysProfile[], calculateOverhead = false): string[][] {
  const data = [];
  // First, write the headers to the first row
  data.push(["Prefix", "Count", "Key Bytes", "Value Bytes", "Total Bytes %"]);
  if (calculateOverhead) {
    data[0]?.push("Overhead %");
  }

  // First, calculate the total bytes
  let totalBytes = 0;
  for (let i = 0; i < keysProfile.length; i++) {
    totalBytes += keysProfile[i]?.valueBytes || 0;
    totalBytes += keysProfile[i]?.keyBytes || 0;
  }

  // Then, for each prefix, write a row with the prefix and the count, key bytes, and value bytes
  // for that prefix
  for (let i = 0; i < keysProfile.length; i++) {
    if ((keysProfile[i]?.count || 0) > 0) {
      const label = keysProfile[i]?.label || "";
      const bytesTotal = (keysProfile[i]?.valueBytes || 0) + (keysProfile[i]?.keyBytes || 0);
      data.push([
        label,
        formatNumber(keysProfile[i]?.count),
        formatNumber(keysProfile[i]?.keyBytes),
        formatNumber(keysProfile[i]?.valueBytes),
        formatPercentage(bytesTotal / totalBytes),
      ]);
    }
  }

  // Calculate overhead as a % of the first row's Total Bytes
  if (calculateOverhead) {
    const firstRowTotalBytes = parseFloat(data[1]?.[4] || "0");
    let totalOverhead = 0;

    // Skip the header and the first row
    for (let i = 1; i < data.length; i++) {
      const bytesTotal = parseFloat(data[i]?.[4] || "0");
      const overhead = bytesTotal / firstRowTotalBytes;

      totalOverhead += overhead;

      data[i]?.push(formatPercentage(overhead));
    }

    data.push(["Total", "", "", "", "", formatPercentage(totalOverhead - 1)]);
  }

  return data;
}

function ValueStatsToPrettyPrintObject(valueStats: ValueStats[]): string[][] {
  const data = [];
  // First, write the headers to the first row
  data.push(["Prefix", "Count", "Total", "Min", "Max", "Average"]);

  // Then, for each prefix, write a row with the prefix and the count, key bytes, and value bytes
  // for that prefix
  for (let i = 0; i < valueStats.length; i++) {
    if ((valueStats[i]?.count || 0) > 0) {
      const label = valueStats[i]?.label || "";
      data.push([
        label,
        formatNumber(valueStats[i]?.count),
        formatNumber(valueStats[i]?.sum),
        formatNumber(valueStats[i]?.min),
        formatNumber(valueStats[i]?.max),
        formatNumber(valueStats[i]?.average),
      ]);
    }
  }

  return data;
}

/**
 * Given an array of KeysProfile objects of the RootPrefixes, categorize each prefix into :
 * 1. User Data
 * 2. Indexes
 * 3. Sync Trie data
 * 4. Hub Events
 * 5. Others
 */
function prefixProfileToDataType(keysProfile: KeysProfile[], userPostfixKeys: KeysProfile[]): KeysProfile[] {
  const dataTypePrefixes = [
    new KeysProfile("User Data"),
    new KeysProfile("Indexes"),
    new KeysProfile("Sync Trie Data"),
    new KeysProfile("Hub Events"),
    new KeysProfile("OnChain Events"),
    new KeysProfile("Others"),
  ];

  for (let i = 0; i < keysProfile.length; i++) {
    const kp = keysProfile[i] as KeysProfile;

    let index = 0;

    if (i === RootPrefix.User) {
      index = 0;
    } else if (i >= RootPrefix.CastsByParent && i <= RootPrefix.ReactionsByTarget) {
      index = 1;
    } else if (i === RootPrefix.SyncMerkleTrieNode) {
      index = 2;
    } else if (i === RootPrefix.HubEvents) {
      index = 3;
    } else if (i === RootPrefix.OnChainEvent) {
      index = 4;
    } else {
      index = 5;
    }

    const profile = dataTypePrefixes[index] as KeysProfile;
    profile.count += kp.count;
    profile.keyBytes += kp.keyBytes;
    profile.valueBytes += kp.valueBytes;
  }

  // The UserData also contains indexes (enum value >= 86), so adjust those from the userPostfix values
  for (let i = 0; i < userPostfixKeys.length; i++) {
    const kp = userPostfixKeys[i] as KeysProfile;

    if (i > UserMessagePostfixMax) {
      // This is index data, so remove it from the UserData
      (dataTypePrefixes[0] as KeysProfile).count -= kp.count;
      (dataTypePrefixes[0] as KeysProfile).keyBytes -= kp.keyBytes;
      (dataTypePrefixes[0] as KeysProfile).valueBytes -= kp.valueBytes;

      // ... and add it to the Indexes
      (dataTypePrefixes[1] as KeysProfile).count += kp.count;
      (dataTypePrefixes[1] as KeysProfile).keyBytes += kp.keyBytes;
      (dataTypePrefixes[1] as KeysProfile).valueBytes += kp.valueBytes;
    }
  }

  return dataTypePrefixes;
}

// Main function to print the usage profile of the DB
export async function profileStorageUsed(rocksDB: RocksDB, fidProfileFileName?: string) {
  const allKeys = new KeysProfile("All Keys");
  const prefixKeys = Array.from(
    { length: getMaxValue(RootPrefix) + 1 },
    (_v, i: number) => new KeysProfile(RootPrefix[i]?.toString()),
  );

  const userPostfixKeys = Array.from(
    { length: getMaxValue(UserPostfix) + 1 },
    (_v, i: number) => new KeysProfile(UserPostfix[i]?.toString()),
  );

  const onchainPostfixKeys = Array.from(
    { length: getMaxValue(OnChainEventPostfix) + 1 },
    (_v, i: number) => new KeysProfile(OnChainEventPostfix[i]?.toString()),
  );

  // Calculate the individual message sizes
  const valueStats = Array.from({ length: 8 }, (_v, i: number) => new ValueStats(UserPostfix[i]?.toString()));
  const allFids = new Map<number, ValueStats[]>();

  // Calculate the number of storage slots rented per FID
  // ValueStats will contain total & current storage slots rented.
  // ValueStats[0]: Total = expired + non-expired
  // ValueStats[1]: Current = non-expired
  enum StorageRentStat {
    TotalStorage = 0,
    CurrentStorage = 1,
  }
  const rentStats = Array.from({ length: 2 }, (_v, i: number) => new ValueStats(StorageRentStat[i]?.toString()));
  const fidRentStats = new Map<number, ValueStats[]>();

  // Iterate over all the keys in the DB
  await rocksDB.forEachIteratorByPrefix(Buffer.from([]), (key, value) => {
    allKeys.count++;
    allKeys.keyBytes += key?.length || 0;
    allKeys.valueBytes += value?.length || 0;

    if (key && key.length > 0) {
      const prefix = key[0] as number;

      if (prefix > 0 && prefix < prefixKeys.length) {
        (prefixKeys[prefix] as KeysProfile).count++;
        (prefixKeys[prefix] as KeysProfile).keyBytes += key?.length || 0;
        (prefixKeys[prefix] as KeysProfile).valueBytes += value?.length || 0;

        // Categorize on chain data for per FID storage units rented
        if (prefix === RootPrefix.OnChainEvent) {
          const postfix = (key as Buffer).readUint8(1);
          if (postfix > 0 && postfix < onchainPostfixKeys.length) {
            (onchainPostfixKeys[postfix] as KeysProfile).count++;
            (onchainPostfixKeys[postfix] as KeysProfile).keyBytes += key?.length || 0;
            (onchainPostfixKeys[postfix] as KeysProfile).valueBytes += value?.length || 0;

            const onchainEventType = key[2] as OnChainEventType;
            if (onchainEventType === OnChainEventType.EVENT_TYPE_STORAGE_RENT && key.length >= 7) {
              const fid = key.slice(3, 7).readUint32BE();
              if (fid > 0) {
                if (value) {
                  let valueStats: ValueStats[] = Array.from(
                    { length: Object.keys(StorageRentStat).length / 2 },
                    (_v, i: number) => {
                      return new ValueStats(StorageRentStat[i]?.toString() ?? "");
                    },
                  );
                  if (fidRentStats.has(fid)) {
                    valueStats = fidRentStats.get(fid) as ValueStats[];
                  }

                  const onChainEvent = Result.fromThrowable(
                    () => OnChainEvent.decode(new Uint8Array(value as Buffer)),
                    (e) => e as HubError,
                  )();
                  if (onChainEvent.isOk()) {
                    const event = onChainEvent.value;
                    const body = event.storageRentEventBody;
                    const expiry = body?.expiry;
                    if (expiry && expiry > currentFarcasterTimestamp()) {
                      valueStats[StorageRentStat.CurrentStorage]?.addValue(body.units ?? 0);
                    }
                    valueStats[StorageRentStat.TotalStorage]?.addValue(body?.units ?? 0);

                    fidRentStats.set(fid, valueStats);
                  }
                }
              }
            }
          }
        }
        // Further categorize user data into user postfixes
        if (prefix === RootPrefix.User) {
          const postfix = key[1 + 4] as number;

          if (postfix > 0 && postfix < userPostfixKeys.length) {
            (userPostfixKeys[postfix] as KeysProfile).count++;
            (userPostfixKeys[postfix] as KeysProfile).keyBytes += key?.length || 0;
            (userPostfixKeys[postfix] as KeysProfile).valueBytes += value?.length || 0;

            if (postfix < UserMessagePostfixMax) {
              const fid = key.slice(1, 5).readUint32BE();

              let fidProfile;
              if (fid > 0) {
                if (allFids.has(fid)) {
                  fidProfile = allFids.get(fid) as ValueStats[];
                } else {
                  fidProfile = Array.from({ length: 8 }, (_v, i: number) => new ValueStats(UserPostfix[i]?.toString()));
                  allFids.set(fid, fidProfile);
                }
              }

              (valueStats[postfix] as ValueStats).addValue(value?.length || 0);

              if (fidProfileFileName) {
                ((fidProfile as ValueStats[])[postfix] as ValueStats).addValue(value?.length || 0);
              }
            }
          } else {
            logger.error(`Invalid postfix ${postfix} for key ${key.toString("hex")}`);
          }
        }
      } else {
        logger.error(`Invalid prefix ${prefix} for key ${key.toString("hex")}`);
      }
    }

    if (allKeys.count % 1_000_000 === 0) {
      logger.info(`Read ${formatNumber(allKeys.count)} keys`);
      return false;
    }

    return false;
  });

  logger.info(`RocksDB contains ${allKeys.toString()}`);

  console.log("\nBy Prefix:\n");
  console.log(prettyPrintTable(KeysProfileToPrettyPrintObject(prefixKeys)));

  console.log("\nBy Data Type:\n");
  console.log(
    prettyPrintTable(KeysProfileToPrettyPrintObject(prefixProfileToDataType(prefixKeys, userPostfixKeys), true)),
  );

  console.log("\nBy OnChain Event Postfix:\n");
  console.log(prettyPrintTable(KeysProfileToPrettyPrintObject(onchainPostfixKeys)));

  console.log("\nBy User Data type:\n");
  console.log(prettyPrintTable(KeysProfileToPrettyPrintObject(userPostfixKeys)));

  console.log("\nValue Sizes (bytes):\n");
  console.log(prettyPrintTable(ValueStatsToPrettyPrintObject(valueStats)));

  console.log("\nTotals:\n");
  console.log(prettyPrintTable(KeysProfileToPrettyPrintObject([allKeys])));

  if (fidProfileFileName) {
    // Remove file if it exists
    Result.fromThrowable(
      () => unlinkSync(fidProfileFileName),
      (e) => e,
    )();

    // Open a CSV file for writing
    const csvStream = createWriteStream(fidProfileFileName);

    // Write the headers
    csvStream.write("FID,");
    // For each valuestat, write the headers, prefixing the label
    for (let i = 1; i < valueStats.length; i++) {
      if (i === 5) {
        // Ignore signer key
        continue;
      }
      // User Postfix related headers
      csvStream.write(`Count_${valueStats[i]?.label},Sum_${valueStats[i]?.label},Min_${valueStats[i]?.label},`);
      csvStream.write(`Max_${valueStats[i]?.label},Average_${valueStats[i]?.label},`);
    }

    // For each storage stat, write the headers, prefixing the label
    for (let i = 0; i < rentStats.length; i++) {
      csvStream.write(`Count_${rentStats[i]?.label},Sum_${rentStats[i]?.label},Min_${rentStats[i]?.label},`);
      csvStream.write(`Max_${rentStats[i]?.label},Average_${rentStats[i]?.label},`);
    }

    csvStream.write("\n");

    // Iterate over all the FIDs
    for (const [fid, fidProfile] of allFids) {
      // Start a new line in the CSV file

      // Write the FID
      csvStream.write(`${fid},`);

      // Go over each valuestat in the fidprofile and calculate the stats
      for (let i = 1; i < fidProfile.length; i++) {
        if (i === 5) {
          // Ignore signer key
          continue;
        }

        const prettyPrint = (num: number | undefined) => {
          if (num === Number.MAX_SAFE_INTEGER || num === Number.MIN_SAFE_INTEGER) return "";
          return num?.toString() || "";
        };

        // Write the stats to the CSV file
        csvStream.write(
          `${prettyPrint(fidProfile[i]?.count)},${prettyPrint(fidProfile[i]?.sum)},${prettyPrint(
            fidProfile[i]?.min,
          )},${prettyPrint(fidProfile[i]?.max)},`,
        );
        csvStream.write(`${prettyPrint(fidProfile[i]?.average)},`);
      }

      // Go over each storage rent statistic for the FID and calculate the stats
      if (fidRentStats.has(fid)) {
        const rentStat = fidRentStats.get(fid) as ValueStats[];

        for (let i = 0; i < rentStat.length; i++) {
          const prettyPrint = (num: number | undefined) => {
            if (num === Number.MAX_SAFE_INTEGER || num === Number.MIN_SAFE_INTEGER) return "";
            return num?.toString() || "";
          };

          // Write the stats to the CSV file
          csvStream.write(
            `${prettyPrint(rentStat[i]?.count)},${prettyPrint(rentStat[i]?.sum)},${prettyPrint(
              rentStat[i]?.min,
            )},${prettyPrint(rentStat[i]?.max)},`,
          );
          csvStream.write(`${prettyPrint(rentStat[i]?.average)},`);
        }
      }

      // End the line
      csvStream.write("\n");
    }

    // Close the CSV file
    csvStream.end();
    csvStream.close();

    await once(csvStream, "finish");
    console.log(
      `\nCSV file written to ${fidProfileFileName} ${csvStream.bytesWritten} ${csvStream.errored} ${csvStream.pending}`,
    );
  }
}
