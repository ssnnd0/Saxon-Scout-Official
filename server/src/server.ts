// Comprehensive Saxon Scout API Server
// Implements all FRC APIs including The Blue Alliance, FIRST API, and local scouting data

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import pkg from 'pg';
const { Pool } = pkg;
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import http from 'http';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import multer from 'multer';
import fs from 'fs';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Configuration
// ============================================================================

const PORT = parseInt(process.env.PORT || '8787', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

// Database configuration - make it optional for development
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://frc:frcpass@localhost:5432/scouting';
const USE_DATABASE = process.env.USE_DATABASE
  ? process.env.USE_DATABASE !== 'false'
  : NODE_ENV === 'production'; // Default: enabled in production, disabled in dev unless explicitly set

let pool: InstanceType<typeof Pool> | null = null;

if (USE_DATABASE) {
  try {
    pool = new Pool({ connectionString: DATABASE_URL });
    console.log('Database connection configured');
  } catch (error) {
    console.warn('Database connection failed, running without database:', error);
    pool = null;
  }
} else {
  console.log('Database disabled for development');
}

// API configuration
const TBA_API_KEY = process.env.TBA_API_KEY || '';
const TBA_BASE_URL = 'https://www.thebluealliance.com/api/v3';
const FIRST_BASE_URL = 'https://frc-api.firstinspires.org/v2.0';
const FIRST_USERNAME = process.env.FIRST_USERNAME || '';
const FIRST_PASSWORD = process.env.FIRST_PASSWORD || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev_secret_change_me';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || `http://localhost:${PORT}/api/auth/google/callback`;

// Initialize Google Gemini AI
let genAI: GoogleGenAI | null = null;
if (GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    console.log('Google Gemini AI initialized');
  } catch (error) {
    console.warn('Failed to initialize Gemini AI:', error);
  }
} else {
  console.log('Gemini AI not configured (GEMINI_API_KEY not set)');
}

// ============================================================================
// Express App Setup
// ============================================================================

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://www.thebluealliance.com", "https://frc-api.firstinspires.org"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://scouting.saxonrobotics.org', 'https://scout.saxonrobotics.org']
    : ['http://localhost:3000', 'http://localhost:8787'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression and parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Sessions (required for Passport)
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: NODE_ENV === 'production'
  }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Passport Google Strategy
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL
  }, async (_accessToken: string, _refreshToken: string, profile: any, done: (err: any, user?: any) => void) => {
    try {
      const name = profile.displayName || (profile.emails?.[0]?.value?.split('@')[0]) || 'User';
      const email = profile.emails?.[0]?.value;
      const userId = await getOrCreateUser(name, email);
      return done(null, { id: userId, name, email });
    } catch (err) {
      return done(err as any);
    }
  }));

  passport.serializeUser((user: any, done: (err: any, id?: any) => void) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id: any, done: (err: any, user?: any) => void) => {
    if (!pool) return done(null, { id });
    try {
      const r = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [id]);
      if (!r.rowCount) return done(null, { id });
      return done(null, r.rows[0]);
    } catch (e) {
      return done(e as any);
    }
  });
}

// ============================================================================
// Database Schema Setup
// ============================================================================

