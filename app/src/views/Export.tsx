// @ts-nocheck
import * as Inferno from 'inferno';
import { useState } from '../lib/inferno-hooks-shim';
import type { DirHandle } from '../lib/fsStore';
import JSZip from 'jszip';

interface ExportProps {
  root: DirHandle | null;
  navigateHome: () => void;
}

// Helper to read all JSON files from a subdirectory, returning file name,
// parsed object and text. If parsing fails, obj will be undefined.
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
      try { obj = JSON.parse(text); } catch {}
      out.push({ name, obj, text });
    }
  } catch (err) {
    console.error(err);
  }
  return out;
}

export default function Export({ root, navigateHome }: ExportProps) {
  const [matchUrl, setMatchUrl] = useState<string | null>(null);
  const [pitUrl, setPitUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function exportMatches() {
    setError(null);
    if (!root) return setError('Pick a data folder first');
    try {
      const files = await readJsonFiles(root, 'matches');
      if (!files.length) return setError('No matches to export');
      // Compose CSV header and rows
      const headers = ['team','game','alliance','time','scouter','auto_scored','auto_missed','mobility','tele_cycles','tele_scored','tele_missed','fouls','endgame_state','comments'];
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
        const endgame_state = obj.endgame?.climb && obj.endgame.climb !== 'none' ? obj.endgame.climb : obj.endgame?.park ? 'park' : 'none';
        const comments = obj.comments ? '"' + obj.comments.replace(/"/g, '""') + '"' : '';
        rows.push([team,game,alliance,time,scouter,auto_scored,auto_missed,mobility,tele_cycles,tele_scored,tele_missed,fouls,endgame_state,comments].join(','));
      });
      const csv = rows.join('\n');
      // Build zip
      const zip = new JSZip();
      files.forEach(({ name, text }) => {
        zip.file('matches/' + name, text);
      });
      zip.file('matches.csv', csv);
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      setMatchUrl(url);
    } catch (err) {
      console.error(err);
      setError('Failed to export matches');
    }
  }

  async function exportPit() {
    setError(null);
    if (!root) return setError('Pick a data folder first');
    try {
      const files = await readJsonFiles(root, 'pit');
      if (!files.length) return setError('No pit data to export');
      // CSV header and rows
      const headers = ['team','drivetrain','autoPaths','preferredZones','cycleTimeEst','climb','notes','scouter','time'];
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
        rows.push([team,drivetrain,autoPaths,zones,cycle,climb,notes,scouter,time].join(','));
      });
      const csv = rows.join('\n');
      const zip = new JSZip();
      files.forEach(({ name, text }) => {
        zip.file('pit/' + name, text);
      });
      zip.file('pit.csv', csv);
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      setPitUrl(url);
    } catch (err) {
      console.error(err);
      setError('Failed to export pit data');
    }
  }

  return (
    <div className="card-modern card">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h4 className="mb-1 fw-bold">Export Data</h4>
            <p className="text-muted mb-0 small">Download your scouting data for analysis and sharing</p>
          </div>
          <button className="btn btn-outline-secondary" onClick={navigateHome}>
            <i className="fa fa-arrow-left me-2"></i>
            Back
          </button>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
            <i className="fa fa-exclamation-circle"></i>
            <span>{error}</span>
          </div>
        )}

        <div className="row g-3">
          <div className="col-md-6">
            <div className="card h-100 border-primary">
              <div className="card-body d-flex flex-column">
                <div className="d-flex align-items-center mb-3">
                  <div className="export-icon-wrapper bg-primary bg-opacity-10 text-primary me-3">
                    <i className="fa fa-gamepad"></i>
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold">Match Data</h5>
                    <small className="text-muted">All scouted match records</small>
                  </div>
                </div>
                <p className="small text-muted mb-3">
                  Export all match scouting data including autonomous, teleop, endgame scores, and more. Includes both JSON files and a CSV summary.
                </p>
                <div className="mt-auto">
                  {!matchUrl ? (
                    <button
                      aria-label="export matches"
                      className="btn btn-primary w-100"
                      onClick={exportMatches}
                    >
                      <i className="fa fa-file-archive me-2"></i>
                      Generate Match Export
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
                        onClick={() => setMatchUrl(null)}
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
            <div className="card h-100 border-success">
              <div className="card-body d-flex flex-column">
                <div className="d-flex align-items-center mb-3">
                  <div className="export-icon-wrapper bg-success bg-opacity-10 text-success me-3">
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
                      aria-label="export pit data"
                      className="btn btn-success w-100"
                      onClick={exportPit}
                    >
                      <i className="fa fa-file-archive me-2"></i>
                      Generate Pit Export
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
                        onClick={() => setPitUrl(null)}
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
