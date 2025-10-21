/**
 * Optimized API Client with advanced caching
 * Provides improved performance through efficient caching strategies
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { memoryCache, persistentCache, CACHE_EXPIRY } from '../cacheManager';

// API response and error types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
}

// Cache configuration
interface CacheConfig {
  enabled: boolean;
  ttl: number;
  type: 'memory' | 'persistent';
}

// Default cache configuration
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  enabled: true,
  ttl: CACHE_EXPIRY.MEDIUM,
  type: 'memory'
};

/**
 * Enhanced API Client with advanced caching capabilities
 */
export class OptimizedAPIClient {
  private baseURL: string;
  private instance: AxiosInstance;
  private defaultCacheConfig: CacheConfig;
  
  constructor(
    baseURL: string,
    defaultCacheConfig: Partial<CacheConfig> = {}
  ) {
    this.baseURL = baseURL;
    this.defaultCacheConfig = { ...DEFAULT_CACHE_CONFIG, ...defaultCacheConfig };
    
    this.instance = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Add request interceptor for logging
    this.instance.interceptors.request.use(
      (config) => {
        // Log request (in development only)
        if (process.env['NODE_ENV'] === 'development') {
          console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Add response interceptor for error handling
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        const apiError = this.handleError(error);
        
        // Log error (in development only)
        if (process.env['NODE_ENV'] === 'development') {
          console.error('API Error:', apiError);
        }
        
        return Promise.reject(apiError);
      }
    );
  }
  
  /**
   * Make a GET request with caching
   * @param url Request URL
   * @param params Query parameters
   * @param cacheConfig Cache configuration
   * @returns Promise with response data
   */
  async get<T = any>(
    url: string,
    params: any = {},
    cacheConfig: Partial<CacheConfig> = {}
  ): Promise<T> {
    const config: AxiosRequestConfig = { params };
    const mergedCacheConfig = { ...this.defaultCacheConfig, ...cacheConfig };
    
    // Skip cache if disabled
    if (!mergedCacheConfig.enabled) {
      return this.request<T>('GET', url, config);
    }
    
    // Generate cache key
    const cacheKey = this.getCacheKey('GET', url, params);
    
    // Get appropriate cache based on type
    const cache = mergedCacheConfig.type === 'memory' ? memoryCache : persistentCache;
    
    // Try to get from cache first
    const cachedData = cache.get<T>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // If not in cache, fetch fresh data
    const data = await this.request<T>('GET', url, config);
    
    // Store in cache
    cache.set(cacheKey, data, mergedCacheConfig.ttl);
    
    return data;
  }
  
  /**
   * Make a POST request
   * @param url Request URL
   * @param data Request body
   * @param config Request configuration
   * @returns Promise with response data
   */
  async post<T = any>(
    url: string,
    data: any = {},
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    return this.request<T>('POST', url, { ...config, data });
  }
  
  /**
   * Make a PUT request
   * @param url Request URL
   * @param data Request body
   * @param config Request configuration
   * @returns Promise with response data
   */
  async put<T = any>(
    url: string,
    data: any = {},
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    return this.request<T>('PUT', url, { ...config, data });
  }
  
  /**
   * Make a DELETE request
   * @param url Request URL
   * @param config Request configuration
   * @returns Promise with response data
   */
  async delete<T = any>(
    url: string,
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    return this.request<T>('DELETE', url, config);
  }
  
  /**
   * Make a PATCH request
   * @param url Request URL
   * @param data Request body
   * @param config Request configuration
   * @returns Promise with response data
   */
  async patch<T = any>(
    url: string,
    data: any = {},
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    return this.request<T>('PATCH', url, { ...config, data });
  }
  
  /**
   * Make a request with the specified method
   * @param method HTTP method
   * @param url Request URL
   * @param config Request configuration
   * @returns Promise with response data
   */
  private async request<T = any>(
    method: string,
    url: string,
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    try {
      const response: AxiosResponse = await this.instance.request({
        method,
        url,
        ...config
      });
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Generate a cache key for the request
   * @param method HTTP method
   * @param url Request URL
   * @param params Query parameters
   * @returns Cache key
   */
  private getCacheKey(method: string, url: string, params: any = {}): string {
    return `${method}:${url}:${JSON.stringify(params)}`;
  }
  
  /**
   * Handle API errors
   * @param error Error object
   * @returns Standardized API error
   */
  private handleError(error: any): APIError {
    if (error.response) {
      return {
        code: `HTTP_${error.response.status}`,
        message: error.response.data?.message || error.message,
        details: error.response.data
      };
    } else if (error.request) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network request failed',
        details: { url: error.config?.url }
      };
    } else {
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unknown error occurred'
      };
    }
  }
  
  /**
   * Clear all cached data
   * @param type Cache type to clear (if not specified, clears both)
   */
  clearCache(type?: 'memory' | 'persistent'): void {
    if (!type || type === 'memory') {
      memoryCache.clear();
    }
    
    if (!type || type === 'persistent') {
      persistentCache.clear();
    }
  }
  
  /**
   * Clear expired cached data
   * @param type Cache type to clear expired entries from (if not specified, clears both)
   */
  clearExpiredCache(type?: 'memory' | 'persistent'): void {
    if (!type || type === 'memory') {
      memoryCache.clearExpired();
    }
    
    if (!type || type === 'persistent') {
      persistentCache.clearExpired();
    }
  }
  
  /**
   * Get cache statistics
   * @returns Object with cache statistics
   */
  getCacheStats(): { memory: { size: number }, persistent: { estimatedSize: string } } {
    return {
      memory: {
        size: memoryCache.size
      },
      persistent: {
        estimatedSize: `${Object.keys(localStorage).filter(key => key.startsWith('saxon_scout_cache_')).length} items`
      }
    };
  }
}

// Create API client instances
export const optimizedApiClient = new OptimizedAPIClient('/api');
export const optimizedTbaClient = new OptimizedAPIClient('https://www.thebluealliance.com/api/v3', {
  ttl: CACHE_EXPIRY.LONG // TBA data changes less frequently
});
export const optimizedFirstClient = new OptimizedAPIClient('https://frc-api.firstinspires.org/v3.0', {
  ttl: CACHE_EXPIRY.MEDIUM
});