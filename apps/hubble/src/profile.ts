import { RootPrefix, UserPostfix } from "./storage/db/types.js";
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
function formatNumber(num?: number): string {
  if (num === undefined) return "";

  if (Math.abs(num) >= 1.0e12) return `${(Math.abs(num) / 1.0e12).toFixed(1)}T`;
  else if (Math.abs(num) >= 1.0e9) return `${(Math.abs(num) / 1.0e9).toFixed(1)}B`;
  else if (Math.abs(num) >= 1.0e6) return `${(Math.abs(num) / 1.0e6).toFixed(1)}M`;
  else if (Math.abs(num) >= 1.0e3) return `${(Math.abs(num) / 1.0e3).toFixed(1)}K`;
  else return num.toString();
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

// Return a string that can printed to console of a table with the data
function prettyPrintTable(data: (string | number)[][]): string {
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
function toPrettyPrintObject(keysProfile: KeysProfile[]): string[][] {
  const data = [];
  // First, write the headers to the first row
  data.push(["Prefix", "Count", "Key Bytes", "Value Bytes", "Total Bytes %"]);

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
      data.push([
        label,
        formatNumber(keysProfile[i]?.count),
        formatNumber(keysProfile[i]?.keyBytes),
        formatNumber(keysProfile[i]?.valueBytes),
        formatPercentage(((keysProfile[i]?.valueBytes || 0) + (keysProfile[i]?.keyBytes || 0)) / totalBytes),
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

    if (kp.label.includes("User")) {
      index = 0;
    } else if (kp.label.includes("By")) {
      index = 1;
    } else if (kp.label.includes("Trie")) {
      index = 2;
    } else if (kp.label.includes("HubEvents")) {
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

    if (i >= 86) {
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
  // Iterate over all the keys in the DB
  const iterator = rocksDB.iterator();

  const allKeys = new KeysProfile("All Keys");
  const prefixKeys = Array.from(
    { length: getMaxValue(RootPrefix) + 1 },
    (_v, i: number) => new KeysProfile(RootPrefix[i]?.toString()),
  );

  const userPostfixKeys = Array.from(
    { length: getMaxValue(UserPostfix) + 1 },
    (_v, i: number) => new KeysProfile(UserPostfix[i]?.toString()),
  );

  for await (const [key, value] of iterator) {
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
  }

  logger.info(`RocksDB contains ${allKeys.toString()}`);

  console.log(prettyPrintTable(toPrettyPrintObject(prefixKeys)));

  console.log("\nBy Data Type:\n");
  console.log(prettyPrintTable(toPrettyPrintObject(prefixProfileToDataType(prefixKeys, userPostfixKeys))));

  console.log("\nBy User Data type:\n");
  console.log(prettyPrintTable(toPrettyPrintObject(userPostfixKeys)));

  console.log("\nTotals:\n");
  console.log(prettyPrintTable(toPrettyPrintObject([allKeys])));
}
