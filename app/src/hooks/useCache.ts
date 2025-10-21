import { useState, useEffect, useCallback } from 'react';
import { memoryCache, persistentCache, CACHE_EXPIRY } from '../lib/cacheManager';

type CacheType = 'memory' | 'persistent';

interface UseCacheOptions {
  type?: CacheType;
  expiry?: number;
  revalidate?: boolean;
  onError?: (error: any) => void;
}

/**
 * React hook for using the cache system
 * @param key Cache key
 * @param fetcher Function to fetch data if not in cache
 * @param options Cache options
 * @returns Object containing data, loading state, error, and refetch function
 */
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {}
) {
  const {
    type = 'memory',
    expiry = CACHE_EXPIRY.MEDIUM,
    revalidate = false,
    onError
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  // Get the appropriate cache based on type
  const cache = type === 'memory' ? memoryCache : persistentCache;

  const fetchData = useCallback(async (skipCache = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to get from cache first (unless skipCache is true)
      if (!skipCache) {
        const cachedData = cache.get<T>(key);
        if (cachedData) {
          setData(cachedData);
          setIsLoading(false);
          
          // If revalidate is true, fetch fresh data in the background
          if (revalidate) {
            fetchFreshData();
          }
          
          return;
        }
      }

      // If not in cache or skipCache is true, fetch fresh data
      await fetchFreshData();
    } catch (err) {
      setError(err);
      if (onError) onError(err);
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, cache, expiry, revalidate]);

  // Helper function to fetch fresh data
  const fetchFreshData = async () => {
    try {
      const freshData = await fetcher();
      setData(freshData);
      cache.set(key, freshData, expiry);
    } catch (err) {
      setError(err);
      if (onError) onError(err);
      throw err;
    }
  };

  // Function to manually refetch data
  const refetch = useCallback(() => fetchData(true), [fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [key, fetchData]);

  return { data, isLoading, error, refetch };
}

/**
 * React hook for using the cache system with multiple keys
 * @param keys Array of cache keys
 * @param fetcher Function to fetch data for a specific key if not in cache
 * @param options Cache options
 * @returns Object containing data map, loading state, error, and refetch function
 */
export function useCacheMap<T>(
  keys: string[],
  fetcher: (key: string) => Promise<T>,
  options: UseCacheOptions = {}
) {
  const {
    type = 'memory',
    expiry = CACHE_EXPIRY.MEDIUM,
    revalidate = false,
    onError
  } = options;

  const [dataMap, setDataMap] = useState<Record<string, T>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  // Get the appropriate cache based on type
  const cache = type === 'memory' ? memoryCache : persistentCache;

  const fetchData = useCallback(async (skipCache = false) => {
    setIsLoading(true);
    setError(null);

    const newDataMap: Record<string, T> = { ...dataMap };
    const fetchPromises: Promise<void>[] = [];

    for (const key of keys) {
      fetchPromises.push(
        (async () => {
          try {
            // Try to get from cache first (unless skipCache is true)
            if (!skipCache) {
              const cachedData = cache.get<T>(key);
              if (cachedData) {
                newDataMap[key] = cachedData;
                return;
              }
            }

            // If not in cache or skipCache is true, fetch fresh data
            const freshData = await fetcher(key);
            newDataMap[key] = freshData;
            cache.set(key, freshData, expiry);
          } catch (err) {
            if (onError) onError(err);
            throw err;
          }
        })()
      );
    }

    try {
      await Promise.all(fetchPromises);
      setDataMap(newDataMap);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [keys, fetcher, cache, expiry, dataMap]);

  // Function to manually refetch data
  const refetch = useCallback(() => fetchData(true), [fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [JSON.stringify(keys), fetchData]);

  return { dataMap, isLoading, error, refetch };
}