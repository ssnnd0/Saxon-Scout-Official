import express from 'express';
import { Pool } from 'pg';
import { verifyAdminToken } from '../middleware/auth';

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware to verify admin access
router.use(verifyAdminToken);

/**
 * Get all records from the database
 * Requires admin authentication
 */
router.get('/records', async (req, res) => {
  try {
    // Get match records
    const matchQuery = `
      SELECT 
        id, 
        'match' as type,
        team_number, 
        match_number,
        scouter_name,
        created_at
      FROM match_records
      ORDER BY created_at DESC
    `;
    
    // Get pit records
    const pitQuery = `
      SELECT 
        id, 
        'pit' as type,
        team_number, 
        NULL as match_number,
        scouter_name,
        created_at
      FROM pit_records
      ORDER BY created_at DESC
    `;
    
    const [matchResults, pitResults] = await Promise.all([
      pool.query(matchQuery),
      pool.query(pitQuery)
    ]);
    
    // Combine and sort by created_at
    const allRecords = [
      ...matchResults.rows,
      ...pitResults.rows
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    res.json(allRecords);
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ message: 'Server error while fetching records' });
  }
});

/**
 * Delete a record from the database
 * Requires admin authentication and password confirmation
 * Logs the deletion for audit purposes
 */
router.delete('/records/:id', async (req, res) => {
  const { id } = req.params;
  const { adminPassword, recordType, teamNumber, actionReason } = req.body;
  
  // Verify admin password (this should be a secure check against stored hash)
  const isPasswordValid = await verifyAdminPassword(adminPassword);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid admin password' });
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Determine which table to delete from
    const tableName = recordType === 'match' ? 'match_records' : 'pit_records';
    
    // Delete the record
    const deleteQuery = `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`;
    const deleteResult = await client.query(deleteQuery, [id]);
    
    if (deleteResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Record not found' });
    }
    
    // Log the deletion for audit purposes
    const logQuery = `
      INSERT INTO admin_audit_log (
        admin_id, 
        action_type, 
        record_id, 
        record_type, 
        team_number, 
        action_reason,
        ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    
    await client.query(logQuery, [
      req.user?.id || 0, // From auth middleware with null check
      'DELETE',
      id,
      recordType,
      teamNumber,
      actionReason,
      req.ip
    ]);
    
    await client.query('COMMIT');
    
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting record:', error);
    res.status(500).json({ message: 'Server error while deleting record' });
  } finally {
    client.release();
  }
});

/**
 * Get audit log entries
 * Requires admin authentication
 */
router.get('/audit-log', async (req, res) => {
  try {
    const query = `
      SELECT 
        al.id,
        al.admin_id,
        u.username as admin_username,
        al.action_type,
        al.record_id,
        al.record_type,
        al.team_number,
        al.action_reason,
        al.ip_address,
        al.created_at
      FROM admin_audit_log al
      JOIN users u ON al.admin_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 100
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ message: 'Server error while fetching audit log' });
  }
});

/**
 * Verify admin password
 * This is a placeholder - in a real implementation, this would check against a securely stored hash
 */
async function verifyAdminPassword(password: string): Promise<boolean> {
  // In a real implementation, this would verify against a securely stored hash
  // For now, we'll use a simple check against an environment variable
  const adminPassword = process.env.ADMIN_PASSWORD;
  return password === adminPassword;
}

export default router;