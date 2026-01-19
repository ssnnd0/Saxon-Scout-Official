-- Enable JSONB support (default in modern Postgres)
-- Matches Table
CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    event_code TEXT NOT NULL,
    match_number INTEGER NOT NULL,
    team_number TEXT NOT NULL,
    scout_name TEXT,
    data JSONB NOT NULL, -- Stores the full MatchData object
    last_modified BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for fast lookup
    CONSTRAINT matches_unique_event_match_team UNIQUE (event_code, match_number, team_number)
);

CREATE INDEX idx_matches_event_code ON matches(event_code);
CREATE INDEX idx_matches_team_number ON matches(team_number);
CREATE INDEX idx_matches_last_modified ON matches(last_modified);

-- Users Table (Optional, for authentication if implemented server-side)
CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    pin_hash TEXT NOT NULL,
    role TEXT DEFAULT 'scout',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Teams Cache (Optional, synced from TBA)
CREATE TABLE IF NOT EXISTS teams (
    team_number INTEGER PRIMARY KEY,
    nickname TEXT,
    event_code TEXT
);
