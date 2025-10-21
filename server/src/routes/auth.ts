import express from 'express';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  try {
    // Implementation will be added later
    res.json({ message: 'Auth endpoint' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', requireAuth, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;