async function initializeDatabase() {
  if (!pool) {
    console.log('Skipping database initialization - no database connection');
    return;
  }

  try {
    // Test database connection
    await pool.query('SELECT 1');
    console.log('Database connection test successful');

    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255),
        role VARCHAR(50) DEFAULT 'scouter',
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Ensure new columns exist when migrating from older schema
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'scouter'");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS logins (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        session_id VARCHAR(255) UNIQUE NOT NULL,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS files_created (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        filename VARCHAR(255) NOT NULL,
        filepath TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Scouting data tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scouted_matches (
        id SERIAL PRIMARY KEY,
        team_number INTEGER NOT NULL,
        match_number INTEGER NOT NULL,
        alliance VARCHAR(10) NOT NULL,
        scouter_name VARCHAR(255) NOT NULL,
        auto_scored INTEGER DEFAULT 0,
        auto_missed INTEGER DEFAULT 0,
        auto_mobility BOOLEAN DEFAULT FALSE,
        auto_notes TEXT,
        teleop_cycles INTEGER DEFAULT 0,
        teleop_scored INTEGER DEFAULT 0,
        teleop_missed INTEGER DEFAULT 0,
        teleop_defense VARCHAR(50),
        endgame_park BOOLEAN DEFAULT FALSE,
        endgame_climb VARCHAR(20) DEFAULT 'none',
        fouls INTEGER DEFAULT 0,
        comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_number, match_number, scouter_name)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS scouted_pits (
        id SERIAL PRIMARY KEY,
        team_number INTEGER NOT NULL,
        scouter_name VARCHAR(255) NOT NULL,
        drivetrain VARCHAR(100),
        auto_paths TEXT[],
        preferred_zones TEXT[],
        cycle_time_est INTEGER,
        climb BOOLEAN DEFAULT FALSE,
        notes TEXT,
        images JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_number, scouter_name)
      )
    `);

    // Alliance selection table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alliance_selections (
        id SERIAL PRIMARY KEY,
        alliance_number INTEGER UNIQUE NOT NULL,
        captain INTEGER NOT NULL,
        first_pick INTEGER,
        second_pick INTEGER,
        backup INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Match planning table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS match_plans (
        id SERIAL PRIMARY KEY,
        match_number INTEGER UNIQUE NOT NULL,
        our_alliance JSONB,
        opponent_alliance JSONB,
        strategy TEXT,
        roles JSONB,
        notes TEXT,
        whiteboard_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_scouted_matches_team 
      ON scouted_matches(team_number)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_scouted_matches_match 
      ON scouted_matches(match_number)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_scouted_pits_team 
      ON scouted_pits(team_number)
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    // Don't throw error, just log it and continue without database
    console.log('Continuing without database functionality');
  }
}

// ============================================================================
// API Client Setup
// ============================================================================

const tbaClient = axios.create({
  baseURL: TBA_BASE_URL,
  timeout: 10000,
  headers: {
    'X-TBA-Auth-Key': TBA_API_KEY,
    'Content-Type': 'application/json'
  }
});

const firstClient = axios.create({
  baseURL: FIRST_BASE_URL,
  timeout: 10000,
  auth: {
    username: FIRST_USERNAME,
    password: FIRST_PASSWORD
  },
  headers: {
    'Content-Type': 'application/json'
  }
});

// ============================================================================
// Utility Functions
// ============================================================================

async function getOrCreateUser(name: string, email?: string): Promise<number> {
  if (!pool) {
    // Return a mock user ID when database is not available
    return 1;
  }

  const trimmedName = name.trim();
  const normalizedEmail = email?.trim().toLowerCase() || null;
  const autoAdmin = normalizedEmail 
    ? (normalizedEmail.endsWith('@saxonrobotic.org') || normalizedEmail.endsWith('@saxonrobotics.org'))
    : false;

  // Try to find existing user by email first (preferred), then by name
  let existing = null as any;
  if (normalizedEmail) {
    const byEmail = await pool.query('SELECT id, role, email FROM users WHERE email = $1', [normalizedEmail]);
    if (byEmail.rowCount && byEmail.rowCount > 0) {
      existing = byEmail.rows[0];
    }
  }
  if (!existing) {
    const byName = await pool.query('SELECT id, role, email FROM users WHERE name = $1', [trimmedName]);
    if (byName.rowCount && byName.rowCount > 0) {
      existing = byName.rows[0];
    }
  }

  if (existing) {
    // Update email if missing, and promote to admin if matches domain rule
    const updates: string[] = [];
    const params: any[] = [];
    let idx = 1;
    if (normalizedEmail && !existing.email) {
      updates.push(`email = $${idx++}`);
      params.push(normalizedEmail);
    }
    if (autoAdmin && existing.role !== 'admin') {
      updates.push(`role = 'admin'`);
    }
    if (updates.length) {
      params.push(existing.id);
      await pool.query(`UPDATE users SET ${updates.join(', ')}, active = TRUE WHERE id = $${idx} `, params);
    }
    return existing.id;
  }

  // Create new user
  const role = autoAdmin ? 'admin' : 'scouter';
  const insert = await pool.query(
    'INSERT INTO users(name, email, role, active) VALUES ($1, $2, $3, TRUE) RETURNING id',
    [trimmedName, normalizedEmail, role]
  );
  return insert.rows[0].id;
}

function handleAPIError(error: any, res: express.Response) {
  console.error('API Error:', error);
  
  if (error.response) {
    return res.status(error.response.status).json({
      success: false,
      error: error.response.data?.message || 'External API error',
      details: error.response.data
    });
  } else if (error.request) {
    return res.status(503).json({
      success: false,
      error: 'External API unavailable',
      details: { url: error.config?.url }
    });
  } else {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}

// ============================================================================
// Static File Serving
// ============================================================================

const staticDir = path.resolve(__dirname, '../app');

// Add proper headers for service worker and manifest
app.use((req, res, next) => {
  if (req.path === '/service-worker.js') {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.setHeader('Service-Worker-Allowed', '/');
  }
  if (req.path === '/manifest.json') {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
  next();
});

console.log('Serving static files from:', staticDir);
app.use(express.static(staticDir));

// ============================================================================
// OAuth + Session Auth Routes (Server-side only)
// ============================================================================
// Google OAuth entry and callback
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  app.get(
    '/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/signin' }),
    (_req, res) => {
      return res.redirect('/');
    }
  );
}

// Logout clears session
app.post('/api/logout', (req, res, next) => {
  try {
    // @ts-ignore
    req.logout?.(() => {
      // @ts-ignore
      req.session?.destroy?.(() => {
        res.clearCookie('sessionId');
        res.clearCookie('scouterName');
        return res.json({ success: true });
      });
    });
  } catch (e) {
    next(e);
  }
});

// Current user info
app.get('/api/me', (req, res) => {
  // @ts-ignore
  const user = req.user;
  return res.json({ success: true, data: user || null });
});

// Admin guard middleware
function ensureAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  // @ts-ignore
  const user = req.user;
  if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const role = (user as any).role || 'scouter';
  if (role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });
  return next();
}

// ============================================================================
// Admin - User Management (Protected)
// ============================================================================
app.get('/api/admin/users', ensureAdmin, async (_req, res) => {
  if (!pool) return res.json({ success: true, data: [] });
  try {
    const result = await pool.query('SELECT id, name, email, role, active, created_at FROM users ORDER BY created_at DESC');
    const users = result.rows.map((u: any) => ({
      id: String(u.id),
      name: u.name,
      email: u.email,
      role: u.role || 'scouter',
      active: u.active !== false
    }));
    res.json({ success: true, data: users });
  } catch (error) {
    handleAPIError(error, res);
  }
});

app.post('/api/admin/users/:id/active', ensureAdmin, async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database not available' });
  const { id } = req.params;
  const { active } = req.body as { active?: boolean };
  if (typeof active !== 'boolean') return res.status(400).json({ success: false, error: 'active must be boolean' });
  try {
    const result = await pool.query('UPDATE users SET active = $1 WHERE id = $2 RETURNING id, name, email, role, active', [active, parseInt(id, 10)]);
    if (!result.rowCount) return res.status(404).json({ success: false, error: 'User not found' });
    const u = result.rows[0];
    res.json({ success: true, data: { id: String(u.id), name: u.name, email: u.email, role: u.role, active: u.active } });
  } catch (error) {
    handleAPIError(error, res);
  }
});

app.post('/api/admin/users/:id/role', ensureAdmin, async (req, res) => {
  if (!pool) return res.status(503).json({ success: false, error: 'Database not available' });
  const { id } = req.params;
  const { role } = req.body as { role?: string };
  if (!role || !['admin', 'scouter', 'viewer'].includes(role)) return res.status(400).json({ success: false, error: 'Invalid role' });
  try {
    const result = await pool.query('UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role, active', [role, parseInt(id, 10)]);
    if (!result.rowCount) return res.status(404).json({ success: false, error: 'User not found' });
    const u = result.rows[0];
    res.json({ success: true, data: { id: String(u.id), name: u.name, email: u.email, role: u.role, active: u.active } });
  } catch (error) {
    handleAPIError(error, res);
  }
});

// ============================================================================
// Authentication Endpoints (Local + OAuth)
// ============================================================================

app.post('/api/login', async (req, res) => {
  const { name, email } = req.body as { name?: string; email?: string };
  if (!name || !name.trim()) {
    return res.status(400).json({ 
      success: false, 
      error: 'Name is required' 
    });
  }

  try {
    const trimmed = name.trim();
    const userId = await getOrCreateUser(trimmed, email);
    const sessionId = crypto.randomUUID();
    
    // Only log to database if available
    if (pool) {
    await pool.query(
        'INSERT INTO logins(user_id, session_id, user_agent) VALUES ($1, $2, $3)',
      [userId, sessionId, req.headers['user-agent'] || null]
    );
    }

    const cookieOptions = { 
      httpOnly: true, 
      sameSite: 'lax' as const, 
      secure: NODE_ENV === 'production' 
    };
    
  res.cookie('sessionId', sessionId, cookieOptions);
    res.cookie('scouterName', trimmed, { 
      sameSite: 'lax' as const, 
      secure: NODE_ENV === 'production' 
    });

    // Try to fetch role & email to return
    let role = 'scouter';
    let userEmail: string | null = null;
    if (pool) {
      try {
        const r = await pool.query('SELECT role, email FROM users WHERE id = $1', [userId]);
        if (r.rowCount && r.rows[0]) {
          role = r.rows[0].role || role;
          userEmail = r.rows[0].email || null;
        }
      } catch {}
    }

    return res.json({ 
      success: true, 
      data: { userId, scouterName: trimmed, role, email: userEmail } 
    });
  } catch (error) {
    return handleAPIError(error, res);
  }
});

app.post('/api/log/file-created', async (req, res) => {
  const { filename, filepath, name } = req.body as { 
    filename?: string; 
    filepath?: string; 
    name?: string; 
  };

  if (!filename || !filepath || !name) {
    return res.status(400).json({ 
      success: false, 
      error: 'Filename, filepath, and name are required' 
    });
  }

  try {
    const userId = await getOrCreateUser(name.trim());
    
    // Only log to database if available
    if (pool) {
      await pool.query(
        'INSERT INTO files_created(user_id, filename, filepath) VALUES ($1, $2, $3)',
        [userId, filename, filepath]
      );
    }

    return res.json({ success: true });
  } catch (error) {
    return handleAPIError(error, res);
  }
});

// ============================================================================
// The Blue Alliance API Endpoints
// ============================================================================

app.get('/api/tba/team/:teamNumber', async (req, res) => {
  try {
    const { teamNumber } = req.params;
    const response = await tbaClient.get(`/team/frc${teamNumber}`);
    res.json({ success: true, data: response.data });
  } catch (error) {
    handleAPIError(error, res);
  }
});

app.get('/api/tba/team/:teamNumber/events', async (req, res) => {
  try {
    const { teamNumber } = req.params;
    const { year } = req.query;
    const yearParam = year ? `/${year}` : '';
    const response = await tbaClient.get(`/team/frc${teamNumber}/events${yearParam}`);
    res.json({ success: true, data: response.data });
  } catch (error) {
    handleAPIError(error, res);
  }
});

app.get('/api/tba/team/:teamNumber/event/:eventKey/matches', async (req, res) => {
  try {
    const { teamNumber, eventKey } = req.params;
    const response = await tbaClient.get(`/team/frc${teamNumber}/event/${eventKey}/matches`);
    res.json({ success: true, data: response.data });
  } catch (error) {
    handleAPIError(error, res);
  }
});

app.get('/api/tba/team/:teamNumber/event/:eventKey/status', async (req, res) => {
  try {
    const { teamNumber, eventKey } = req.params;
    const response = await tbaClient.get(`/team/frc${teamNumber}/event/${eventKey}/status`);
    res.json({ success: true, data: response.data });
  } catch (error) {
    handleAPIError(error, res);
  }
});

app.get('/api/tba/event/:eventKey', async (req, res) => {
  try {
    const { eventKey } = req.params;
    const response = await tbaClient.get(`/event/${eventKey}`);
    res.json({ success: true, data: response.data });
  } catch (error) {
    handleAPIError(error, res);
  }
});

app.get('/api/tba/event/:eventKey/teams', async (req, res) => {
  try {
    const { eventKey } = req.params;
    const response = await tbaClient.get(`/event/${eventKey}/teams`);
    res.json({ success: true, data: response.data });
  } catch (error) {
    handleAPIError(error, res);
  }
});

app.get('/api/tba/event/:eventKey/matches', async (req, res) => {
  try {
    const { eventKey } = req.params;
    const response = await tbaClient.get(`/event/${eventKey}/matches`);
    res.json({ success: true, data: response.data });
  } catch (error) {
    handleAPIError(error, res);
  }
});

app.get('/api/tba/event/:eventKey/rankings', async (req, res) => {
  try {
    const { eventKey } = req.params;
    const response = await tbaClient.get(`/event/${eventKey}/rankings`);
    res.json({ success: true, data: response.data });
  } catch (error) {
    handleAPIError(error, res);
  }
});

app.get('/api/tba/event/:eventKey/awards', async (req, res) => {
  try {
    const { eventKey } = req.params;
    const response = await tbaClient.get(`/event/${eventKey}/awards`);
    res.json({ success: true, data: response.data });
  } catch (error) {
    handleAPIError(error, res);
  }
});

// ============================================================================
// FIRST API Endpoints
// ============================================================================

app.get('/api/first/event/:eventCode', async (req, res) => {
  try {
    const { eventCode } = req.params;
    const response = await firstClient.get(`/events/${eventCode}`);
    res.json({ success: true, data: response.data });
  } catch (error) {
    handleAPIError(error, res);
  }
});

app.get('/api/first/team/:teamNumber', async (req, res) => {
  try {
    const { teamNumber } = req.params;
    const response = await firstClient.get(`/teams/${teamNumber}`);
    res.json({ success: true, data: response.data });
  } catch (error) {
    handleAPIError(error, res);
  }
});

app.get('/api/first/event/:eventCode/matches', async (req, res) => {
  try {
    const { eventCode } = req.params;
    const response = await firstClient.get(`/events/${eventCode}/matches`);
    res.json({ success: true, data: response.data });
  } catch (error) {
    handleAPIError(error, res);
  }
});

// ============================================================================
// Local Scouting Data Endpoints
// ============================================================================

app.post('/api/scouting/matches', async (req, res) => {
  if (!pool) {
    return res.status(503).json({
      success: false,
      error: 'Database not available',
      message: 'Scouting data cannot be saved without database connection'
    });
  }

  try {
    const {
      team_number,
      match_number,
      alliance,
      scouter_name,
      auto_scored,
      auto_missed,
      auto_mobility,
      auto_notes,
      teleop_cycles,
      teleop_scored,
      teleop_missed,
      teleop_defense,
      endgame_park,
      endgame_climb,
      fouls,
      comments
    } = req.body;

    const result = await pool.query(`
      INSERT INTO scouted_matches (
        team_number, match_number, alliance, scouter_name,
        auto_scored, auto_missed, auto_mobility, auto_notes,
        teleop_cycles, teleop_scored, teleop_missed, teleop_defense,
        endgame_park, endgame_climb, fouls, comments
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (team_number, match_number, scouter_name)
      DO UPDATE SET
        alliance = EXCLUDED.alliance,
        auto_scored = EXCLUDED.auto_scored,
        auto_missed = EXCLUDED.auto_missed,
        auto_mobility = EXCLUDED.auto_mobility,
        auto_notes = EXCLUDED.auto_notes,
        teleop_cycles = EXCLUDED.teleop_cycles,
        teleop_scored = EXCLUDED.teleop_scored,
        teleop_missed = EXCLUDED.teleop_missed,
        teleop_defense = EXCLUDED.teleop_defense,
        endgame_park = EXCLUDED.endgame_park,
        endgame_climb = EXCLUDED.endgame_climb,
        fouls = EXCLUDED.fouls,
        comments = EXCLUDED.comments,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [
      team_number, match_number, alliance, scouter_name,
      auto_scored || 0, auto_missed || 0, auto_mobility || false, auto_notes,
      teleop_cycles || 0, teleop_scored || 0, teleop_missed || 0, teleop_defense,
      endgame_park || false, endgame_climb || 'none', fouls || 0, comments
    ]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    handleAPIError(error, res);
  }
});

