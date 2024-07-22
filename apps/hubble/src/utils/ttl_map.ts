/**
 * TTLMap - A high-performance Time-To-Live Map implementation
 *
 * This data structure provides a Map-like interface with automatic expiration of entries.
 * It is designed for scenarios with thousands of elements and frequent bulk retrieval operations.
 *
 * Key features:
 * - Constant-time complexity for get, set, and delete operations
 * - Efficient bulk retrieval of non-expired entries
 * - Coarse-grained TTL defined at the Map level
 * - Ability to reset TTL for individual entries
 *
 * @template K The type of keys in the map
 * @template V The type of values in the map
 */
export class TTLMap<K, V> {
  private map: Map<K, { value: V; expiresAt: number }>;
  private readonly ttl: number;
  private lastCleanup: number;
  private readonly cleanupInterval: number;
  private nonExpiredCount: number;

  /**
   * @param ttl Time-to-live in milliseconds for entries
   * @param cleanupInterval Optional interval for running the cleanup process (default: ttl / 2)
   */
  constructor(ttl: number, cleanupInterval?: number) {
    this.map = new Map();
    this.ttl = ttl;
    this.lastCleanup = Date.now();
    this.cleanupInterval = cleanupInterval || Math.floor(ttl / 2);
    this.nonExpiredCount = 0;
  }

  /**
   * Sets a key-value pair in the map with the current TTL
   * @param key The key to set
   * @param value The value to set
   * @returns The TTLMap instance for method chaining
   */
  set(key: K, value: V): this {
    const now = Date.now();
    const expiresAt = now + this.ttl;
    const existingEntry = this.map.get(key);

    if (!existingEntry) {
      this.nonExpiredCount++;
    }

    this.map.set(key, { value, expiresAt });
    this.cleanupIfNeeded();
    return this;
  }

  /**
   * Retrieves a value from the map if it exists and hasn't expired
   * @param key The key to retrieve
   * @returns The value if found and not expired, undefined otherwise
   */
  get(key: K): V | undefined {
    const entry = this.map.get(key);
    if (entry) {
      if (entry.expiresAt > Date.now()) {
        return entry.value;
      } else {
        this.map.delete(key);
        this.nonExpiredCount--;
      }
    }
    return undefined;
  }

  /**
   * Deletes a key-value pair from the map
   * @param key The key to delete
   * @returns true if the element was in the map and not expired, false otherwise
   */
  delete(key: K): boolean {
    const entry = this.map.get(key);
    if (entry) {
      if (entry.expiresAt > Date.now()) {
        this.nonExpiredCount--;
      }
      return this.map.delete(key);
    }
    return false;
  }

  /**
   * Resets the TTL for a given key without changing its value
   * @param key The key to reset the TTL for
   * @returns true if the key exists and TTL was reset, false otherwise
   */
  resetTTL(key: K): boolean {
    const entry = this.map.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + this.ttl;
      return true;
    }
    return false;
  }

  /**
   * Retrieves all non-expired entries from the map
   * This method is optimized for frequent calls and large datasets
   * @returns An array of [key, value] pairs for all non-expired entries
   */
  getAll(): [K, V][] {
    this.cleanupIfNeeded();
    const now = Date.now();
    return Array.from(this.map.entries())
      .filter(([, { expiresAt }]) => expiresAt > now)
      .map(([key, { value }]) => [key, value]);
  }

  /**
   * Clears all entries from the map
   */
  clear(): void {
    this.nonExpiredCount = 0;
    this.map.clear();
  }

  /**
   * Returns the number of non-expired entries in the map
   * @returns The number of non-expired entries in the map
   */
  size(): number {
    this.cleanupIfNeeded();
    return this.nonExpiredCount;
  }

  /**
   * Performs cleanup of expired entries if the cleanup interval has elapsed
   * This method is called internally and doesn't need to be invoked manually
   */
  private cleanupIfNeeded(): void {
    const now = Date.now();
    if (now - this.lastCleanup > this.cleanupInterval) {
      let nonExpired = 0;
      this.map.forEach((entry, key) => {
        if (entry.expiresAt <= now) {
          this.map.delete(key);
        } else {
          nonExpired++;
        }
      });
      this.lastCleanup = now;
      this.nonExpiredCount = nonExpired;
    }
  }
}
