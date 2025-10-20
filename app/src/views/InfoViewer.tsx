import React, { Component } from 'react';
import Chart from 'chart.js/auto';
import type { DirHandle } from '../lib/fsStore';


interface InfoViewerProps {
  root: DirHandle | null;
}

interface InfoViewerState {
  summary: SummaryEntry[];
  error: string | null;
  genaiText: string;
  loading: boolean;
}

interface SummaryEntry {
  team: number;
  matches: number;
  autoScore: number;
  autoMiss: number;
  teleopScore: number;
  teleopMiss: number;
  mobilityCount: number;
  endgameCounts: { none: number; park: number; shallow: number; deep: number };
  foulCount: number;
}

async function readAllMatches(root: DirHandle): Promise<any[]> {
  const matches: any[] = [];
  try {
    const matchesDir = await root.getDirectoryHandle('matches', { create: false });
    // Type assertion for FileSystemDirectoryHandle which has entries()
    const dirHandle = matchesDir as any;
    if (dirHandle.entries) {
      for await (const [name, handle] of dirHandle.entries()) {
        if (name.endsWith('.json')) {
          try {
            const file = await handle.getFile();
            const text = await file.text();
            const data = JSON.parse(text);
            matches.push(data);
          } catch (err) {
            console.warn(`Failed to read ${name}:`, err);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Failed to read matches directory:', err);
  }
  return matches;
}

function summarise(records: any[]): SummaryEntry[] {
  const teamMap = new Map<number, any[]>();
  
  records.forEach(record => {
    const team = record.team;
    if (!teamMap.has(team)) {
      teamMap.set(team, []);
    }
    teamMap.get(team)!.push(record);
  });

  return Array.from(teamMap.entries()).map(([team, matches]) => {
    const autoScore = matches.reduce((sum, m) => sum + (m.phase?.auto?.scored || 0), 0);
    const autoMiss = matches.reduce((sum, m) => sum + (m.phase?.auto?.missed || 0), 0);
    const teleopScore = matches.reduce((sum, m) => sum + (m.phase?.teleop?.scored || 0), 0);
    const teleopMiss = matches.reduce((sum, m) => sum + (m.phase?.teleop?.missed || 0), 0);
    const mobilityCount = matches.reduce((sum, m) => sum + (m.phase?.auto?.mobility ? 1 : 0), 0);
    const foulCount = matches.reduce((sum, m) => sum + (m.fouls || 0), 0);
    
    const endgameCounts = {
      none: matches.filter(m => m.endgame?.climb === 'none').length,
      park: matches.filter(m => m.endgame?.park).length,
      shallow: matches.filter(m => m.endgame?.climb === 'low').length,
      deep: matches.filter(m => m.endgame?.climb === 'high').length
    };

    return {
      team,
      matches: matches.length,
      autoScore,
      autoMiss,
      teleopScore,
      teleopMiss,
      mobilityCount,
      endgameCounts,
      foulCount
    };
  }).sort((a, b) => b.autoScore + b.teleopScore - (a.autoScore + a.teleopScore));
}

export default class InfoViewer extends Component<InfoViewerProps, InfoViewerState> {
  chartInstance: any = null;
  chartRef: any = null;

  constructor(props: InfoViewerProps) {
    super(props);
    this.state = {
      summary: [],
      error: null,
      genaiText: '',
      loading: true
    };
  }

  componentDidMount() {
    this.loadData();
  }

  componentDidUpdate(prevProps: InfoViewerProps) {
    if (prevProps.root !== this.props.root) {
      this.loadData();
    }
  }

  componentWillUnmount() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }

  loadData = async () => {
    const { root } = this.props;

    try {
      this.setState({ loading: true, error: null });
      
      let matches: any[] = [];
      
      // Try to fetch from server first
      try {
        const response = await fetch('/api/scouting/matches');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.length > 0) {
            // Convert server data format to local format
            matches = data.data.map((m: any) => ({
              team: m.team_number,
              game: m.match_number,
              alliance: m.alliance,
              scouter: m.scouter_name,
              phase: {
                auto: {
                  scored: m.auto_scored || 0,
                  missed: m.auto_missed || 0,
                  mobility: m.auto_mobility || false
                },
                teleop: {
                  scored: m.teleop_scored || 0,
                  missed: m.teleop_missed || 0
                }
              },
              endgame: {
                park: m.endgame_park || false,
                climb: m.endgame_climb || 'none'
              },
              fouls: m.fouls || 0,
              comments: m.comments || ''
            }));
            console.log(`Loaded ${matches.length} matches from PostgreSQL server`);
          }
        }
      } catch (serverError) {
        console.warn('Failed to fetch from server, trying local storage:', serverError);
      }
      
      // Fallback to local storage if server data is empty or failed
      if (matches.length === 0 && root) {
        matches = await readAllMatches(root);
        console.log(`Loaded ${matches.length} matches from local storage`);
      }
      
      const summary = summarise(matches);
      this.setState({ summary, loading: false });
      
      // Render chart after data is loaded
      setTimeout(() => this.renderChart(), 100);
    } catch (err: any) {
      this.setState({ error: err.message, loading: false });
    }
  }

  renderChart = () => {
    if (!this.chartRef || this.state.summary.length === 0) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const { summary } = this.state;
    const teams = summary.map(s => s.team);
    const autoScores = summary.map(s => s.autoScore);
    const teleopScores = summary.map(s => s.teleopScore);

    const config: any = {
      type: 'bar',
      data: {
        labels: teams,
        datasets: [
          {
            label: 'Auto Score',
            data: autoScores,
            backgroundColor: 'rgba(255, 215, 0, 0.8)',
            borderColor: 'rgba(255, 215, 0, 1)',
            borderWidth: 2
          },
          {
            label: 'Teleop Score',
            data: teleopScores,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderColor: 'rgba(0, 0, 0, 1)',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Team Performance Analysis',
            font: { size: 16, weight: 'bold' as const }
          },
          legend: {
            display: true,
            position: 'top' as const
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Score'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Team Number'
            }
          }
        }
      }
    };

    this.chartInstance = new Chart(this.chartRef, config);
  }

  askGenAI = async () => {
    try {
      const prompt = 'Generate strategic insights from the local FRC match data.';
      const r = await fetch('/api/genai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await r.json();
      this.setState({ genaiText: data.text || data.error || 'GenAI unavailable' });
    } catch (err: any) {
      this.setState({ genaiText: 'Error contacting GenAI' });
    }
  }

  render() {
    const { summary, error, genaiText, loading } = this.state;

    return (
      <div className="saxon-hero">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="saxon-card">
            {/* Saxon Header */}
            <div className="saxon-card-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="saxon-module-icon text-3xl">
                    <i className="fa fa-chart-line"></i>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-saxon-black">WAR ROOM</h1>
                    <p className="text-saxon-gold-dark">Team statistics and performance metrics</p>
                  </div>
                </div>
                {summary.length > 0 && (
                  <div className="flex items-center space-x-4">
                    <span className="saxon-badge">{summary.length} Teams</span>
                    <span className="saxon-badge-outline">Analytics</span>
                  </div>
                )}
              </div>
            </div>

            <div className="saxon-card-body">
              {loading && (
                <div className="text-center py-12">
                  <div className="saxon-loading-lg mx-auto mb-4"></div>
                  <p className="text-saxon-gold-dark">Loading analytics data...</p>
                </div>
              )}

              {error && (
                <div className="saxon-alert saxon-alert-error mb-6">
                  <div className="flex items-center">
                    <i className="fa fa-exclamation-triangle mr-4 text-2xl"></i>
                    <div>
                      <strong>Error:</strong> {error}
                    </div>
                  </div>
                </div>
              )}

              {!loading && !error && summary.length === 0 && (
                <div className="saxon-alert saxon-alert-warning mb-6">
                  <div className="flex items-center">
                    <i className="fa fa-info-circle mr-4 text-2xl"></i>
                    <div>
                      <strong>No Data:</strong> No scouting data found. Start scouting matches to see analytics.
                    </div>
                  </div>
                </div>
              )}

              {!loading && !error && summary.length > 0 && (
                <>
                  {/* Performance Chart */}
                  <div className="saxon-card bg-saxon-gold-light mb-6">
                    <div className="saxon-card-body">
                      <h3 className="font-bold text-saxon-black mb-4">
                        <i className="fa fa-chart-bar mr-2"></i>
                        TEAM PERFORMANCE ANALYSIS
                      </h3>
                      <div className="relative" style={{ height: '400px' }}>
                        <canvas ref={(ref) => this.chartRef = ref}></canvas>
                      </div>
                    </div>
                  </div>

                  {/* Team Statistics Table */}
                  <div className="saxon-card mb-6">
                    <div className="saxon-card-body">
                      <h3 className="font-bold text-saxon-black mb-4">
                        <i className="fa fa-table mr-2"></i>
                        TEAM STATISTICS
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="saxon-table">
                          <thead>
                            <tr>
                              <th>Team</th>
                              <th>Matches</th>
                              <th>Auto Score</th>
                              <th>Teleop Score</th>
                              <th>Mobility</th>
                              <th>Endgame</th>
                              <th>Fouls</th>
                            </tr>
                          </thead>
                          <tbody>
                            {summary.map((entry, index) => (
                              <tr key={entry.team}>
                                <td className="font-bold">{entry.team}</td>
                                <td>{entry.matches}</td>
                                <td className="text-saxon-gold-dark font-bold">{entry.autoScore}</td>
                                <td className="text-saxon-black font-bold">{entry.teleopScore}</td>
                                <td>
                                  <span className="saxon-badge-outline text-xs">
                                    {entry.mobilityCount}/{entry.matches}
                                  </span>
                                </td>
                                <td>
                                  <div className="text-xs space-y-1">
                                    <div>Park: {entry.endgameCounts.park}</div>
                                    <div>Shallow: {entry.endgameCounts.shallow}</div>
                                    <div>Deep: {entry.endgameCounts.deep}</div>
                                  </div>
                                </td>
                                <td className="text-red-600 font-bold">{entry.foulCount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* AI Insights */}
                  <div className="saxon-card bg-saxon-gold-light">
                    <div className="saxon-card-body">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-saxon-black">
                          <i className="fa fa-brain mr-2"></i>
                          AI STRATEGIC INSIGHTS
                        </h3>
                        <button
                          className="saxon-btn-outline"
                          onClick={this.askGenAI}
                        >
                          <i className="fa fa-magic mr-2"></i>
                          Generate Insights
                        </button>
                      </div>
                      {genaiText ? (
                        <div className="bg-white p-4 rounded-xl border-2 border-saxon-gold">
                          <p className="text-saxon-black whitespace-pre-wrap">{genaiText}</p>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-saxon-gold-dark">
                          <i className="fa fa-robot text-4xl mb-4"></i>
                          <p>Click "Generate Insights" to get AI-powered strategic analysis</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Saxon Footer */}
            <div className="saxon-card-footer">
              <div className="flex justify-between items-center">
                <div className="text-sm text-saxon-gold-dark">
                  <strong>WAR ROOM ANALYTICS</strong> • Team 611 Saxon Robotics
                </div>
                <div className="text-sm text-saxon-black">
                  FRC 2025 REEFSCAPE
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}