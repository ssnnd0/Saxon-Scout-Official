import React, { Suspense, useCallback, useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { pickRoot, DirHandle } from '../lib/fsStore';
import { APIProvider, APIErrorBoundary } from '../lib/api';
import { SettingsProvider } from '../context/SettingsContext';
import { ExclamationIcon } from '@heroicons/react/outline';
import ErrorBoundary from '../components/ErrorBoundary';
import LoadingSpinner from '../components/LoadingSpinner';
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

// Sidebar component props
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
  scouter: string;
  root: DirHandle | null;
  isMobile: boolean;
}

/**
 * Top-level application component. Manages global state such as the selected
 * root folder and the currently logged-in scouter. Handles initialization,
 * file system access detection, and view routing.
 */
// Sidebar component
const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  onLogout,
  scouter,
  root,
  isMobile
}) => {
  return (
    <div
      className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transition-transform duration-300 transform ${
        collapsed ? '-translate-x-full md:translate-x-0 md:w-16' : 'translate-x-0'
      }`}
    >
      <div className="flex h-full flex-col justify-between p-4">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">Scouter</div>
              <div className="text-sm font-semibold text-gray-900">{scouter || 'Guest'}</div>
            </div>
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <i className="fa fa-chevron-left"></i>
            </button>
          </div>
          <div className="mt-4 rounded-md bg-gray-50 p-3 text-sm text-gray-600">
            <div className="font-medium text-gray-700">Storage</div>
            <div>{root ? 'Linked to local folder' : 'No folder selected yet'}</div>
            <div className="mt-2 text-xs text-gray-400">{isMobile ? 'Mobile layout' : 'Desktop layout'}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Sign out
        </button>
      </div>
    </div>
  );
};

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

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
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const toggleSidebar = useCallback(() => {
    setNavCollapsed(prev => !prev);
  }, []);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [location.pathname, isMobileMenuOpen]);

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  }, []);

  const isActive = useCallback((path: string) => {
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  }, [location.pathname]);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <ExclamationIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-3">Initialization Error</h3>
              <div className="mt-2 text-sm text-gray-500">
                <p>{initError}</p>
                <p className="mt-2">Please check your browser compatibility and try refreshing the page.</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasFileSystemAccess) {
    return (
      <div className="p-4 max-w-2xl mx-auto mt-8">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Browser Not Supported</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Saxon Scout requires a modern browser with File System Access API support.</p>
                <p className="mt-1">Please use Chrome, Edge, or Opera (version 86+).</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  let content: React.ReactNode;

  if (!root || !isLoggedIn) {
    content = (
      <AppShell
        root={root}
        scouter={scouter}
        onLogout={handleLogout}
        onPickFolder={handlePick}
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
      </AppShell>
    );
  } else {
    content = (
      <div
        className={`min-h-screen flex flex-col bg-gray-50 ${
          !navCollapsed ? 'md:pl-64' : 'md:pl-16'
        } transition-all duration-300`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:ring-2 focus:ring-blue-500 focus:rounded"
        >
          Skip to main content
        </a>

        <header className="bg-white shadow-sm z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button
                  type="button"
                  className="mr-2 inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  onClick={toggleMobileMenu}
                  aria-expanded="false"
                >
                  <span className="sr-only">Open main menu</span>
                  <i className="fa fa-bars"></i>
                </button>
                <h1 className="text-lg font-semibold text-gray-900">Saxon Scout</h1>
              </div>
              <div className="flex items-center">
                <button
                  type="button"
                  className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={toggleSidebar}
                  title={navCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  <span className="sr-only">Toggle sidebar</span>
                  <i className="fa fa-ellipsis-v"></i>
                </button>
              </div>
            </div>
          </div>
        </header>

        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1 bg-white shadow-lg">
              <button
                className={`w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => handleNavigate('/')}
              >
                Home
              </button>
              <button
                className={`w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/quick') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => handleNavigate('/quick')}
              >
                Quick Scout
              </button>
              <button
                className={`w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/pit') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => handleNavigate('/pit')}
              >
                Pit Scout
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            collapsed={navCollapsed}
            onToggle={toggleSidebar}
            onLogout={handleLogout}
            scouter={scouter}
            root={root}
            isMobile={isMobile}
          />

          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            ></div>
          )}

          <main id="main-content" className="flex-1 overflow-y-auto focus:outline-none" tabIndex={-1}>
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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
                <Route
                  path="*"
                  element={
                    <RouteBoundary>
                      <NotFound />
                    </RouteBoundary>
                  }
                />
              </Routes>
            </div>
          </main>
        </div>

        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src="/app/assets/Logo+611.png" alt="Saxon Scout Logo" className="w-6 h-6" />
                <div>
                  <div className="font-bold text-saxon-black">Saxon Scout</div>
                  <div className="text-xs text-gray-600">Team 611 Saxon Robotics • FRC 2025 REEFSCAPE</div>
                </div>
              </div>
              <div className="text-center md:text-right">
                <div className="text-sm text-gray-600">Local-first scouting for FRC events</div>
                <div className="text-xs text-gray-500 mt-1">
                  © {new Date().getFullYear()} Saxon Robotics. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

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
