import { Pool, QueryResult } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://saxon_user:saxon_password@localhost:5432/saxon_scout',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const query = (text: string, params?: any[]): Promise<QueryResult> => {
  return pool.query(text, params);
};

export const getClient = async () => {
  return await pool.connect();
};

export const initializeDatabase = async () => {
  try {
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    const client = await pool.connect();
    try {
      await client.query(schema);
      console.log('✅ Database schema initialized successfully');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('❌ Error initializing database:', err);
    throw err;
  }
};

export const closePool = async () => {
  await pool.end();
};

export default pool;
