import React, { Component } from 'react';
import { writeJSON } from '../lib/fsStore';
import type { DirHandle } from '../lib/fsStore';


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

type EndgameState = 'none' | 'park' | 'shallow' | 'deep';
type CoralLevel = 'L1' | 'L2' | 'L3' | 'L4';
type AlgaeTarget = 'processor' | 'net';
type PhaseName = 'auto' | 'teleop';

type CoralAction = { type: 'coral'; level: CoralLevel; phase: PhaseName; time: number };
type AlgaeAction = { type: 'algae'; target: AlgaeTarget; phase: PhaseName; time: number };
type EndgameAction = { type: 'endgame'; state: EndgameState; time: number };
type FoulAction = { type: 'foul'; time: number };
type MobilityAction = { type: 'mobility'; state: boolean; previous: boolean; time: number };
type HistoryAction = CoralAction | AlgaeAction | EndgameAction | FoulAction | MobilityAction;

interface QuickScoutState {
  auto: boolean;
  alliance: 'red' | 'blue';
  team: number;
  game: number;
  eventCode: string;
  stats: ScoutStats;
  history: HistoryAction[];
  timerActive: boolean;
  elapsed: number;
  saving: boolean;
  showInstructions: boolean;
}

const GRID = { rows: 3, cols: 3 };

function sliceStyle(r: number, c: number) {
  return {
    gridRow: r + 1,
    gridColumn: c + 1,
    background: 'transparent',
    border: '2px solid var(--saxon-gold)',
    borderRadius: '12px',
    color: 'transparent'
  };
}

export default class QuickScout extends Component<QuickScoutProps, QuickScoutState> {
  timerInterval: any = null;
  teamInputRef: React.RefObject<HTMLInputElement> = React.createRef();
  gameInputRef: React.RefObject<HTMLInputElement> = React.createRef();

