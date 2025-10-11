// @ts-nocheck
import { useState, useEffect } from 'inferno-hooks';
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

  return (
    <div class="card shadow-sm">
      <div class="card-body">
        <div class="d-flex flex-wrap gap-2 mb-3 align-items-center">
          {/* Phase toggle */}
          <span class="badge bg-secondary" role="button" onClick={() => setAuto(a => !a)}>{auto ? 'AUTO' : 'TELEOP'}</span>
          {/* Alliance selector */}
          <div class="btn-group">
            <button class={`btn btn-${alliance === 'red' ? 'danger' : 'outline-danger'}`} onClick={() => setAlliance('red')}>Red</button>
            <button class={`btn btn-${alliance === 'blue' ? 'primary' : 'outline-primary'}`} onClick={() => setAlliance('blue')}>Blue</button>
          </div>
          {/* Mobility toggle; only active during AUTO */}
          <button class={`btn ${stats.auto.mobility ? 'btn-success' : 'btn-outline-secondary'}`} disabled={!auto} onClick={toggleMobility}>Mobility</button>
          {/* Timer display; click to start/stop */}
          <span class="badge bg-dark" role="button" onClick={() => setTimerActive(a => !a)} title="Tap to start/stop timer">⏱ {formatTime(elapsed)}</span>
          {/* Team and match inputs */}
          <input class="form-control w-auto" type="number" placeholder="Team" value={team || ''} onInput={(e: any) => setTeam(parseInt(e.target.value || '0'))} />
          <input class="form-control w-auto" type="number" placeholder="Match" value={game || ''} onInput={(e: any) => setGame(parseInt(e.target.value || '0'))} />
          {/* Save button */}
          <button class="btn btn-success ms-auto" onClick={save}>Save Match</button>
        </div>
        {/* Render the grid of buttons */}
        <div class="row g-2">
          {Array.from({ length: GRID.rows }).map((_, r) => (
            <div class="col-12 d-flex gap-2" style={{ height: '7rem' }}>
              {Array.from({ length: GRID.cols }).map((_, c) => (
                <button
                  key={`${r}-${c}`}
                  class="flex-fill btn border"
                  style={sliceStyle(r, c)}
                  onClick={() => clickCell(r, c)}
                >
                  .
                </button>
              ))}
            </div>
          ))}
        </div>
        {/* Display summary stats */}
        <div class="mt-3 small text-muted">
          Auto: {stats.auto.coral.L1 + stats.auto.coral.L2 + stats.auto.coral.L3 + stats.auto.coral.L4 + stats.auto.algae.processor + stats.auto.algae.net} scored
          {stats.auto.mobility ? ' + Mobility' : ''} • Teleop: {stats.teleop.coral.L1 + stats.teleop.coral.L2 + stats.teleop.coral.L3 + stats.teleop.coral.L4 + stats.teleop.algae.processor + stats.teleop.algae.net} scored
          • Fouls: {stats.fouls} • Endgame: {stats.endgame.state}
        </div>
      </div>
    </div>
  );
}