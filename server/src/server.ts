// @ts-nocheck
import express from 'express';
import cookieParser from 'cookie-parser';
import { Pool } from 'pg';
import crypto from 'crypto';

// Configure the PostgreSQL connection pool. When running in development or
// locally via docker-compose, DATABASE_URL will typically be undefined and
// the fallback will connect to the local Postgres container.
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://frc:frcpass@localhost:5432/scouting' });

const app = express();
app.use(express.json());
app.use(cookieParser());

/**
 * Fetch an existing user ID by name or create a new record. Names are stored
 * exactly as provided (case sensitive). Returns the user ID.
 */
async function getOrCreateUser(name: string): Promise<number> {
  const r = await pool.query('select id from users where name = $1', [name]);
  if (r.rowCount) return r.rows[0].id as number;
  const ins = await pool.query('insert into users(name) values ($1) returning id', [name]);
  return ins.rows[0].id as number;
}

// Login endpoint: accepts a simple object `{ name: string }`. Creates or
// retrieves a user record, then logs the login event and sets cookies.
app.post('/api/login', async (req, res) => {
  const { name } = req.body as { name?: string };
  if (!name || !name.trim()) return res.status(400).json({ error: 'name required' });
  try {
    const trimmed = name.trim();
    const userId = await getOrCreateUser(trimmed);
    const sessionId = crypto.randomUUID();
    await pool.query(
      'insert into logins(user_id, session_id, user_agent) values ($1, $2, $3)',
      [userId, sessionId, req.headers['user-agent'] || null]
    );
    // Set cookies to identify session and scouter name
    res.cookie('sessionId', sessionId, { httpOnly: true, sameSite: 'lax', secure: true });
    res.cookie('scouterName', trimmed, { sameSite: 'lax', secure: true });
    return res.json({ ok: true, userId });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'internal error' });
  }
});

// File creation log endpoint: expects `{ filename, filepath, name }`. Looks up
// the user by name and records the file. Does not set any cookies.
app.post('/api/log/file-created', async (req, res) => {
  const { filename, filepath, name } = req.body as { filename?: string; filepath?: string; name?: string };
  if (!filename || !filepath || !name) return res.status(400).json({ error: 'filename, filepath, name required' });
  try {
    const userId = await getOrCreateUser(name.trim());
    await pool.query('insert into files_created(user_id, filename, filepath) values ($1, $2, $3)', [userId, filename, filepath]);
    return res.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'internal error' });
  }
});

// Optional proxy endpoint to Google GenAI (Gemini). This demonstration just
// returns an error unless the `GOOGLE_API_KEY` environment variable is set.
app.post('/api/genai/summarize', async (req, res) => {
  if (!process.env.GOOGLE_API_KEY) {
    return res.status(501).json({ error: 'GenAI not configured' });
  }
  // In a real implementation, this would use @google/generative-ai or similar
  // to send the prompt to the Gemini API and return the generated text. For
  // security and simplicity in this skeleton, we return a stub response.
  return res.status(501).json({ error: 'Implement with Gemini SDK' });
});

// Start the server. The port defaults to 8787 when not provided by the
// environment. If this script is run by node directly, the server begins
// listening; in tests it can be imported and started separately.
const port = parseInt(process.env.PORT || '8787', 10);
app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});