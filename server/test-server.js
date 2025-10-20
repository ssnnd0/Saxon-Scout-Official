// Test server for local development without database
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cookieParser());

// Serve static files from the built frontend
app.use(express.static(path.join(__dirname, '../dist/app')));

// Mock login endpoint - just sets cookies without database
app.post('/api/login', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name required' });
  
  const trimmed = name.trim();
  const sessionId = 'mock-session-' + Date.now();
  
  // Set cookies for testing
  const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: false };
  res.cookie('sessionId', sessionId, cookieOptions);
  res.cookie('scouterName', trimmed, { sameSite: 'lax', secure: false });
  
  console.log(`Login: ${trimmed} (session: ${sessionId})`);
  return res.json({ ok: true, userId: 1 });
});

// Mock file creation log endpoint
app.post('/api/log/file-created', (req, res) => {
  const { filename, filepath, name } = req.body;
  if (!filename || !filepath || !name) return res.status(400).json({ error: 'filename, filepath, name required' });
  
  console.log(`File created: ${filename} by ${name} at ${filepath}`);
  return res.json({ ok: true });
});

// Mock GenAI endpoint
app.post('/api/genai/summarize', (req, res) => {
  return res.status(501).json({ error: 'GenAI not configured (test mode)' });
});

// Serve the React app for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/app/index.html'));
});

const port = parseInt(process.env.PORT || '8787', 10);
app.listen(port, () => {
  console.log(`🚀 Saxon Scout test server running at http://localhost:${port}`);
  console.log(`📁 Serving frontend from: ${path.join(__dirname, '../dist/app')}`);
  console.log(`💾 Database: DISABLED (using mock endpoints for testing)`);
  console.log(`📝 File operations: LOGGED TO CONSOLE ONLY`);
});