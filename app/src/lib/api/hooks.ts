// React hooks for API integration
// Provides easy-to-use hooks for data fetching with loading states and error handling

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from './client';
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
  UseAPIState,
  UseAPIWithPaginationState
} from './types';

// ============================================================================
// Generic API Hook
// ============================================================================

export function useAPI<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
): UseAPIState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

// ============================================================================
// Paginated API Hook
// ============================================================================

export function useAPIPagination<T>(
  apiCall: (page: number, limit: number) => Promise<{ data: T[]; pagination: any }>,
  initialPage: number = 1,
  initialLimit: number = 20
): UseAPIWithPaginationState<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0
  });

  const fetchData = useCallback(async (page: number, limit: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall(page, limit);
      setData(result.data);
      setPagination(result.pagination);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const setPage = useCallback((page: number) => {
    fetchData(page, pagination.limit);
  }, [fetchData, pagination.limit]);

  const setLimit = useCallback((limit: number) => {
    fetchData(1, limit);
  }, [fetchData]);

  useEffect(() => {
    fetchData(initialPage, initialLimit);
  }, [fetchData, initialPage, initialLimit]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(pagination.page, pagination.limit),
    pagination,
    setPage,
    setLimit
  };
}

// ============================================================================
// The Blue Alliance Hooks
// ============================================================================

export function useTBATeam(teamNumber: number) {
  return useAPI(
    () => apiClient.getTeam(teamNumber),
    [teamNumber]
  );
}

export function useTBATeamEvents(teamNumber: number, year?: number) {
  return useAPI(
    () => apiClient.getTeamEvents(teamNumber, year),
    [teamNumber, year]
  );
}

export function useTBATeamMatches(teamNumber: number, eventKey: string) {
  return useAPI(
    () => apiClient.getTeamMatches(teamNumber, eventKey),
    [teamNumber, eventKey]
  );
}

export function useTBATeamStats(teamNumber: number, eventKey: string) {
  return useAPI(
    () => apiClient.getTeamStats(teamNumber, eventKey),
    [teamNumber, eventKey]
  );
}

export function useTBAEvent(eventKey: string) {
  return useAPI(
    () => apiClient.getEvent(eventKey),
    [eventKey]
  );
}

export function useTBAEventTeams(eventKey: string) {
  return useAPI(
    () => apiClient.getEventTeams(eventKey),
    [eventKey]
  );
}

export function useTBAEventMatches(eventKey: string) {
  return useAPI(
    () => apiClient.getEventMatches(eventKey),
    [eventKey]
  );
}

export function useTBAEventRankings(eventKey: string) {
  return useAPI(
    () => apiClient.getEventRankings(eventKey),
    [eventKey]
  );
}

export function useTBAEventAwards(eventKey: string) {
  return useAPI(
    () => apiClient.getEventAwards(eventKey),
    [eventKey]
  );
}

// ============================================================================
// FIRST API Hooks
// ============================================================================

export function useFIRSTEvent(eventCode: string) {
  return useAPI(
    () => apiClient.getFIRSTEvent(eventCode),
    [eventCode]
  );
}

export function useFIRSTTeam(teamNumber: number) {
  return useAPI(
    () => apiClient.getFIRSTTeam(teamNumber),
    [teamNumber]
  );
}

export function useFIRSTMatches(eventCode: string) {
  return useAPI(
    () => apiClient.getFIRSTMatches(eventCode),
    [eventCode]
  );
}

// ============================================================================
// Local API Hooks (Saxon Scout specific)
// ============================================================================

export function useScoutedMatches(teamNumber?: number) {
  return useAPI(
    () => apiClient.getScoutedMatches(teamNumber),
    [teamNumber]
  );
}

export function useScoutedPits(teamNumber?: number) {
  return useAPI(
    () => apiClient.getScoutedPits(teamNumber),
    [teamNumber]
  );
}

export function useTeamStats(teamNumber: number) {
  return useAPI(
    () => apiClient.getLocalTeamStats(teamNumber),
    [teamNumber]
  );
}

export function useAllTeamStats() {
  return useAPI(
    () => apiClient.getAllTeamStats(),
    []
  );
}

// ============================================================================
// Mutation Hooks (for creating/updating data)
// ============================================================================

export function useSaveScoutedMatch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveMatch = useCallback(async (match: ScoutedMatch) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiClient.saveScoutedMatch(match);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to save match');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    saveMatch,
    loading,
    error
  };
}

export function useSaveScoutedPit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savePit = useCallback(async (pit: ScoutedPit) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiClient.saveScoutedPit(pit);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to save pit data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    savePit,
    loading,
    error
  };
}

// ============================================================================
// Advanced Hooks
// ============================================================================

export function useTeamComparison(teamNumbers: number[], eventKey: string) {
  const [data, setData] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComparison = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const promises = teamNumbers.map(async (teamNumber) => {
        const [team, stats, matches] = await Promise.all([
          apiClient.getTeam(teamNumber),
          apiClient.getTeamStats(teamNumber, eventKey),
          apiClient.getTeamMatches(teamNumber, eventKey)
        ]);
        
        return {
          teamNumber,
          team,
          stats,
          matches
        };
      });
      
      const results = await Promise.all(promises);
      const comparisonData = results.reduce((acc, result) => {
        acc[result.teamNumber] = result;
        return acc;
      }, {} as Record<number, any>);
      
      setData(comparisonData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch team comparison');
      console.error('Team comparison error:', err);
    } finally {
      setLoading(false);
    }
  }, [teamNumbers, eventKey]);

  useEffect(() => {
    if (teamNumbers.length > 0 && eventKey) {
      fetchComparison();
    }
  }, [fetchComparison]);

  return {
    data,
    loading,
    error,
    refetch: fetchComparison
  };
}

export function useEventOverview(eventKey: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [event, teams, matches, rankings, awards] = await Promise.all([
        apiClient.getEvent(eventKey),
        apiClient.getEventTeams(eventKey),
        apiClient.getEventMatches(eventKey),
        apiClient.getEventRankings(eventKey),
        apiClient.getEventAwards(eventKey)
      ]);
      
      setData({
        event,
        teams,
        matches,
        rankings,
        awards
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch event overview');
      console.error('Event overview error:', err);
    } finally {
      setLoading(false);
    }
  }, [eventKey]);

  useEffect(() => {
    if (eventKey) {
      fetchOverview();
    }
  }, [fetchOverview]);

  return {
    data,
    loading,
    error,
    refetch: fetchOverview
  };
}

// ============================================================================
// Cache Management Hook
// ============================================================================

export function useAPICache() {
  const [cacheStats, setCacheStats] = useState(apiClient.getCacheStats());

  const clearCache = useCallback(() => {
    apiClient.clearCache();
    setCacheStats(apiClient.getCacheStats());
  }, []);

  const refreshStats = useCallback(() => {
    setCacheStats(apiClient.getCacheStats());
  }, []);

  return {
    cacheStats,
    clearCache,
    refreshStats
  };
}
