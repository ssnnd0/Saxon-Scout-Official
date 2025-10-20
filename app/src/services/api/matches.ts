import { apiClient } from './client';

export interface Match {
  id: string;
  matchNumber: number;
  matchType: 'qualification' | 'quarterfinal' | 'semifinal' | 'final';
  eventId: string;
  eventName: string;
  scheduledTime: string;
  playedTime?: string;
  blueAlliance: Alliance;
  redAlliance: Alliance;
  score?: {
    blue: number;
    red: number;
  };
  winner?: 'red' | 'blue' | 'tie';
  data?: MatchData;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Alliance {
  teamIds: string[];
  teamNumbers: number[];
  teamNames: string[];
  score?: number;
  rankingPoints?: number;
  foulPoints?: number;
  autoPoints?: number;
  teleopPoints?: number;
  endgamePoints?: number;
}

export interface MatchData {
  auto: {
    mobility: boolean[];
    autoChargeStation: ('docked' | 'engaged' | 'none')[];
    autoGamePieces: {
      top: number[];
      mid: number[];
      low: number[];
    }[];
  };
  teleop: {
    gamePieces: {
      top: number[];
      mid: number[];
      low: number[];
    }[];
    linkScores: number[];
    coopertitionBonus: boolean;
    activationBonus: boolean;
  };
  endgame: {
    endgameStatus: ('parked' | 'docked' | 'engaged' | 'none')[];
    endgameTime?: number[];
  };
  penalties: {
    teamId: string;
    matchTime: number;
    type: string;
    card: 'yellow' | 'red' | 'dq';
    description?: string;
  }[];
  notes: {
    teamId: string;
    content: string;
    category: 'defense' | 'strategy' | 'mechanical' | 'other';
  }[];
}

export interface MatchFilter {
  eventId?: string;
  teamId?: string;
  matchType?: Match['matchType'];
  fromDate?: string;
  toDate?: string;
  sortBy?: 'matchNumber' | 'scheduledTime' | 'playedTime';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface MatchScoutData {
  matchId: string;
  teamId: string;
  scouterId: string;
  auto: {
    mobility: boolean;
    autoChargeStation: 'docked' | 'engaged' | 'none';
    gamePieces: {
      top: number;
      mid: number;
      low: number;
    };
  };
  teleop: {
    gamePieces: {
      top: number;
      mid: number;
      low: number;
    };
    linkScores: number;
  };
  endgame: {
    endgameStatus: 'parked' | 'docked' | 'engaged' | 'none';
    endgameTime?: number;
  };
  penalties: {
    matchTime: number;
    type: string;
    card?: 'yellow' | 'red' | 'dq';
    description?: string;
  }[];
  notes: string;
  overallPerformance: 1 | 2 | 3 | 4 | 5;
  createdAt: string;
  updatedAt: string;
}

export const matchesApi = {
  // Get all matches with optional filters
  getMatches: async (filters: MatchFilter = {}): Promise<{ data: Match[]; total: number }> => {
    const response = await apiClient.get<{ data: Match[]; total: number }>('/matches', { params: filters });
    return response;
  },

  // Get a single match by ID
  getMatchById: async (id: string): Promise<Match> => {
    return apiClient.get<Match>(`/matches/${id}`);
  },

  // Create a new match
  createMatch: async (matchData: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): Promise<Match> => {
    return apiClient.post<Match>('/matches', matchData);
  },

  // Update a match
  updateMatch: async (id: string, matchData: Partial<Match>): Promise<Match> => {
    return apiClient.put<Match>(`/matches/${id}`, matchData);
  },

  // Delete a match
  deleteMatch: async (id: string): Promise<void> => {
    await apiClient.delete(`/matches/${id}`);
  },

  // Get matches for a specific team
  getTeamMatches: async (teamId: string, filters: Omit<MatchFilter, 'teamId'> = {}): Promise<Match[]> => {
    const response = await apiClient.get<{ data: Match[] }>(`/teams/${teamId}/matches`, { params: filters });
    return response.data;
  },

  // Get matches for a specific event
  getEventMatches: async (eventId: string, filters: Omit<MatchFilter, 'eventId'> = {}): Promise<Match[]> => {
    const response = await apiClient.get<{ data: Match[] }>(`/events/${eventId}/matches`, { params: filters });
    return response.data;
  },

  // Submit match scouting data
  submitScoutData: async (scoutData: Omit<MatchScoutData, 'id' | 'createdAt' | 'updatedAt'>): Promise<MatchScoutData> => {
    return apiClient.post<MatchScoutData>('/scout/data', scoutData);
  },

  // Get scouting data for a match
  getMatchScoutData: async (matchId: string, teamId?: string): Promise<MatchScoutData[]> => {
    const params = teamId ? { teamId } : {};
    return apiClient.get<MatchScoutData[]>(`/scout/data/${matchId}`, { params });
  },

  // Update scouting data
  updateScoutData: async (id: string, scoutData: Partial<MatchScoutData>): Promise<MatchScoutData> => {
    return apiClient.put<MatchScoutData>(`/scout/data/${id}`, scoutData);
  },

  // Get upcoming matches
  getUpcomingMatches: async (limit: number = 5): Promise<Match[]> => {
    const response = await apiClient.get<{ data: Match[] }>('/matches/upcoming', { params: { limit } });
    return response.data;
  },

  // Get recent matches
  getRecentMatches: async (limit: number = 5): Promise<Match[]> => {
    const response = await apiClient.get<{ data: Match[] }>('/matches/recent', { params: { limit } });
    return response.data;
  },
};
