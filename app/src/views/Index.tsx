// @ts-nocheck
import * as Inferno from 'inferno';
import { FC } from 'inferno';
import type { DirHandle } from '../lib/fsStore';

interface IndexProps {
  root: DirHandle | null;
  scouter: string;
  onPickFolder: () => void;
  onLogin: () => void;
}

const Index: FC<IndexProps> = ({ root, scouter, onPickFolder, onLogin }) => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
    <nav className="navbar app-navbar px-3 shadow-sm">
      <div className="container-fluid" style={{ maxWidth: '1200px' }}>
        <div className="d-flex align-items-center gap-3">
          <img 
            src="/app/assets/Logo+611.png" 
            alt="Saxon Scout Logo" 
            className="app-logo" 
            style={{ height: '40px' }}
          />
          <div className="nav-title" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
            Saxon Scout
          </div>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {!root && (
            <button 
              className="btn btn-light btn-sm d-flex align-items-center gap-2" 
              onClick={onPickFolder}
            >
              <i className="fa fa-folder-open"></i>
              <span className="d-none d-sm-inline">Select Data Folder</span>
            </button>
          )}
          {root && (
            <span className="badge bg-success d-flex align-items-center gap-1">
              <i className="fa fa-check-circle"></i>
              <span className="d-none d-sm-inline">Folder Connected</span>
            </span>
          )}
          <button 
            className="btn btn-light btn-sm d-flex align-items-center gap-2" 
            onClick={onLogin}
          >
            <i className="fa fa-user"></i>
            <span>{scouter || 'Login'}</span>
          </button>
        </div>
      </div>
    </nav>

    <main className="container" style={{ maxWidth: '1200px', marginTop: '3rem', minHeight: 'calc(100vh - 100px)' }}>
      {!root && !scouter && (
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-lg border-0" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <div className="card-body p-5 text-center">
                <img 
                  src="/app/assets/Logo+611.png" 
                  alt="Saxon Scout Logo" 
                  style={{ height: '80px', marginBottom: '2rem' }}
                />
                <h1 className="card-title mb-3" style={{ color: '#0066cc', fontSize: '2.5rem', fontWeight: 'bold' }}>
                  Welcome to Saxon Scout
                </h1>
                <p className="card-text text-muted mb-4" style={{ fontSize: '1.1rem' }}>
                  A local-first scouting platform for FRC events
                </p>

                <div className="alert alert-info mb-4" style={{ borderRadius: '8px', textAlign: 'left', backgroundColor: '#e7f3ff', borderColor: '#0066cc' }}>
                  <h5 className="alert-heading mb-3">
                    <i className="fa fa-info-circle me-2"></i>
                    Getting Started
                  </h5>
                  <ol className="mb-0 ps-3">
                    <li className="mb-2">
                      <strong>Select Data Folder:</strong> Click the button in the top right to choose where your scouting data will be stored locally
                    </li>
                    <li className="mb-2">
                      <strong>Login:</strong> Enter your scouter name to start logging observations and create scouting records
                    </li>
                    <li>
                      <strong>Start Scouting:</strong> Begin creating quick scouts, pit scouts, and analyzing team data with your team
                    </li>
                  </ol>
                </div>

                <div className="d-flex gap-2 justify-content-center flex-wrap">
                  <button 
                    className="btn btn-primary btn-lg d-flex align-items-center gap-2" 
                    onClick={onPickFolder}
                  >
                    <i className="fa fa-folder-open"></i>
                    Select Data Folder
                  </button>
                  <button 
                    className="btn btn-outline-primary btn-lg d-flex align-items-center gap-2" 
                    onClick={onLogin}
                  >
                    <i className="fa fa-user"></i>
                    Login as Scouter
                  </button>
                </div>
              </div>
            </div>

            <div className="row mt-5 g-3">
              <div className="col-md-4">
                <div className="card h-100 shadow-sm border-0" style={{ borderRadius: '8px' }}>
                  <div className="card-body text-center">
                    <i className="fa fa-bolt" style={{ fontSize: '2.5rem', color: '#0066cc', marginBottom: '1rem' }}></i>
                    <h5 className="card-title fw-bold">Quick Scout</h5>
                    <p className="card-text text-muted">Fast match-based scouting with large touch targets</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card h-100 shadow-sm border-0" style={{ borderRadius: '8px' }}>
                  <div className="card-body text-center">
                    <i className="fa fa-target" style={{ fontSize: '2.5rem', color: '#0066cc', marginBottom: '1rem' }}></i>
                    <h5 className="card-title fw-bold">Pit Scout</h5>
                    <p className="card-text text-muted">Detailed team and robot capability information</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card h-100 shadow-sm border-0" style={{ borderRadius: '8px' }}>
                  <div className="card-body text-center">
                    <i className="fa fa-download" style={{ fontSize: '2.5rem', color: '#0066cc', marginBottom: '1rem' }}></i>
                    <h5 className="card-title fw-bold">Export Data</h5>
                    <p className="card-text text-muted">Export and share your scouting data as CSV</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {root && !scouter && (
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div className="alert alert-warning shadow-sm" style={{ borderRadius: '8px' }}>
              <h4 className="alert-heading">
                <i className="fa fa-exclamation-triangle me-2"></i> 
                Almost There
              </h4>
              <p>You've selected a data folder. Now you need to login as a scouter to continue.</p>
              <button className="btn btn-warning" onClick={onLogin}>
                <i className="fa fa-user me-2"></i>
                Login Now
              </button>
            </div>
          </div>
        </div>
      )}

      {!root && scouter && (
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div className="alert alert-warning shadow-sm" style={{ borderRadius: '8px' }}>
              <h4 className="alert-heading">
                <i className="fa fa-folder me-2"></i> 
                Select a Folder
              </h4>
              <p>You're logged in as <strong>{scouter}</strong>. Now select a data folder to store your scouting data.</p>
              <button className="btn btn-warning" onClick={onPickFolder}>
                <i className="fa fa-folder-open me-2"></i>
                Select Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {root && scouter && (
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div className="card shadow-lg border-0" style={{ borderRadius: '12px' }}>
              <div className="card-body p-5 text-center">
                <i className="fa fa-check-circle" style={{ fontSize: '3rem', color: '#28a745', marginBottom: '1rem' }}></i>
                <h2 className="mb-3 fw-bold">Ready to Scout!</h2>
                <p className="text-muted mb-4">
                  You're logged in as <strong>{scouter}</strong> and your data folder is connected.
                </p>
                <div className="alert alert-success mb-0">
                  <i className="fa fa-check-circle me-2"></i> 
                  Everything is set up and ready to go!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  </div>
);

export default Index;