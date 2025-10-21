import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { 
  Box, 
  Button, 
  TextField, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { Delete, Refresh, Search } from '@mui/icons-material';
import { format } from 'date-fns';

interface DatabaseRecord {
  id: string;
  type: string;
  team_number: number;
  match_number?: number;
  scouter_name: string;
  created_at: string;
  [key: string]: any;
}

interface DatabaseManagerProps {
  isAdmin: boolean;
}

/**
 * Admin component for managing database records
 * Provides secure deletion capabilities with authentication and audit logging
 */
export const DatabaseManager: React.FC<DatabaseManagerProps> = ({ isAdmin }) => {
  const [records, setRecords] = useState<DatabaseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [recordType, setRecordType] = useState<'all' | 'match' | 'pit'>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DatabaseRecord | null>(null);

  // Fetch records from the database
  const fetchRecords = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/admin/records', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('saxon-scout-admin-token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      } else {
        toast.error('Failed to fetch records. Please check your admin permissions.');
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      console.error('Error fetching records:', error);
      toast.error('An error occurred while fetching records');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (isAdmin) {
      fetchRecords();
    }
  }, [isAdmin]);

  // Filter records based on search and type
  const filteredRecords = records.filter(record => {
    const matchesFilter = 
      record.team_number.toString().includes(filter) ||
      record.scouter_name.toLowerCase().includes(filter.toLowerCase()) ||
      (record.match_number && record.match_number.toString().includes(filter));
    
    const matchesType = 
      recordType === 'all' || 
      (recordType === 'match' && record.type === 'match') ||
      (recordType === 'pit' && record.type === 'pit');
    
    return matchesFilter && matchesType;
  });

  // Handle record deletion with authentication
  const handleDeleteRecord = async (record: DatabaseRecord) => {
    setSelectedRecord(record);
    setShowPasswordModal(true);
  };

  // Confirm deletion with admin password
  const confirmDeleteWithPassword = async () => {
    if (!selectedRecord) return;
    
    try {
      const response = await fetch(`/api/admin/records/${selectedRecord.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('saxon-scout-admin-token')}`
        },
        body: JSON.stringify({
          adminPassword,
          recordId: selectedRecord.id,
          recordType: selectedRecord.type,
          teamNumber: selectedRecord.team_number,
          actionReason: 'Admin requested deletion'
        })
      });

      if (response.ok) {
        toast.success('Record deleted successfully');
        // Update local state
        setRecords(records.filter(r => r.id !== selectedRecord.id));
      } else {
        const errorData = await response.json();
        toast.error(`Failed to delete: ${errorData.message || 'Invalid credentials'}`);
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('An error occurred while deleting the record');
    } finally {
      setShowPasswordModal(false);
      setAdminPassword('');
      setSelectedRecord(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="alert alert-danger">
        You do not have permission to access this page.
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <h2 className="mb-4">Database Management</h2>
      
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Records Management</h5>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Search by team number, scouter name, or match number"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={recordType}
                onChange={(e) => setRecordType(e.target.value as any)}
              >
                <option value="all">All Records</option>
                <option value="match">Match Records</option>
                <option value="pit">Pit Records</option>
              </select>
            </div>
            <div className="col-md-2">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={fetchRecords}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Team</th>
                    <th>Match</th>
                    <th>Scouter</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-3">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => (
                      <tr key={record.id}>
                        <td>{record.id.substring(0, 8)}...</td>
                        <td>
                          <span className={`badge ${record.type === 'match' ? 'bg-info' : 'bg-success'}`}>
                            {record.type}
                          </span>
                        </td>
                        <td>{record.team_number}</td>
                        <td>{record.match_number || 'N/A'}</td>
                        <td>{record.scouter_name}</td>
                        <td>{new Date(record.created_at).toLocaleString()}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteRecord(record)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Admin Password Modal */}
      {showPasswordModal && (
        <div className="modal fade show" style={{ display: 'block' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Confirm Record Deletion</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPasswordModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-3">
                  You are about to delete a record for Team {selectedRecord?.team_number}.
                  This action cannot be undone and will be logged for audit purposes.
                </p>
                <div className="form-group">
                  <label htmlFor="adminPassword">Admin Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="adminPassword"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password to confirm"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmDeleteWithPassword}
                  disabled={!adminPassword}
                >
                  Delete Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseManager;