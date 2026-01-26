import { Router } from 'express';
import { query } from '../database';

const router = Router();

// Get all matches
router.get('/matches', async (req, res) => {
  try {
    const result = await query('SELECT * FROM matches ORDER BY updated_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Get match by ID
router.get('/matches/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM matches WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

// Create or update match
router.post('/matches', async (req, res) => {
  try {
    const {
      id, scoutName, scouterInitials, matchNumber, teamNumber, alliance, startingZone,
      leaveLine, autoFuelScored, autoFuelMissed, autoTowerLevel,
      teleopFuelScored, teleopFuelMissed, fuelIntakeGround, fuelIntakeSource,
      endgameTowerLevel, climbDuration, climbPosition, crossedBump, underTrench,
      autoStrategy, teleopStrategy, attackDuration, defenseDuration, feedingDuration,
      defensePlayed, robotDied, comments, lastModified, events, autoEvents, teleopEvents
    } = req.body;

    const matchId = id || `match_${Date.now()}`;
    const now = new Date();

    const result = await query(
      `INSERT INTO matches (id, scout_name, scouter_initials, match_number, team_number, alliance, starting_zone,
        leave_line, auto_fuel_scored, auto_fuel_missed, auto_tower_level,
        teleop_fuel_scored, teleop_fuel_missed, fuel_intake_ground, fuel_intake_source,
        endgame_tower_level, climb_duration, climb_position, crossed_bump, under_trench,
        auto_strategy, teleop_strategy, attack_duration, defense_duration, feeding_duration,
        defense_played, robot_died, comments, last_modified, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)
       ON CONFLICT (id) DO UPDATE SET
        scout_name = $2, scouter_initials = $3, match_number = $4, team_number = $5, alliance = $6, starting_zone = $7,
        leave_line = $8, auto_fuel_scored = $9, auto_fuel_missed = $10, auto_tower_level = $11,
        teleop_fuel_scored = $12, teleop_fuel_missed = $13, fuel_intake_ground = $14, fuel_intake_source = $15,
        endgame_tower_level = $16, climb_duration = $17, climb_position = $18, crossed_bump = $19, under_trench = $20,
        auto_strategy = $21, teleop_strategy = $22, attack_duration = $23, defense_duration = $24, feeding_duration = $25,
        defense_played = $26, robot_died = $27, comments = $28, last_modified = $29, updated_at = $30
       RETURNING *`,
      [matchId, scoutName, scouterInitials, matchNumber, teamNumber, alliance, startingZone,
        leaveLine, autoFuelScored, autoFuelMissed, autoTowerLevel,
        teleopFuelScored, teleopFuelMissed, fuelIntakeGround, fuelIntakeSource,
        endgameTowerLevel, climbDuration, climbPosition, crossedBump, underTrench,
        autoStrategy, teleopStrategy, attackDuration, defenseDuration, feedingDuration,
        defensePlayed, robotDied, comments, lastModified || Date.now(), now]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save match' });
  }
});

// Delete match
router.delete('/matches/:id', async (req, res) => {
  try {
    await query('DELETE FROM matches WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete match' });
  }
});

export default router;
