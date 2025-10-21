import React, { Suspense, useCallback, useState, useEffect } from 'react';
import { BrowserRouter as Router, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { pickRoot, DirHandle } from '../lib/fsStore';
import { APIProvider, APIErrorBoundary } from '../lib/api';
import { SettingsProvider } from '../context/SettingsContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import ErrorBoundary from '../components/ErrorBoundary';
import LoadingSpinner from '../components/LoadingSpinner';
import { AppLayout } from '../components/Layout/AppLayout';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/theme.css';

// Type definitions
interface AppState {
  root: DirHandle | null;
  scouter: string;
  isInitializing: boolean;
  hasFileSystemAccess: boolean;
  initError: string | null;
  theme: 'light' | 'dark';
}

// Lazy load components
const QuickScout = React.lazy(() => import('./QuickScout'));
const InfoViewer = React.lazy(() => import('./InfoViewer'));
const PitScout = React.lazy(() => import('./PitScout'));
const AllianceSelection = React.lazy(() => import('./AllianceSelection'));
const MatchPlanning = React.lazy(() => import('./MatchPlanning'));
const EventSchedule = React.lazy(() => import('./EventSchedule'));
const Analytics = React.lazy(() => import('./Analytics'));
const ExportView = React.lazy(() => import('./Export'));
const Settings = React.lazy(() => import('./Settings'));
const AdminPortal = React.lazy(() => import('./AdminPortal'));
const UserManagement = React.lazy(() => import('./UserManagement'));
const SignIn = React.lazy(() => import('./SignIn'));
const Home = React.lazy(() => import('./Home'));
const NotFound = React.lazy(() => import('./NotFound'));
const AppShell = React.lazy(() => import('../components/AppShell'));

/**
 * Top-level application component. Manages global state such as the selected
 * root folder and the currently logged-in scouter. Handles initialization,
 * file system access detection, and view routing.
 */

const RouteBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ErrorBoundary fallback={<div>Something went wrong.</div>}>{children}</ErrorBoundary>;
};

