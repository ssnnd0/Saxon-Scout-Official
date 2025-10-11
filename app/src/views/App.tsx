// @ts-nocheck
import { useState } from 'inferno-hooks';
import { pickRoot, DirHandle } from '../lib/fsStore';
import QuickScout from './QuickScout';
import InfoViewer from './InfoViewer';
import PitScout from './PitScout';
import Export from './Export';
import Home from './Home';

/**
 * Top‑level application component. Manages global state such as the selected
 * root folder and the currently logged‑in scouter. Presents buttons for
 * selecting a data directory and logging in, and displays the scouting and
 * information viewer panels.
 */
export default function App() {
  const [root, setRoot] = useState<DirHandle | null>(null);
  const [scouter, setScouter] = useState<string>('');
  const [view, setView] = useState<'home'|'quick'|'pit'|'info'|'export'|'settings'>('home');

  async function handlePick() {
    try {
      const dir = await pickRoot();
      setRoot(dir);
    } catch (err) {
      console.error(err);
      alert('Unable to access filesystem. Make sure your browser supports the File System Access API and that you grant permission.');
    }
  }

  async function login() {
    const name = prompt('Enter your name (for logs):')?.trim();
    if (!name) return;
    try {
      setScouter(name);
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

  return (
    <div class="container py-4">
      <div class="d-flex flex-wrap gap-2 mb-3 align-items-center">
        <button class="btn btn-primary" onClick={handlePick}>Pick Data Folder</button>
        <button class="btn btn-outline-secondary" onClick={login}>{scouter ? `Logged in: ${scouter}` : 'Login (name only)'}</button>
        {root && scouter && view !== 'home' && (
          <button class="btn btn-light" onClick={() => setView('home')}>Home</button>
        )}
      </div>
      {!root && <p class="text-muted">Please pick a data folder to get started.</p>}
      {root && scouter && view === 'home' && <Home navigate={(v: string) => setView(v as any)} />}
      {root && scouter && view === 'quick' && <QuickScout root={root} scouter={scouter} />}
      {root && scouter && view === 'pit' && <PitScout root={root} scouter={scouter} navigateHome={() => setView('home')} />}
      {root && scouter && view === 'info' && <InfoViewer root={root} />}
      {root && scouter && view === 'export' && <Export root={root} navigateHome={() => setView('home')} />}
      {/* Settings view could be added here in the future */}
    </div>
  );
}