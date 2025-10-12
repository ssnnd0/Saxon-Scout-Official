// @ts-nocheck
import * as Inferno from 'inferno';
import { Component } from 'inferno';
import { pickRoot, DirHandle } from '../lib/fsStore';
import QuickScout from './QuickScout';
import InfoViewer from './InfoViewer';
import PitScout from './PitScout';
import Export from './Export';
import Home from './Home';
import Index from './Index';
import '../styles/theme.css';

interface AppState {
  root: DirHandle | null;
  scouter: string;
  view: 'home'|'quick'|'pit'|'info'|'export'|'settings';
  isInitializing: boolean;
  hasFileSystemAccess: boolean;
  initError: string | null;
}

/**
 * Top-level application component. Manages global state such as the selected
 * root folder and the currently logged-in scouter. Handles initialization,
 * file system access detection, and view routing.
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

      // Load cached configuration
      this.loadCachedConfig().catch(err => {
        console.warn('Failed to load cached config:', err);
      });

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
        JSON.parse(config);
        // Apply any saved configurations here
      }
    } catch (err) {
      console.warn('Failed to load cached config:', err);
    }
  }

  handlePick = async () => {
    try {
      console.log('Requesting directory access...');
      const dir = await pickRoot();
      console.log('Directory access granted');
      this.setState({ root: dir });
    } catch (err) {
      console.error('Directory picker failed:', err);
      alert('Unable to access filesystem. Make sure your browser supports the File System Access API and that you grant permission.');
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
      localStorage.setItem('saxon_scout_user', name);
    } catch (err) {
      console.error(err);
      this.setState({ scouter: '' });
      localStorage.removeItem('saxon_scout_user');
      alert('Login failed');
    }
  }

  logout = () => {
    this.setState({ scouter: '', root: null, view: 'home' });
    localStorage.removeItem('saxon_scout_user');
  }

  setView = (view: 'home'|'quick'|'pit'|'info'|'export'|'settings') => {
    this.setState({ view });
  }

  render() {
    const { root, scouter, view, isInitializing, hasFileSystemAccess, initError } = this.state;
    
    // Show loading state
    if (isInitializing) {
      return (
        <div className="app-shell">
          <main className="app-container d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <div className="text-center">
              <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Initializing...</span>
              </div>
              <h2 className="mb-2">Saxon Scout</h2>
              <p className="text-muted">Initializing application...</p>
            </div>
          </main>
        </div>
      );
    }

    // Show initialization error
    if (initError) {
      return (
        <div className="app-shell">
          <main className="app-container">
            <div className="alert alert-danger rounded-3 shadow-sm" style={{ marginTop: '2rem' }}>
              <h4 className="alert-heading d-flex align-items-center gap-2">
                <i className="fa fa-exclamation-triangle"></i>
                Initialization Error
              </h4>
              <p>{initError}</p>
              <hr />
              <p className="mb-0">
                Please check your browser compatibility and try refreshing the page.
              </p>
            </div>
          </main>
        </div>
      );
    }

    // Show browser support error
    if (!hasFileSystemAccess) {
      return (
        <div className="app-shell">
          <main className="app-container">
            <div className="alert alert-warning rounded-3 shadow-sm" style={{ marginTop: '2rem' }}>
              <h4 className="alert-heading d-flex align-items-center gap-2">
                <i className="fa fa-info-circle"></i>
                Browser Not Supported
              </h4>
              <p>
                Saxon Scout requires a modern browser with File System Access API support.
                Please use Chrome, Edge, or Opera (version 86+).
              </p>
            </div>
          </main>
        </div>
      );
    }

    // Show index/welcome page if not fully setup
    if (!root || !scouter) {
      return (
        <Index 
          root={root} 
          scouter={scouter} 
          onPickFolder={this.handlePick}
          onLogin={this.login}
        />
      );
    }

    // Show main application with navbar
    return (
      <div className="app-shell">
        <nav className="navbar app-navbar px-3 shadow-sm">
          <div className="container-fluid" style={{ maxWidth: 'var(--max-width)' }}>
            <div className="d-flex align-items-center gap-3">
              <img src="/app/assets/Logo+611.png" alt="Saxon Scout Logo" className="app-logo" />
              <div className="nav-title">Saxon Scout</div>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {root && (
                <span className="badge bg-success d-flex align-items-center gap-1">
                  <i className="fa fa-check-circle"></i>
                  <span className="d-none d-sm-inline">Folder Connected</span>
                </span>
              )}
              <span className="badge bg-info d-flex align-items-center gap-1">
                <i className="fa fa-user"></i>
                <span>{scouter}</span>
              </span>
              {view !== 'home' && (
                <button className="btn btn-outline-light btn-sm d-flex align-items-center gap-2" onClick={() => this.setView('home')}>
                  <i className="fa fa-home"></i>
                  <span className="d-none d-sm-inline">Home</span>
                </button>
              )}
              <button className="btn btn-outline-light btn-sm d-flex align-items-center gap-2" onClick={this.logout}>
                <i className="fa fa-sign-out-alt"></i>
                <span className="d-none d-sm-inline">Logout</span>
              </button>
            </div>
          </div>
        </nav>

        <main className="app-container">
          {view === 'home' && <Home navigate={this.setView} />}
          {view === 'quick' && <QuickScout root={root} scouter={scouter} />}
          {view === 'pit' && <PitScout root={root} scouter={scouter} navigateHome={() => this.setView('home')} />}
          {view === 'info' && <InfoViewer root={root} />}
          {view === 'export' && <Export root={root} navigateHome={() => this.setView('home')} />}
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