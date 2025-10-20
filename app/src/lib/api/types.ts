// Comprehensive TypeScript interfaces for FRC APIs
// Based on The Blue Alliance API v3 and FIRST API specifications

// ============================================================================
// The Blue Alliance API Types
// ============================================================================

export interface TBATeam {
  key: string;
  team_number: number;
  nickname: string;
  name: string;
  city: string;
  state_prov: string;
  country: string;
  address: string;
  postal_code: string;
  gmaps_place_id: string;
  gmaps_url: string;
  lat: number;
  lng: number;
  location_name: string;
  website: string;
  rookie_year: number;
  motto: string;
  home_championship: Record<string, any>;
}

export interface TBAEvent {
  key: string;
  name: string;
  event_code: string;
  event_type: number;
  district: Record<string, any>;
  city: string;
  state_prov: string;
  country: string;
  start_date: string;
  end_date: string;
  year: number;
  short_name: string;
  event_type_string: string;
  week: number;
  address: string;
  postal_code: string;
  gmaps_place_id: string;
  gmaps_url: string;
  lat: number;
  lng: number;
  location_name: string;
  timezone: string;
  website: string;
  first_event_id: string;
  first_event_code: string;
  webcasts: Array<{
    type: string;
    channel: string;
    date: string;
    file: string;
  }>;
  division_keys: string[];
  parent_event_key: string;
  playoff_type: number;
  playoff_type_string: string;
}

export interface TBAMatch {
  key: string;
  comp_level: string;
  set_number: number;
  match_number: number;
  alliances: {
    red: {
      score: number;
      team_keys: string[];
      surrogate_team_keys: string[];
      dq_team_keys: string[];
    };
    blue: {
      score: number;
      team_keys: string[];
      surrogate_team_keys: string[];
      dq_team_keys: string[];
    };
  };
  winning_alliance: string;
  event_key: string;
  time: number;
  actual_time: number;
  predicted_time: number;
  post_result_time: number;
  score_breakdown: Record<string, any>;
  videos: Array<{
    type: string;
    key: string;
  }>;
}

export interface TBARanking {
  team_key: string;
  rank: number;
  record: {
    wins: number;
    losses: number;
    ties: number;
  };
  qual_average: number;
  dq: number;
  matches_played: number;
  sort_orders: number[];
  extra_stats: number[];
}

export interface TBAAward {
  name: string;
  award_type: number;
  event_key: string;
  recipient_list: Array<{
    team_key: string;
    awardee: string;
  }>;
  year: number;
}

// ============================================================================
// FIRST API Types
// ============================================================================

export interface FIRSTEvent {
  eventCode: string;
  divisionCode: string;
  name: string;
  type: string;
  districtCode: string;
  venue: string;
  city: string;
  stateprov: string;
  country: string;
  dateStart: string;
  dateEnd: string;
  timezone: string;
  website: string;
  liveStreamUrl: string;
  webcasts: Array<{
    type: string;
    channel: string;
    date: string;
    file: string;
  }>;
  timezone: string;
  remote: boolean;
  hybrid: boolean;
  published: boolean;
  public: boolean;
  address: string;
  postalCode: string;
  gmapsPlaceId: string;
  gmapsUrl: string;
  lat: number;
  lng: number;
  locationName: string;
  fieldCount: number;
  fields: Array<{
    fieldNumber: number;
    name: string;
  }>;
  eventType: string;
  weekNumber: number;
  season: {
    code: string;
    name: string;
  };
}

export interface FIRSTTeam {
  teamNumber: number;
  nameFull: string;
  nameShort: string;
  city: string;
  stateProv: string;
  country: string;
  rookieYear: number;
  robotName: string;
  districtCode: string;
  schoolName: string;
  homeCMP: string;
  website: string;
  socialMedia: {
    youtube: string;
    twitter: string;
    facebook: string;
    instagram: string;
    github: string;
  };
  profileYear: number;
  motto: string;
  location: string;
  homeChampionship: Record<string, any>;
  lastActive: string;
  robot: {
    year: number;
    robotName: string;
    key: string;
    teamKey: string;
  };
}

export interface FIRSTMatch {
  matchNumber: number;
  description: string;
  field: string;
  tournamentLevel: string;
  actualStartTime: string;
  actualEndTime: string;
  postResultTime: string;
  scoreRedFinal: number;
  scoreRedFoul: number;
  scoreRedAuto: number;
  scoreBlueFinal: number;
  scoreBlueFoul: number;
  scoreBlueAuto: number;
  teams: Array<{
    teamNumber: number;
    station: string;
    surrogate: boolean;
    noShow: boolean;
    dq: boolean;
    onField: boolean;
  }>;
  scoreRed: {
    auto: number;
    teleop: number;
    endgame: number;
    penalty: number;
    total: number;
  };
  scoreBlue: {
    auto: number;
    teleop: number;
    endgame: number;
    penalty: number;
    total: number;
  };
  winner: string;
  duration: number;
  gameSpecific: Record<string, any>;
}

// ============================================================================
// Saxon Scout Internal Types
// ============================================================================

export interface ScoutedMatch {
  id: string;
  team: number;
  game: number;
  alliance: 'red' | 'blue';
  time: string;
  scouter: string;
  phase: {
    auto: {
      scored: number;
      missed: number;
      mobility: boolean;
      notes?: string;
    };
    teleop: {
      cycles: number;
      scored: number;
      missed: number;
      defense?: string;
    };
  };
  endgame: {
    park: boolean;
    climb: 'none' | 'low' | 'high';
  };
  fouls: number;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScoutedPit {
  id: string;
  team: number;
  drivetrain: string;
  autoPaths: string[];
  preferredZones: string[];
  cycleTimeEst: number | null;
  climb: boolean;
  notes: string;
  scouter: string;
  time: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamStats {
  team: number;
  matches: number;
  autoScore: number;
  autoMiss: number;
  teleopScore: number;
  teleopMiss: number;
  mobilityCount: number;
  endgameCounts: {
    none: number;
    park: number;
    shallow: number;
    deep: number;
  };
  foulCount: number;
  averageCycleTime: number;
  accuracy: number;
  reliability: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface APIConfig {
  tba: {
    baseURL: string;
    apiKey: string;
    timeout: number;
  };
  first: {
    baseURL: string;
    username: string;
    password: string;
    timeout: number;
  };
  local: {
    baseURL: string;
    timeout: number;
  };
}

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum cache size
  enabled: boolean;
}

// ============================================================================
// Hook Types
// ============================================================================

export interface UseAPIState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseAPIWithPaginationState<T> extends UseAPIState<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
}

// ============================================================================
// Event Types
// ============================================================================

export interface APIEvent {
  type: 'FETCH_START' | 'FETCH_SUCCESS' | 'FETCH_ERROR' | 'CACHE_HIT' | 'CACHE_MISS';
  endpoint: string;
  timestamp: number;
  duration?: number;
  error?: string;
}
