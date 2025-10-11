// @ts-nocheck
import { useEffect, useState, useRef } from 'inferno-hooks';
import Chart from 'chart.js/auto';
/**
 * Reads all JSON match files from the `matches` subfolder within the provided
 * root directory. Files that do not end with `.json` are ignored. The
 * returned array contains parsed JavaScript objects.
 */
async function readAllMatches(root) {
    try {
        const matchesDir = await root.getDirectoryHandle('matches');
        const out = [];
        // @ts-ignore - FileSystemDirectoryHandle is async iterable
        for await (const [name, handle] of matchesDir.entries()) {
            if (typeof name === 'string' && name.endsWith('.json')) {
                const fileHandle = handle;
                const file = await fileHandle.getFile();
                const text = await file.text();
                try {
                    out.push(JSON.parse(text));
                }
                catch (err) {
                    console.warn('Failed to parse', name, err);
                }
            }
        }
        return out;
    }
    catch (err) {
        console.error(err);
        return [];
    }
}
/**
 * Collate match records by team, computing totals for auto and teleop scored
 * points, mobility occurrences, endgame distributions, and foul counts.
 */
function summarise(records) {
    const map = new Map();
    for (const rec of records) {
        const t = rec.team;
        if (!map.has(t)) {
            map.set(t, {
                team: t,
                matches: 0,
                autoScore: 0,
                autoMiss: 0,
                teleopScore: 0,
                teleopMiss: 0,
                mobilityCount: 0,
                endgameCounts: { none: 0, park: 0, shallow: 0, deep: 0 },
                foulCount: 0
            });
        }
        const entry = map.get(t);
        entry.matches++;
        entry.autoScore += rec.phase?.auto?.scored || 0;
        entry.autoMiss += rec.phase?.auto?.missed || 0;
        entry.teleopScore += rec.phase?.teleop?.scored || 0;
        entry.teleopMiss += rec.phase?.teleop?.missed || 0;
        if (rec.phase?.auto?.mobility)
            entry.mobilityCount++;
        const endState = rec.endgame?.climb ?
            (rec.endgame.climb === 'low' ? 'shallow' : rec.endgame.climb === 'high' ? 'deep' : 'none') :
            (rec.endgame?.park ? 'park' : 'none');
        entry.endgameCounts[endState]++;
        entry.foulCount += rec.fouls || 0;
    }
    return Array.from(map.values()).sort((a, b) => a.team - b.team);
}
export default function InfoViewer({ root }) {
    const [summary, setSummary] = useState([]);
    const [error, setError] = useState(null);
    const [genaiText, setGenaiText] = useState('');
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    useEffect(() => {
        (async () => {
            if (!root) {
                setSummary([]);
                return;
            }
            try {
                const recs = await readAllMatches(root);
                const sum = summarise(recs);
                setSummary(sum);
                setError(null);
            }
            catch (err) {
                setError(err.message || 'Failed to read matches');
            }
        })();
    }, [root]);
    // Render chart when summary changes
    useEffect(() => {
        if (!chartRef.current)
            return;
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        if (!summary.length)
            return;
        // Prepare data arrays
        const labels = summary.map(e => e.team.toString());
        const cyclesAvg = summary.map(e => {
            const totCycles = e.teleopScore; // teleopScore is scored count; cycles approximate to scored in our data
            return e.matches ? totCycles / e.matches : 0;
        });
        const accuracy = summary.map(e => {
            const totalAttempts = e.autoScore + e.autoMiss + e.teleopScore + e.teleopMiss;
            const totalScored = e.autoScore + e.teleopScore;
            return totalAttempts > 0 ? (totalScored / totalAttempts) * 100 : 0;
        });
        const data = {
            labels,
            datasets: [
                {
                    label: 'Avg Teleop Cycles',
                    data: cyclesAvg,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)'
                },
                {
                    label: 'Accuracy (%)',
                    data: accuracy,
                    backgroundColor: 'rgba(255, 99, 132, 0.5)'
                }
            ]
        };
        const config = {
            type: 'bar',
            data,
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return value;
                            }
                        }
                    }
                }
            }
        };
        chartInstance.current = new Chart(chartRef.current, config);
    }, [summary]);
    async function askGenAI() {
        try {
            const prompt = 'Generate strategic insights from the local FRC match data.';
            const r = await fetch('/api/genai/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            const data = await r.json();
            setGenaiText(data.text || data.error || 'GenAI unavailable');
        }
        catch (err) {
            setGenaiText('Error contacting GenAI');
        }
    }
    return (<div class="card">
      <div class="card-body">
        <h5>Information Viewer</h5>
        {error && <div class="alert alert-danger">{error}</div>}
        {!summary.length && !error && <p class="text-muted">No matches yet.</p>}
        {summary.length > 0 && (<>
            <div class="table-responsive mb-4">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Matches</th>
                    <th>Auto Score</th>
                    <th>Teleop Score</th>
                    <th>Mobility</th>
                    <th>Endgame (None/Park/Shallow/Deep)</th>
                    <th>Fouls</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map(entry => (<tr key={entry.team}>
                      <td>{entry.team}</td>
                      <td>{entry.matches}</td>
                      <td>{entry.autoScore}</td>
                      <td>{entry.teleopScore}</td>
                      <td>{entry.mobilityCount}</td>
                      <td>
                        {entry.endgameCounts.none}/{entry.endgameCounts.park}/
                        {entry.endgameCounts.shallow}/{entry.endgameCounts.deep}
                      </td>
                      <td>{entry.foulCount}</td>
                    </tr>))}
                </tbody>
              </table>
            </div>
            <canvas ref={chartRef} style={{ maxWidth: '100%', maxHeight: '300px' }}/>
          </>)}
        <button class="btn btn-outline-primary" onClick={askGenAI} disabled={genaiText.length > 0}>
          Ask GenAI (optional)
        </button>
        {genaiText && <div class="mt-3"><strong>GenAI:</strong> {genaiText}</div>}
      </div>
    </div>);
}
