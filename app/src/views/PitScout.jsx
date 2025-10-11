// @ts-nocheck
import { useState } from 'inferno-hooks';
import { writeJSON } from '../lib/fsStore';
/**
 * PitScout collects robot capability information from the pit. A series of
 * toggles and selects allow the scouter to record drivetrain, autonomous
 * capabilities, preferred zones, climb ability and notes. Records are
 * persisted to the local `pit` folder.
 */
export default function PitScout({ root, scouter, navigateHome }) {
    const [team, setTeam] = useState(0);
    const [drivetrain, setDrivetrain] = useState('Tank');
    const [autoPaths, setAutoPaths] = useState([]);
    const [zones, setZones] = useState([]);
    const [cycleTime, setCycleTime] = useState(null);
    const [canClimb, setCanClimb] = useState(false);
    const [notes, setNotes] = useState('');
    const driveOptions = ['Tank', 'Mecanum', 'Swerve', 'Other'];
    const autoOptions = ['Two Piece Auto', 'Three Piece Auto', 'Mobility Only', 'Other'];
    const zoneOptions = ['Near Zone', 'Far Zone', 'Loading Zone', 'Mid Zone'];
    function toggleArray(item, arr, setter) {
        if (arr.includes(item))
            setter(arr.filter(x => x !== item));
        else
            setter([...arr, item]);
    }
    async function save() {
        if (!root)
            return alert('Pick a data folder first');
        if (!scouter)
            return alert('Please login before saving');
        if (!team)
            return alert('Team number required');
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
        }
        catch (err) {
            console.error(err);
            alert('Failed to save pit scouting');
        }
    }
    return (<div class="card">
      <div class="card-body">
        <h5 class="card-title">Pit Scout</h5>
        <div class="mb-3">
          <label class="form-label">Team Number</label>
          <input type="number" class="form-control" value={team || ''} onInput={(e) => setTeam(parseInt(e.target.value || '0'))}/>
        </div>
        <div class="mb-3">
          <label class="form-label">Drivetrain</label>
          <select class="form-select" value={drivetrain} onChange={(e) => setDrivetrain(e.target.value)}>
            {driveOptions.map(opt => <option value={opt}>{opt}</option>)}
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Auto Paths</label>
          <div class="d-flex flex-wrap gap-2">
            {autoOptions.map(opt => (<label class="form-check">
                <input type="checkbox" class="form-check-input" checked={autoPaths.includes(opt)} onChange={() => toggleArray(opt, autoPaths, setAutoPaths)}/>
                {opt}
              </label>))}
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label">Preferred Zones</label>
          <div class="d-flex flex-wrap gap-2">
            {zoneOptions.map(opt => (<label class="form-check">
                <input type="checkbox" class="form-check-input" checked={zones.includes(opt)} onChange={() => toggleArray(opt, zones, setZones)}/>
                {opt}
              </label>))}
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label">Cycle Time Estimate (s)</label>
          <input type="number" class="form-control" value={cycleTime ?? ''} onInput={(e) => setCycleTime(e.target.value ? parseInt(e.target.value) : null)}/>
        </div>
        <div class="mb-3 form-check">
          <input type="checkbox" class="form-check-input" id="climbCheck" checked={canClimb} onChange={(e) => setCanClimb(e.target.checked)}/>
          <label class="form-check-label" for="climbCheck">Can Climb</label>
        </div>
        <div class="mb-3">
          <label class="form-label">Notes</label>
          <textarea class="form-control" rows={3} value={notes} onInput={(e) => setNotes(e.target.value)}></textarea>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-success" onClick={save}>Save Pit Data</button>
          <button class="btn btn-secondary" onClick={navigateHome}>Back</button>
        </div>
      </div>
    </div>);
}
