// @ts-nocheck
import * as Inferno from 'inferno';
import { useState } from '../lib/inferno-hooks-shim';
import type { DirHandle } from '../lib/fsStore';
import { writeJSON } from '../lib/fsStore';

interface PitScoutProps {
  root: DirHandle | null;
  scouter: string;
  navigateHome: () => void;
}

/**
 * PitScout collects robot capability information from the pit. A series of
 * toggles and selects allow the scouter to record drivetrain, autonomous
 * capabilities, preferred zones, climb ability and notes. Records are
 * persisted to the local `pit` folder.
 */
export default function PitScout({ root, scouter, navigateHome }: PitScoutProps) {
  const [team, setTeam] = useState<number>(0);
  const [drivetrain, setDrivetrain] = useState('Tank');
  const [autoPaths, setAutoPaths] = useState<string[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [cycleTime, setCycleTime] = useState<number | null>(null);
  const [canClimb, setCanClimb] = useState(false);
  const [notes, setNotes] = useState('');

  const driveOptions = ['Tank', 'Mecanum', 'Swerve', 'Other'];
  const autoOptions = ['Two Piece Auto', 'Three Piece Auto', 'Mobility Only', 'Other'];
  const zoneOptions = ['Near Zone', 'Far Zone', 'Loading Zone', 'Mid Zone'];

  function toggleArray(item: string, arr: string[], setter: (a: string[]) => void) {
    if (arr.includes(item)) setter(arr.filter(x => x !== item));
    else setter([...arr, item]);
  }

  async function save() {
    if (!root) return alert('Pick a data folder first');
    if (!scouter) return alert('Please login before saving');
    if (!team) return alert('Team number required');
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
    try {
      await writeJSON(root, `pit/${filename}`, record);
      await fetch('/api/log/file-created', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, filepath: 'pit/' + filename, name: scouter || 'unknown' })
      });
      alert('Pit scouting saved');
      // Reset form
      setDrivetrain('Tank');
      setAutoPaths([]);
      setZones([]);
      setCycleTime(null);
      setCanClimb(false);
      setNotes('');
      setTeam(0);
    } catch (err) {
      console.error(err);
      alert('Failed to save pit scouting');
    }
  }

  return (
    <div className="card-modern card">
      <div className="card-body">
        <h5 className="card-title">Pit Scout</h5>
        <div className="mb-3">
          <label className="form-label">Team Number</label>
          <input type="number" className="form-control" value={team || ''} onInput={(e: any) => setTeam(parseInt(e.target.value || '0'))} />
        </div>
        <div className="mb-3">
          <label className="form-label">Drivetrain</label>
          <select className="form-select" value={drivetrain} onChange={(e: any) => setDrivetrain(e.target.value)}>
            {driveOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Auto Paths</label>
          <div className="d-flex flex-wrap gap-2">
            {autoOptions.map(opt => (
              <label key={opt} className="form-check form-check-inline">
                <input aria-label={`auto path ${opt}`} type="checkbox" className="form-check-input" checked={autoPaths.includes(opt)} onChange={() => toggleArray(opt, autoPaths, setAutoPaths)} />
                <span className="form-check-label ms-1">{opt}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label">Preferred Zones</label>
          <div className="d-flex flex-wrap gap-2">
            {zoneOptions.map(opt => (
              <label key={opt} className="form-check">
                <input type="checkbox" className="form-check-input" checked={zones.includes(opt)} onChange={() => toggleArray(opt, zones, setZones)} />
                {opt}
              </label>
            ))}
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label">Cycle Time Estimate (s)</label>
          <input type="number" className="form-control" value={cycleTime ?? ''} onInput={(e: any) => setCycleTime(e.target.value ? parseInt(e.target.value) : null)} />
        </div>
        <div className="mb-3 form-check">
          <input type="checkbox" className="form-check-input" id="climbCheck" checked={canClimb} onChange={(e: any) => setCanClimb(e.target.checked)} />
          <label className="form-check-label" htmlFor="climbCheck">Can Climb</label>
        </div>
        <div className="mb-3">
          <label className="form-label">Notes</label>
          <textarea className="form-control" rows={3} value={notes} onInput={(e: any) => setNotes(e.target.value)}></textarea>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-success" onClick={save}>Save Pit Data</button>
          <button className="btn btn-secondary" onClick={navigateHome}>Back</button>
        </div>
      </div>
    </div>
  );
}
