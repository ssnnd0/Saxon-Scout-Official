// Saxon Scout API - Main Export File
// Provides a unified interface for all API functionality

// Core API client and types
export { apiClient, defaultAPIConfig, defaultCacheConfig } from './client';
export * from './types';

// React hooks for API integration
export * from './hooks';

// React context for API state management
export { 
  APIProvider, 
  useAPI, 
  withAPI, 
  APIErrorBoundary,
  useOnlineStatus,
  useCacheManagement,
  useAPIError
} from './context';

// High-level service functions
export { 
  TeamService, 
  EventService, 
  ScoutingService, 
  AnalyticsService 
} from './services';

// Re-export commonly used types for convenience
export type {
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
  UseAPIState,
  UseAPIWithPaginationState
} from './types';
