/**
 * API Cache Utility
 * Implements in-memory caching with TTL for API responses
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class ApiCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      // Cache expired, remove it
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached data with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };

    this.cache.set(key, entry);
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear specific key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all keys matching a pattern
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Clean up expired entries (garbage collection)
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Singleton instance
export const apiCache = new ApiCache();

// Auto cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Decorator function for caching async functions
 */
export function cached<T>(
  key: string,
  ttl?: number
): (fn: () => Promise<T>) => Promise<T> {
  return async (fn: () => Promise<T>): Promise<T> => {
    // Check cache first
    const cached = apiCache.get<T>(key);
    if (cached !== null) {
      console.log(`[Cache HIT] ${key}`);
      return cached;
    }

    console.log(`[Cache MISS] ${key}`);
    // Fetch fresh data
    const data = await fn();
    
    // Store in cache
    apiCache.set(key, data, ttl);
    
    return data;
  };
}

/**
 * Stale-while-revalidate pattern
 * Returns cached data immediately if available, but fetches fresh data in background
 */
export async function staleWhileRevalidate<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = apiCache.get<T>(key);
  
  if (cached !== null) {
    // Return cached data immediately
    console.log(`[SWR Cache HIT] ${key} - returning stale, revalidating...`);
    
    // Fetch fresh data in background
    fetcher().then(freshData => {
      apiCache.set(key, freshData, ttl);
      console.log(`[SWR Revalidated] ${key}`);
    }).catch(err => {
      console.warn(`[SWR Revalidation failed] ${key}:`, err);
    });
    
    return cached;
  }

  // No cached data, fetch fresh
  console.log(`[SWR Cache MISS] ${key} - fetching...`);
  const data = await fetcher();
  apiCache.set(key, data, ttl);
  return data;
}
