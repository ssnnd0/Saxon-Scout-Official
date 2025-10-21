import express from 'express';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Get all scouting data
router.get('/', requireAuth, async (req, res) => {
  try {
    // Implementation will be added later
    res.json({ message: 'Scouting data endpoint' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;