  constructor(props: QuickScoutProps) {
    super(props);
    this.state = {
      auto: true,
      alliance: 'red',
      team: 0,
      game: 0,
      eventCode: '',
      stats: {
        auto: {
          coral: { L1: 0, L2: 0, L3: 0, L4: 0 },
          algae: { processor: 0, net: 0 },
          mobility: false
        },
        teleop: {
          coral: { L1: 0, L2: 0, L3: 0, L4: 0 },
          algae: { processor: 0, net: 0 }
        },
        endgame: { state: 'none' },
        fouls: 0
      },
      history: [],
      timerActive: false,
      elapsed: 0,
      saving: false,
      showInstructions: false
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
    if (prevState.timerActive !== this.state.timerActive) {
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
    const key = e.key.toLowerCase();
    if (key === 'q') {
      this.setState({ auto: true });
    } else if (key === 't') {
      this.setState({ auto: false });
    } else if (key === 'e') {
      this.toggleEndgame();
    } else if (key === 'f') {
      this.recordFoul();
    } else if (key === 'u') {
      this.undo();
    } else if (key === 'm' || key === 'M') {
      this.toggleMobility();
    }
  }

  recordCoral = (level: 'L1' | 'L2' | 'L3' | 'L4') => {
    const phase: PhaseName = this.state.auto ? 'auto' : 'teleop';
    this.setState(prevState => ({
      stats: {
        ...prevState.stats,
        [phase]: {
          ...prevState.stats[phase],
          coral: {
            ...prevState.stats[phase].coral,
            [level]: prevState.stats[phase].coral[level] + 1
          }
        }
      },
      history: [...prevState.history, { type: 'coral', level: level as CoralLevel, phase, time: this.state.elapsed }]
    }));
  }

  recordAlgae = (target: 'processor' | 'net') => {
    const phase: PhaseName = this.state.auto ? 'auto' : 'teleop';
    this.setState(prevState => ({
      stats: {
        ...prevState.stats,
        [phase]: {
          ...prevState.stats[phase],
          algae: {
            ...prevState.stats[phase].algae,
            [target]: prevState.stats[phase].algae[target] + 1
          }
        }
      },
      history: [...prevState.history, { type: 'algae', target: target as AlgaeTarget, phase, time: this.state.elapsed }]
    }));
  }

  toggleEndgame = () => {
    const states: Array<EndgameState> = ['none', 'park', 'shallow', 'deep'];
    const currentIndex = states.indexOf(this.state.stats.endgame.state);
    const nextIndex = (currentIndex + 1) % states.length;
    
    this.setState(prevState => ({
      stats: {
        ...prevState.stats,
        endgame: { state: states[nextIndex] as EndgameState }
      },
      history: [...prevState.history, { type: 'endgame', state: states[nextIndex] as EndgameState, time: this.state.elapsed }]
    }));
  }

  recordFoul = () => {
    this.setState(prevState => ({
      stats: {
        ...prevState.stats,
        fouls: prevState.stats.fouls + 1
      },
      history: [...prevState.history, { type: 'foul', time: this.state.elapsed }]
    }));
  }

  toggleMobility = () => {
    this.setState(prevState => ({
      stats: {
        ...prevState.stats,
        auto: {
          ...prevState.stats.auto,
          mobility: !prevState.stats.auto.mobility
        }
      },
      history: [
        ...prevState.history,
        {
          type: 'mobility',
          state: !prevState.stats.auto.mobility,
          previous: prevState.stats.auto.mobility ?? false,
          time: this.state.elapsed,
        }
      ]
    }));
  }

  undo = () => {
    if (this.state.history.length === 0) return;
    
    const lastAction = this.state.history[this.state.history.length - 1] as HistoryAction;
    const newHistory = this.state.history.slice(0, -1);
    
    this.setState(prevState => {
      const newStats = { ...prevState.stats };
      switch (lastAction.type) {
        case 'coral': {
          const phaseVar: PhaseName = lastAction.phase;
          const coral = newStats[phaseVar].coral;
          const key = lastAction.level as keyof typeof coral;
          coral[key] = Math.max(0, coral[key] - 1);
          break;
        }
        case 'algae': {
          const phaseVar: PhaseName = lastAction.phase;
          const algae = newStats[phaseVar].algae;
          const key = lastAction.target as keyof typeof algae;
          algae[key] = Math.max(0, algae[key] - 1);
          break;
        }
        case 'endgame': {
          const states: Array<EndgameState> = ['none', 'park', 'shallow', 'deep'];
          const currentIndex = states.indexOf(newStats.endgame.state);
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : states.length - 1;
          newStats.endgame.state = states[prevIndex] as EndgameState;
          break;
        }
        case 'foul': {
          newStats.fouls = Math.max(0, newStats.fouls - 1);
          break;
        }
        case 'mobility': {
          newStats.auto.mobility = Boolean(lastAction.previous);
          break;
        }
      }

      return { stats: newStats, history: newHistory };
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
      alert('Please select a data folder first');
      return;
    }
    if (!scouter) {
      alert('Please login before saving');
      return;
    }
    if (!team || team <= 0) {
      alert('Please enter a valid team number');
      return;
    }
    if (!game || game <= 0) {
      alert('Please enter a valid match number');
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

      // Server-first approach: Try to save to server first
      try {
        const serverResponse = await fetch('/api/scouting/matches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(record)
        });

        if (!serverResponse.ok) {
          throw new Error(`Server error: ${serverResponse.status}`);
        }

        console.log('Data saved to server successfully');
        
        // Only save locally as backup if server save succeeds
        try {
          await writeJSON(root, `matches/${filename}`, record);
          console.log('Data also saved locally as backup');
        } catch (localError) {
          console.warn('Local backup save failed:', localError);
          // Don't fail the whole operation if local save fails
        }
      } catch (serverError) {
        console.warn('Server save failed, falling back to local storage:', serverError);
        
        // Fallback to local storage only if server is unavailable
        await writeJSON(root, `matches/${filename}`, record);
        console.log('Data saved locally (server unavailable)');
      }
      
      // Log file creation (non-blocking)
      fetch('/api/log/file-created', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, filepath: 'matches/' + filename, name: scouter || 'unknown' })
      }).catch(err => console.warn('Failed to log file creation:', err));

      alert(`Match ${game} for Team ${team} saved successfully!`);

      this.setState({
        stats: {
          auto: {
            coral: { L1: 0, L2: 0, L3: 0, L4: 0 },
            algae: { processor: 0, net: 0 },
            mobility: false
          },
          teleop: {
            coral: { L1: 0, L2: 0, L3: 0, L4: 0 },
            algae: { processor: 0, net: 0 }
          },
          endgame: { state: 'none' },
          fouls: 0
        },
        history: [],
        elapsed: 0,
        timerActive: false,
        saving: false
      });
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save match. Please try again.');
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

  buildTimeline = (): string => {
    if (!this.state.history.length) return '';
    return this.state.history.map((h: any) => `${h.t ?? 0}:${h.token || h.type}`).join(' ');
  }

  renderScoringCells = (): React.ReactNode[] => {
    const cells: React.ReactNode[] = [];

    for (let row = 0; row < GRID.rows; row += 1) {
      for (let col = 0; col < GRID.cols; col += 1) {
        const cellNum = row * GRID.cols + col + 1;
        const isActive = (row < 2 && col < GRID.cols) || (row === 2 && col < 2);
        const label = this.getCellLabel(row, col);

        cells.push(
          <div
            key={`${row}-${col}`}
            className={`saxon-scoring-cell ${isActive ? 'active' : ''}`}
            onClick={() => this.clickCell(row, col)}
          >
            <div className="text-2xl font-bold mb-2">{cellNum}</div>
            <div className="text-sm">{label}</div>
          </div>
        );
      }
    }

    return cells;
  }

  render() {
    const { auto, alliance, team, game, stats, timerActive, elapsed, saving, showInstructions } = this.state;
    const phase = auto ? 'auto' : 'teleop';
    
    // Calculate scores
    const autoScore = stats ? Object.values(stats.auto.coral).reduce((a: number, b: number) => a + b, 0) : 0;
    const teleopScore = stats ? Object.values(stats.teleop.coral).reduce((a: number, b: number) => a + b, 0) : 0;
    
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white shadow-lg rounded overflow-hidden">
            <div className="px-6 py-8 border-b border-gray-200">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="flex items-center space-x-6">
                  <div className="bg-yellow-600 p-4 rounded text-white">
                    <i className="fa fa-shield-alt text-4xl"></i>
                  </div>
                  <div>
                    <h1 className="text-4xl font-black text-gray-900">Saxon Scout</h1>
                    <div className="flex space-x-4 mt-4">
                      <span className="bg-yellow-600 text-white text-lg px-6 py-1 rounded">
                        Team 611
                      </span>
                      <span className="border border-yellow-600 text-yellow-700 text-lg px-6 py-1 rounded">
                        FRC 2025
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-100 p-4 rounded shadow-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {auto ? 'Autonomous' : 'Teleoperated'}
                    </div>
                    <div className="text-4xl font-bold text-yellow-700">
                      {this.formatTime(elapsed || 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-6">
              {/* Control Panel */}
              <div className="bg-gray-50 p-4 rounded mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <i className="fa fa-users mr-2"></i>
                      <span>Team Number</span>
                    </label>
                    <input
                      ref={this.teamInputRef}
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      value={team || ''}
                      onChange={(e) => this.setState({ team: parseInt(e.target.value) || 0 })}
                      onClick={() => this.teamInputRef.current?.focus()}
                      placeholder="Enter team number"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <i className="fa fa-gamepad mr-2"></i>
                      <span>Match Number</span>
                    </label>
                    <input
                      ref={this.gameInputRef}
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saxon-gold focus:border-saxon-gold"
                      value={game || ''}
                      onChange={(e) => this.setState({ game: parseInt(e.target.value) || 0 })}
                      onClick={() => this.gameInputRef.current?.focus()}
                      placeholder="Enter match number"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <i className="fa fa-flag mr-2"></i>
                      <span>Alliance</span>
                    </label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md ${
                          alliance === 'red'
                            ? "bg-red-600 text-white"
                            : "bg-white text-red-600 border border-red-600 hover:bg-red-50"
                        }`}
                        onClick={() => this.setState({ alliance: 'red' })}
                      >
                        <i className={`fa fa-circle mr-2 ${alliance === 'red' ? "text-white" : "text-red-500"}`}></i>
                        <span>Red Alliance</span>
                      </button>
                      <button
                        type="button"
                        className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md ${
                          alliance === 'blue'
                            ? "bg-blue-600 text-white"
                            : "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
                        }`}
                        onClick={() => this.setState({ alliance: 'blue' })}
                      >
                        <i className={`fa fa-circle mr-2 ${alliance === 'blue' ? "text-white" : "text-blue-500"}`}></i>
                        <span>Blue Alliance</span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                      <i className="fa fa-clock mr-2"></i>
                      <span>Timer</span>
                    </label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        onClick={() => this.setState({ timerActive: !timerActive })}
                      >
                        <i className={`fa ${timerActive ? "fa-pause" : "fa-play"} mr-2`}></i>
                        <span>{timerActive ? 'Pause Timer' : 'Start Timer'}</span>
                      </button>
                      <button
                        type="button"
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                        onClick={() => this.setState({ elapsed: 0, timerActive: false })}
                      >
                        <i className="fa fa-stop mr-2"></i>
                        <span>Reset Timer</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions Alert */}
              {showInstructions && (
                <div className="saxon-alert saxon-alert-info mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <i className="fa fa-info-circle mr-4 text-blue-500 text-2xl"></i>
                      <div>
                        <strong>Getting Started:</strong> Click the scoring grid to record actions. 
                        Use the phase controls to switch between Autonomous and Teleoperated modes.
                      </div>
                    </div>
                    <button
                      type="button"
                      className="saxon-btn-black"
                      onClick={() => this.setState({ showInstructions: false })}
                    >
                      <i className="fa fa-times"></i>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 mb-6">
                <button
                  type="button"
                  className="saxon-btn text-lg px-8 py-4"
                  onClick={() => this.setState({ auto: !auto })}
                >
                  <i className="fa fa-exchange-alt mr-3"></i>
                  Switch Phase
                </button>
                <button
                  type="button"
                  className="saxon-btn-outline text-lg px-8 py-4"
                  onClick={this.toggleMobility}
                >
                  <i className="fa fa-running mr-3"></i>
                  Toggle Mobility
                </button>
                <button
                  type="button"
                  className="saxon-btn-black text-lg px-8 py-4"
                  onClick={this.save}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <i className="fa fa-spinner fa-spin mr-3"></i>
                      Saving Data...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-save mr-3"></i>
                      Save Data
                    </>
                  )}
                </button>
              </div>

              {/* Data Display */}
              <div className="mb-6">
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h2 className="text-xl font-semibold mb-4">Match Info</h2>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Team Number</label>
                          <input
                            type="number"
                            value={team || ''}
                            onChange={(e) => this.setState({ team: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                            placeholder="Enter team number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Match Number</label>
                          <input
                            type="number"
                            value={game || ''}
                            onChange={(e) => this.setState({ game: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                            placeholder="Enter match number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Alliance</label>
                          <div className="flex space-x-4">
                            <button
                              type="button"
                              className={`flex-1 py-2 px-4 rounded-md ${alliance === 'red' ? "bg-red-600 text-white" : "bg-gray-200 text-gray-800"}`}
                              onClick={() => this.setState({ alliance: 'red' })}
                            >
                              Red Alliance
                            </button>
                            <button
                              type="button"
                              className={`flex-1 py-2 px-4 rounded-md ${alliance === 'blue' ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
                              onClick={() => this.setState({ alliance: 'blue' })}
                            >
                              Blue Alliance
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold mb-4">Scoring</h2>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-500">Autonomous</div>
                            <div className="text-3xl font-bold text-yellow-600">{autoScore}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-500">Teleoperated</div>
                            <div className="text-3xl font-bold text-yellow-600">{teleopScore}</div>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold">Total</span>
                            <span className="text-2xl font-bold">{autoScore + teleopScore}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-3xl font-bold text-gray-900">{stats?.endgame?.state?.toString() || 'N/A'}</div>
                  <div className="text-sm text-gray-500">Endgame Status</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-3xl font-bold text-gray-900">{stats?.fouls || 0}</div>
                  <div className="text-sm text-gray-500">Fouls</div>
                </div>
              </div>

              {/* Saxon Scoring Grid */}
              <div className="bg-yellow-50 p-6 rounded-lg shadow mb-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Scoring Grid</h3>
                  <p className="text-yellow-700">Click cells to record {phase} actions</p>
                </div>
                <div className="saxon-scoring-grid max-w-2xl mx-auto">
                  {this.renderScoringCells()}
                </div>
              </div>
            </div>

            {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-4">
                    <button 
                      type="button" 
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                      onClick={() => this.setState({ auto: true })}
                    >
                      <i className="fa fa-play mr-2"></i>Autonomous Phase
                    </button>
                    <button 
                      type="button" 
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                      onClick={() => this.setState({ auto: false })}
                    >
                      <i className="fa fa-gamepad mr-2"></i>Teleoperated Phase
                    </button>
                    <button 
                      type="button" 
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                      onClick={this.toggleEndgame}
                    >
                      <i className="fa fa-flag-checkered mr-2"></i>Endgame
                    </button>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-yellow-700">Saxon Scout v2.1</div>
                    <div className="text-sm text-gray-700">Team 611 • FRC 2025</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    );
  }
}
