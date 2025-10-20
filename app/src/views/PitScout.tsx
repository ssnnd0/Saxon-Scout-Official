import React, { Component } from 'react';
import { writeJSON } from '../lib/fsStore';
import type { DirHandle } from '../lib/fsStore';
import { spacing } from '../styles/tokens';

interface PitScoutProps {
  root: DirHandle | null;
  scouter: string;
  navigateHome: () => void;
}

interface PitScoutState {
  team: number;
  drivetrain: string;
  autoPaths: string[];
  zones: string[];
  cycleTime: number | null;
  canClimb: boolean;
  notes: string;
  saving: boolean;
  saveMessage: string | null;
}

export default class PitScout extends Component<PitScoutProps, PitScoutState> {
  constructor(props: PitScoutProps) {
    super(props);
    this.state = {
      team: 0,
      drivetrain: '',
      autoPaths: [],
      zones: [],
      cycleTime: null,
      canClimb: false,
      notes: '',
      saving: false,
      saveMessage: null
    };
  }

  driveOptions = ['Tank', 'Mecanum', 'Swerve', 'Other'];
  autoOptions = ['Two Piece Auto', 'Three Piece Auto', 'Mobility Only', 'Other'];
  zoneOptions = ['Near Zone', 'Far Zone', 'Loading Zone', 'Mid Zone'];

  toggleArray = (item: string, arr: string[]) => {
    if (arr.includes(item)) {
      return arr.filter(i => i !== item);
    } else {
      return [...arr, item];
    }
  }

  handleTeamChange = (e: any) => {
    this.setState({ team: parseInt(e.target.value) || 0 });
  }

  handleDrivetrainChange = (e: any) => {
    this.setState({ drivetrain: e.target.value });
  }

  handleAutoPathToggle = (path: string) => {
    this.setState(prevState => ({
      autoPaths: this.toggleArray(path, prevState.autoPaths)
    }));
  }

  handleZoneToggle = (zone: string) => {
    this.setState(prevState => ({
      zones: this.toggleArray(zone, prevState.zones)
    }));
  }

  handleCycleTimeChange = (e: any) => {
    this.setState({ cycleTime: e.target.value ? parseInt(e.target.value) : null });
  }

  handleClimbChange = (e: any) => {
    this.setState({ canClimb: e.target.checked });
  }

  handleNotesChange = (e: any) => {
    this.setState({ notes: e.target.value });
  }

  save = async () => {
    const { root, scouter } = this.props;
    const { team, drivetrain, autoPaths, zones, cycleTime, canClimb, notes } = this.state;

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

    this.setState({ saving: true });

    try {
      const now = new Date();
      const isoForFilename = now.toISOString().replace(/[:.]/g, '');
      const filename = `team-${team}__pit__time-${isoForFilename}.json`;

      const record = {
        team,
        drivetrain,
        autoPaths,
        zones,
        cycleTime,
        canClimb,
        notes,
        scouter,
        time: now.toISOString()
      };

      // Server-first approach: Try to save to server first
      try {
        const serverResponse = await fetch('/api/scouting/pit', {
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
          await writeJSON(root, `pit/${filename}`, record);
          console.log('Data also saved locally as backup');
        } catch (localError) {
          console.warn('Local backup save failed:', localError);
        }
      } catch (serverError) {
        console.warn('Server save failed, falling back to local storage:', serverError);
        
        // Fallback to local storage only if server is unavailable
        await writeJSON(root, `pit/${filename}`, record);
        console.log('Data saved locally (server unavailable)');
      }
      
      // Log file creation (non-blocking)
      fetch('/api/log/file-created', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, filepath: 'pit/' + filename, name: scouter || 'unknown' })
      }).catch(err => console.warn('Failed to log file creation:', err));

      // Inline success message already shown via saveMessage state
      this.setState({ 
        saveMessage: 'Pit scouting data saved successfully!',
        saving: false 
      });
      
