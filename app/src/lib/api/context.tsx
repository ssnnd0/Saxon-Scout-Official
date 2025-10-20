// React Context for API state management
// Provides global API state and configuration

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { apiClient } from './client';
import { APIConfig, CacheConfig } from './types';

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
// API Context Types
// ============================================================================

interface APIState {
  config: APIConfig;
  cacheConfig: CacheConfig;
  isOnline: boolean;
  lastError: string | null;
  cacheStats: {
    size: number;
    keys: string[];
  };
}

interface APIActions {
  setConfig: (config: APIConfig) => void;
  setCacheConfig: (config: CacheConfig) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  setError: (error: string | null) => void;
  clearCache: () => void;
  refreshCacheStats: () => void;
}

type APIAction = 
  | { type: 'SET_CONFIG'; payload: APIConfig }
  | { type: 'SET_CACHE_CONFIG'; payload: CacheConfig }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_CACHE' }
  | { type: 'REFRESH_CACHE_STATS' };

// ============================================================================
// Initial State
// ============================================================================

const initialState: APIState = {
  config: {
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
  },
  cacheConfig: {
    ttl: 300, // 5 minutes
    maxSize: 1000,
    enabled: true
  },
  isOnline: navigator.onLine,
  lastError: null,
  cacheStats: {
    size: 0,
    keys: []
  }
};

// ============================================================================
// Reducer
// ============================================================================

function apiReducer(state: APIState, action: APIAction): APIState {
  switch (action.type) {
    case 'SET_CONFIG':
      return { ...state, config: action.payload };
    
    case 'SET_CACHE_CONFIG':
      return { ...state, cacheConfig: action.payload };
    
    case 'SET_ONLINE_STATUS':
      return { ...state, isOnline: action.payload };
    
    case 'SET_ERROR':
      return { ...state, lastError: action.payload };
    
    case 'CLEAR_CACHE':
      apiClient.clearCache();
      return { 
        ...state, 
        cacheStats: { size: 0, keys: [] },
        lastError: null 
      };
    
    case 'REFRESH_CACHE_STATS':
      return { 
        ...state, 
        cacheStats: apiClient.getCacheStats() 
      };
    
    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

const APIContext = createContext<{
  state: APIState;
  actions: APIActions;
} | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

interface APIProviderProps {
  children: ReactNode;
  config?: Partial<APIConfig>;
  cacheConfig?: Partial<CacheConfig>;
}

export function APIProvider({ 
  children, 
  config: customConfig,
  cacheConfig: customCacheConfig 
}: APIProviderProps) {
  const [state, dispatch] = useReducer(apiReducer, {
    ...initialState,
    config: { ...initialState.config, ...customConfig },
    cacheConfig: { ...initialState.cacheConfig, ...customCacheConfig }
  });

  const actions: APIActions = {
    setConfig: (config: APIConfig) => {
      dispatch({ type: 'SET_CONFIG', payload: config });
    },

    setCacheConfig: (config: CacheConfig) => {
      dispatch({ type: 'SET_CACHE_CONFIG', payload: config });
    },

    setOnlineStatus: (isOnline: boolean) => {
      dispatch({ type: 'SET_ONLINE_STATUS', payload: isOnline });
    },

    setError: (error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error });
    },

    clearCache: () => {
      dispatch({ type: 'CLEAR_CACHE' });
    },

    refreshCacheStats: () => {
      dispatch({ type: 'REFRESH_CACHE_STATS' });
    }
  };

  // Monitor online/offline status
  React.useEffect(() => {
    const handleOnline = () => actions.setOnlineStatus(true);
    const handleOffline = () => actions.setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Refresh cache stats periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      actions.refreshCacheStats();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <APIContext.Provider value={{ state, actions }}>
      {children}
    </APIContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useAPI() {
  const context = useContext(APIContext);
  
  if (!context) {
    throw new Error('useAPI must be used within an APIProvider');
  }
  
  return context;
}

// ============================================================================
// Higher-Order Component
// ============================================================================

export function withAPI<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function WithAPIComponent(props: P) {
    return (
      <APIProvider>
        <Component {...props} />
      </APIProvider>
    );
  };
}

// ============================================================================
// Error Boundary
// ============================================================================

interface APIErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class APIErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode },
  APIErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): APIErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('API Error Boundary caught an error:', error, errorInfo);
    
    // Log to server if available
    if (apiClient) {
      fetch('/__client_log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'API_ERROR_BOUNDARY',
          error: error.message,
          stack: error.stack,
          errorInfo
        })
      }).catch(console.error);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="alert alert-danger m-3">
          <h4>API Error</h4>
          <p>Something went wrong with the API connection.</p>
          <details>
            <summary>Error Details</summary>
            <pre>{this.state.error?.message}</pre>
          </details>
          <button 
            className="btn btn-primary mt-2"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Utility Hooks
// ============================================================================

export function useOnlineStatus() {
  const { state, actions } = useAPI();
  
  return {
    isOnline: state.isOnline,
    setOnlineStatus: actions.setOnlineStatus
  };
}

export function useCacheManagement() {
  const { state, actions } = useAPI();
  
  return {
    cacheStats: state.cacheStats,
    clearCache: actions.clearCache,
    refreshStats: actions.refreshCacheStats
  };
}

export function useAPIError() {
  const { state, actions } = useAPI();
  
  return {
    error: state.lastError,
    setError: actions.setError,
    clearError: () => actions.setError(null)
  };
}
