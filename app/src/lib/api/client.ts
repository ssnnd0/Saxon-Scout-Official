// Comprehensive API client for Saxon Scout
// Handles The Blue Alliance, FIRST API, and local API calls

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { 
  TBATeam, 
  TBAEvent, 
  TBAMatch, 
  TBARanking, 
  TBAAward,
  FIRSTEvent,
  FIRSTTeam,
  FIRSTMatch,
  ScoutedMatch,
  ScoutedPit,
  TeamStats,
  APIResponse,
  PaginatedResponse,
  APIConfig,
  CacheConfig,
  APIError
} from './types';

// ============================================================================
// Environment Variables Helper
// ============================================================================

const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // In browser, we can't access process.env directly
  // These would typically be set at build time or via window object
  if (typeof window !== 'undefined' && (window as any).__ENV__) {
    return (window as any).__ENV__[key] || defaultValue;
  }
  return defaultValue;
};

// ============================================================================
// Cache Implementation
// ============================================================================

class APICache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  set(key: string, data: any, ttl?: number): void {
    if (!this.config.enabled) return;
    
    const now = Date.now();
    const cacheTTL = ttl || this.config.ttl * 1000;
    
    this.cache.set(key, {
      data,
      timestamp: now,
      ttl: cacheTTL
    });

