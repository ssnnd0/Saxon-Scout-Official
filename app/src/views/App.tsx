// @ts-nocheck
import * as Inferno from 'inferno';
import { Component } from 'inferno';
import { pickRoot, DirHandle } from '../lib/fsStore';
import QuickScout from './QuickScout';
import InfoViewer from './InfoViewer';
import PitScout from './PitScout';
import Export from './Export';
import Home from './Home';
import Settings from './Settings';
import { toast } from '../lib/toast';

interface AppState {
  root: DirHandle | null;
  scouter: string;
  view: 'home'|'quick'|'pit'|'info'|'export'|'settings';
  isInitializing: boolean;
  hasFileSystemAccess: boolean;
  initError: string | null;
}

/**
 * Top‑level application component. Manages global state such as the selected
 * root folder and the currently logged‑in scouter. Presents buttons for
 * selecting a data directory and logging in, and displays the scouting and
 * information viewer panels.
 */
export default class App extends Component<{}, AppState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      root: null,
      scouter: '',
      view: 'home',
      isInitializing: true,
      hasFileSystemAccess: false,
      initError: null
    };
  }

  componentDidMount() {
    // Start initialization process
    this.initializeApp();
  }

  initializeApp = async () => {
    try {
      console.log('Starting application initialization...');
      
      // Check if File System Access API is available
      const hasFileSystem = 'showDirectoryPicker' in window;
      console.log('File System Access API available:', hasFileSystem);
      
      this.setState({ hasFileSystemAccess: hasFileSystem });
      
      // Try to restore previous session if available
      const savedScout = localStorage.getItem('saxon_scout_user');
      if (savedScout) {
        console.log('Found saved scouter:', savedScout);
        this.setState({ scouter: savedScout });
        try {
          // Verify login with server
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
          this.setState({ scouter: '' });
        }
      }

      // Load cached configuration (don't wait for it)
      this.loadCachedConfig().catch(err => {
        console.warn('Failed to load cached config:', err);
      });

      // Successfully initialized
      console.log('Application initialization complete');
      this.setState({ isInitializing: false });
      
    } catch (err) {
      console.error('Initialization failed:', err);
      this.setState({ 
        isInitializing: false,
        initError: err?.message || 'Failed to initialize application'
      });
    }
  }

  async loadCachedConfig() {
    try {
      const config = localStorage.getItem('saxon_scout_config');
      if (config) {
        const parsedConfig = JSON.parse(config);
        // Apply any saved configurations
        // ...
      }
    } catch (err) {
      console.warn('Failed to load cached config:', err);
    }
  }

  async ensureDirectoryStructure() {
    // If we have a saved root directory, ensure required folders exist
    const root = this.state.root;
    if (root) {
      await Promise.all([
        root.getDirectoryHandle('matches', { create: true }),
        root.getDirectoryHandle('pit', { create: true }),
        root.getDirectoryHandle('exports', { create: true }),
        root.getDirectoryHandle('logs', { create: true })
      ]);
    }
  }

  handlePick = async () => {
    try {
      console.log('Requesting directory access...');
      const dir = await pickRoot();
      console.log('Directory access granted');
      
      // Create required subdirectories
      try {
        await Promise.all([
          dir.getDirectoryHandle('matches', { create: true }),
          dir.getDirectoryHandle('pit', { create: true }),
          dir.getDirectoryHandle('exports', { create: true }),
          dir.getDirectoryHandle('logs', { create: true })
        ]);
        console.log('Created required subdirectories');
      } catch (err) {
        console.error('Failed to create subdirectories:', err);
        throw new Error('Failed to create required folders. Please check permissions.');
      }

      this.setState({ root: dir });
    } catch (err) {
      console.error('Directory picker failed:', err);
      toast.error('Unable to access filesystem. Please grant permission and try again.');
    }
  }

  login = async () => {
    const name = prompt('Enter your name (for logs):')?.trim();
    if (!name) return;
    try {
      this.setState({ scouter: name });
      await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      // Save the scouter name for future sessions
      localStorage.setItem('saxon_scout_user', name);
    } catch (err) {
      console.error(err);
      this.setState({ scouter: '' });
      localStorage.removeItem('saxon_scout_user');
      alert('Login failed');
    }
  }

  setView = (view: 'home'|'quick'|'pit'|'info'|'export'|'settings') => {
    this.setState({ view });
  }

  render() {
    const { root, scouter, view, isInitializing, hasFileSystemAccess, initError } = this.state;
    
    if (isInitializing) {
      return (
        <div className="loading-screen">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Initializing...</span>
          </div>
          <p className="loading-title">Saxon Scout</p>
          <p className="text-muted">Initializing application...</p>
        </div>
      );
    }

    if (initError) {
      return (
        <div className="app-container">
          <div className="alert alert-danger rounded-3 shadow-sm">
            <h4 className="alert-heading d-flex align-items-center gap-2">
              <i className="fa fa-exclamation-triangle"></i>
              Initialization Error
            </h4>
            <p>{initError}</p>
            <hr />
            <p className="mb-0">
              Please check your browser compatibility and try refreshing the page.
              If the problem persists, contact technical support.
            </p>
          </div>
        </div>
      );
    }

    if (!hasFileSystemAccess) {
      return (
        <div className="app-container">
          <div className="alert alert-warning rounded-3 shadow-sm">
            <h4 className="alert-heading d-flex align-items-center gap-2">
              <i className="fa fa-info-circle"></i>
              Browser Not Supported
            </h4>
            <p>
              Saxon Scout requires a modern browser with File System Access API support.
              Please use a supported browser like Chrome, Edge, or Opera.
            </p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="app-shell">
        <nav className="navbar app-navbar px-3 shadow-sm">
          <div className="container-fluid" style={{ maxWidth: 'var(--max-width)' }}>
            <div className="d-flex align-items-center gap-3">
              <img src="/app/assets/Logo+611.png" alt="Saxon Scout Logo" className="app-logo" />
              <div className="nav-title">Saxon Scout</div>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {!root && (
                <button className="btn btn-light btn-sm d-flex align-items-center gap-2" onClick={this.handlePick}>
                  <i className="fa fa-folder-open"></i>
                  <span className="d-none d-sm-inline">Pick Folder</span>
                </button>
              )}
              {root && (
                <span className="badge bg-success d-flex align-items-center gap-1">
                  <i className="fa fa-check-circle"></i>
                  <span className="d-none d-sm-inline">Folder Connected</span>
                </span>
              )}
              <button className="btn btn-light btn-sm d-flex align-items-center gap-2" onClick={this.login}>
                <i className="fa fa-user"></i>
                <span>{scouter || 'Login'}</span>
              </button>
              {root && scouter && view !== 'home' && (
                <button className="btn btn-outline-light btn-sm d-flex align-items-center gap-2" onClick={() => this.setView('home')}>
                  <i className="fa fa-home"></i>
                  <span className="d-none d-sm-inline">Home</span>
                </button>
              )}
            </div>
          </div>
        </nav>

        <main className="app-container">
          {!root && !scouter && (
            <div className="alert alert-info rounded-3 shadow-sm d-flex align-items-start gap-3">
              <i className="fa fa-info-circle fs-4"></i>
              <div>
                <h5 className="alert-heading mb-2">Welcome to Saxon Scout</h5>
                <p className="mb-2">To get started:</p>
                <ol className="mb-0 ps-3">
                  <li>Click <strong>Pick Folder</strong> to select your data directory</li>
                  <li>Click <strong>Login</strong> to enter your scouter name</li>
                </ol>
              </div>
            </div>
          )}

          {root && scouter && view === 'home' && <Home navigate={(v: string) => this.setView(v as any)} />}
          {root && scouter && view === 'quick' && <QuickScout root={root} scouter={scouter} />}
          {root && scouter && view === 'pit' && <PitScout root={root} scouter={scouter} navigateHome={() => this.setView('home')} />}
          {root && scouter && view === 'info' && <InfoViewer root={root} />}
          {root && scouter && view === 'export' && <Export root={root} navigateHome={() => this.setView('home')} />}
          {root && scouter && view === 'settings' && <Settings navigateHome={() => this.setView('home')} />}
        </main>

        <footer className="app-footer">
          <div className="d-flex align-items-center justify-content-center gap-2">
            <span>© Saxon Scout</span>
            <span className="text-muted">|</span>
            <span className="text-muted">Local-first scouting for FRC events</span>
          </div>
        </footer>
      </div>
    );
  }
}
