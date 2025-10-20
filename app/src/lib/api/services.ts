// API Service Layer
// Provides high-level service functions for common operations

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
  APIResponse
} from './types';

// ============================================================================
// Team Services
// ============================================================================

export class TeamService {
  /**
   * Get comprehensive team information from multiple sources
   */
  static async getTeamProfile(teamNumber: number): Promise<{
    tba: TBATeam;
    first: FIRSTTeam;
    stats: TeamStats;
    scoutedMatches: ScoutedMatch[];
    scoutedPits: ScoutedPit[];
  }> {
    try {
      const [tba, first, stats, scoutedMatches, scoutedPits] = await Promise.all([
        apiClient.getTeam(teamNumber),
        apiClient.getFIRSTTeam(teamNumber),
        apiClient.getTeamStats(teamNumber),
        apiClient.getScoutedMatches(teamNumber),
        apiClient.getScoutedPits(teamNumber)
      ]);

      return {
        tba: tba.data,
        first: first.data,
        stats: stats.data,
        scoutedMatches: scoutedMatches.data || [],
        scoutedPits: scoutedPits.data || []
      };
    } catch (error) {
      console.error('Failed to get team profile:', error);
      throw error;
    }
  }

  /**
   * Compare multiple teams side by side
   */
  static async compareTeams(teamNumbers: number[], eventKey: string): Promise<{
    teams: Array<{
      teamNumber: number;
      tba: TBATeam;
      stats: TBARanking;
      matches: TBAMatch[];
    }>;
  }> {
    try {
      const teamPromises = teamNumbers.map(async (teamNumber) => {
        const [tba, stats, matches] = await Promise.all([
          apiClient.getTeam(teamNumber),
          apiClient.getTeamStats(teamNumber, eventKey),
          apiClient.getTeamMatches(teamNumber, eventKey)
        ]);

        return {
          teamNumber,
          tba: tba.data,
          stats: stats.data,
          matches: matches.data
        };
      });

      const teams = await Promise.all(teamPromises);
      return { teams };
    } catch (error) {
      console.error('Failed to compare teams:', error);
      throw error;
    }
  }

  /**
   * Get team performance trends over time
   */
  static async getTeamTrends(teamNumber: number, eventKey: string): Promise<{
    matches: TBAMatch[];
    scoutedMatches: ScoutedMatch[];
    trends: {
      autoScore: number[];
      teleopScore: number[];
      totalScore: number[];
      accuracy: number[];
      reliability: number[];
    };
  }> {
    try {
      const [tbaMatches, scoutedMatches] = await Promise.all([
        apiClient.getTeamMatches(teamNumber, eventKey),
        apiClient.getScoutedMatches(teamNumber)
      ]);

      const matches = tbaMatches.data;
      const scouted = scoutedMatches.data || [];

      // Calculate trends
      const trends = {
        autoScore: scouted.map(m => m.phase?.auto?.scored || 0),
        teleopScore: scouted.map(m => m.phase?.teleop?.scored || 0),
        totalScore: scouted.map(m => (m.phase?.auto?.scored || 0) + (m.phase?.teleop?.scored || 0)),
        accuracy: scouted.map(m => {
          const scored = (m.phase?.auto?.scored || 0) + (m.phase?.teleop?.scored || 0);
          const missed = (m.phase?.auto?.missed || 0) + (m.phase?.teleop?.missed || 0);
          return scored + missed > 0 ? scored / (scored + missed) : 0;
        }),
        reliability: scouted.map(m => {
          const autoMobility = m.phase?.auto?.mobility || false;
          const endgamePark = m.endgame?.park || false;
          return autoMobility && endgamePark ? 1 : 0;
        })
      };

      return {
        matches,
        scoutedMatches: scouted,
        trends
      };
    } catch (error) {
      console.error('Failed to get team trends:', error);
      throw error;
    }
  }
}

// ============================================================================
// Event Services
// ============================================================================

export class EventService {
  /**
   * Get comprehensive event information
   */
  static async getEventOverview(eventKey: string): Promise<{
    event: TBAEvent;
    teams: TBATeam[];
    matches: TBAMatch[];
    rankings: TBARanking[];
    awards: TBAAward[];
  }> {
    try {
      const [event, teams, matches, rankings, awards] = await Promise.all([
        apiClient.getEvent(eventKey),
        apiClient.getEventTeams(eventKey),
        apiClient.getEventMatches(eventKey),
        apiClient.getEventRankings(eventKey),
        apiClient.getEventAwards(eventKey)
      ]);

      return {
        event: event.data,
        teams: teams.data,
        matches: matches.data,
        rankings: rankings.data,
        awards: awards.data
      };
    } catch (error) {
      console.error('Failed to get event overview:', error);
      throw error;
    }
  }

