// @ts-nocheck
import * as Inferno from 'inferno';
import { Component } from 'inferno';
import type { DirHandle } from '../lib/fsStore';
import { writeJSON } from '../lib/fsStore';
import gamepieceUrl from '../assets/gamepiece.png';

interface QuickScoutProps {
  root: DirHandle | null;
  scouter: string;
}

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

interface QuickScoutState {
  auto: boolean;
  alliance: 'red' | 'blue';
  team: number;
  game: number;
  stats: ScoutStats;
  history: any[];
  timerActive: boolean;
  elapsed: number;
  saving: boolean;
}

const GRID = { rows: 3, cols: 3 };

function sliceStyle(r: number, c: number) {
  const x = (c / (GRID.cols - 1)) * 100;
  const y = (r / (GRID.rows - 1)) * 100;
  return {
    backgroundImage: `url(${gamepieceUrl})`,
    backgroundSize: '100% 100%',
    backgroundPosition: `${x}% ${y}%`,
    backgroundRepeat: 'no-repeat',
    color: 'transparent'
  };
}

export default class QuickScout extends Component<QuickScoutProps, QuickScoutState> {
  timerInterval: any = null;

  constructor(props: QuickScoutProps) {
    super(props);
    this.state = {
      auto: true,
      alliance: 'red',
      team: 0,
      game: 0,
      stats: {
        auto: { coral: { L1: 0, L2: 0, L3: 0, L4: 0 }, algae: { processor: 0, net: 0 }, mobility: false },
        teleop: { coral: { L1: 0, L2: 0, L3: 0, L4: 0 }, algae: { processor: 0, net: 0 } },
        endgame: { state: 'none' },
        fouls: 0
      },
      history: [],
      timerActive: false,
      elapsed: 0,
      saving: false
    };
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyPress);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyPress);
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  componentDidUpdate(prevProps: any, prevState: QuickScoutState) {
    if (this.state.timerActive !== prevState.timerActive) {
      if (this.state.timerActive) {
        this.timerInterval = setInterval(() => {
          this.setState({ elapsed: this.state.elapsed + 1 });
        }, 1000);
      } else {
        if (this.timerInterval) clearInterval(this.timerInterval);
      }
    }
  }

  handleKeyPress = (e: KeyboardEvent) => {
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    const key = e.key;
    if (/^[1-9]$/.test(key)) {
      const n = parseInt(key, 10) - 1;
      const r = Math.floor(n / GRID.cols);
      const c = n % GRID.cols;
      this.clickCell(r, c);
    } else if (key === 'u' || key === 'U') {
      this.undo();
    } else if (key === 'f' || key === 'F') {
      this.recordFoul();
    } else if (key === 'm' || key === 'M') {
      this.toggleMobility();
    }
  }

  recordCoral = (level: 'L1' | 'L2' | 'L3' | 'L4') => {
    this.setState(prev => {
      const ph = prev.auto ? 'auto' : 'teleop';
      const newStats = JSON.parse(JSON.stringify(prev.stats));
      newStats[ph].coral[level]++;
      return {
        stats: newStats,
        history: [...prev.history, { type: 'coral', phase: ph, level }]
      };
    });
  }

  recordAlgae = (target: 'processor' | 'net') => {
    this.setState(prev => {
      const ph = prev.auto ? 'auto' : 'teleop';
      const newStats = JSON.parse(JSON.stringify(prev.stats));
      newStats[ph].algae[target]++;
      return {
        stats: newStats,
        history: [...prev.history, { type: 'algae', phase: ph, target }]
      };
    });
  }

  toggleEndgame = () => {
    this.setState(prev => {
      const newStats = JSON.parse(JSON.stringify(prev.stats));
      const cycle: Array<'none' | 'park' | 'shallow' | 'deep'> = ['none', 'park', 'shallow', 'deep'];
      const idx = cycle.indexOf(prev.stats.endgame.state);
      const nextState = cycle[(idx + 1) % cycle.length];
      newStats.endgame.state = nextState;
      return {
        stats: newStats,
        history: [...prev.history, { type: 'endgame', previous: prev.stats.endgame.state }]
      };
    });
  }

  recordFoul = () => {
    this.setState(prev => {
      const newStats = JSON.parse(JSON.stringify(prev.stats));
      newStats.fouls++;
      return {
        stats: newStats,
        history: [...prev.history, { type: 'foul' }]
      };
    });
  }

  toggleMobility = () => {
    this.setState(prev => {
      const newStats = JSON.parse(JSON.stringify(prev.stats));
      newStats.auto.mobility = !prev.stats.auto.mobility;
      return {
        stats: newStats,
        history: [...prev.history, { type: 'mobility', previous: prev.stats.auto.mobility }]
      };
    });
  }

  undo = () => {
    this.setState(prev => {
      if (!prev.history.length) return prev;
      const last = prev.history[prev.history.length - 1];
      const newStats = JSON.parse(JSON.stringify(prev.stats));

      if (last.type === 'coral') {
        newStats[last.phase].coral[last.level] = Math.max(0, newStats[last.phase].coral[last.level] - 1);
      } else if (last.type === 'algae') {
        newStats[last.phase].algae[last.target] = Math.max(0, newStats[last.phase].algae[last.target] - 1);
      } else if (last.type === 'endgame') {
        newStats.endgame.state = last.previous;
      } else if (last.type === 'foul') {
        newStats.fouls = Math.max(0, newStats.fouls - 1);
      } else if (last.type === 'mobility') {
        newStats.auto.mobility = last.previous;
      }

      return {
        stats: newStats,
        history: prev.history.slice(0, -1)
      };
    });
  }

  clickCell = (r: number, c: number) => {
    if (r === 0 && c === 0) return this.recordCoral('L1');
    if (r === 0 && c === 1) return this.recordCoral('L2');
    if (r === 0 && c === 2) return this.recordCoral('L3');
    if (r === 1 && c === 0) return this.recordCoral('L4');
    if (r === 1 && c === 1) return this.recordAlgae('processor');
    if (r === 1 && c === 2) return this.recordAlgae('net');
    if (r === 2 && c === 0) return this.toggleEndgame();
    if (r === 2 && c === 1) return this.recordFoul();
    if (r === 2 && c === 2) return this.undo();
  }

  formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  save = async () => {
    const { root, scouter } = this.props;
    const { team, game, alliance, stats, auto } = this.state;

    if (!root) {
      alert('Pick a data folder first');
      return;
    }
    if (!scouter) {
      alert('Please login before saving');
      return;
    }

    this.setState({ saving: true });

    try {
      const now = new Date();
      const isoForFilename = now.toISOString().replace(/[:.]/g, '');
      const filename = `team-${team}__game-${game}__alliance-${alliance}__time-${isoForFilename}.json`;

      const sumCoral = (phase: 'auto' | 'teleop') =>
        Object.values(stats[phase].coral).reduce((a: number, b: number) => a + b, 0);
      const sumAlgae = (phase: 'auto' | 'teleop') =>
        Object.values(stats[phase].algae).reduce((a: number, b: number) => a + b, 0);

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

      await writeJSON(root, `matches/${filename}`, record);
      await fetch('/api/log/file-created', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, filepath: 'matches/' + filename, name: scouter || 'unknown' })
      });

      alert('Match saved successfully!');

      this.setState({
        stats: {
          auto: { coral: { L1: 0, L2: 0, L3: 0, L4: 0 }, algae: { processor: 0, net: 0 }, mobility: false },
          teleop: { coral: { L1: 0, L2: 0, L3: 0, L4: 0 }, algae: { processor: 0, net: 0 } },
          endgame: { state: 'none' },
          fouls: 0
        },
        history: [],
        timerActive: false,
        elapsed: 0,
        team: 0,
        game: 0,
        saving: false
      });
    } catch (err) {
      console.error(err);
      alert('Failed to save match');
      this.setState({ saving: false });
    }
  }

  getCellLabel = (r: number, c: number): string => {
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
  }

  render() {
    const { auto, alliance, team, game, stats, timerActive, elapsed, saving } = this.state;

    const totalAuto = stats.auto.coral.L1 + stats.auto.coral.L2 + stats.auto.coral.L3 + stats.auto.coral.L4 + stats.auto.algae.processor + stats.auto.algae.net;
    const totalTeleop = stats.teleop.coral.L1 + stats.teleop.coral.L2 + stats.teleop.coral.L3 + stats.teleop.coral.L4 + stats.teleop.algae.processor + stats.teleop.algae.net;

    return (
      <div className="card-modern card">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h4 className="mb-0 fw-bold">
              <i className="fa fa-gamepad me-2"></i>
              Quick Scout
            </h4>
            <span className="badge bg-primary" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
              {auto ? 'AUTONOMOUS' : 'TELEOPERATED'}
            </span>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small text-muted fw-bold">MATCH INFO</label>
              <div className="d-flex gap-2">
                <input
                  className="form-control"
                  type="number"
                  placeholder="Team #"
                  value={team || ''}
                  onInput={(e: any) => this.setState({ team: parseInt(e.target.value || '0') })}
                />
                <input
                  className="form-control"
                  type="number"
                  placeholder="Match #"
                  value={game || ''}
                  onInput={(e: any) => this.setState({ game: parseInt(e.target.value || '0') })}
                />
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label small text-muted fw-bold">ALLIANCE</label>
              <div className="btn-group w-100" role="group">
                <button
                  type="button"
                  className={`btn ${alliance === 'red' ? 'btn-danger' : 'btn-outline-danger'}`}
                  onClick={() => this.setState({ alliance: 'red' })}
                >
                  <i className="fa fa-circle me-2"></i>Red Alliance
                </button>
                <button
                  type="button"
                  className={`btn ${alliance === 'blue' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => this.setState({ alliance: 'blue' })}
                >
                  <i className="fa fa-circle me-2"></i>Blue Alliance
                </button>
              </div>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2 mb-3 align-items-center" role="toolbar">
            <button
              className="btn btn-outline-primary"
              onClick={() => this.setState({ auto: !auto })}
            >
              <i className="fa fa-sync-alt me-2"></i>
              {auto ? 'Switch to Teleop' : 'Switch to Auto'}
            </button>
            <button
              className={`btn ${stats.auto.mobility ? 'btn-success' : 'btn-outline-success'}`}
              disabled={!auto}
              onClick={this.toggleMobility}
            >
              <i className={`fa ${stats.auto.mobility ? 'fa-check-circle' : 'fa-circle'} me-2`}></i>
              Mobility
            </button>
            <button
              className={`btn ${timerActive ? 'btn-warning' : 'btn-outline-secondary'}`}
              onClick={() => this.setState({ timerActive: !timerActive })}
            >
              <i className="fa fa-stopwatch me-2"></i>
              {this.formatTime(elapsed)}
            </button>
            <button className="btn btn-success ms-auto" onClick={this.save} disabled={saving}>
              <i className="fa fa-save me-2"></i>
              {saving ? 'Saving...' : 'Save Match'}
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
                      style={sliceStyle(r, c) as any}
                      onClick={() => this.clickCell(r, c)}
                    >
                      <span className="quick-scout-cell-overlay">
                        <span className="badge bg-dark bg-opacity-75">{cellNum}</span>
                        <span className="quick-scout-cell-label">{this.getCellLabel(r, c)}</span>
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
}