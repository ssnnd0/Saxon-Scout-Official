import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import { initializeDatabase, closePool } from './database';

// Routes
import matchesRouter from './routes/matches';
import pitDataRouter from './routes/pitData';
import teamsRouter from './routes/teams';
import usersRouter from './routes/users';
import picklistRouter from './routes/picklist';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', matchesRouter);
app.use('/api', pitDataRouter);
app.use('/api', teamsRouter);
app.use('/api', usersRouter);
app.use('/api', picklistRouter);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: Function) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const startServer = async () => {
  try {
    // Initialize database (optional - log warning if it fails)
    try {
      await initializeDatabase();
      console.log('✅ Database initialized');
    } catch (dbErr) {
      console.warn('⚠️  Database connection failed - API will work but data won\'t persist to database');
      console.warn('   Make sure PostgreSQL is running with correct credentials');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📱 API base URL: http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await closePool();
  process.exit(0);
});

startServer();
