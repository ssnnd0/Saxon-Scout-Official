import React, { Component } from 'react';

interface ScouterAccuracy {
  scouter_name: string;
  total_scouts: number;
  avg_auto_predicted: number;
  avg_teleop_predicted: number;
  auto_consistency: number;
  teleop_consistency: number;
}

interface AnalyticsState {
  accuracy: ScouterAccuracy[];
  loading: boolean;
  error: string | null;
}

export default class Analytics extends Component<{}, AnalyticsState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      accuracy: [],
      loading: true,
      error: null
    };
  }

  componentDidMount() {
    this.loadAccuracyMetrics();
  }

  loadAccuracyMetrics = async () => {
    try {
      this.setState({ loading: true, error: null });
      
      const response = await fetch('/api/analytics/accuracy');
      const data = await response.json();
      
      if (data.success) {
        this.setState({ accuracy: data.data, loading: false });
      } else {
        throw new Error(data.error || 'Failed to load accuracy metrics');
      }
    } catch (error: any) {
      console.error('Error loading accuracy metrics:', error);
      this.setState({ 
        error: error.message || 'Failed to load analytics',
        loading: false 
      });
    }
  }

  render() {
    const { accuracy, loading, error } = this.state;

    return (
      <div className="saxon-hero">
        <div className="container mx-auto px-6 py-8">
          <div className="saxon-card">
            <div className="saxon-card-header">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold mb-2">Scouting Analytics</h1>
                  <p className="text-sm opacity-80">Performance metrics and accuracy tracking</p>
                </div>
                <button 
                  onClick={this.loadAccuracyMetrics}
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

              {!loading && !error && accuracy.length === 0 && (
                <div className="saxon-alert saxon-alert-info">
                  <i className="fa fa-info-circle"></i>
                  <div>
                    No scouting data available yet. Scout some matches to see analytics.
                  </div>
                </div>
              )}

              {!loading && !error && accuracy.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Scouter Performance</h3>
                  <div className="overflow-x-auto">
                    <table className="saxon-table">
                      <thead>
                        <tr>
                          <th>Scouter</th>
                          <th>Matches Scouted</th>
                          <th>Avg Auto Predicted</th>
                          <th>Avg Teleop Predicted</th>
                          <th>Auto Consistency</th>
                          <th>Teleop Consistency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accuracy.map((scouter) => (
                          <tr key={scouter.scouter_name}>
                            <td className="font-semibold">{scouter.scouter_name}</td>
                            <td>
                              <span className="saxon-badge">{scouter.total_scouts}</span>
                            </td>
                            <td>{parseFloat(scouter.avg_auto_predicted?.toString() || '0').toFixed(1)}</td>
                            <td>{parseFloat(scouter.avg_teleop_predicted?.toString() || '0').toFixed(1)}</td>
                            <td>
                              <span className="text-xs" style={{ 
                                color: parseFloat(scouter.auto_consistency?.toString() || '0') < 5 
                                  ? 'var(--color-success)' 
                                  : 'var(--color-warning)' 
                              }}>
                                ±{parseFloat(scouter.auto_consistency?.toString() || '0').toFixed(1)}
                              </span>
                            </td>
                            <td>
                              <span className="text-xs" style={{ 
                                color: parseFloat(scouter.teleop_consistency?.toString() || '0') < 10 
                                  ? 'var(--color-success)' 
                                  : 'var(--color-warning)' 
                              }}>
                                ±{parseFloat(scouter.teleop_consistency?.toString() || '0').toFixed(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 saxon-alert saxon-alert-info">
                    <i className="fa fa-info-circle"></i>
                    <div>
                      <strong>About Consistency:</strong> Lower values indicate more consistent scouting. 
                      Green values show good consistency, yellow indicates room for improvement.
                    </div>
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
