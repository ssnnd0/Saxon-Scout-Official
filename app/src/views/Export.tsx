import React, { Component } from 'react';
import JSZip from 'jszip';
import type { DirHandle } from '../lib/fsStore';

interface ExportProps {
  root: DirHandle | null;
  navigateHome: () => void;
}

interface ExportState {
  matchUrl: string | null;
  pitUrl: string | null;
  error: string | null;
  loading: boolean;
}

async function readJsonFiles(root: DirHandle, subdir: string): Promise<Array<{ name: string; obj: any; text: string }>> {
  const files: Array<{ name: string; obj: any; text: string }> = [];
  try {
    const dir = await root.getDirectoryHandle(subdir);
    for await (const [name, handle] of dir.entries()) {
      if (name.endsWith('.json')) {
        try {
          const file = await handle.getFile();
          const text = await file.text();
          const obj = JSON.parse(text);
          files.push({ name, obj, text });
        } catch (err) {
          console.warn(`Failed to read ${name}:`, err);
        }
      }
    }
  } catch (err) {
    console.warn(`Failed to read ${subdir} directory:`, err);
  }
  return files;
}

export default class Export extends Component<ExportProps, ExportState> {
  constructor(props: ExportProps) {
    super(props);
    this.state = {
      matchUrl: null,
      pitUrl: null,
      error: null,
      loading: false
    };
  }

