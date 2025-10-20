import React, { Component } from 'react';

interface Match {
  key: string;
  comp_level: string;
  match_number: number;
  alliances: {
    red: { team_keys: string[] };
    blue: { team_keys: string[] };
  };
  time: number;
}

interface EventScheduleState {
  eventKey: string;
  matches: Match[];
  loading: boolean;
  error: string | null;
}

export default class EventSchedule extends Component<{}, EventScheduleState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      eventKey: '2025casj',
      matches: [],
      loading: false,
      error: null
    };
  }

  loadSchedule = async () => {
    const { eventKey } = this.state;
    if (!eventKey) return;

    try {
      this.setState({ loading: true, error: null });
      
      const response = await fetch(`/api/events/${eventKey}/schedule`);
      const data = await response.json();
      
      if (data.success) {
        this.setState({ matches: data.data, loading: false });
      } else {
        throw new Error(data.error || 'Failed to load schedule');
      }
    } catch (error: any) {
      console.error('Error loading schedule:', error);
      this.setState({ 
        error: error.message || 'Failed to load event schedule',
        loading: false 
      });
    }
  }

  render() {
    const { eventKey, matches, loading, error } = this.state;

    return (
      <div className="saxon-hero">
        <div className="container mx-auto px-6 py-8">
          <div className="saxon-card">
            <div className="saxon-card-header">
              <h1 className="text-2xl font-bold mb-2">Event Schedule</h1>
              <p className="text-sm opacity-80">View match schedules from The Blue Alliance</p>
            </div>

            <div className="saxon-card-body">
              <div className="mb-6 flex gap-4 items-end">
                <div className="saxon-form-group flex-1">
                  <label className="saxon-form-label">Event Key</label>
                  <input
                    type="text"
                    className="saxon-input"
                    value={eventKey}
                    onChange={(e) => this.setState({ eventKey: e.target.value })}
                    placeholder="e.g., 2025casj"
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                    Format: YYYY + event code (e.g., 2025casj for San Jose 2025)
                  </p>
                </div>
                <button
                  onClick={this.loadSchedule}
                  className="saxon-btn"
                  disabled={loading}
                >
                  <i className="fa fa-download mr-2"></i>
                  Load Schedule
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
                    <p className="text-sm mt-1">Make sure TBA_API_KEY is configured in your .env file</p>
                  </div>
                </div>
              )}

              {!loading && !error && matches.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="saxon-table">
                    <thead>
                      <tr>
                        <th>Match</th>
                        <th>Type</th>
                        <th>Red Alliance</th>
                        <th>Blue Alliance</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matches.map((match) => (
                        <tr key={match.key}>
                          <td className="font-semibold">{match.match_number}</td>
                          <td>
                            <span className="saxon-badge-outline">
                              {match.comp_level === 'qm' ? 'Qual' : match.comp_level.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            {match.alliances.red.team_keys.map(key => key.replace('frc', '')).join(', ')}
                          </td>
                          <td>
                            {match.alliances.blue.team_keys.map(key => key.replace('frc', '')).join(', ')}
                          </td>
                          <td>
                            {match.time ? new Date(match.time * 1000).toLocaleTimeString() : 'TBD'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!loading && !error && matches.length === 0 && eventKey && (
                <div className="saxon-alert saxon-alert-info">
                  <i className="fa fa-info-circle"></i>
                  <div>
                    No matches found for this event. Click "Load Schedule" to fetch data.
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
