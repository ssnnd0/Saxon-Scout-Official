
export enum MatchPhase {
  Auto = 'Auto',
  Teleop = 'Teleop'
}

export enum GamePiece {
  None = 'None',
  Fuel = 'Fuel'
}

export type TowerLevel = 'None' | 'Level 1' | 'Level 2' | 'Level 3' | 'Failed';

export interface GameEvent {
  timestamp: number;
  phase: MatchPhase;
  action: string;
  piece: GamePiece | string;
  location: string;
  value: number;
}

export type ScoutingEvent = GameEvent;

export enum Alliance {
  Red = 'Red',
  Blue = 'Blue'
}

export type ViewState = 'LOGIN' | 'DASHBOARD' | 'SETTINGS' | 'MATCH_DATA' | 'GAME_START' | 'AUTO_START' | 'AUTO_SCORING' | 'TELEOP_SCORING' | 'ENDGAME_SCORING' | 'SUMMARY' | 'DATA_VIEW' | 'PICKLIST' | 'PIT_SCOUTING';

export interface MatchData {
  id: string;
  lastModified?: number; // For sync conflict resolution
  
  // Identifiers
  scoutName: string;
  scouterInitials: string;
  matchNumber: string;
  teamNumber: string;
  alliance: Alliance;

  // Setup
  startingZone: string;

  // Auto (Fuel Game)
  leaveLine: boolean;
  autoFuelScored: number;
  autoFuelMissed: number;
  autoTowerLevel: 'None' | 'Level 1' | 'Failed'; // Auto only allows L1 (15pts)

  // Teleop (Fuel Game)
  teleopFuelScored: number;
  teleopFuelMissed: number;
  fuelIntakeGround: number;
  fuelIntakeSource: number; // From Outpost/Depot

  // Endgame (Fuel Game)
  endgameTowerLevel: TowerLevel; // L1(10), L2(20), L3(30)
  
  // Status
  defensePlayed: boolean;
  robotDied: boolean;
  comments: string;
  
  // Endgame additional
  climbDuration?: number;
  climbPosition?: string;
  crossedBump?: boolean;
  underTrench?: boolean;
  
  // Strategy
  autoStrategy?: string;
  teleopStrategy?: string;
  attackDuration?: number;
  defenseDuration?: number;
  feedingDuration?: number;

  // Timeline
  events: GameEvent[];
  autoEvents: GameEvent[];
  teleopEvents: GameEvent[];
}

export interface PitData {
  teamNumber: string;
  lastModified: number;
  scouterName: string;
  drivetrain: string;
  motors: string;
  weight: string;
  batteries: string;
  bump: boolean;
  trench: boolean;
  climb: string;
  archetype: string;
  experience: string;
  intake: string;
  ballCapacity: string;
  preload: string;
  shooters: string;
  canFeed: boolean;
  minDist: string;
  maxDist: string;
  bps: string;
  autoAlign: boolean;
  notes: string;
}

export interface TeamAggregate {
  teamNumber: string;
  matchesPlayed: number;
  avgFuelPoints: number;
  avgTowerPoints: number;
  avgTotalPoints: number;
  climbRate: number;
}

export interface AppSettings {
  frcApiUsername: string;
  frcApiToken: string;
  eventYear: string;
  eventCode: string;
  tbaApiKey?: string;
  syncServerUrl?: string;
}

export interface RankedTeam {
  teamNumber: string;
  rank: number;
  notes: string;
  avgFuel?: number;
  avgTower?: number;
}

export interface Team {
  teamNumber: string | number;
  nameShort: string;
}

export interface ScheduledMatch {
  matchNumber: number;
  description: string;
  tournamentLevel: string;
  teams: { teamNumber: number; station: string; surrogate: boolean }[];
}

export interface TBAMatch {
  key: string;
  comp_level: string;
  match_number: number;
  alliances: {
    red: { team_keys: string[]; surrogate_team_keys?: string[] };
    blue: { team_keys: string[]; surrogate_team_keys?: string[] };
  };
}

export interface LocalUser {
  username: string;
  pin: string;
  role: 'admin' | 'scout';
}

export interface UserPreferences {
  theme: 'system' | 'light' | 'dark' | 'gold';
  defaultInitials: string;
}