  /**
   * Get event schedule with match details
   */
  static async getEventSchedule(eventKey: string): Promise<{
    matches: TBAMatch[];
    schedule: Array<{
      time: string;
      matches: TBAMatch[];
    }>;
  }> {
    try {
      const matches = await apiClient.getEventMatches(eventKey);
      const matchData = matches.data;

      // Group matches by time
      const scheduleMap = new Map<string, TBAMatch[]>();
      
      matchData.forEach(match => {
        const time = new Date(match.time * 1000).toISOString().split('T')[0];
        if (!scheduleMap.has(time)) {
          scheduleMap.set(time, []);
        }
        scheduleMap.get(time)!.push(match);
      });

      const schedule = Array.from(scheduleMap.entries()).map(([time, matches]) => ({
        time,
        matches: matches.sort((a, b) => a.match_number - b.match_number)
      }));

      return {
        matches: matchData,
        schedule: schedule.sort((a, b) => a.time.localeCompare(b.time))
      };
    } catch (error) {
      console.error('Failed to get event schedule:', error);
      throw error;
    }
  }

  /**
   * Get event standings with detailed statistics
   */
  static async getEventStandings(eventKey: string): Promise<{
    rankings: TBARanking[];
    standings: Array<{
      rank: number;
      team: TBATeam;
      record: { wins: number; losses: number; ties: number };
      stats: any;
    }>;
  }> {
    try {
      const [rankings, teams] = await Promise.all([
        apiClient.getEventRankings(eventKey),
        apiClient.getEventTeams(eventKey)
      ]);

      const teamMap = new Map(teams.data.map(team => [team.key, team]));
      
      const standings = rankings.data.map(ranking => ({
        rank: ranking.rank,
        team: teamMap.get(ranking.team_key)!,
        record: ranking.record,
        stats: ranking.sort_orders
      }));

      return {
        rankings: rankings.data,
        standings
      };
    } catch (error) {
      console.error('Failed to get event standings:', error);
      throw error;
    }
  }
}

// ============================================================================
// Scouting Services
// ============================================================================

export class ScoutingService {
  /**
   * Save scouted match data with validation
   */
  static async saveMatch(match: ScoutedMatch): Promise<APIResponse<ScoutedMatch>> {
    try {
      // Validate required fields
      if (!match.team || !match.game || !match.scouter) {
        throw new Error('Team number, game number, and scouter name are required');
      }

      // Validate numeric fields
      if (match.team < 1 || match.team > 9999) {
        throw new Error('Team number must be between 1 and 9999');
      }

      if (match.game < 1) {
        throw new Error('Game number must be positive');
      }

      const result = await apiClient.saveScoutedMatch(match);
      return result;
    } catch (error) {
      console.error('Failed to save match:', error);
      throw error;
    }
  }

  /**
   * Save scouted pit data with validation
   */
  static async savePit(pit: ScoutedPit): Promise<APIResponse<ScoutedPit>> {
    try {
      // Validate required fields
      if (!pit.team || !pit.scouter) {
        throw new Error('Team number and scouter name are required');
      }

      // Validate team number
      if (pit.team < 1 || pit.team > 9999) {
        throw new Error('Team number must be between 1 and 9999');
      }

      const result = await apiClient.saveScoutedPit(pit);
      return result;
    } catch (error) {
      console.error('Failed to save pit data:', error);
      throw error;
    }
  }

  /**
   * Get scouting summary for an event
   */
  static async getEventScoutingSummary(eventKey: string): Promise<{
    totalMatches: number;
    totalPits: number;
    teams: Array<{
      teamNumber: number;
      matchesScouted: number;
      pitsScouted: number;
      lastScouted: string;
    }>;
  }> {
    try {
      const [matches, pits] = await Promise.all([
        apiClient.getScoutedMatches(),
        apiClient.getScoutedPits()
      ]);

      const matchData = matches.data || [];
      const pitData = pits.data || [];

      // Group by team
      const teamMap = new Map<number, {
        teamNumber: number;
        matchesScouted: number;
        pitsScouted: number;
        lastScouted: string;
      }>();

      matchData.forEach(match => {
        const teamNumber = match.team;
        if (!teamMap.has(teamNumber)) {
          teamMap.set(teamNumber, {
            teamNumber,
            matchesScouted: 0,
            pitsScouted: 0,
            lastScouted: ''
          });
        }
        teamMap.get(teamNumber)!.matchesScouted++;
        if (match.createdAt > teamMap.get(teamNumber)!.lastScouted) {
          teamMap.get(teamNumber)!.lastScouted = match.createdAt;
        }
      });

      pitData.forEach(pit => {
        const teamNumber = pit.team;
        if (!teamMap.has(teamNumber)) {
          teamMap.set(teamNumber, {
            teamNumber,
            matchesScouted: 0,
            pitsScouted: 0,
            lastScouted: ''
          });
        }
        teamMap.get(teamNumber)!.pitsScouted++;
        if (pit.createdAt > teamMap.get(teamNumber)!.lastScouted) {
          teamMap.get(teamNumber)!.lastScouted = pit.createdAt;
        }
      });

      return {
        totalMatches: matchData.length,
        totalPits: pitData.length,
        teams: Array.from(teamMap.values()).sort((a, b) => a.teamNumber - b.teamNumber)
      };
    } catch (error) {
      console.error('Failed to get scouting summary:', error);
      throw error;
    }
  }

