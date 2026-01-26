import { Router } from 'express';
import { query } from '../database';

const router = Router();

// Get all picklists
router.get('/picklists', async (req, res) => {
  try {
    const result = await query('SELECT * FROM picklists ORDER BY rank ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch picklists' });
  }
});

// Create or update picklist
router.post('/picklists', async (req, res) => {
  try {
    const picklists = req.body; // Array of picklist items

    for (const item of picklists) {
      const now = new Date();
      await query(
        `INSERT INTO picklists (team_number, rank, notes, avg_fuel, updated_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (team_number) DO UPDATE SET rank = $2, notes = $3, avg_fuel = $4, updated_at = $5`,
        [item.teamNumber, item.rank, item.notes, item.avgFuel, now]
      );
    }

    res.json({ success: true, count: picklists.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save picklists' });
  }
});

export default router;
