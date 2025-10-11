// @ts-nocheck
import * as Inferno from 'inferno';
import { Component } from 'inferno';
import { pickRoot, DirHandle } from '../lib/fsStore';
import QuickScout from './QuickScout';
import InfoViewer from './InfoViewer';
import PitScout from './PitScout';
import Export from './Export';
import Home from './Home';

interface AppState {
  root: DirHandle | null;
  scouter: string;
  view: 'home'|'quick'|'pit'|'info'|'export'|'settings';
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
      view: 'home'
    };
  }

  handlePick = async () => {
    try {
      const dir = await pickRoot();
      this.setState({ root: dir });
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
      alert('Login failed');
    }
  }

  setView = (view: 'home'|'quick'|'pit'|'info'|'export'|'settings') => {
    this.setState({ view });
  }

  render() {
    const { root, scouter, view } = this.state;
    
    return (
      <div className="container py-4">
        <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
          <button className="btn btn-primary" onClick={this.handlePick}>Pick Data Folder</button>
          <button className="btn btn-outline-secondary" onClick={this.login}>{scouter ? `Logged in: ${scouter}` : 'Login (name only)'}</button>
          {root && scouter && view !== 'home' && (
            <button className="btn btn-light" onClick={() => this.setView('home')}>Home</button>
          )}
        </div>
        {!root && <p className="text-muted">Please pick a data folder to get started.</p>}
        {root && scouter && view === 'home' && <Home navigate={(v: string) => this.setView(v as any)} />}
        {root && scouter && view === 'quick' && <QuickScout root={root} scouter={scouter} />}
        {root && scouter && view === 'pit' && <PitScout root={root} scouter={scouter} navigateHome={() => this.setView('home')} />}
        {root && scouter && view === 'info' && <InfoViewer root={root} />}
        {root && scouter && view === 'export' && <Export root={root} navigateHome={() => this.setView('home')} />}
        {/* Settings view could be added here in the future */}
      </div>
    );
  }
}