app.get('/api/scouting/matches', async (req, res) => {
  if (!pool) {
    return res.json({ success: true, data: [] });
  }

  try {
    const { team } = req.query;
    let query = 'SELECT * FROM scouted_matches';
    const params: any[] = [];

    if (team) {
      query += ' WHERE team_number = $1';
      params.push(parseInt(team as string));
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    handleAPIError(error, res);
  }
});

app.post('/api/scouting/pit', async (req, res) => {
  if (!pool) {
    return res.status(503).json({
      success: false,
      error: 'Database not available',
      message: 'Scouting data cannot be saved without database connection'
    });
  }

  try {
    const {
      team_number,
      scouter_name,
      drivetrain,
      auto_paths,
      preferred_zones,
      cycle_time_est,
      climb,
      notes
    } = req.body;

    const result = await pool.query(`
      INSERT INTO scouted_pits (
        team_number, scouter_name, drivetrain, auto_paths,
        preferred_zones, cycle_time_est, climb, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (team_number, scouter_name)
      DO UPDATE SET
        drivetrain = EXCLUDED.drivetrain,
        auto_paths = EXCLUDED.auto_paths,
        preferred_zones = EXCLUDED.preferred_zones,
        cycle_time_est = EXCLUDED.cycle_time_est,
        climb = EXCLUDED.climb,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [
      team_number, scouter_name, drivetrain, auto_paths || [],
      preferred_zones || [], cycle_time_est, climb || false, notes
    ]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    handleAPIError(error, res);
  }
});

app.get('/api/scouting/pit', async (req, res) => {
  if (!pool) {
    return res.json({ success: true, data: [] });
  }

  try {
    const { team } = req.query;
    let query = 'SELECT * FROM scouted_pits';
    const params: any[] = [];

    if (team) {
      query += ' WHERE team_number = $1';
      params.push(parseInt(team as string));
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    handleAPIError(error, res);
  }
});

app.get('/api/scouting/stats/:teamNumber', async (req, res) => {
  if (!pool) {
    return res.json({
      success: true,
      data: {
        team: parseInt(req.params.teamNumber),
        matches: 0,
        autoScore: 0,
        autoMiss: 0,
        teleopScore: 0,
        teleopMiss: 0,
        mobilityCount: 0,
        endgameCounts: { none: 0, park: 0, shallow: 0, deep: 0 },
        foulCount: 0,
        averageCycleTime: 0,
        accuracy: 0,
        reliability: 0
      }
    });
  }

  try {
    const { teamNumber } = req.params;
    const teamNum = parseInt(teamNumber);

    const result = await pool.query(`
      SELECT 
        team_number,
        COUNT(*) as matches,
        AVG(auto_scored) as auto_score,
        AVG(auto_missed) as auto_miss,
        AVG(teleop_scored) as teleop_score,
        AVG(teleop_missed) as teleop_miss,
        COUNT(CASE WHEN auto_mobility THEN 1 END) as mobility_count,
        COUNT(CASE WHEN endgame_climb = 'none' THEN 1 END) as endgame_none,
        COUNT(CASE WHEN endgame_park THEN 1 END) as endgame_park,
        COUNT(CASE WHEN endgame_climb = 'shallow' THEN 1 END) as endgame_shallow,
        COUNT(CASE WHEN endgame_climb = 'deep' THEN 1 END) as endgame_deep,
        AVG(fouls) as foul_count,
        AVG(teleop_cycles) as average_cycle_time,
        (AVG(auto_scored) + AVG(teleop_scored)) / 
        (AVG(auto_scored) + AVG(teleop_scored) + AVG(auto_missed) + AVG(teleop_missed)) as accuracy,
        COUNT(CASE WHEN auto_mobility AND endgame_park THEN 1 END) / COUNT(*) as reliability
      FROM scouted_matches 
      WHERE team_number = $1
      GROUP BY team_number
    `, [teamNum]);

    if (result.rows.length === 0) {
      return res.json({ 
        success: true, 
        data: {
          team: teamNum,
          matches: 0,
          autoScore: 0,
          autoMiss: 0,
          teleopScore: 0,
          teleopMiss: 0,
          mobilityCount: 0,
          endgameCounts: { none: 0, park: 0, shallow: 0, deep: 0 },
          foulCount: 0,
          averageCycleTime: 0,
          accuracy: 0,
          reliability: 0
        }
      });
    }

    const stats = result.rows[0];
    res.json({
      success: true,
      data: {
        team: stats.team_number,
        matches: parseInt(stats.matches),
        autoScore: parseFloat(stats.auto_score) || 0,
        autoMiss: parseFloat(stats.auto_miss) || 0,
        teleopScore: parseFloat(stats.teleop_score) || 0,
        teleopMiss: parseFloat(stats.teleop_miss) || 0,
        mobilityCount: parseInt(stats.mobility_count),
        endgameCounts: {
          none: parseInt(stats.endgame_none),
          park: parseInt(stats.endgame_park),
          shallow: parseInt(stats.endgame_shallow),
          deep: parseInt(stats.endgame_deep)
        },
        foulCount: parseFloat(stats.foul_count) || 0,
        averageCycleTime: parseFloat(stats.average_cycle_time) || 0,
        accuracy: parseFloat(stats.accuracy) || 0,
        reliability: parseFloat(stats.reliability) || 0
      }
    });
  } catch (error) {
    handleAPIError(error, res);
  }
});

app.get('/api/scouting/stats', async (req, res) => {
  if (!pool) {
    return res.json({ success: true, data: [] });
  }

  try {
    const result = await pool.query(`
      SELECT 
        team_number,
        COUNT(*) as matches,
        AVG(auto_scored) as auto_score,
        AVG(auto_missed) as auto_miss,
        AVG(teleop_scored) as teleop_score,
        AVG(teleop_missed) as teleop_miss,
        COUNT(CASE WHEN auto_mobility THEN 1 END) as mobility_count,
        COUNT(CASE WHEN endgame_climb = 'none' THEN 1 END) as endgame_none,
        COUNT(CASE WHEN endgame_park THEN 1 END) as endgame_park,
        COUNT(CASE WHEN endgame_climb = 'shallow' THEN 1 END) as endgame_shallow,
        COUNT(CASE WHEN endgame_climb = 'deep' THEN 1 END) as endgame_deep,
        AVG(fouls) as foul_count,
        AVG(teleop_cycles) as average_cycle_time,
        (AVG(auto_scored) + AVG(teleop_scored)) / 
        (AVG(auto_scored) + AVG(teleop_scored) + AVG(auto_missed) + AVG(teleop_missed)) as accuracy,
        COUNT(CASE WHEN auto_mobility AND endgame_park THEN 1 END) / COUNT(*) as reliability
      FROM scouted_matches 
      GROUP BY team_number
      ORDER BY team_number
    `);

    const stats = result.rows.map((row: any) => ({
      team: row.team_number,
      matches: parseInt(row.matches),
      autoScore: parseFloat(row.auto_score) || 0,
      autoMiss: parseFloat(row.auto_miss) || 0,
      teleopScore: parseFloat(row.teleop_score) || 0,
      teleopMiss: parseFloat(row.teleop_miss) || 0,
      mobilityCount: parseInt(row.mobility_count),
      endgameCounts: {
        none: parseInt(row.endgame_none),
        park: parseInt(row.endgame_park),
        shallow: parseInt(row.endgame_shallow),
        deep: parseInt(row.endgame_deep)
      },
      foulCount: parseFloat(row.foul_count) || 0,
      averageCycleTime: parseFloat(row.average_cycle_time) || 0,
      accuracy: parseFloat(row.accuracy) || 0,
      reliability: parseFloat(row.reliability) || 0
    }));

    res.json({ success: true, data: stats });
  } catch (error) {
    handleAPIError(error, res);
  }
});

// ============================================================================
// Google Gemini AI Endpoints
// ============================================================================

app.post('/api/genai/summarize', async (req, res) => {
  if (!genAI) {
    return res.status(503).json({
      success: false,
      error: 'Gemini AI not configured',
      text: 'AI not available. configure GEMINI_API_KEY. ur dumb'
    });
  }

  try {
    const { prompt } = req.body;
    
    // Get scouting data from database
    let scoutingData = 'No scouting data available.';
    if (pool) {
      try {
        const result = await pool.query(`
          SELECT 
            team_number,
            COUNT(*) as matches,
            AVG(auto_scored) as avg_auto_score,
            AVG(teleop_scored) as avg_teleop_score,
            AVG(fouls) as avg_fouls
          FROM scouted_matches 
          GROUP BY team_number
          ORDER BY (AVG(auto_scored) + AVG(teleop_scored)) DESC
          LIMIT 10
        `);
        
        if (result.rows.length > 0) {
          scoutingData = 'Top performing teams:\n' + result.rows.map((row: any) => 
            `Team ${row.team_number}: ${row.matches} matches, Avg Auto: ${parseFloat(row.avg_auto_score).toFixed(1)}, Avg Teleop: ${parseFloat(row.avg_teleop_score).toFixed(1)}, Avg Fouls: ${parseFloat(row.avg_fouls).toFixed(1)}`
          ).join('\n');
        }
      } catch (dbError) {
        console.warn('Failed to fetch scouting data for AI:', dbError);
      }
    }

    const fullPrompt = `You are an expert FRC (FIRST Robotics Competition) scouting analyst for Team 611 Saxon Robotics with deep understanding of strategic evaluation methodologies. Your analysis prioritizes detailed observational scouting data that tracks specific robot actions in every match, as this granular action-level data provides significantly higher accuracy than aggregate statistical metrics alone. While you reference OPR (Offensive Power Rating), EPA (Expected Points Added), and rankings as supplementary data points, you understand their critical limitations: OPR assumes linear scoring and linear team contribution which breaks down in games with non-linear scoring elements, resource constraints, or positional interference, and it cannot capture defensive contributions or qualitative factors like driving skill and reliability; EPA functions as a moving average useful for predictions (calibrated to approximately 70% accuracy) but still cannot reveal qualitative robot characteristics, situational adaptability, or specific capability patterns; rankings reflect cumulative results heavily influenced by schedule strength and alliance partners rather than individual team quality. Your analytical framework follows this methodology: first, identify consistent performance patterns from observational data including autonomous routines and success rates, cycle times and scoring efficiency, endgame mechanism reliability, positional preferences, and defensive capabilities; second, assess reliability by quantifying mechanical breakdowns, performance variance, and improvement trends across matches; third, classify teams by strategic roles such as primary scorers, specialists, versatile contributors, defensive robots, or support roles; fourth, evaluate alliance synergy by analyzing complementary capabilities, spatial compatibility, cycle synchronization, and coordination possibilities; fifth, contextualize analysis within the current year's game design by assessing how linear versus non-linear scoring, resource constraints, positional requirements, and high-variance elements affect strategic priorities. When analyzing the scouting data provided in ${scoutingData} and responding to ${prompt || 'Provide general strategic insights'}, you deliver concise, actionable insights structured around alliance selection strategy (identifying top partners based on complementary strengths and proven reliability, highlighting undervalued capabilities revealed in observational data, flagging teams whose metrics may misrepresent actual value), match strategy (tactical approaches tailored to opponent weaknesses, risk assessment for high-variance versus consistent strategies, defensive assignments, contingency planning), and critical considerations (mechanical reliability concerns, performance variance, strategic mismatches, metric-data discrepancies). You lead with the most actionable insight, support claims with specific observational evidence, acknowledge uncertainty where appropriate, provide clear reasoning chains, and use precise FRC terminology. You always remember these principles: trust scouting data first and investigate when it conflicts with OPR/EPA/rankings, recognize that team value depends on game design and alliance composition context, prioritize reliability over peak performance since consistent performers often provide more value than inconsistent high-performers, explicitly account for defensive contributions that traditional statistics systematically undervalue, and note teams that adapt strategies mid-event as signals of sophistication worth highlighting in recommendations.`;
    
    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: fullPrompt
    });
    const text = response.text;

    res.json({
      success: true,
      text: text,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Gemini AI error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate AI insights',
      text: 'An error occurred while generating AI insights. Please try again.'
    });
  }
});