  /**
   * Export scouting data in various formats
   */
  static async exportScoutingData(format: 'json' | 'csv' | 'excel' = 'json'): Promise<{
    data: string;
    filename: string;
    mimeType: string;
  }> {
    try {
      const [matches, pits, stats] = await Promise.all([
        apiClient.getScoutedMatches(),
        apiClient.getScoutedPits(),
        apiClient.getAllTeamStats()
      ]);

      const data = {
        matches: matches.data || [],
        pits: pits.data || [],
        stats: stats.data || [],
        exportedAt: new Date().toISOString()
      };

      let exportData: string;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'json':
          exportData = JSON.stringify(data, null, 2);
          filename = `saxon-scout-export-${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;
        
        case 'csv':
          // Convert to CSV format
          const csvData = [
            'Type,Team,Match,Alliance,Scouter,Auto Scored,Auto Missed,Teleop Scored,Teleop Missed,Comments',
            ...(matches.data || []).map(m => 
              `Match,${m.team},${m.game},${m.alliance},${m.scouter},${m.phase?.auto?.scored || 0},${m.phase?.auto?.missed || 0},${m.phase?.teleop?.scored || 0},${m.phase?.teleop?.missed || 0},"${m.comments || ''}"`
            ),
            ...(pits.data || []).map(p => 
              `Pit,${p.team},N/A,N/A,${p.scouter},N/A,N/A,N/A,N/A,"${p.notes || ''}"`
            )
          ].join('\n');
          
          exportData = csvData;
          filename = `saxon-scout-export-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
        
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      return {
        data: exportData,
        filename,
        mimeType
      };
    } catch (error) {
      console.error('Failed to export scouting data:', error);
      throw error;
    }
  }
}

// ============================================================================
// Analytics Services
// ============================================================================

export class AnalyticsService {
  /**
   * Calculate team performance metrics
   */
  static calculateTeamMetrics(scoutedMatches: ScoutedMatch[]): {
    averageAutoScore: number;
    averageTeleopScore: number;
    averageTotalScore: number;
    accuracy: number;
    reliability: number;
    consistency: number;
  } {
    if (scoutedMatches.length === 0) {
      return {
        averageAutoScore: 0,
        averageTeleopScore: 0,
        averageTotalScore: 0,
        accuracy: 0,
        reliability: 0,
        consistency: 0
      };
    }

    const autoScores = scoutedMatches.map(m => m.phase?.auto?.scored || 0);
    const teleopScores = scoutedMatches.map(m => m.phase?.teleop?.scored || 0);
    const totalScores = scoutedMatches.map(m => 
      (m.phase?.auto?.scored || 0) + (m.phase?.teleop?.scored || 0)
    );

    const averageAutoScore = autoScores.reduce((a, b) => a + b, 0) / autoScores.length;
    const averageTeleopScore = teleopScores.reduce((a, b) => a + b, 0) / teleopScores.length;
    const averageTotalScore = totalScores.reduce((a, b) => a + b, 0) / totalScores.length;

    // Calculate accuracy (scored / (scored + missed))
    const totalScored = scoutedMatches.reduce((sum, m) => 
      sum + (m.phase?.auto?.scored || 0) + (m.phase?.teleop?.scored || 0), 0
    );
    const totalMissed = scoutedMatches.reduce((sum, m) => 
      sum + (m.phase?.auto?.missed || 0) + (m.phase?.teleop?.missed || 0), 0
    );
    const accuracy = totalScored + totalMissed > 0 ? totalScored / (totalScored + totalMissed) : 0;

    // Calculate reliability (percentage of matches with mobility and park)
    const reliableMatches = scoutedMatches.filter(m => 
      m.phase?.auto?.mobility && m.endgame?.park
    ).length;
    const reliability = scoutedMatches.length > 0 ? reliableMatches / scoutedMatches.length : 0;

    // Calculate consistency (inverse of standard deviation)
    const mean = averageTotalScore;
    const variance = totalScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / totalScores.length;
    const standardDeviation = Math.sqrt(variance);
    const consistency = standardDeviation > 0 ? 1 / (1 + standardDeviation) : 1;

    return {
      averageAutoScore,
      averageTeleopScore,
      averageTotalScore,
      accuracy,
      reliability,
      consistency
    };
  }

  /**
   * Generate team comparison report
   */
  static generateTeamComparison(teams: Array<{
    teamNumber: number;
    scoutedMatches: ScoutedMatch[];
  }>): Array<{
    teamNumber: number;
    metrics: ReturnType<typeof AnalyticsService.calculateTeamMetrics>;
    rank: number;
  }> {
    const teamMetrics = teams.map(team => ({
      teamNumber: team.teamNumber,
      metrics: this.calculateTeamMetrics(team.scoutedMatches),
      rank: 0
    }));

    // Sort by average total score
    teamMetrics.sort((a, b) => b.metrics.averageTotalScore - a.metrics.averageTotalScore);

    // Assign ranks
    teamMetrics.forEach((team, index) => {
      team.rank = index + 1;
    });

    return teamMetrics;
  }
}
