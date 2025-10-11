// @ts-nocheck
import * as Inferno from 'inferno';
import { useState, useEffect } from '../lib/inferno-hooks-shim';
import type { DirHandle } from '../lib/fsStore';
import { writeJSON } from '../lib/fsStore';
import gamepieceUrl from '../assets/gamepiece.png';

/**
 * Configuration for the grid of buttons. The grid maps each cell to a
 * particular scouting action for the 2025 FRC game, REEFSCAPE. A 3×3 layout
 * provides nine large hit targets that cover common scoring and endgame
 * activities:
 *
 * Row 0 (r=0): Coral scoring on Levels 1–3
 *   c=0 → L1 coral, c=1 → L2 coral, c=2 → L3 coral
 * Row 1 (r=1): Higher coral and algae scoring
 *   c=0 → L4 coral, c=1 → algae into processor, c=2 → algae into net
 * Row 2 (r=2): Endgame & fouls
 *   c=0 → park/climb cycle (none → park → shallow → deep → none)
 *   c=1 → foul (increments fouls)
 *   c=2 → undo (reverts last recorded action)
 */
const GRID = { rows: 3, cols: 3 };

// Determine the background offset for each cell such that, when rendered
// together, the grid forms one seamless image. Each button receives the full
// image as its background but shifts the `background-position` so that its
// portion lines up correctly.
function sliceStyle(r: number, c: number) {
  const x = (c / (GRID.cols - 1)) * 100;
  const y = (r / (GRID.rows - 1)) * 100;
  return {
    backgroundImage: `url(${gamepieceUrl})`,
    backgroundSize: '100% 100%',
    backgroundPosition: `${x}% ${y}%`,
    backgroundRepeat: 'no-repeat',
    // Hide text; we rely on the image itself
    color: 'transparent'
  } as any;
}

// Type definitions for internal state
interface PhaseStats {
  coral: { L1: number; L2: number; L3: number; L4: number };
  algae: { processor: number; net: number };
  mobility?: boolean;
}

interface ScoutStats {
  auto: PhaseStats;
  teleop: PhaseStats;
  endgame: { state: 'none' | 'park' | 'shallow' | 'deep' };
  fouls: number;
}

/**
 * The QuickScout component renders the main interface for match scouting. It
 * presents a grid of buttons overlaid on the game piece image. Each button
 * corresponds to a single action and updates state accordingly when clicked.
 */
