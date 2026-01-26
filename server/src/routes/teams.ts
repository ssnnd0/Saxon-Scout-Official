import { Router } from 'express';
import { query } from '../database';

const router = Router();

// Get all teams
router.get('/teams', async (req, res) => {
  try {
    const result = await query('SELECT * FROM teams ORDER BY team_number ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Create or update teams (bulk)
router.post('/teams', async (req, res) => {
  try {
    const teams = req.body; // Array of teams

    for (const team of teams) {
      await query(
        `INSERT INTO teams (team_number, name_short)
         VALUES ($1, $2)
         ON CONFLICT (team_number) DO UPDATE SET name_short = $2`,
        [team.teamNumber, team.nameShort]
      );
    }

    res.json({ success: true, count: teams.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save teams' });
  }
});

export default router;
