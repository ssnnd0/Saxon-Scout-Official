import express from 'express';
import scoutingRoutes from './scouting';
import teamsRoutes from './teams';
import authRoutes from './auth';
import adminRoutes from './admin';

const router = express.Router();

// Register all route modules
router.use('/auth', authRoutes);
router.use('/scouting', scoutingRoutes);
router.use('/teams', teamsRoutes);
router.use('/admin', adminRoutes);

export default router;