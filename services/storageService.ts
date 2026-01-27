import { MatchData, AppSettings, RankedTeam, Team, ScheduledMatch, LocalUser, UserPreferences, PitData } from '../types';
import { analytics } from './analyticsService';

const STORAGE_KEY = 'saxon_scout_data';
const SCHEDULE_KEY = 'saxon_scout_schedule';
const TEAMS_KEY = 'saxon_scout_teams';
const SETTINGS_KEY = 'saxon_scout_settings';
const PICKLIST_KEY = 'saxon_scout_picklist';
const USERS_KEY = 'saxon_scout_users';
const PREFS_KEY = 'saxon_preferences';
const PIT_DATA_KEY = 'saxon_pit_data';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Utility to safely parse JSON
const safeParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json);
  } catch (e) {
    analytics.warn('storage', 'Failed to parse JSON', { json: json.slice(0, 50) });
    return fallback;
  }
};

// API connection helper
export const connectToSQLServer = async () => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    const isConnected = response.ok;
    analytics.info('storage', `Server connection: ${isConnected ? 'SUCCESS' : 'FAILED'}`);
    return isConnected;
  } catch (err) {
    analytics.warn('storage', 'Failed to connect to server', { error: String(err) });
    return false;
  }
};

export const saveMatch = async (data: MatchData) => {
  try {
    // Try to save to server first
    const response = await fetch(`${API_BASE_URL}/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      analytics.info('storage', 'Match saved to server', { matchId: data.id });
      return await response.json();
    }
  } catch (err) {
    analytics.debug('storage', 'Server unavailable, falling back to localStorage', { error: String(err) });
  }

  // Fallback to localStorage
  try {
    const current = await getMatches();
    const matchToSave = { ...data, lastModified: data.lastModified || Date.now() };
    
    const existingIndex = current.findIndex(m => m.id === matchToSave.id);
    let updated;
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = matchToSave;
    } else {
      matchToSave.id = matchToSave.id || Date.now().toString();
      updated = [...current, matchToSave];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    analytics.info('storage', 'Match saved to localStorage', { matchId: matchToSave.id });
    return matchToSave;
  } catch (err) {
    analytics.error('storage', 'Failed to save match', { error: String(err) });
    throw err;
  }
};

export const mergeMatches = async (remoteMatches: MatchData[]) => {
  const localMatches = await getMatches();
  let hasChanges = false;

  remoteMatches.forEach(remoteMatch => {
    const localMatchIndex = localMatches.findIndex(m => m.id === remoteMatch.id);
    if (localMatchIndex >= 0) {
      const localMatch = localMatches[localMatchIndex];
      if ((remoteMatch.lastModified || 0) > (localMatch.lastModified || 0)) {
        localMatches[localMatchIndex] = remoteMatch;
        hasChanges = true;
      }
    } else {
      localMatches.push(remoteMatch);
      hasChanges = true;
    }
  });

  if (hasChanges) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localMatches));
  }
  return localMatches;
};

export const getMatches = async (): Promise<MatchData[]> => {
  try {
    // Try to fetch from server first
    const response = await fetch(`${API_BASE_URL}/matches`);
    if (response.ok) {
      const matches = await response.json();
      analytics.debug('storage', `Fetched ${matches.length} matches from server`);
      return matches;
    }
  } catch (err) {
    analytics.debug('storage', 'Server unavailable, using localStorage', { error: String(err) });
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const matches = raw ? safeParse(raw, []) : [];
    analytics.debug('storage', `Fetched ${matches.length} matches from localStorage`);
    return matches;
  } catch (err) {
    analytics.error('storage', 'Failed to fetch matches', { error: String(err) });
    return [];
  }
};

export const clearMatches = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getSettings = (): AppSettings => {
  const raw = localStorage.getItem(SETTINGS_KEY);
  return raw ? JSON.parse(raw) : { 
    frcApiUsername: '', 
    frcApiToken: '', 
    eventYear: '2026', 
    eventCode: 'vaalex',
    syncServerUrl: ''
  };
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const getPicklist = (): RankedTeam[] => {
  const raw = localStorage.getItem(PICKLIST_KEY);
  return raw ? JSON.parse(raw) : [];
};

export const savePicklist = (list: RankedTeam[]) => {
  localStorage.setItem(PICKLIST_KEY, JSON.stringify(list));
};

export const saveSchedule = (matches: ScheduledMatch[]) => {
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(matches));
};

export const getSchedule = (): ScheduledMatch[] => {
  const raw = localStorage.getItem(SCHEDULE_KEY);
  return raw ? JSON.parse(raw) : [];
};

export const saveTeams = (teams: Team[]) => {
  localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
};

export const getTeams = (): Team[] => {
  const raw = localStorage.getItem(TEAMS_KEY);
  return raw ? JSON.parse(raw) : [];
};

export const getLocalUsers = (): LocalUser[] => {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
};

export const saveLocalUsers = (users: LocalUser[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getUserPreferences = (): UserPreferences => {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : { theme: 'system', defaultInitials: '' };
};

export const saveUserPreferences = (prefs: UserPreferences) => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
};

export const exportData = () => {
  const data = {
    matches: getMatches(),
    picklist: getPicklist(),
    version: '2026.SAXON.1'
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `saxon_data_${new Date().toISOString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const getPitData = (): PitData[] => {
  const raw = localStorage.getItem(PIT_DATA_KEY);
  return raw ? JSON.parse(raw) : [];
};

export const savePitData = async (data: PitData) => {
  try {
    // Try to save to server first
    const response = await fetch(`${API_BASE_URL}/pit-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Server unavailable, falling back to localStorage');
  }

  // Fallback to localStorage
  const current = getPitData();
  const pitDataToSave = { ...data, lastModified: data.lastModified || Date.now() };
  
  const existingIndex = current.findIndex(p => p.teamNumber === pitDataToSave.teamNumber);
  let updated;
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = pitDataToSave;
  } else {
    updated = [...current, pitDataToSave];
  }
  localStorage.setItem(PIT_DATA_KEY, JSON.stringify(updated));
  return pitDataToSave;
};