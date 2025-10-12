// @ts-nocheck
import * as Inferno from 'inferno';
import { Component } from 'inferno';
import type { DirHandle } from '../lib/fsStore';
import JSZip from 'jszip';

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
  const out: Array<{ name: string; obj: any; text: string }> = [];
  try {
    const dir = await root.getDirectoryHandle(subdir);
    // @ts-ignore
    for await (const [name, handle] of dir.entries()) {
      if (!name.endsWith('.json')) continue;
      const file = await (handle as FileSystemFileHandle).getFile();
      const text = await file.text();
      let obj: any = undefined;
      try {
        obj = JSON.parse(text);
      } catch (e) {
        console.warn('Failed to parse', name);
      }
      out.push({ name, obj, text });
    }
  } catch (err) {
    console.error('Error reading files from', subdir, err);
  }
  return out;
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
    this.setState({ error: null, loading: true });
    const { root } = this.props;
    if (!root) {
      this.setState({ error: 'Pick a data folder first', loading: false });
      return;
    }
    try {
      const files = await readJsonFiles(root, 'matches');
      if (!files.length) {
        this.setState({ error: 'No matches to export', loading: false });
        return;
      }

      const headers = [
        'team', 'game', 'alliance', 'time', 'scouter', 
        'auto_scored', 'auto_missed', 'mobility', 
        'tele_cycles', 'tele_scored', 'tele_missed', 
        'fouls', 'endgame_state', 'comments'
      ];
      const rows = [headers.join(',')];

      files.forEach(({ obj }) => {
        if (!obj) return;
        const team = obj.team ?? '';
        const game = obj.game ?? '';
        const alliance = obj.alliance ?? '';
        const time = obj.time ?? '';
        const scouter = obj.scouter ?? '';
        const auto_scored = obj.phase?.auto?.scored ?? '';
        const auto_missed = obj.phase?.auto?.missed ?? '';
        const mobility = obj.phase?.auto?.mobility ? 'Y' : 'N';
        const tele_cycles = obj.phase?.teleop?.cycles ?? '';
        const tele_scored = obj.phase?.teleop?.scored ?? '';
        const tele_missed = obj.phase?.teleop?.missed ?? '';
        const fouls = obj.fouls ?? '';
        const endgame_state = 
          obj.endgame?.climb && obj.endgame.climb !== 'none' 
            ? obj.endgame.climb 
            : obj.endgame?.park 
            ? 'park' 
            : 'none';
        const comments = obj.comments ? '"' + obj.comments.replace(/"/g, '""') + '"' : '';
        
        rows.push([
          team, game, alliance, time, scouter, 
          auto_scored, auto_missed, mobility, 
          tele_cycles, tele_scored, tele_missed, 
          fouls, endgame_state, comments
        ].join(','));
      });

      const csv = rows.join('\n');
      const zip = new JSZip();
      
      files.forEach(({ name, text }) => {
        zip.file('matches/' + name, text);
      });
      zip.file('matches.csv', csv);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      this.setState({ matchUrl: url, loading: false });
    } catch (err) {
      console.error(err);
      this.setState({ error: 'Failed to export matches', loading: false });
    }
  }

  exportPit = async () => {
    this.setState({ error: null, loading: true });
    const { root } = this.props;
    if (!root) {
      this.setState({ error: 'Pick a data folder first', loading: false });
      return;
    }
    try {
      const files = await readJsonFiles(root, 'pit');
      if (!files.length) {
        this.setState({ error: 'No pit data to export', loading: false });
        return;
      }

      const headers = ['team', 'drivetrain', 'autoPaths', 'preferredZones', 'cycleTimeEst', 'climb', 'notes', 'scouter', 'time'];
      const rows = [headers.join(',')];

      files.forEach(({ obj }) => {
        if (!obj) return;
        const team = obj.team ?? '';
        const drivetrain = obj.drivetrain ?? '';
        const autoPaths = Array.isArray(obj.autoPaths) ? obj.autoPaths.join('|') : '';
        const zones = Array.isArray(obj.preferredZones) ? obj.preferredZones.join('|') : '';
        const cycle = obj.cycleTimeEst ?? '';
        const climb = obj.climb ? 'Y' : 'N';
        let notes = obj.notes ?? '';
        notes = notes ? '"' + notes.replace(/"/g, '""') + '"' : '';
        const scouter = obj.scouter ?? '';
        const time = obj.time ?? '';
        
        rows.push([team, drivetrain, autoPaths, zones, cycle, climb, notes, scouter, time].join(','));
      });

      const csv = rows.join('\n');
      const zip = new JSZip();
      
      files.forEach(({ name, text }) => {
        zip.file('pit/' + name, text);
      });
      zip.file('pit.csv', csv);

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
      <div className="card-modern card">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h4 className="mb-1 fw-bold">
                <i className="fa fa-file-archive me-2 text-warning"></i>
                Export Data
              </h4>
              <p className="text-muted mb-0 small">Download your scouting data for analysis and sharing</p>
            </div>
            <button className="btn btn-outline-secondary" onClick={navigateHome}>
              <i className="fa fa-arrow-left me-2"></i>
              Back
            </button>
          </div>

          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" role="alert">
              <i className="fa fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          <div className="row g-3">
            <div className="col-md-6">
              <div className="card h-100 border-primary" style={{ borderTopWidth: '3px', borderTopStyle: 'solid' }}>
                <div className="card-body d-flex flex-column">
                  <div className="d-flex align-items-center mb-3">
                    <div 
                      className="export-icon-wrapper bg-primary bg-opacity-10 text-primary me-3"
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.75rem'
                      }}
                    >
                      <i className="fa fa-gamepad"></i>
                    </div>
                    <div>
                      <h5 className="mb-0 fw-bold">Match Data</h5>
                      <small className="text-muted">All scouted match records</small>
                    </div>
                  </div>
                  <p className="small text-muted mb-3">
                    Export all match scouting data including autonomous, teleop, endgame scores, and more. Includes both JSON files and a CSV summary for spreadsheet analysis.
                  </p>
                  <div className="mt-auto">
                    {!matchUrl ? (
                      <button
                        className="btn btn-primary w-100"
                        onClick={this.exportMatches}
                        disabled={loading}
                      >
                        <i className="fa fa-file-archive me-2"></i>
                        {loading ? 'Generating...' : 'Generate Match Export'}
                      </button>
                    ) : (
                      <div className="d-grid gap-2">
                        <a
                          className="btn btn-success w-100"
                          href={matchUrl}
                          download="matches_export.zip"
                        >
                          <i className="fa fa-download me-2"></i>
                          Download Matches ZIP
                        </a>
                        <button
                          className="btn btn-outline-primary btn-sm w-100"
                          onClick={() => this.setState({ matchUrl: null })}
                        >
                          <i className="fa fa-redo me-2"></i>
                          Generate New Export
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card h-100 border-success" style={{ borderTopWidth: '3px', borderTopStyle: 'solid', borderTopColor: '#28a745' }}>
                <div className="card-body d-flex flex-column">
                  <div className="d-flex align-items-center mb-3">
                    <div 
                      className="export-icon-wrapper bg-success bg-opacity-10 text-success me-3"
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.75rem'
                      }}
                    >
                      <i className="fa fa-tools"></i>
                    </div>
                    <div>
                      <h5 className="mb-0 fw-bold">Pit Data</h5>
                      <small className="text-muted">Robot capability records</small>
                    </div>
                  </div>
                  <p className="small text-muted mb-3">
                    Export all pit scouting data including drivetrain types, autonomous paths, preferred zones, and robot capabilities. Includes both JSON files and a CSV summary.
                  </p>
                  <div className="mt-auto">
                    {!pitUrl ? (
                      <button
                        className="btn btn-success w-100"
                        onClick={this.exportPit}
                        disabled={loading}
                      >
                        <i className="fa fa-file-archive me-2"></i>
                        {loading ? 'Generating...' : 'Generate Pit Export'}
                      </button>
                    ) : (
                      <div className="d-grid gap-2">
                        <a
                          className="btn btn-success w-100"
                          href={pitUrl}
                          download="pit_export.zip"
                        >
                          <i className="fa fa-download me-2"></i>
                          Download Pit ZIP
                        </a>
                        <button
                          className="btn btn-outline-success btn-sm w-100"
                          onClick={() => this.setState({ pitUrl: null })}
                        >
                          <i className="fa fa-redo me-2"></i>
                          Generate New Export
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="alert alert-info mt-4 d-flex align-items-start gap-2">
            <i className="fa fa-info-circle mt-1"></i>
            <div className="small">
              <strong>Export Format:</strong> Each export contains a ZIP file with:
              <ul className="mb-0 mt-2">
                <li>Individual JSON files for each record</li>
                <li>A consolidated CSV file for spreadsheet analysis</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
}