// ============================================================================
// File Upload Configuration (Multer)
// ============================================================================

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'robot-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// ============================================================================
// Pit Scouting with Image Upload
// ============================================================================

// Upload robot image
app.post('/api/pit/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error: any) {
    console.error('Image upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve uploaded images
app.use('/uploads', express.static(uploadsDir));

// Update pit scouting to include images
app.post('/api/scouting/pit-with-images', express.json(), async (req, res) => {
  try {
    const { team_number, scouter_name, drivetrain, auto_paths, preferred_zones, cycle_time_est, climb, notes, images } = req.body;
    
    if (!pool) {
      return res.status(503).json({ success: false, error: 'Database not available' });
    }

    const query = `
      INSERT INTO scouted_pits (
        team_number, scouter_name, drivetrain, auto_paths, preferred_zones,
        cycle_time_est, climb, notes, images, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (team_number, scouter_name)
      DO UPDATE SET
        drivetrain = EXCLUDED.drivetrain,
        auto_paths = EXCLUDED.auto_paths,
        preferred_zones = EXCLUDED.preferred_zones,
        cycle_time_est = EXCLUDED.cycle_time_est,
        climb = EXCLUDED.climb,
        notes = EXCLUDED.notes,
        images = EXCLUDED.images,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await pool.query(query, [
      team_number, scouter_name, drivetrain, auto_paths, preferred_zones,
      cycle_time_est, climb, notes, JSON.stringify(images || [])
    ]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Pit scouting with images error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// Alliance Selection API
// ============================================================================

// Get alliance selection recommendations
app.get('/api/alliance/recommendations', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ success: false, error: 'Database not available' });
    }

    // Get team statistics for alliance selection
    const query = `
      SELECT 
        team_number,
        COUNT(*) as matches_played,
        AVG(auto_scored) as avg_auto,
        AVG(teleop_scored) as avg_teleop,
        AVG(auto_scored + teleop_scored) as avg_total,
        AVG(fouls) as avg_fouls,
        SUM(CASE WHEN auto_mobility THEN 1 ELSE 0 END)::float / COUNT(*) as mobility_rate,
        SUM(CASE WHEN endgame_climb != 'none' THEN 1 ELSE 0 END)::float / COUNT(*) as climb_rate,
        MAX(auto_scored + teleop_scored) as max_score,
        STDDEV(auto_scored + teleop_scored) as score_consistency
      FROM scouted_matches
      GROUP BY team_number
      HAVING COUNT(*) >= 2
      ORDER BY avg_total DESC
      LIMIT 50
    `;

    const result = await pool.query(query);
    
    // Calculate composite scores
    const teams = result.rows.map((team: any) => ({
      ...team,
      composite_score: (
        parseFloat(team.avg_total) * 0.5 +
        parseFloat(team.avg_auto) * 0.2 +
        parseFloat(team.climb_rate) * 20 +
        parseFloat(team.mobility_rate) * 5 -
        parseFloat(team.avg_fouls) * 2 -
        (parseFloat(team.score_consistency) || 0) * 0.1
      ).toFixed(2)
    })).sort((a, b) => parseFloat(b.composite_score) - parseFloat(a.composite_score));

    res.json({ success: true, data: teams });
  } catch (error: any) {
    console.error('Alliance recommendations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save alliance selection
app.post('/api/alliance/save', express.json(), async (req, res) => {
  try {
    const { alliance_number, captain, first_pick, second_pick, backup, notes } = req.body;
    
    if (!pool) {
      return res.status(503).json({ success: false, error: 'Database not available' });
    }

    const query = `
      INSERT INTO alliance_selections (
        alliance_number, captain, first_pick, second_pick, backup, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (alliance_number)
      DO UPDATE SET
        captain = EXCLUDED.captain,
        first_pick = EXCLUDED.first_pick,
        second_pick = EXCLUDED.second_pick,
        backup = EXCLUDED.backup,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await pool.query(query, [alliance_number, captain, first_pick, second_pick, backup, notes]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Save alliance error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// Match Planning Whiteboard
// ============================================================================

// Get match plan
app.get('/api/match-plan/:matchNumber', async (req, res) => {
  try {
    const { matchNumber } = req.params;
    
    if (!pool) {
      return res.status(503).json({ success: false, error: 'Database not available' });
    }

    const query = `SELECT * FROM match_plans WHERE match_number = $1`;
    const result = await pool.query(query, [matchNumber]);
    
    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows[0] });
    } else {
      res.json({ success: true, data: null });
    }
  } catch (error: any) {
    console.error('Get match plan error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save match plan
app.post('/api/match-plan', express.json(), async (req, res) => {
  try {
    const { match_number, our_alliance, opponent_alliance, strategy, roles, notes, whiteboard_data } = req.body;
    
    if (!pool) {
      return res.status(503).json({ success: false, error: 'Database not available' });
    }

    const query = `
      INSERT INTO match_plans (
        match_number, our_alliance, opponent_alliance, strategy, roles, notes, whiteboard_data, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (match_number)
      DO UPDATE SET
        our_alliance = EXCLUDED.our_alliance,
        opponent_alliance = EXCLUDED.opponent_alliance,
        strategy = EXCLUDED.strategy,
        roles = EXCLUDED.roles,
        notes = EXCLUDED.notes,
        whiteboard_data = EXCLUDED.whiteboard_data,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await pool.query(query, [
      match_number,
      JSON.stringify(our_alliance),
      JSON.stringify(opponent_alliance),
      strategy,
      JSON.stringify(roles),
      notes,
      JSON.stringify(whiteboard_data)
    ]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Save match plan error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// Event Schedule Integration
// ============================================================================

// Get event schedule from The Blue Alliance
app.get('/api/events/:eventKey/schedule', async (req, res) => {
  try {
    const { eventKey } = req.params;
    
    if (!TBA_API_KEY) {
      return res.status(503).json({ success: false, error: 'TBA API not configured' });
    }

    const response = await axios.get(`${TBA_BASE_URL}/event/${eventKey}/matches`, {
      headers: { 'X-TBA-Auth-Key': TBA_API_KEY }
    });

    res.json({ success: true, data: response.data });
  } catch (error: any) {
    console.error('TBA schedule error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get current event info
app.get('/api/events/:eventKey', async (req, res) => {
  try {
    const { eventKey } = req.params;
    
    if (!TBA_API_KEY) {
      return res.status(503).json({ success: false, error: 'TBA API not configured' });
    }

    const response = await axios.get(`${TBA_BASE_URL}/event/${eventKey}`, {
      headers: { 'X-TBA-Auth-Key': TBA_API_KEY }
    });

    res.json({ success: true, data: response.data });
  } catch (error: any) {
    console.error('TBA event error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get team events for current year
app.get('/api/team/:teamNumber/events', async (req, res) => {
  try {
    const { teamNumber } = req.params;
    const year = new Date().getFullYear();
    
    if (!TBA_API_KEY) {
      return res.status(503).json({ success: false, error: 'TBA API not configured' });
    }

    const response = await axios.get(`${TBA_BASE_URL}/team/frc${teamNumber}/events/${year}`, {
      headers: { 'X-TBA-Auth-Key': TBA_API_KEY }
    });

    res.json({ success: true, data: response.data });
  } catch (error: any) {
    console.error('TBA team events error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// Scouting Accuracy Metrics
// ============================================================================

// Get scouting accuracy by comparing predictions vs actual results
app.get('/api/analytics/accuracy', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ success: false, error: 'Database not available' });
    }

    const query = `
      SELECT 
        scouter_name,
        COUNT(*) as total_scouts,
        AVG(auto_scored) as avg_auto_predicted,
        AVG(teleop_scored) as avg_teleop_predicted,
        STDDEV(auto_scored) as auto_consistency,
        STDDEV(teleop_scored) as teleop_consistency
      FROM scouted_matches
      GROUP BY scouter_name
      ORDER BY total_scouts DESC
    `;

    const result = await pool.query(query);
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Accuracy metrics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// Health Check and Utility Endpoints
// ============================================================================

// Health check endpoint for connectivity testing
app.head('/api/health', (req, res) => {
  res.status(200).end();
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    database: pool ? 'connected' : 'disconnected',
    gemini: genAI ? 'configured' : 'not configured',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// Error Handling and Fallback
// ============================================================================

// Client log endpoint for debugging
app.post('/__client_log', express.json({ limit: '50kb' }), (req, res) => {
  try {
    const payload = req.body || {};
    console.log('[client-log]', JSON.stringify(payload));
    res.status(204).end();
  } catch (err) {
    console.error('Failed to record client log:', err);
    res.status(500).end();
  }
});

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/__')) {
    return next();
  }
  
  res.sendFile(path.join(staticDir, 'index.html'), (err) => {
    if (err) {
      console.error('Failed to send index.html:', err);
      res.status(500).send('Internal Server Error');
    }
  });
});

// ============================================================================
// Server Startup
// ============================================================================

async function startServer() {
  try {
    // Initialize database (non-fatal in dev)
    await initializeDatabase();

    const dbStatus = pool ? 'Connected' : 'Disabled/Not connected';

    function listenWithRetry(startPort: number, attemptsLeft = 20) {
      let currentPort = startPort;
      const attempt = (left: number) => {
        const server = http.createServer(app);
        server.on('error', (err: any) => {
          if ((err as any).code === 'EADDRINUSE' && left > 0) {
            console.warn(`Port ${currentPort} in use, trying ${currentPort + 1}...`);
            currentPort += 1;
            setTimeout(() => attempt(left - 1), 100);
          } else {
            console.error('Server failed to start:', err);
            process.exit(1);
          }
        });
        server.listen(currentPort, () => {
          console.log(` Saxon Scout API Server running on port ${currentPort}`);
          console.log(` Environment: ${NODE_ENV}`);
          console.log(` Database: ${dbStatus}`);
          console.log(` TBA API: ${TBA_API_KEY ? 'Configured' : 'Not configured'}`);
          console.log(` FIRST API: ${FIRST_USERNAME ? 'Configured' : 'Not configured'}`);
        });
      };
      attempt(attemptsLeft);
    }

    // Start the server with automatic port fallback
    listenWithRetry(PORT);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
