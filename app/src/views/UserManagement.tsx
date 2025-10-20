import React, { useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  email?: string;
  role: 'admin' | 'scouter' | 'viewer';
  active: boolean;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/users');
        if (!res.ok) throw new Error('Failed to load users');
        const data = await res.json();
        if (data?.success && Array.isArray(data.data)) {
          setUsers(data.data);
        } else {
          setUsers([]);
        }
      } catch (err: any) {
        setError('Could not load users');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleActive = async (user: User) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}/active`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !user.active })
      });
      if (!res.ok) throw new Error();
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: !u.active } : u));
    } catch {
      alert('Failed to update user');
    }
  };

  return (
    <div className="saxon-hero">
      <div className="container mx-auto px-6 py-8">
        <div className="saxon-card">
          <div className="saxon-card-header">
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Manage users, roles, and access
            </p>
          </div>
          <div className="saxon-card-body">
            {loading && (
              <div className="flex justify-center py-8"><div className="saxon-loading-lg"></div></div>
            )}
            {error && (
              <div className="saxon-alert saxon-alert-error mb-4">
                <i className="fa fa-exclamation-triangle"></i>
                <div>{error}</div>
              </div>
            )}
            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="saxon-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="font-semibold">{u.name}</td>
                        <td>{u.email || '-'}</td>
                        <td>
                          <span className="saxon-badge-outline">{u.role}</span>
                        </td>
                        <td>{u.active ? 'Active' : 'Disabled'}</td>
                        <td>
                          <button className="saxon-btn-outline" onClick={() => toggleActive(u)}>
                            {u.active ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center" style={{ color: 'var(--color-text-secondary)' }}>
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
