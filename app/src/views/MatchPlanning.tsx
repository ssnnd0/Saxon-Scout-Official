import React, { Component } from 'react';

interface MatchPlan {
  match_number: number;
  our_alliance: number[];
  opponent_alliance: number[];
  strategy: string;
  roles: { [key: number]: string };
  notes: string;
  whiteboard_data: any;
}

interface MatchPlanningState {
  matchNumber: number;
  plan: MatchPlan | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

export default class MatchPlanning extends Component<{}, MatchPlanningState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      matchNumber: 1,
      plan: null,
      loading: false,
      saving: false,
      error: null
    };
  }

  loadMatchPlan = async (matchNumber: number) => {
    try {
      this.setState({ loading: true, error: null });
      
      const response = await fetch(`/api/match-plan/${matchNumber}`);
      const data = await response.json();
      
      if (data.success) {
        if (data.data) {
          // Parse JSON fields
          const plan = {
            ...data.data,
            our_alliance: JSON.parse(data.data.our_alliance || '[]'),
            opponent_alliance: JSON.parse(data.data.opponent_alliance || '[]'),
            roles: JSON.parse(data.data.roles || '{}'),
            whiteboard_data: JSON.parse(data.data.whiteboard_data || '{}')
          };
          this.setState({ plan, loading: false });
        } else {
          // Create new plan
          this.setState({
            plan: {
              match_number: matchNumber,
              our_alliance: [611, 0, 0],
              opponent_alliance: [0, 0, 0],
              strategy: '',
              roles: {},
              notes: '',
              whiteboard_data: {}
            },
            loading: false
          });
        }
      } else {
        throw new Error(data.error || 'Failed to load match plan');
      }
    } catch (error: any) {
      console.error('Error loading match plan:', error);
      this.setState({ 
        error: error.message || 'Failed to load match plan',
        loading: false 
      });
    }
  }

  saveMatchPlan = async () => {
    const { plan } = this.state;
    if (!plan) return;

    try {
      this.setState({ saving: true, error: null });
      
      const response = await fetch('/api/match-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Match plan saved successfully!');
        this.setState({ saving: false });
      } else {
        throw new Error(data.error || 'Failed to save match plan');
      }
    } catch (error: any) {
      console.error('Error saving match plan:', error);
      this.setState({ 
        error: error.message || 'Failed to save match plan',
        saving: false 
      });
    }
  }

  updatePlanField = (field: keyof MatchPlan, value: any) => {
    const { plan } = this.state;
    if (!plan) return;
    
    this.setState({
      plan: {
        ...plan,
        [field]: value
      }
    });
  }

  updateAllianceTeam = (alliance: 'our_alliance' | 'opponent_alliance', index: number, value: number) => {
    const { plan } = this.state;
    if (!plan) return;
    
    const newAlliance = [...plan[alliance]];
    newAlliance[index] = value;
    
    this.setState({
      plan: {
        ...plan,
        [alliance]: newAlliance
      }
    });
  }

  updateRole = (teamNumber: number, role: string) => {
    const { plan } = this.state;
    if (!plan) return;
    
    this.setState({
      plan: {
        ...plan,
        roles: {
          ...plan.roles,
          [teamNumber]: role
        }
      }
    });
  }

  render() {
    const { matchNumber, plan, loading, saving, error } = this.state;

    return (
      <div className="saxon-hero">
        <div className="container mx-auto px-6 py-8">
          <div className="saxon-card">
            <div className="saxon-card-header">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold mb-2">Match Planning</h1>
                  <p className="text-sm opacity-80">Strategy and Role Assignment for Upcoming Matches</p>
                </div>
              </div>
            </div>

            <div className="saxon-card-body">
              {/* Match Selector */}
              <div className="mb-6 flex gap-4 items-end">
                <div className="saxon-form-group flex-1">
                  <label className="saxon-form-label">Match Number</label>
                  <input
                    type="number"
                    className="saxon-input"
                    value={matchNumber}
                    onChange={(e) => this.setState({ matchNumber: parseInt(e.target.value) || 1 })}
                    min="1"
                  />
                </div>
                <button
                  onClick={() => this.loadMatchPlan(matchNumber)}
                  className="saxon-btn"
                  disabled={loading}
                >
                  <i className="fa fa-search mr-2"></i>
                  Load Match Plan
                </button>
              </div>

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

              {!loading && plan && (
                <div className="space-y-6">
                  {/* Alliance Teams */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Our Alliance */}
                    <div className="saxon-card">
                      <div className="saxon-card-header">
                        <h3 className="text-lg font-semibold">Our Alliance</h3>
                      </div>
                      <div className="saxon-card-body space-y-4">
                        {plan.our_alliance.map((team, index) => (
                          <div key={index} className="saxon-form-group">
                            <label className="saxon-form-label">
                              Team {index + 1} {index === 0 && '(Us)'}
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                className="saxon-input flex-1"
                                value={team || ''}
                                onChange={(e) => this.updateAllianceTeam('our_alliance', index, parseInt(e.target.value) || 0)}
                                placeholder="Team number"
                              />
                              <select
                                className="saxon-input"
                                value={plan.roles[team] || ''}
                                onChange={(e) => this.updateRole(team, e.target.value)}
                              >
                                <option value="">Select Role</option>
                                <option value="scorer">Scorer</option>
                                <option value="defender">Defender</option>
                                <option value="support">Support</option>
                                <option value="climber">Climber</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Opponent Alliance */}
                    <div className="saxon-card">
                      <div className="saxon-card-header">
                        <h3 className="text-lg font-semibold">Opponent Alliance</h3>
                      </div>
                      <div className="saxon-card-body space-y-4">
                        {plan.opponent_alliance.map((team, index) => (
                          <div key={index} className="saxon-form-group">
                            <label className="saxon-form-label">Team {index + 1}</label>
                            <input
                              type="number"
                              className="saxon-input"
                              value={team || ''}
                              onChange={(e) => this.updateAllianceTeam('opponent_alliance', index, parseInt(e.target.value) || 0)}
                              placeholder="Team number"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Strategy */}
                  <div className="saxon-form-group">
                    <label className="saxon-form-label">Match Strategy</label>
                    <textarea
                      className="saxon-input"
                      rows={4}
                      value={plan.strategy}
                      onChange={(e) => this.updatePlanField('strategy', e.target.value)}
                      placeholder="Describe the overall strategy for this match..."
                    />
                  </div>

                  {/* Notes */}
                  <div className="saxon-form-group">
                    <label className="saxon-form-label">Additional Notes</label>
                    <textarea
                      className="saxon-input"
                      rows={3}
                      value={plan.notes}
                      onChange={(e) => this.updatePlanField('notes', e.target.value)}
                      placeholder="Any additional notes or observations..."
                    />
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={this.saveMatchPlan}
                      className="saxon-btn"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <i className="fa fa-spinner fa-spin mr-2"></i>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="fa fa-save mr-2"></i>
                          Save Match Plan
                        </>
                      )}
                    </button>
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
