/**
 * Cache Manager for Saxon Scout
 * Provides efficient caching mechanisms for API responses and frequently accessed data
 */

// Cache expiration times (in milliseconds)
const CACHE_EXPIRY = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 24 * 60 * 60 * 1000, // 24 hours
  PERMANENT: Infinity // Never expires
};

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

/**
 * In-memory cache for API responses and frequently accessed data
 */
class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  
  /**
   * Set a value in the cache
   * @param key Cache key
   * @param data Data to cache
   * @param expiry Expiration time in milliseconds
   */
  set<T>(key: string, data: T, expiry: number = CACHE_EXPIRY.MEDIUM): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry
    });
  }
  
  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns Cached data or null if not found or expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if entry has expired
    if (entry.expiry !== Infinity && Date.now() - entry.timestamp > entry.expiry) {
      this.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  /**
   * Delete a value from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Clear expired entries from the cache
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry !== Infinity && now - entry.timestamp > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Get the number of entries in the cache
   */
  get size(): number {
    return this.cache.size;
  }
}

/**
 * Persistent cache using localStorage
 */
class PersistentCache {
  private prefix: string;
  
  constructor(prefix: string = 'saxon_scout_cache_') {
    this.prefix = prefix;
  }
  
  /**
   * Set a value in the persistent cache
   * @param key Cache key
   * @param data Data to cache
   * @param expiry Expiration time in milliseconds
   */
  set<T>(key: string, data: T, expiry: number = CACHE_EXPIRY.MEDIUM): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiry
      };
      
      localStorage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch (error) {
      console.error('Failed to set persistent cache item:', error);
    }
  }
  
  /**
   * Get a value from the persistent cache
   * @param key Cache key
   * @returns Cached data or null if not found or expired
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;
      
      const entry = JSON.parse(item) as CacheEntry<T>;
      
      // Check if entry has expired
      if (entry.expiry !== Infinity && Date.now() - entry.timestamp > entry.expiry) {
        this.delete(key);
        return null;
      }
      
      return entry.data;
    } catch (error) {
      console.error('Failed to get persistent cache item:', error);
      return null;
    }
  }
  
  /**
   * Delete a value from the persistent cache
   * @param key Cache key
   */
  delete(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }
  
  /**
   * Clear all entries from the persistent cache
   */
  clear(): void {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    }
  }
  
  /**
   * Clear expired entries from the persistent cache
   */
  clearExpired(): void {
    const now = Date.now();
    const keys = Object.keys(localStorage);
    
    for (const key of keys) {
      if (key.startsWith(this.prefix)) {
        try {
          const item = localStorage.getItem(key);
          if (!item) continue;
          
          const entry = JSON.parse(item) as CacheEntry<any>;
          
          if (entry.expiry !== Infinity && now - entry.timestamp > entry.expiry) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          // If we can't parse the item, remove it
          localStorage.removeItem(key);
        }
      }
    }
  }
}

// Create singleton instances
const memoryCache = new MemoryCache();
const persistentCache = new PersistentCache();

// Set up periodic cleanup of expired cache entries
setInterval(() => {
  memoryCache.clearExpired();
  persistentCache.clearExpired();
}, 5 * 60 * 1000); // Clean up every 5 minutes

// Export cache instances and constants
export {
  memoryCache,
  persistentCache,
  CACHE_EXPIRY
};