      setTimeout(() => {
        this.setState({ saveMessage: null });
      }, 3000);
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save pit scouting data. Please try again.');
      this.setState({ saving: false });
    }
  }

  render() {
    const { navigateHome } = this.props;
    const { team, drivetrain, autoPaths, zones, cycleTime, canClimb, notes, saving, saveMessage } = this.state;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className={`max-w-7xl mx-auto px-${spacing.lg} py-${spacing.xl}`}>
          <div className={`bg-white shadow-lg rounded-${spacing.sm} overflow-hidden`}>
            {/* Header Section */}
            <div className={`px-${spacing.xl} py-${spacing.lg} border-b border-gray-200`}>
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-${spacing.xl} items-center`}>
                <div className={`flex items-center space-x-${spacing.lg}`}>
                  <div className={`bg-saxon-gold p-${spacing.md} rounded-${spacing.xs} text-white`}>
                    <i className="fa fa-clipboard-list text-4xl"></i>
                  </div>
                  <div>
                    <h1 className={`text-4xl font-black text-saxon-black`}>Pit Scouting</h1>
                    <div className={`flex space-x-${spacing.md} mt-${spacing.md}`}>
                      <span className={`bg-saxon-gold text-white text-lg px-${spacing.lg} py-${spacing.xs} rounded-${spacing.xs}`}>
                        Team {team || '###'}
                      </span>
                      <span className={`border border-saxon-gold text-saxon-gold text-lg px-${spacing.lg} py-${spacing.xs} rounded-${spacing.xs}`}>
                        Scouter: {this.props.scouter}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={`bg-saxon-gold-light p-${spacing.md} rounded-${spacing.xs} shadow-sm`}>
                  <div className={`text-center`}>
                    <div className={`text-2xl font-bold text-saxon-black mb-${spacing.xs}`}>
                      Pit Scouting Notes
                    </div>
                    <div className={`text-sm text-saxon-gold-dark`}>
                      Record your observations about the robot
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className={`p-${spacing.xl}`}>
              {/* Team Selection */}
              <div className={`bg-gray-50 p-${spacing.lg} rounded-${spacing.xs} mb-${spacing.xl}`}>
                <h2 className={`text-xl font-bold text-saxon-black mb-${spacing.lg}`}>Team Information</h2>
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-${spacing.lg}`}>
                  <div className="space-y-2">
                    <label className={`block text-sm font-medium text-gray-700 flex items-center`}>
                      <i className={`fa fa-users mr-${spacing.sm}`}></i>
                      <span>Team Number</span>
                    </label>
                    <input
                      type="number"
                      className={`w-full px-${spacing.sm} py-${spacing.xs} border border-gray-300 rounded-${spacing.xs} focus:ring-2 focus:ring-saxon-gold focus:border-saxon-gold`}
                      value={team || ''}
                      onChange={(e) => this.setState({ team: parseInt(e.target.value) || 0 })}
                      placeholder="Enter team number"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`block text-sm font-medium text-gray-700 flex items-center`}>
                      <i className={`fa fa-user mr-${spacing.sm}`}></i>
                      <span>Scouter Name</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full px-${spacing.sm} py-${spacing.xs} border border-gray-300 rounded-${spacing.xs} focus:ring-2 focus:ring-saxon-gold focus:border-saxon-gold`}
                      value={this.props.scouter}
                      readOnly
                      placeholder="Your name"
                    />
                  </div>
                </div>
              </div>

              {/* Drivetrain Selection */}
              <div className={`bg-white p-${spacing.lg} rounded-${spacing.xs} shadow-sm mb-${spacing.xl}`}>
                <h2 className={`text-xl font-bold text-saxon-black mb-${spacing.lg}`}>Robot Specifications</h2>
                <div className={`space-y-${spacing.md}`}>
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-${spacing.sm}`}>
                      Drivetrain Type
                    </label>
                    <div className={`grid grid-cols-2 md:grid-cols-4 gap-${spacing.sm}`}>
                      {this.driveOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`px-${spacing.sm} py-${spacing.xs} rounded-${spacing.xs} text-center border ${
                            drivetrain === option
                              ? 'bg-saxon-gold text-white border-saxon-gold'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={() => this.handleDrivetrainChange({ target: { value: option } })}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auto Paths */}
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-${spacing.sm}`}>
                      Auto Paths
                    </label>
                    <div className={`grid grid-cols-2 md:grid-cols-4 gap-${spacing.sm}`}>
                      {this.autoOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`px-${spacing.sm} py-${spacing.xs} rounded-${spacing.xs} text-center border ${
                            autoPaths.includes(option)
                              ? 'bg-saxon-gold text-white border-saxon-gold'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={() => this.handleAutoPathToggle(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scoring Zones */}
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-${spacing.sm}`}>
                      Scoring Zones
                    </label>
                    <div className={`grid grid-cols-2 md:grid-cols-4 gap-${spacing.sm}`}>
                      {this.zoneOptions.map((zone) => (
                        <button
                          key={zone}
                          type="button"
                          className={`px-${spacing.sm} py-${spacing.xs} rounded-${spacing.xs} text-center border ${
                            zones.includes(zone)
                              ? 'bg-saxon-gold text-white border-saxon-gold'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={() => this.handleZoneToggle(zone)}
                        >
                          {zone}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cycle Time and Climb */}
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-${spacing.lg}`}>
                    <div className="space-y-2">
                      <label className={`block text-sm font-medium text-gray-700`}>
                        Average Cycle Time (seconds)
                      </label>
                      <input
                        type="number"
                        className={`w-full px-${spacing.sm} py-${spacing.xs} border border-gray-300 rounded-${spacing.xs} focus:ring-2 focus:ring-saxon-gold focus:border-saxon-gold`}
                        value={cycleTime || ''}
                        onChange={this.handleCycleTimeChange}
                        placeholder="e.g. 5"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="canClimb"
                        checked={canClimb}
                        onChange={this.handleClimbChange}
                        className={`h-5 w-5 rounded border-gray-300 text-saxon-gold focus:ring-saxon-gold`}
                      />
                      <label htmlFor="canClimb" className={`text-sm font-medium text-gray-700`}>
                        Can Climb
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className={`bg-white p-${spacing.lg} rounded-${spacing.xs} shadow-sm mb-${spacing.xl}`}>
                <h2 className={`text-xl font-bold text-saxon-black mb-${spacing.md}`}>Additional Notes</h2>
                <textarea
                  className={`w-full px-${spacing.sm} py-${spacing.sm} border border-gray-300 rounded-${spacing.xs} focus:ring-2 focus:ring-saxon-gold focus:border-saxon-gold min-h-40`}
                  value={notes}
                  onChange={this.handleNotesChange}
                  placeholder="Enter any additional notes about the robot, strategy, or observations..."
                />
              </div>

              {/* Action Buttons */}
              <div className={`flex justify-between items-center`}>
                <button
                  type="button"
                  onClick={navigateHome}
                  className={`px-${spacing.lg} py-${spacing.xs} border border-gray-300 rounded-${spacing.xs} text-gray-700 hover:bg-gray-50 flex items-center`}
                >
                  <i className={`fa fa-arrow-left mr-${spacing.sm}`}></i>
                  <span>Back to Home</span>
                </button>
                
                <div className={`flex items-center space-x-${spacing.md}`}>
                  {saveMessage && (
                    <span className={`text-sm ${saveMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                      {saveMessage}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={this.save}
                    disabled={saving || !team}
                    className={`px-${spacing.lg} py-${spacing.xs} bg-saxon-gold text-white rounded-${spacing.xs} hover:bg-saxon-gold-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
                  >
                    {saving ? (
                      <>
                        <i className="fa fa-spinner fa-spin mr-2"></i>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <i className={`fa fa-save mr-${spacing.sm}`}></i>
                        <span>Save Data</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className={`mt-${spacing.xl} pt-${spacing.md} border-t border-gray-200`}>
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className={`text-sm text-saxon-gold-dark mb-2 md:mb-0`}>
                    <strong>Pit Scouting Module</strong> • Team 611 Saxon Robotics
                  </div>
                  <div className={`text-sm text-saxon-black`}>
                    FRC 2025 REEFSCAPE • {new Date().getFullYear()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}