    // Clean up expired entries
    this.cleanup();
  }

  get(key: string): any | null {
    if (!this.config.enabled) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// ============================================================================
// API Client Class
// ============================================================================

export class SaxonScoutAPI {
  private tbaClient: AxiosInstance;
  private firstClient: AxiosInstance;
  private localClient: AxiosInstance;
  private cache: APICache;
  private config: APIConfig;

  constructor(config: APIConfig, cacheConfig: CacheConfig) {
    this.config = config;
    this.cache = new APICache(cacheConfig);

    // Initialize TBA client
    this.tbaClient = axios.create({
      baseURL: config.tba.baseURL,
      timeout: config.tba.timeout,
      headers: {
        'X-TBA-Auth-Key': config.tba.apiKey,
        'Content-Type': 'application/json'
      }
    });

    // Initialize FIRST API client
    this.firstClient = axios.create({
      baseURL: config.first.baseURL,
      timeout: config.first.timeout,
      auth: {
        username: config.first.username,
        password: config.first.password
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Initialize local API client
    this.localClient = axios.create({
      baseURL: config.local.baseURL,
      timeout: config.local.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for caching
    this.tbaClient.interceptors.request.use((config) => {
      const cacheKey = this.getCacheKey(config);
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        console.log('Cache hit for:', cacheKey);
        return Promise.reject({ cached: true, data: cached });
      }
      
      console.log('Cache miss for:', cacheKey);
      return config;
    });

    // Response interceptor for caching
    this.tbaClient.interceptors.response.use(
      (response) => {
        const cacheKey = this.getCacheKey(response.config);
        this.cache.set(cacheKey, response.data, 300000); // 5 minutes
        return response;
      },
      (error) => {
        if (error.cached) {
          return Promise.resolve({ data: error.data, status: 200 });
        }
        return Promise.reject(this.handleError(error));
      }
    );

    // Error handling for all clients
    [this.tbaClient, this.firstClient, this.localClient].forEach(client => {
      client.interceptors.response.use(
        (response) => response,
        (error) => Promise.reject(this.handleError(error))
      );
    });
  }

  private getCacheKey(config: AxiosRequestConfig): string {
    return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
  }

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

  // ============================================================================
  // The Blue Alliance API Methods
  // ============================================================================

  async getTeam(teamNumber: number): Promise<TBATeam> {
    const response = await this.tbaClient.get(`/team/frc${teamNumber}`);
    return response.data;
  }

  async getTeamEvents(teamNumber: number, year?: number): Promise<TBAEvent[]> {
    const yearParam = year ? `/${year}` : '';
    const response = await this.tbaClient.get(`/team/frc${teamNumber}/events${yearParam}`);
    return response.data;
  }

  async getTeamMatches(teamNumber: number, eventKey: string): Promise<TBAMatch[]> {
    const response = await this.tbaClient.get(`/team/frc${teamNumber}/event/${eventKey}/matches`);
    return response.data;
  }

  async getTeamStats(teamNumber: number, eventKey: string): Promise<TBARanking> {
    const response = await this.tbaClient.get(`/team/frc${teamNumber}/event/${eventKey}/status`);
    return response.data;
  }

  async getEvent(eventKey: string): Promise<TBAEvent> {
    const response = await this.tbaClient.get(`/event/${eventKey}`);
    return response.data;
  }

  async getEventTeams(eventKey: string): Promise<TBATeam[]> {
    const response = await this.tbaClient.get(`/event/${eventKey}/teams`);
    return response.data;
  }

  async getEventMatches(eventKey: string): Promise<TBAMatch[]> {
    const response = await this.tbaClient.get(`/event/${eventKey}/matches`);
    return response.data;
  }

  async getEventRankings(eventKey: string): Promise<TBARanking[]> {
    const response = await this.tbaClient.get(`/event/${eventKey}/rankings`);
    return response.data;
  }

  async getEventAwards(eventKey: string): Promise<TBAAward[]> {
    const response = await this.tbaClient.get(`/event/${eventKey}/awards`);
    return response.data;
  }

  // ============================================================================
  // FIRST API Methods
  // ============================================================================

  async getFIRSTEvent(eventCode: string): Promise<FIRSTEvent> {
    const response = await this.firstClient.get(`/events/${eventCode}`);
    return response.data;
  }

  async getFIRSTTeam(teamNumber: number): Promise<FIRSTTeam> {
    const response = await this.firstClient.get(`/teams/${teamNumber}`);
    return response.data;
  }

  async getFIRSTMatches(eventCode: string): Promise<FIRSTMatch[]> {
    const response = await this.firstClient.get(`/events/${eventCode}/matches`);
    return response.data;
  }

  // ============================================================================
  // Local API Methods (Saxon Scout specific)
  // ============================================================================

  async saveScoutedMatch(match: ScoutedMatch): Promise<APIResponse<ScoutedMatch>> {
    const response = await this.localClient.post('/api/scouting/matches', match);
    return response.data;
  }

  async getScoutedMatches(teamNumber?: number): Promise<APIResponse<ScoutedMatch[]>> {
    const params = teamNumber ? { team: teamNumber } : {};
    const response = await this.localClient.get('/api/scouting/matches', { params });
    return response.data;
  }

  async saveScoutedPit(pit: ScoutedPit): Promise<APIResponse<ScoutedPit>> {
    const response = await this.localClient.post('/api/scouting/pit', pit);
    return response.data;
  }

  async getScoutedPits(teamNumber?: number): Promise<APIResponse<ScoutedPit[]>> {
    const params = teamNumber ? { team: teamNumber } : {};
    const response = await this.localClient.get('/api/scouting/pit', { params });
    return response.data;
  }

  async getLocalTeamStats(teamNumber: number): Promise<APIResponse<TeamStats>> {
    const response = await this.localClient.get(`/api/scouting/stats/${teamNumber}`);
    return response.data;
  }

  async getAllTeamStats(): Promise<APIResponse<TeamStats[]>> {
    const response = await this.localClient.get('/api/scouting/stats');
    return response.data;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache['cache'].size,
      keys: Array.from(this.cache['cache'].keys())
    };
  }
}

// ============================================================================
// Default Configuration
// ============================================================================

export const defaultAPIConfig: APIConfig = {
  tba: {
    baseURL: 'https://www.thebluealliance.com/api/v3',
    apiKey: getEnvVar('REACT_APP_TBA_API_KEY', ''),
    timeout: 10000
  },
  first: {
    baseURL: 'https://frc-api.firstinspires.org/v2.0',
    username: getEnvVar('REACT_APP_FIRST_USERNAME', ''),
    password: getEnvVar('REACT_APP_FIRST_PASSWORD', ''),
    timeout: 10000
  },
  local: {
    baseURL: ((): string => {
      const env = getEnvVar('REACT_APP_API_URL', '');
      if (env) return env;
      if (typeof window !== 'undefined' && window.location) {
        return window.location.origin;
      }
      return '';
    })(),
    timeout: 5000
  }
};

export const defaultCacheConfig: CacheConfig = {
  ttl: 300, // 5 minutes
  maxSize: 1000,
  enabled: true
};

// ============================================================================
// Singleton Instance
// ============================================================================

export const apiClient = new SaxonScoutAPI(defaultAPIConfig, defaultCacheConfig);