// Main App component
function App() {
  const [appState, setAppState] = useState<AppState>({
    root: null,
    scouter: '',
    isInitializing: true,
    hasFileSystemAccess: false,
    initError: null,
    theme: (localStorage.getItem('saxon_scout_theme') as 'light' | 'dark') || 'light'
  });

  const navigate = useNavigate();

  const loadCachedConfig = useCallback(async () => {
    try {
      const config = localStorage.getItem('saxon_scout_config');
      if (config) {
        JSON.parse(config);
      }
    } catch (err) {
      console.warn('Failed to load cached config:', err);
    }
  }, []);

  const initializeApp = useCallback(async () => {
    try {
      const hasFileSystem = 'showDirectoryPicker' in window;
      setAppState(prev => ({ ...prev, hasFileSystemAccess: hasFileSystem }));

      const savedScout = localStorage.getItem('saxon_scout_user');
      if (savedScout) {
        setAppState(prev => ({ ...prev, scouter: savedScout }));
        try {
          const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: savedScout })
          });

          if (!response.ok) {
            throw new Error('Login verification failed');
          }
        } catch (error) {
          console.warn('Failed to verify saved login:', error);
          localStorage.removeItem('saxon_scout_user');
          setAppState(prev => ({ ...prev, scouter: '' }));
        }
      }

      await loadCachedConfig();
      setAppState(prev => ({ ...prev, isInitializing: false }));
    } catch (err: any) {
      console.error('Initialization failed:', err);
      setAppState(prev => ({
        ...prev,
        isInitializing: false,
        initError: err?.message || 'Failed to initialize application'
      }));
    }
  }, [loadCachedConfig]);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  const handlePick = useCallback(async () => {
    try {
      const dir = await pickRoot();
      setAppState(prev => ({ ...prev, root: dir }));
    } catch (err) {
      console.error('Directory picker failed:', err);
      alert('Unable to access filesystem. Make sure your browser supports the File System Access API and that you grant permission.');
    }
  }, []);

  const handleLogin = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      setAppState(prev => ({ ...prev, scouter: username }));
      localStorage.setItem('saxon_scout_user', username);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, []);

  const handleLogout = useCallback(() => {
    setAppState(prev => ({ ...prev, scouter: '', root: null }));
    localStorage.removeItem('saxon_scout_user');
    navigate('/login');
  }, [navigate]);

  const { root, scouter, isInitializing, initError, hasFileSystemAccess } = appState;
  const isLoggedIn = !!scouter;

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center p-4">
        <div className="card shadow-sm" style={{ maxWidth: '500px', width: '100%' }}>
          <div className="card-body text-center p-4">
            <div 
              className="d-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 mx-auto mb-3"
              style={{ width: '64px', height: '64px' }}
            >
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-danger" style={{ fontSize: '2rem' }} />
            </div>
            <h3 className="h5 mb-3">Initialization Error</h3>
            <p className="text-muted mb-2">{initError}</p>
            <p className="text-muted small mb-4">Please check your browser compatibility and try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasFileSystemAccess) {
    return (
      <div className="container py-5">
        <div className="alert alert-info border-start border-4 border-info" role="alert">
          <h4 className="alert-heading">Browser Not Supported</h4>
          <p>Saxon Scout requires a modern browser with File System Access API support.</p>
          <hr />
          <p className="mb-0">Please use Chrome, Edge, or Opera (version 86+).</p>
        </div>
      </div>
    );
  }

  // Not logged in or no folder selected - show setup screens
  if (!root || !isLoggedIn) {
    return (
      <div className="min-vh-100 bg-light">
        <Routes>
          <Route
            path="/"
            element={
              <RouteBoundary>
                <Home navigate={navigate} />
              </RouteBoundary>
            }
          />
          <Route
            path="/login"
            element={
              isLoggedIn ? <Navigate to="/" replace /> : <SignIn onLogin={handleLogin} />
            }
          />
          <Route
            path="*"
            element={<Navigate to={isLoggedIn ? '/' : '/login'} replace />}
          />
        </Routes>
      </div>
    );
  }

  // Logged in with folder - show main app with layout
  const content = (
    <AppLayout
      root={root}
      scouter={scouter}
      onLogout={handleLogout}
      isAdmin={false}
    >
      <Routes>
        <Route
          path="/"
          element={
            <RouteBoundary>
              <Home navigate={navigate} />
            </RouteBoundary>
          }
        />
        <Route
          path="/quick"
          element={
            <RouteBoundary>
              <QuickScout root={root} scouter={scouter} />
            </RouteBoundary>
          }
        />
        <Route
          path="/pit"
          element={
            <RouteBoundary>
              <PitScout root={root} scouter={scouter} navigateHome={() => navigate('/')} />
            </RouteBoundary>
          }
        />
        <Route
          path="/info"
          element={
            <RouteBoundary>
              <InfoViewer root={root} />
            </RouteBoundary>
          }
        />
        <Route
          path="/alliance"
          element={
            <RouteBoundary>
              <AllianceSelection />
            </RouteBoundary>
          }
        />
        <Route
          path="/match-planning"
          element={
            <RouteBoundary>
              <MatchPlanning />
            </RouteBoundary>
          }
        />
        <Route
          path="/schedule"
          element={
            <RouteBoundary>
              <EventSchedule />
            </RouteBoundary>
          }
        />
        <Route
          path="/analytics"
          element={
            <RouteBoundary>
              <Analytics />
            </RouteBoundary>
          }
        />
        <Route
          path="/export"
          element={
            <RouteBoundary>
              <ExportView root={root} navigateHome={() => navigate('/')} />
            </RouteBoundary>
          }
        />
        <Route
          path="/settings"
          element={
            <RouteBoundary>
              <Settings navigateHome={() => navigate('/')} />
            </RouteBoundary>
          }
        />
        <Route
          path="/admin"
          element={
            <RouteBoundary>
              <AdminPortal />
            </RouteBoundary>
          }
        />
        <Route
          path="/users"
          element={
            <RouteBoundary>
              <UserManagement />
            </RouteBoundary>
          }
        />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/more" element={<Navigate to="/" replace />} />
        <Route
          path="*"
          element={
            <RouteBoundary>
              <NotFound />
            </RouteBoundary>
          }
        />
      </Routes>
    </AppLayout>
  );

  return (
    <SettingsProvider>
      <APIProvider>
        <APIErrorBoundary>
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
              </div>
            }
          >
            {content}
          </Suspense>
        </APIErrorBoundary>
      </APIProvider>
    </SettingsProvider>
  );
}

const AppWithRouter = () => (
  <Router>
    <App />
  </Router>
);

// Export the main App component
export default AppWithRouter;
