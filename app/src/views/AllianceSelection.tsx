import React, { Component } from 'react';

interface Team {
  team_number: number;
  matches_played: number;
  avg_auto: number;
  avg_teleop: number;
  avg_total: number;
  avg_fouls: number;
  mobility_rate: number;
  climb_rate: number;
  max_score: number;
  score_consistency: number;
  composite_score: number;
}

interface Alliance {
  alliance_number: number;
  captain: number;
  first_pick: number | null;
  second_pick: number | null;
  backup: number | null;
  notes: string;
}

interface AllianceSelectionState {
  teams: Team[];
  alliances: Alliance[];
  loading: boolean;
  error: string | null;
  selectedAlliance: number;
  editingAlliance: Alliance | null;
}

export default class AllianceSelection extends Component<{}, AllianceSelectionState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      teams: [],
      alliances: [],
      loading: true,
      error: null,
      selectedAlliance: 1,
      editingAlliance: null
    };
  }

  componentDidMount() {
    this.loadTeamRecommendations();
  }

  loadTeamRecommendations = async () => {
    try {
      this.setState({ loading: true, error: null });
      
      const response = await fetch('/api/alliance/recommendations');
      const data = await response.json();
      
      if (data.success) {
        this.setState({ teams: data.data, loading: false });
      } else {
        throw new Error(data.error || 'Failed to load recommendations');
      }
    } catch (error: any) {
      console.error('Error loading recommendations:', error);
      this.setState({ 
        error: error.message || 'Failed to load team recommendations',
        loading: false 
      });
    }
  }

  saveAlliance = async (alliance: Alliance) => {
    try {
      const response = await fetch('/api/alliance/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alliance)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Alliance saved successfully!');
        this.setState({ editingAlliance: null });
      } else {
        throw new Error(data.error || 'Failed to save alliance');
      }
    } catch (error: any) {
      console.error('Error saving alliance:', error);
      alert('Failed to save alliance: ' + error.message);
    }
  }

  startEditingAlliance = (allianceNumber: number) => {
    this.setState({
      selectedAlliance: allianceNumber,
      editingAlliance: {
        alliance_number: allianceNumber,
        captain: 0,
        first_pick: null,
        second_pick: null,
        backup: null,
        notes: ''
      }
    });
  }

  updateAllianceField = (field: keyof Alliance, value: any) => {
    const { editingAlliance } = this.state;
    if (!editingAlliance) return;
    
    this.setState({
      editingAlliance: {
        ...editingAlliance,
        [field]: value
      }
    });
  }

  render() {
    const { teams, loading, error, editingAlliance } = this.state;

    return (
      <div className="saxon-hero">
        <div className="container mx-auto px-6 py-8">
          <div className="saxon-card">
            <div className="saxon-card-header">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold mb-2">Alliance Selection</h1>
                  <p className="text-sm opacity-80">AI-Powered Team Recommendations and Alliance Builder</p>
                </div>
                <button 
                  onClick={this.loadTeamRecommendations}
                  className="saxon-btn-outline"
                  disabled={loading}
                >
                  <i className="fa fa-sync mr-2"></i>
                  Refresh
                </button>
              </div>
            </div>

            <div className="saxon-card-body">
              {loading && (
                <div className="flex justify-center py-12">
                  <div className="saxon-loading-lg"></div>
                </div>
              )}

              {error && (
                <div className="saxon-alert saxon-alert-error mb-6">
                  <i className="fa fa-exclamation-triangle"></i>
                  <div>
                    <strong>Error:</strong> {error}
                  </div>
                </div>
              )}

              {!loading && !error && teams.length === 0 && (
                <div className="saxon-alert saxon-alert-info">
                  <i className="fa fa-info-circle"></i>
                  <div>
                    No team data available. Scout some matches first to generate recommendations.
                  </div>
                </div>
              )}

              {!loading && !error && teams.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Team Rankings */}
                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">Team Rankings</h3>
                    <div className="overflow-x-auto">
                      <table className="saxon-table">
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Team</th>
                            <th>Composite</th>
                            <th>Avg Total</th>
                            <th>Avg Auto</th>
                            <th>Climb %</th>
                            <th>Matches</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teams.map((team, index) => (
                            <tr key={team.team_number}>
                              <td className="font-bold">{index + 1}</td>
                              <td className="font-semibold">{team.team_number}</td>
                              <td>
                                <span className="saxon-badge">{team.composite_score}</span>
                              </td>
                              <td>{parseFloat(team.avg_total.toString()).toFixed(1)}</td>
                              <td>{parseFloat(team.avg_auto.toString()).toFixed(1)}</td>
                              <td>{(parseFloat(team.climb_rate.toString()) * 100).toFixed(0)}%</td>
                              <td>{team.matches_played}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Alliance Builder */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Alliance Builder</h3>
                    
                    {!editingAlliance ? (
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                          <button
                            key={num}
                            onClick={() => this.startEditingAlliance(num)}
                            className="w-full saxon-btn-outline text-left"
                          >
                            <i className="fa fa-users mr-2"></i>
                            Alliance {num}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="saxon-card">
                        <div className="saxon-card-body space-y-4">
                          <h4 className="font-semibold">Alliance {editingAlliance.alliance_number}</h4>
                          
                          <div className="saxon-form-group">
                            <label className="saxon-form-label">Captain</label>
                            <input
                              type="number"
                              className="saxon-input"
                              value={editingAlliance.captain || ''}
                              onChange={(e) => this.updateAllianceField('captain', parseInt(e.target.value) || 0)}
                              placeholder="Team number"
                            />
                          </div>

                          <div className="saxon-form-group">
                            <label className="saxon-form-label">First Pick</label>
                            <input
                              type="number"
                              className="saxon-input"
                              value={editingAlliance.first_pick || ''}
                              onChange={(e) => this.updateAllianceField('first_pick', parseInt(e.target.value) || null)}
                              placeholder="Team number"
                            />
                          </div>

                          <div className="saxon-form-group">
                            <label className="saxon-form-label">Second Pick</label>
                            <input
                              type="number"
                              className="saxon-input"
                              value={editingAlliance.second_pick || ''}
                              onChange={(e) => this.updateAllianceField('second_pick', parseInt(e.target.value) || null)}
                              placeholder="Team number"
                            />
                          </div>

                          <div className="saxon-form-group">
                            <label className="saxon-form-label">Backup</label>
                            <input
                              type="number"
                              className="saxon-input"
                              value={editingAlliance.backup || ''}
                              onChange={(e) => this.updateAllianceField('backup', parseInt(e.target.value) || null)}
                              placeholder="Team number"
                            />
                          </div>

                          <div className="saxon-form-group">
                            <label className="saxon-form-label">Notes</label>
                            <textarea
                              className="saxon-input"
                              rows={3}
                              value={editingAlliance.notes}
                              onChange={(e) => this.updateAllianceField('notes', e.target.value)}
                              placeholder="Strategy notes..."
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => this.saveAlliance(editingAlliance)}
                              className="saxon-btn flex-1"
                            >
                              <i className="fa fa-save mr-2"></i>
                              Save
                            </button>
                            <button
                              onClick={() => this.setState({ editingAlliance: null })}
                              className="saxon-btn-outline flex-1"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