  exportMatches = async () => {
    const { root } = this.props;
    if (!root) {
      this.setState({ error: 'No data folder selected' });
      return;
    }

    this.setState({ loading: true, error: null });

    try {
      const files = await readJsonFiles(root, 'matches');
      if (files.length === 0) {
        this.setState({ error: 'No match data found', loading: false });
        return;
      }

      // Create CSV content
      const headers = ['Team', 'Match', 'Alliance', 'Time', 'Scouter', 'Auto Score', 'Auto Miss', 'Auto Mobility', 'Teleop Cycles', 'Teleop Score', 'Teleop Miss', 'Endgame Park', 'Endgame Climb', 'Fouls'];
      const csvRows = [headers.join(',')];
      
      files.forEach(file => {
        const { obj } = file;
        const row = [
          obj.team || '',
          obj.game || '',
          obj.alliance || '',
          obj.time || '',
          obj.scouter || '',
          obj.phase?.auto?.scored || 0,
          obj.phase?.auto?.missed || 0,
          obj.phase?.auto?.mobility ? 'Yes' : 'No',
          obj.phase?.teleop?.cycles || 0,
          obj.phase?.teleop?.scored || 0,
          obj.phase?.teleop?.missed || 0,
          obj.endgame?.park ? 'Yes' : 'No',
          obj.endgame?.climb || 'none',
          obj.fouls || 0
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      this.setState({ matchUrl: url, loading: false });
    } catch (err) {
      console.error(err);
      this.setState({ error: 'Failed to export match data', loading: false });
    }
  }

  exportPit = async () => {
    const { root } = this.props;
    if (!root) {
      this.setState({ error: 'No data folder selected' });
      return;
    }

    this.setState({ loading: true, error: null });

    try {
      const files = await readJsonFiles(root, 'pit');
      if (files.length === 0) {
        this.setState({ error: 'No pit data found', loading: false });
        return;
      }

      const zip = new JSZip();
      
      // Add individual JSON files
      files.forEach(file => {
        zip.file(file.name, file.text);
      });

      // Create summary CSV
      const headers = ['Team', 'Drivetrain', 'Auto Paths', 'Preferred Zones', 'Cycle Time', 'Can Climb', 'Notes', 'Scouter', 'Time'];
      const csvRows = [headers.join(',')];
      
      files.forEach(file => {
        const { obj } = file;
        const row = [
          obj.team || '',
          obj.drivetrain || '',
          (obj.autoPaths || []).join(';'),
          (obj.zones || []).join(';'),
          obj.cycleTime || '',
          obj.canClimb ? 'Yes' : 'No',
          (obj.notes || '').replace(/,/g, ';'),
          obj.scouter || '',
          obj.time || ''
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      zip.file('pit_summary.csv', csvContent);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      this.setState({ pitUrl: url, loading: false });
    } catch (err) {
      console.error(err);
      this.setState({ error: 'Failed to export pit data', loading: false });
    }
  }

  render() {
    const { navigateHome } = this.props;
    const { matchUrl, pitUrl, error, loading } = this.state;

    return (
      <div className="saxon-hero">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="saxon-card">
            {/* Saxon Header */}
            <div className="saxon-card-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="saxon-module-icon text-3xl">
                    <i className="fa fa-download"></i>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-saxon-black">SUPPLY LOGISTICS</h1>
                    <p className="text-saxon-gold-dark">Export scouting data for analysis</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="saxon-badge">CSV/JSON</span>
                  <button className="saxon-btn-outline" onClick={navigateHome}>
                    <i className="fa fa-arrow-left mr-2"></i>
                    Back
                  </button>
                </div>
              </div>
            </div>

            <div className="saxon-card-body">
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

              <div className="saxon-grid-2 gap-8">
                {/* Match Data Export */}
                <div className="saxon-card bg-saxon-gold-light">
                  <div className="saxon-card-body">
                    <div className="text-center mb-6">
                      <div className="saxon-module-icon text-4xl mx-auto mb-4">
                        <i className="fa fa-gamepad"></i>
                      </div>
                      <h3 className="font-bold text-saxon-black mb-2">MATCH DATA EXPORT</h3>
                      <p className="text-saxon-gold-dark">Export match scouting data as CSV</p>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-xl border-2 border-saxon-gold">
                        <h4 className="font-bold text-saxon-black mb-2">Export Format:</h4>
                        <ul className="text-sm text-saxon-gold-dark space-y-1">
                          <li>• Team number and match information</li>
                          <li>• Autonomous and teleoperated scores</li>
                          <li>• Endgame capabilities and fouls</li>
                          <li>• Scouter attribution and timestamps</li>
                        </ul>
                      </div>

                      <button
                        className="saxon-btn w-full text-lg py-4"
                        onClick={this.exportMatches}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <i className="fa fa-spinner fa-spin mr-3"></i>
                            PROCESSING...
                          </>
                        ) : (
                          <>
                            <i className="fa fa-download mr-3"></i>
                            EXPORT MATCH DATA
                          </>
                        )}
                      </button>

                      {matchUrl && (
                        <div className="saxon-alert saxon-alert-success">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <i className="fa fa-check-circle mr-4 text-2xl"></i>
                              <div>
                                <strong>Export Ready:</strong> Match data has been processed
                              </div>
                            </div>
                            <a
                              href={matchUrl}
                              download="saxon_scout_matches.csv"
                              className="saxon-btn-outline"
                            >
                              <i className="fa fa-download mr-2"></i>
                              Download CSV
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pit Data Export */}
                <div className="saxon-card bg-saxon-gold-light">
                  <div className="saxon-card-body">
                    <div className="text-center mb-6">
                      <div className="saxon-module-icon text-4xl mx-auto mb-4">
                        <i className="fa fa-robot"></i>
                      </div>
                      <h3 className="font-bold text-saxon-black mb-2">PIT DATA EXPORT</h3>
                      <p className="text-saxon-gold-dark">Export pit scouting data as ZIP</p>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-xl border-2 border-saxon-gold">
                        <h4 className="font-bold text-saxon-black mb-2">Export Format:</h4>
                        <ul className="text-sm text-saxon-gold-dark space-y-1">
                          <li>• Robot capabilities and drivetrain</li>
                          <li>• Autonomous paths and preferred zones</li>
                          <li>• Cycle time estimates and climb ability</li>
                          <li>• Strategic notes and observations</li>
                        </ul>
                      </div>

                      <button
                        className="saxon-btn w-full text-lg py-4"
                        onClick={this.exportPit}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <i className="fa fa-spinner fa-spin mr-3"></i>
                            PROCESSING...
                          </>
                        ) : (
                          <>
                            <i className="fa fa-download mr-3"></i>
                            EXPORT PIT DATA
                          </>
                        )}
                      </button>

                      {pitUrl && (
                        <div className="saxon-alert saxon-alert-success">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <i className="fa fa-check-circle mr-4 text-2xl"></i>
                              <div>
                                <strong>Export Ready:</strong> Pit data has been processed
                              </div>
                            </div>
                            <a
                              href={pitUrl}
                              download="saxon_scout_pit.zip"
                              className="saxon-btn-outline"
                            >
                              <i className="fa fa-download mr-2"></i>
                              Download ZIP
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Instructions */}
              <div className="saxon-card bg-saxon-gold-light mt-6">
                <div className="saxon-card-body">
                  <h3 className="font-bold text-saxon-black mb-4">
                    <i className="fa fa-info-circle mr-2"></i>
                    EXPORT INSTRUCTIONS
                  </h3>
                  <div className="saxon-grid-2">
                    <div>
                      <h4 className="font-bold text-saxon-black mb-2">Match Data (CSV)</h4>
                      <ul className="text-sm text-saxon-gold-dark space-y-1">
                        <li>• Compatible with Excel and Google Sheets</li>
                        <li>• Includes all match scoring data</li>
                        <li>• Perfect for statistical analysis</li>
                        <li>• Can be imported into other tools</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-saxon-black mb-2">Pit Data (ZIP)</h4>
                      <ul className="text-sm text-saxon-gold-dark space-y-1">
                        <li>• Contains individual JSON files</li>
                        <li>• Includes summary CSV for analysis</li>
                        <li>• Preserves all detailed information</li>
                        <li>• Easy to share with alliance partners</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Saxon Footer */}
            <div className="saxon-card-footer">
              <div className="flex justify-between items-center">
                <div className="text-sm text-saxon-gold-dark">
                  <strong>SUPPLY LOGISTICS MODULE</strong> • Team 611 Saxon Robotics
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