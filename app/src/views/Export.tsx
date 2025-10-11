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
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">Export Data</h5>
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="mb-3 d-grid gap-2">
          <button className="btn btn-primary" onClick={exportMatches}>Export Matches (ZIP)</button>
          {matchUrl && <a className="btn btn-outline-primary" href={matchUrl} download="matches_export.zip">Download Matches ZIP</a>}
          <button className="btn btn-success" onClick={exportPit}>Export Pit Data (ZIP)</button>
          {pitUrl && <a className="btn btn-outline-success" href={pitUrl} download="pit_export.zip">Download Pit ZIP</a>}
          <button className="btn btn-secondary" onClick={navigateHome}>Back</button>
        </div>
      </div>
    </div>
  );
}
