// @ts-nocheck
import * as Inferno from 'inferno';
import { Component } from 'inferno';
import type { DirHandle } from '../lib/fsStore';
import { writeJSON } from '../lib/fsStore';

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
      drivetrain: 'Tank',
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
      return arr.filter(x => x !== item);
    }
    return [...arr, item];
  }

  handleTeamChange = (e: any) => {
    this.setState({ team: parseInt(e.target.value || '0') });
  }

  handleDrivetrainChange = (e: any) => {
    this.setState({ drivetrain: e.target.value });
  }

  handleAutoPathToggle = (path: string) => {
    const updated = this.toggleArray(path, this.state.autoPaths);
    this.setState({ autoPaths: updated });
  }

  handleZoneToggle = (zone: string) => {
    const updated = this.toggleArray(zone, this.state.zones);
    this.setState({ zones: updated });
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
      alert('Pick a data folder first');
      return;
    }
    if (!scouter) {
      alert('Please login before saving');
      return;
    }
    if (!team) {
      alert('Team number required');
      return;
    }

    this.setState({ saving: true, saveMessage: null });

    try {
      const now = new Date();
      const isoName = now.toISOString().replace(/[:.]/g, '');
      const filename = `team-${team}__pit__time-${isoName}.json`;
      const record = {
        team,
        drivetrain,
        autoPaths,
        preferredZones: zones,
        cycleTimeEst: cycleTime,
        climb: canClimb,
        notes,
        scouter,
        time: now.toISOString()
      };

      await writeJSON(root, `pit/${filename}`, record);
      await fetch('/api/log/file-created', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, filepath: 'pit/' + filename, name: scouter || 'unknown' })
      });

      this.setState({
        saving: false,
        saveMessage: 'Pit scouting saved successfully!',
        team: 0,
        drivetrain: 'Tank',
        autoPaths: [],
        zones: [],
        cycleTime: null,
        canClimb: false,
        notes: ''
      });

      setTimeout(() => {
        this.setState({ saveMessage: null });
      }, 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to save pit scouting');
      this.setState({ saving: false });
    }
  }

  render() {
    const { navigateHome } = this.props;
    const { team, drivetrain, autoPaths, zones, cycleTime, canClimb, notes, saving, saveMessage } = this.state;

    return (
      <div className="card-modern card">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h4 className="mb-1 fw-bold">
                <i className="fa fa-tools me-2 text-info"></i>
                Pit Scout
              </h4>
              <p className="text-muted mb-0 small">Record robot capabilities and pit observations</p>
            </div>
            <button className="btn btn-outline-secondary" onClick={navigateHome}>
              <i className="fa fa-arrow-left me-2"></i>
              Back
            </button>
          </div>

          {saveMessage && (
            <div className="alert alert-success d-flex align-items-center gap-2 mb-3">
              <i className="fa fa-check-circle"></i>
              <span>{saveMessage}</span>
            </div>
          )}

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                <i className="fa fa-hashtag me-2 text-primary"></i>
                Team Number
              </label>
              <input
                type="number"
                className="form-control form-control-lg"
                value={team || ''}
                onInput={this.handleTeamChange}
                placeholder="Enter team number"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">
                <i className="fa fa-cogs me-2 text-primary"></i>
                Drivetrain Type
              </label>
              <select
                className="form-select form-select-lg"
                value={drivetrain}
                onChange={this.handleDrivetrainChange}
              >
                {this.driveOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">
                <i className="fa fa-route me-2 text-success"></i>
                Autonomous Capabilities
              </label>
              <div className="d-flex flex-wrap gap-2">
                {this.autoOptions.map(opt => (
                  <div key={opt} className="form-check form-check-pill">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id={`auto-${opt}`}
                      checked={autoPaths.includes(opt)}
                      onChange={() => this.handleAutoPathToggle(opt)}
                    />
                    <label className="form-check-label" htmlFor={`auto-${opt}`}>
                      {opt}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">
                <i className="fa fa-map-marked-alt me-2 text-info"></i>
                Preferred Zones
              </label>
              <div className="d-flex flex-wrap gap-2">
                {this.zoneOptions.map(opt => (
                  <div key={opt} className="form-check form-check-pill">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id={`zone-${opt}`}
                      checked={zones.includes(opt)}
                      onChange={() => this.handleZoneToggle(opt)}
                    />
                    <label className="form-check-label" htmlFor={`zone-${opt}`}>
                      {opt}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">
                <i className="fa fa-clock me-2 text-warning"></i>
                Cycle Time Estimate (seconds)
              </label>
              <input
                type="number"
                className="form-control"
                value={cycleTime ?? ''}
                onInput={this.handleCycleTimeChange}
                placeholder="e.g., 8"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">
                <i className="fa fa-mountain me-2 text-danger"></i>
                Climbing Capability
              </label>
              <div className="form-check form-switch" style={{ paddingTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="climbCheck"
                  checked={canClimb}
                  onChange={this.handleClimbChange}
                  style={{ width: '3rem', height: '1.5rem' }}
                />
                <label className="form-check-label ms-2" htmlFor="climbCheck">
                  {canClimb ? 'Can Climb' : 'Cannot Climb'}
                </label>
              </div>
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">
                <i className="fa fa-sticky-note me-2 text-secondary"></i>
                Additional Notes
              </label>
              <textarea
                className="form-control"
                rows={4}
                value={notes}
                onInput={this.handleNotesChange}
                placeholder="Record observations, strengths, weaknesses, or any other relevant information..."
              ></textarea>
            </div>
          </div>

          <div className="d-grid gap-2 mt-4">
            <button
              className="btn btn-success btn-lg"
              onClick={this.save}
              disabled={saving}
            >
              <i className="fa fa-save me-2"></i>
              {saving ? 'Saving...' : 'Save Pit Scouting Data'}
            </button>
          </div>
        </div>
      </div>
    );
  }
}