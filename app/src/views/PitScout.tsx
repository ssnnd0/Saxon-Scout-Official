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
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h4 className="mb-1 fw-bold">Pit Scout</h4>
            <p className="text-muted mb-0 small">Record robot capabilities and pit observations</p>
          </div>
          <button className="btn btn-outline-secondary" onClick={navigateHome}>
            <i className="fa fa-arrow-left me-2"></i>
            Back
          </button>
        </div>

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
              onInput={(e: any) => setTeam(parseInt(e.target.value || '0'))}
              placeholder="Enter team number"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">
              <i className="fa fa-cogs me-2 text-primary"></i>
              Drivetrain Type
            </label>
            <select className="form-select form-select-lg" value={drivetrain} onChange={(e: any) => setDrivetrain(e.target.value)}>
              {driveOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold">
              <i className="fa fa-route me-2 text-success"></i>
              Autonomous Capabilities
            </label>
            <div className="d-flex flex-wrap gap-2">
              {autoOptions.map(opt => (
                <div key={opt} className="form-check form-check-pill">
                  <input
                    aria-label={`auto path ${opt}`}
                    type="checkbox"
                    className="form-check-input"
                    id={`auto-${opt}`}
                    checked={autoPaths.includes(opt)}
                    onChange={() => toggleArray(opt, autoPaths, setAutoPaths)}
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
              {zoneOptions.map(opt => (
                <div key={opt} className="form-check form-check-pill">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id={`zone-${opt}`}
                    checked={zones.includes(opt)}
                    onChange={() => toggleArray(opt, zones, setZones)}
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
              onInput={(e: any) => setCycleTime(e.target.value ? parseInt(e.target.value) : null)}
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
                onChange={(e: any) => setCanClimb(e.target.checked)}
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
              onInput={(e: any) => setNotes(e.target.value)}
              placeholder="Record observations, strengths, weaknesses, or any other relevant information..."
            ></textarea>
          </div>
        </div>

        <div className="d-grid gap-2 mt-4">
          <button className="btn btn-success btn-lg" onClick={save}>
            <i className="fa fa-save me-2"></i>
            Save Pit Scouting Data
          </button>
        </div>
      </div>
    </div>
  );
}
