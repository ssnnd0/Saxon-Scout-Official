// @ts-nocheck
import * as Inferno from 'inferno';
import { FC } from 'inferno';

const NotFound: FC = () => (
  <div className="app-shell">
    <nav className="navbar app-navbar px-3 shadow-sm">
      <div className="container-fluid" style={{ maxWidth: '1200px' }}>
        <div className="d-flex align-items-center gap-3">
          <img src="/app/assets/Logo+611.png" alt="Saxon Scout Logo" className="app-logo" />
          <div className="nav-title">Saxon Scout</div>
        </div>
      </div>
    </nav>

    <main className="app-container d-flex align-items-center justify-content-center" style={{ minHeight: 'calc(100vh - 100px)' }}>
      <div className="text-center">
        <div style={{ fontSize: '6rem', fontWeight: 'bold', color: '#0066cc', marginBottom: '1rem' }}>
          404
        </div>
        <h2 className="mb-2">Page Not Found</h2>
        <p className="text-muted mb-4">The page you're looking for doesn't exist.</p>
        <a href="/" className="btn btn-primary btn-lg">
          <i className="fa fa-home me-2"></i>
          Return to Home
        </a>
      </div>
    </main>

    <footer className="app-footer">
      <div className="d-flex align-items-center justify-content-center gap-2">
        <span>© Saxon Scout</span>
        <span className="text-muted">|</span>
      </div>
    </footer>
  </div>
);

export default NotFound;