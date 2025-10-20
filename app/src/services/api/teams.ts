import { apiClient } from './client';

export interface Team {
  id: string;
  number: string;
  name: string;
  nickname?: string;
  location?: string;
  website?: string;
  rookieYear: number;
  stats: {
    matchesPlayed: number;
    winRate: number;
    avgScore: number;
    highScore: number;
    avgAuto: number;
    avgTeleop: number;
    avgEndgame: number;
    reliability: number;
    ranking: number;
  };
  notes?: TeamNote[];
  robot?: RobotInfo;
  createdAt: string;
  updatedAt: string;
}

export interface TeamNote {
  id: string;
  content: string;
  category: 'general' | 'strength' | 'weakness' | 'strategy';
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface RobotInfo {
  drivetrain?: string;
  autoRoutine?: string;
  teleopScoring?: string;
  endgame?: string;
  capabilities?: string[];
  notes?: string;
}

export interface TeamFilter {
  search?: string;
  minMatches?: number;
  minWinRate?: number;
  minAvgScore?: number;
  sortBy?: 'number' | 'name' | 'ranking' | 'winRate' | 'avgScore';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export const teamsApi = {
  // Get all teams with optional filters
  getTeams: async (filters: TeamFilter = {}): Promise<{ data: Team[]; total: number }> => {
    const response = await apiClient.get<{ data: Team[]; total: number }>('/teams', { params: filters });
    return response;
  },

  // Get a single team by ID
  getTeamById: async (id: string): Promise<Team> => {
    return apiClient.get<Team>(`/teams/${id}`);
  },

  // Create a new team
  createTeam: async (teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt' | 'stats'>): Promise<Team> => {
    return apiClient.post<Team>('/teams', teamData);
  },

  // Update a team
  updateTeam: async (id: string, teamData: Partial<Team>): Promise<Team> => {
    return apiClient.put<Team>(`/teams/${id}`, teamData);
  },

  // Delete a team
  deleteTeam: async (id: string): Promise<void> => {
    await apiClient.delete(`/teams/${id}`);
  },

  // Add a note to a team
  addTeamNote: async (teamId: string, note: { content: string; category: TeamNote['category'] }): Promise<TeamNote> => {
    return apiClient.post<TeamNote>(`/teams/${teamId}/notes`, note);
  },

  // Update a team note
  updateTeamNote: async (teamId: string, noteId: string, note: { content: string; category: TeamNote['category'] }): Promise<TeamNote> => {
    return apiClient.put<TeamNote>(`/teams/${teamId}/notes/${noteId}`, note);
  },

  // Delete a team note
  deleteTeamNote: async (teamId: string, noteId: string): Promise<void> => {
    await apiClient.delete(`/teams/${teamId}/notes/${noteId}`);
  },

  // Update robot information
  updateRobotInfo: async (teamId: string, robotInfo: Partial<RobotInfo>): Promise<RobotInfo> => {
    return apiClient.put<RobotInfo>(`/teams/${teamId}/robot`, robotInfo);
  },

  // Get team statistics
  getTeamStats: async (teamId: string): Promise<Team['stats']> => {
    return apiClient.get<Team['stats']>(`/teams/${teamId}/stats`);
  },

  // Get team matches
  getTeamMatches: async (teamId: string): Promise<any[]> => {
    return apiClient.get<any[]>(`/teams/${teamId}/matches`);
  },
};
