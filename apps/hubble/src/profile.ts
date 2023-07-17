import { RootPrefix, UserMessagePostfixMax, UserPostfix } from "./storage/db/types.js";
import { logger } from "./utils/logger.js";
import RocksDB from "./storage/db/rocksdb.js";

// rome-ignore lint/suspicious/noExplicitAny: Generic check for enums needs 'any'
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

// Pretty print a percentage
function formatPercentage(num?: number): string {
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
  median: number;
  average: number;
  sum: number;

  allValues: number[];

  label: string;

  constructor(label = "") {
    this.count = 0;
    this.min = 0;
    this.max = 0;
    this.median = 0;
    this.average = 0;
    this.sum = 0;
    this.allValues = [];

    this.label = label;
  }

  addValue(value: number) {
    this.count++;

    this.allValues.push(value);
  }

  calculate() {
    this.sum = this.allValues.reduce((a, b) => a + b, 0);

    let min = Number.MAX_SAFE_INTEGER;
    let max = Number.MIN_SAFE_INTEGER;
    for (let i = 0; i < this.allValues.length; i++) {
      if ((this.allValues[i] as number) < min) {
        min = this.allValues[i] as number;
      }

      if ((this.allValues[i] as number) > max) {
        max = this.allValues[i] as number;
      }
    }

    this.min = min;
    this.max = max;

    this.median = this.allValues[Math.floor(this.allValues.length / 2)] || 0;
    this.average = this.sum / this.count;
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
  // First, calculate all the valueStats
  for (let i = 0; i < valueStats.length; i++) {
    valueStats[i]?.calculate();
  }

  const data = [];
  // First, write the headers to the first row
  data.push(["Prefix", "Count", "Total", "Min", "Max", "Median", "Average"]);

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
        formatNumber(valueStats[i]?.median),
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
    new KeysProfile("Others"),
  ];

  for (let i = 0; i < keysProfile.length; i++) {
    const kp = keysProfile[i] as KeysProfile;

    let index = 0;

    if (i === RootPrefix.User) {
      index = 0;
    } else if (
      (i >= RootPrefix.CastsByParent && i <= RootPrefix.ReactionsByTarget) ||
      i === RootPrefix.IdRegistryEventByCustodyAddress ||
      i === RootPrefix.NameRegistryEventsByExpiry
    ) {
      index = 1;
    } else if (i === RootPrefix.SyncMerkleTrieNode) {
      index = 2;
    } else if (i === RootPrefix.HubEvents) {
      index = 3;
    } else {
      index = 4;
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
export async function profileStorageUsed(rocksDB: RocksDB) {
  const allKeys = new KeysProfile("All Keys");
  const prefixKeys = Array.from(
    { length: getMaxValue(RootPrefix) + 1 },
    (_v, i: number) => new KeysProfile(RootPrefix[i]?.toString()),
  );

  const userPostfixKeys = Array.from(
    { length: getMaxValue(UserPostfix) + 1 },
    (_v, i: number) => new KeysProfile(UserPostfix[i]?.toString()),
  );

  // Caclulate the individual message sizes
  const valueStats = Array.from({ length: 7 }, (_v, i: number) => new ValueStats(UserPostfix[i]?.toString()));

  // Iterate over all the keys in the DB
  await rocksDB.forEachIterator(
    (key, value) => {
      allKeys.count++;
      allKeys.keyBytes += key?.length || 0;
      allKeys.valueBytes += value?.length || 0;

      if (key && key.length > 0) {
        const prefix = key[0] as number;

        if (prefix > 0 && prefix < prefixKeys.length) {
          (prefixKeys[prefix] as KeysProfile).count++;
          (prefixKeys[prefix] as KeysProfile).keyBytes += key?.length || 0;
          (prefixKeys[prefix] as KeysProfile).valueBytes += value?.length || 0;

          // Further categorize user data into user postfixes
          if (prefix === RootPrefix.User) {
            const postfix = key[1 + 4] as number;

            if (postfix > 0 && postfix < userPostfixKeys.length) {
              (userPostfixKeys[postfix] as KeysProfile).count++;
              (userPostfixKeys[postfix] as KeysProfile).keyBytes += key?.length || 0;
              (userPostfixKeys[postfix] as KeysProfile).valueBytes += value?.length || 0;

              if (postfix <= UserPostfix.UserDataMessage) {
                (valueStats[postfix] as ValueStats).addValue(value?.length || 0);
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
      }
    },
    {},
    1 * 60 * 60 * 1000, // 1 hour timeout
  );

  logger.info(`RocksDB contains ${allKeys.toString()}`);

  console.log("\nBy Prefix:\n");
  console.log(prettyPrintTable(KeysProfileToPrettyPrintObject(prefixKeys)));

  console.log("\nBy Data Type:\n");
  console.log(
    prettyPrintTable(KeysProfileToPrettyPrintObject(prefixProfileToDataType(prefixKeys, userPostfixKeys), true)),
  );

  console.log("\nBy User Data type:\n");
  console.log(prettyPrintTable(KeysProfileToPrettyPrintObject(userPostfixKeys)));

  console.log("\nValue Sizes (bytes):\n");
  console.log(prettyPrintTable(ValueStatsToPrettyPrintObject(valueStats)));

  console.log("\nTotals:\n");
  console.log(prettyPrintTable(KeysProfileToPrettyPrintObject([allKeys])));
}
