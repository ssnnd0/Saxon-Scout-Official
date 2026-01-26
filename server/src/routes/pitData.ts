import { Router } from 'express';
import { query } from '../database';

const router = Router();

// Get all pit data
router.get('/pit-data', async (req, res) => {
  try {
    const result = await query('SELECT * FROM pit_data ORDER BY updated_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pit data' });
  }
});

// Get pit data by team number
router.get('/pit-data/:teamNumber', async (req, res) => {
  try {
    const result = await query('SELECT * FROM pit_data WHERE team_number = $1', [req.params.teamNumber]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pit data not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pit data' });
  }
});

// Create or update pit data
router.post('/pit-data', async (req, res) => {
  try {
    const {
      teamNumber, scouterName, drivetrain, motors, weight, batteries, bump, trench, climb,
      archetype, experience, intake, ballCapacity, preload, shooters, canFeed, minDist, maxDist,
      bps, autoAlign, notes, lastModified
    } = req.body;

    const now = new Date();

    const result = await query(
      `INSERT INTO pit_data (team_number, scouter_name, drivetrain, motors, weight, batteries, bump, trench, climb,
        archetype, experience, intake, ball_capacity, preload, shooters, can_feed, min_dist, max_dist,
        bps, auto_align, notes, last_modified, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
       ON CONFLICT (team_number) DO UPDATE SET
        scouter_name = $2, drivetrain = $3, motors = $4, weight = $5, batteries = $6, bump = $7, trench = $8, climb = $9,
        archetype = $10, experience = $11, intake = $12, ball_capacity = $13, preload = $14, shooters = $15, can_feed = $16,
        min_dist = $17, max_dist = $18, bps = $19, auto_align = $20, notes = $21, last_modified = $22, updated_at = $23
       RETURNING *`,
      [teamNumber, scouterName, drivetrain, motors, weight, batteries, bump, trench, climb,
        archetype, experience, intake, ballCapacity, preload, shooters, canFeed, minDist, maxDist,
        bps, autoAlign, notes, lastModified || Date.now(), now]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save pit data' });
  }
});

// Delete pit data
router.delete('/pit-data/:teamNumber', async (req, res) => {
  try {
    await query('DELETE FROM pit_data WHERE team_number = $1', [req.params.teamNumber]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete pit data' });
  }
});

export default router;