export default function QuickScout({ root, scouter }: { root: DirHandle | null; scouter: string }) {
  // Whether the user is in autonomous (AUTO) or teleoperated (TELEOP) phase
  const [auto, setAuto] = useState(true);
  // Alliance colour (red or blue)
  const [alliance, setAlliance] = useState<'red' | 'blue'>('red');
  // Team number and match number
  const [team, setTeam] = useState<number>(0);
  const [game, setGame] = useState<number>(0);
  // Scouting statistics for the current match
  const [stats, setStats] = useState<ScoutStats>(() => ({
    auto: { coral: { L1: 0, L2: 0, L3: 0, L4: 0 }, algae: { processor: 0, net: 0 }, mobility: false },
    teleop: { coral: { L1: 0, L2: 0, L3: 0, L4: 0 }, algae: { processor: 0, net: 0 } },
    endgame: { state: 'none' },
    fouls: 0
  }));
  // Keep a history of actions for undo functionality. Each entry records
  // enough information to reverse the effect on state. When undoing, we pop
  // from this array and update state accordingly.
  const [history, setHistory] = useState<any[]>([]);

  /**
   * Timer state. When the timer is active, a useEffect below will tick the
   * elapsed counter every second. The user can start/stop the timer by
   * tapping the timer display in the control bar. The elapsed time resets
   * whenever the match is saved to aid the next scout.
   */
  const [timerActive, setTimerActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Increment the elapsed counter once per second when the timer is active.
  // When timerActive changes, start or clear the interval accordingly.
  useEffect(() => {
    let intervalId: any = null;
    if (timerActive) {
      intervalId = setInterval(() => {
        setElapsed(e => e + 1);
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timerActive]);

  // Format the elapsed seconds as MM:SS for display
  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // Keyboard shortcuts: 1-9 map to grid cells (left-to-right, top-to-bottom)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Prevent shortcuts when focusing an input
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const key = e.key;
      if (/^[1-9]$/.test(key)) {
        const n = parseInt(key, 10) - 1; // 0..8
        const r = Math.floor(n / GRID.cols);
        const c = n % GRID.cols;
        clickCell(r, c);
      } else if (key === 'u' || key === 'U') {
        undo();
      } else if (key === 'f' || key === 'F') {
        recordFoul();
      } else if (key === 'm' || key === 'M') {
        toggleMobility();
      } else if (key === 's' || key === 'S') {
        // attempt save
        save();
      }
    }
    window.addEventListener('keydown', onKey as any);
    return () => window.removeEventListener('keydown', onKey as any);
  }, [stats, history, team, game, alliance, scouter, root]);

  /**
   * Register a coral scoring event. Increments the appropriate coral level
   * counter for the current phase and records the action for undo.
   */
  function recordCoral(level: 'L1' | 'L2' | 'L3' | 'L4') {
    setStats(prev => {
      const ph = auto ? 'auto' : 'teleop';
      const newStats = structuredClone(prev);
      newStats[ph].coral[level]++;
      return newStats;
    });
    setHistory(prev => [...prev, { type: 'coral', phase: auto ? 'auto' : 'teleop', level }]);
  }

  /**
   * Register an algae scoring event. Updates processor/net counters in the
   * current phase and records history for undo.
   */
  function recordAlgae(target: 'processor' | 'net') {
    setStats(prev => {
      const ph = auto ? 'auto' : 'teleop';
      const newStats = structuredClone(prev);
      newStats[ph].algae[target]++;
      return newStats;
    });
    setHistory(prev => [...prev, { type: 'algae', phase: auto ? 'auto' : 'teleop', target }]);
  }

  /**
   * Cycle through endgame states: none → park → shallow → deep → none. Each
   * click updates the endgame state and records the previous state so that
   * undo can restore it.
   */
  function toggleEndgame() {
    setStats(prev => {
      const newStats = structuredClone(prev);
      const cycle: Array<'none' | 'park' | 'shallow' | 'deep'> = ['none', 'park', 'shallow', 'deep'];
      const idx = cycle.indexOf(prev.endgame.state);
      const nextState = cycle[(idx + 1) % cycle.length];
      newStats.endgame.state = nextState;
      return newStats;
    });
    setHistory(prev => [...prev, { type: 'endgame', previous: stats.endgame.state }]);
  }

  /**
   * Increment the foul counter and push an entry onto the history for undo.
   */
  function recordFoul() {
    setStats(prev => ({ ...prev, fouls: prev.fouls + 1 }));
    setHistory(prev => [...prev, { type: 'foul' }]);
  }

  /**
   * Toggle the mobility (auto leave) flag. Only relevant during the AUTO
   * period. When toggled on or off, the previous value is stored for undo.
   */
  function toggleMobility() {
    setStats(prev => {
      const newStats = structuredClone(prev);
      newStats.auto.mobility = !prev.auto.mobility;
      return newStats;
    });
    setHistory(prev => [...prev, { type: 'mobility', previous: stats.auto.mobility }]);
  }

  /**
   * Undo the most recent action by reversing its effect on state. If there is
   * no history, this is a no‑op.
   */
  function undo() {
    setHistory(prev => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      setStats(s => {
        const nextStats = structuredClone(s);
        if (last.type === 'coral') {
          nextStats[last.phase].coral[last.level] = Math.max(0, nextStats[last.phase].coral[last.level] - 1);
        } else if (last.type === 'algae') {
          nextStats[last.phase].algae[last.target] = Math.max(0, nextStats[last.phase].algae[last.target] - 1);
        } else if (last.type === 'endgame') {
          nextStats.endgame.state = last.previous;
        } else if (last.type === 'foul') {
          nextStats.fouls = Math.max(0, nextStats.fouls - 1);
        } else if (last.type === 'mobility') {
          nextStats.auto.mobility = last.previous;
        }
        return nextStats;
      });
      return prev.slice(0, -1);
    });
  }

  /**
   * Handler invoked when a grid cell is clicked. Delegates to the specific
   * action based on its coordinates.
   */
  function clickCell(r: number, c: number) {
    if (r === 0 && c === 0) return recordCoral('L1');
    if (r === 0 && c === 1) return recordCoral('L2');
    if (r === 0 && c === 2) return recordCoral('L3');
    if (r === 1 && c === 0) return recordCoral('L4');
    if (r === 1 && c === 1) return recordAlgae('processor');
    if (r === 1 && c === 2) return recordAlgae('net');
    if (r === 2 && c === 0) return toggleEndgame();
    if (r === 2 && c === 1) return recordFoul();
    if (r === 2 && c === 2) return undo();
  }

  /**
   * Compose a record object and persist it to disk using the provided root
   * directory. The filename is derived from team/match/alliance/time. After
   * saving, a POST request is made to the server to log the creation event.
   */
  async function save() {
    if (!root) return alert('Pick a data folder first');
    if (!scouter) return alert('Please login before saving');
    // Compose filename and record
    const now = new Date();
    const isoForFilename = now.toISOString().replace(/[:.]/g, '');
    const filename = `team-${team}__game-${game}__alliance-${alliance}__time-${isoForFilename}.json`;
    // Compute scored counts
    const sumCoral = (phase: 'auto' | 'teleop') => Object.values(stats[phase].coral).reduce((a, b) => a + b, 0);
    const sumAlgae = (phase: 'auto' | 'teleop') => Object.values(stats[phase].algae).reduce((a, b) => a + b, 0);
    const record = {
      team,
      game,
      alliance,
      time: now.toISOString(),
      scouter,
      phase: {
        auto: {
          scored: sumCoral('auto') + sumAlgae('auto'),
          missed: 0,
          mobility: stats.auto.mobility || false,
          notes: undefined
        },
        teleop: {
          cycles: sumCoral('teleop') + sumAlgae('teleop'),
          scored: sumCoral('teleop') + sumAlgae('teleop'),
          missed: 0,
          defense: undefined
        }
      },
      endgame: {
        park: stats.endgame.state === 'park',
        climb: stats.endgame.state === 'shallow' ? 'low' : stats.endgame.state === 'deep' ? 'high' : 'none'
      },
      fouls: stats.fouls,
      comments: undefined
    };
    try {
      await writeJSON(root, `matches/${filename}`, record);
      await fetch('/api/log/file-created', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, filepath: 'matches/' + filename, name: scouter || 'unknown' })
      });
      alert('Saved');
      // Reset stats and history for next match
      setStats({
        auto: { coral: { L1: 0, L2: 0, L3: 0, L4: 0 }, algae: { processor: 0, net: 0 }, mobility: false },
        teleop: { coral: { L1: 0, L2: 0, L3: 0, L4: 0 }, algae: { processor: 0, net: 0 } },
        endgame: { state: 'none' },
        fouls: 0
      });
      setHistory([]);
      // Reset timer
      setTimerActive(false);
      setElapsed(0);
    } catch (err) {
      console.error(err);
      alert('Failed to save match');
    }
  }

  const getCellLabel = (r: number, c: number): string => {
    if (r === 0 && c === 0) return 'L1 Coral';
    if (r === 0 && c === 1) return 'L2 Coral';
    if (r === 0 && c === 2) return 'L3 Coral';
    if (r === 1 && c === 0) return 'L4 Coral';
    if (r === 1 && c === 1) return 'Processor';
    if (r === 1 && c === 2) return 'Net';
    if (r === 2 && c === 0) return 'Endgame';
    if (r === 2 && c === 1) return 'Foul';
    if (r === 2 && c === 2) return 'Undo';
    return '';
  };

  const totalAuto = stats.auto.coral.L1 + stats.auto.coral.L2 + stats.auto.coral.L3 + stats.auto.coral.L4 + stats.auto.algae.processor + stats.auto.algae.net;
  const totalTeleop = stats.teleop.coral.L1 + stats.teleop.coral.L2 + stats.teleop.coral.L3 + stats.teleop.coral.L4 + stats.teleop.algae.processor + stats.teleop.algae.net;

  return (
    <div className="card-modern card">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h4 className="mb-0 fw-bold">Quick Scout</h4>
          <span className="badge bg-primary" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>{auto ? 'AUTONOMOUS' : 'TELEOPERATED'}</span>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label small text-muted fw-bold">MATCH INFO</label>
            <div className="d-flex gap-2">
              <input
                aria-label="team number"
                className="form-control"
                type="number"
                placeholder="Team #"
                value={team || ''}
                onInput={(e: any) => setTeam(parseInt(e.target.value || '0'))}
              />
              <input
                aria-label="match number"
                className="form-control"
                type="number"
                placeholder="Match #"
                value={game || ''}
                onInput={(e: any) => setGame(parseInt(e.target.value || '0'))}
              />
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label small text-muted fw-bold">ALLIANCE</label>
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                className={`btn ${alliance === 'red' ? 'btn-danger' : 'btn-outline-danger'}`}
                onClick={() => setAlliance('red')}
              >
                <i className="fa fa-circle me-2"></i>Red Alliance
              </button>
              <button
                type="button"
                className={`btn ${alliance === 'blue' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setAlliance('blue')}
              >
                <i className="fa fa-circle me-2"></i>Blue Alliance
              </button>
            </div>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2 mb-3 align-items-center" role="toolbar" aria-label="match controls">
          <button
            className="btn btn-outline-primary"
            onClick={() => setAuto(a => !a)}
            title="Toggle match phase"
          >
            <i className="fa fa-sync-alt me-2"></i>
            {auto ? 'Switch to Teleop' : 'Switch to Auto'}
          </button>
          <button
            className={`btn ${stats.auto.mobility ? 'btn-success' : 'btn-outline-success'}`}
            disabled={!auto}
            onClick={toggleMobility}
            title="Toggle mobility bonus"
          >
            <i className={`fa ${stats.auto.mobility ? 'fa-check-circle' : 'fa-circle'} me-2`}></i>
            Mobility
          </button>
          <button
            className={`btn ${timerActive ? 'btn-warning' : 'btn-outline-secondary'}`}
            onClick={() => setTimerActive(a => !a)}
            title="Start/stop timer"
          >
            <i className="fa fa-stopwatch me-2"></i>
            {formatTime(elapsed)}
          </button>
          <button className="btn btn-success ms-auto" onClick={save}>
            <i className="fa fa-save me-2"></i>
            Save Match
          </button>
        </div>

        <div className="alert alert-light border mb-3">
          <div className="row text-center">
            <div className="col">
              <div className="fw-bold text-primary">{totalAuto}</div>
              <div className="small text-muted">Auto Scored</div>
            </div>
            <div className="col">
              <div className="fw-bold text-success">{totalTeleop}</div>
              <div className="small text-muted">Teleop Scored</div>
            </div>
            <div className="col">
              <div className="fw-bold text-danger">{stats.fouls}</div>
              <div className="small text-muted">Fouls</div>
            </div>
            <div className="col">
              <div className="fw-bold text-info">{stats.endgame.state}</div>
              <div className="small text-muted">Endgame</div>
            </div>
          </div>
        </div>

        <label className="form-label small text-muted fw-bold mb-2">SCORING GRID</label>
        <div className="row g-2 mb-2">
          {Array.from({ length: GRID.rows }).map((_, r) => (
            <div key={r} className="col-12 d-flex gap-2" style={{ height: '7rem' }}>
              {Array.from({ length: GRID.cols }).map((_, c) => {
                const cellNum = r * GRID.cols + c + 1;
                return (
                  <button
                    key={`${r}-${c}`}
                    className="flex-fill btn border position-relative shadow-sm quick-scout-cell"
                    style={sliceStyle(r, c)}
                    onClick={() => clickCell(r, c)}
                    aria-label={`${getCellLabel(r, c)} - Press ${cellNum}`}
                  >
                    <span className="quick-scout-cell-overlay">
                      <span className="badge bg-dark bg-opacity-75">{cellNum}</span>
                      <span className="quick-scout-cell-label">{getCellLabel(r, c)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="small text-muted text-center">
          <i className="fa fa-keyboard me-1"></i>
          Keyboard shortcuts: Press 1-9 for quick actions, U for undo, M for mobility
        </div>
      </div>
    </div>
  );
}
