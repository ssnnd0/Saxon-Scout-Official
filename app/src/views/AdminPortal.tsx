import React from 'react';

const AdminPortal: React.FC = () => {
  return (
    <div className="saxon-hero">
      <div className="container mx-auto px-6 py-8">
        <div className="saxon-card">
          <div className="saxon-card-header">
            <h1 className="text-2xl font-bold">Admin Portal</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Manage system settings, users, and data tools
            </p>
          </div>
          <div className="saxon-card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <a className="saxon-card" href="/users">
                <div className="saxon-card-body">
                  <h3 className="text-lg font-semibold mb-2"><i className="fa fa-users mr-2"></i>User Management</h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Create, edit, and disable users; set roles.</p>
                </div>
              </a>
              <div className="saxon-card">
                <div className="saxon-card-body">
                  <h3 className="text-lg font-semibold mb-2"><i className="fa fa-database mr-2"></i>Database</h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Backup, import/export, and maintenance tools.</p>
                </div>
              </div>
              <div className="saxon-card">
                <div className="saxon-card-body">
                  <h3 className="text-lg font-semibold mb-2"><i className="fa fa-cog mr-2"></i>System</h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Feature flags, API keys, and environment info.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
