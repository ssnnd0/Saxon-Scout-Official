-- PostgreSQL Schema for Saxon Scout
-- This is PostgreSQL syntax, not T-SQL/MSSQL

-- Create tables if they don't exist

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  pin VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'scout',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matches (
  id VARCHAR(255) PRIMARY KEY,
  scout_name VARCHAR(255) NOT NULL,
  scouter_initials VARCHAR(10),
  match_number VARCHAR(50) NOT NULL,
  team_number VARCHAR(50) NOT NULL,
  alliance VARCHAR(10),
  starting_zone VARCHAR(255),
  
  -- Auto
  leave_line BOOLEAN DEFAULT FALSE,
  auto_fuel_scored INTEGER DEFAULT 0,
  auto_fuel_missed INTEGER DEFAULT 0,
  auto_tower_level VARCHAR(50) DEFAULT 'None',
  
  -- Teleop
  teleop_fuel_scored INTEGER DEFAULT 0,
  teleop_fuel_missed INTEGER DEFAULT 0,
  fuel_intake_ground INTEGER DEFAULT 0,
  fuel_intake_source INTEGER DEFAULT 0,
  
  -- Endgame
  endgame_tower_level VARCHAR(50) DEFAULT 'None',
  climb_duration FLOAT,
  climb_position VARCHAR(255),
  crossed_bump BOOLEAN DEFAULT FALSE,
  under_trench BOOLEAN DEFAULT FALSE,
  
  -- Strategy
  auto_strategy VARCHAR(255),
  teleop_strategy VARCHAR(255),
  attack_duration FLOAT,
  defense_duration FLOAT,
  feeding_duration FLOAT,
  
  -- Status
  defense_played BOOLEAN DEFAULT FALSE,
  robot_died BOOLEAN DEFAULT FALSE,
  comments TEXT,
  
  last_modified BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pit_data (
  id SERIAL PRIMARY KEY,
  team_number VARCHAR(50) UNIQUE NOT NULL,
  scouter_name VARCHAR(255),
  drivetrain VARCHAR(255),
  motors VARCHAR(255),
  weight VARCHAR(255),
  batteries VARCHAR(255),
  bump BOOLEAN DEFAULT FALSE,
  trench BOOLEAN DEFAULT FALSE,
  climb VARCHAR(255),
  archetype VARCHAR(255),
  experience TEXT,
  intake VARCHAR(255),
  ball_capacity VARCHAR(255),
  preload VARCHAR(255),
  shooters VARCHAR(255),
  can_feed BOOLEAN DEFAULT FALSE,
  min_dist VARCHAR(255),
  max_dist VARCHAR(255),
  bps VARCHAR(255),
  auto_align BOOLEAN DEFAULT FALSE,
  notes TEXT,
  
  last_modified BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  team_number VARCHAR(50) UNIQUE NOT NULL,
  name_short VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schedules (
  id SERIAL PRIMARY KEY,
  match_number INTEGER,
  description VARCHAR(255),
  tournament_level VARCHAR(50),
  teams JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS picklists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  team_number VARCHAR(50),
  rank INTEGER,
  notes TEXT,
  avg_fuel FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) UNIQUE,
  frc_api_username VARCHAR(255),
  frc_api_token VARCHAR(255),
  event_year VARCHAR(4),
  event_code VARCHAR(50),
  tba_api_key VARCHAR(255),
  sync_server_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) UNIQUE,
  theme VARCHAR(50) DEFAULT 'system',
  default_initials VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_matches_team ON matches(team_number);
CREATE INDEX IF NOT EXISTS idx_matches_scout ON matches(scout_name);
CREATE INDEX IF NOT EXISTS idx_matches_match_number ON matches(match_number);
CREATE INDEX IF NOT EXISTS idx_pit_data_team ON pit_data(team_number);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
