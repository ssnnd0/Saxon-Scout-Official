import { Router } from 'express';
import { query } from '../database';

const router = Router();

// Get all users
router.get('/users', async (req, res) => {
  try {
    const result = await query('SELECT id, username, role, created_at FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user
router.post('/users', async (req, res) => {
  try {
    const { username, pin, role = 'scout' } = req.body;

    const result = await query(
      'INSERT INTO users (username, pin, role) VALUES ($1, $2, $3) RETURNING id, username, role, created_at',
      [username, pin, role]
    );

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'User already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Verify PIN
router.post('/users/verify', async (req, res) => {
  try {
    const { username, pin } = req.body;

    const result = await query(
      'SELECT id, username, role FROM users WHERE username = $1 AND pin = $2',
      [username, pin]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to verify user' });
  }
});

export default router;
