// @ts-nocheck
import * as Inferno from 'inferno';
import { useEffect, useState, useRef } from '../lib/inferno-hooks-shim';
import Chart from 'chart.js/auto';
import type { DirHandle } from '../lib/fsStore';

/**
 * Reads all JSON match files from the `matches` subfolder within the provided
 * root directory. Files that do not end with `.json` are ignored. The
 * returned array contains parsed JavaScript objects.
 */
async function readAllMatches(root: DirHandle): Promise<any[]> {
  try {
    const matchesDir = await root.getDirectoryHandle('matches');
    const out: any[] = [];
    // @ts-ignore - FileSystemDirectoryHandle is async iterable
    for await (const [name, handle] of matchesDir.entries()) {
      if (typeof name === 'string' && name.endsWith('.json')) {
        const fileHandle = handle as FileSystemFileHandle;
        const file = await fileHandle.getFile();
        const text = await file.text();
        try {
          out.push(JSON.parse(text));
        } catch (err) {
          console.warn('Failed to parse', name, err);
        }
      }
    }
    return out;
  } catch (err) {
    console.error(err);
    return [];
  }
}

interface SummaryEntry {
  team: number;
  matches: number;
  autoScore: number;
  autoMiss: number;
  teleopScore: number;
  teleopMiss: number;
  mobilityCount: number;
  endgameCounts: { none: number; park: number; shallow: number; deep: number };
  foulCount: number;
}

/**
 * Collate match records by team, computing totals for auto and teleop scored
 * points, mobility occurrences, endgame distributions, and foul counts.
 */
function summarise(records: any[]): SummaryEntry[] {
  const map = new Map<number, SummaryEntry>();
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
    const entry = map.get(t)!;
    entry.matches++;
    entry.autoScore += rec.phase?.auto?.scored || 0;
    entry.autoMiss += rec.phase?.auto?.missed || 0;
    entry.teleopScore += rec.phase?.teleop?.scored || 0;
    entry.teleopMiss += rec.phase?.teleop?.missed || 0;
    if (rec.phase?.auto?.mobility) entry.mobilityCount++;
    const endState = rec.endgame?.climb ?
      (rec.endgame.climb === 'low' ? 'shallow' : rec.endgame.climb === 'high' ? 'deep' : 'none') :
      (rec.endgame?.park ? 'park' : 'none');
    entry.endgameCounts[endState]++;
    entry.foulCount += rec.fouls || 0;
  }
  return Array.from(map.values()).sort((a, b) => a.team - b.team);
}

export default function InfoViewer({ root }: { root: DirHandle | null }) {
  const [summary, setSummary] = useState<SummaryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [genaiText, setGenaiText] = useState<string>('');
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

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
      } catch (err: any) {
        setError(err.message || 'Failed to read matches');
      }
    })();
  }, [root]);

  // Render chart when summary changes
  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    if (!summary.length) return;
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
    const config: any = {
      type: 'bar',
      data,
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value: any) {
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
    } catch (err: any) {
      setGenaiText('Error contacting GenAI');
    }
  }

  return (
    <div className="card-modern card">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h4 className="mb-1 fw-bold">Information Viewer</h4>
            <p className="text-muted mb-0 small">Team statistics and match insights</p>
          </div>
          {summary.length > 0 && (
            <span className="badge bg-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
              <i className="fa fa-users me-2"></i>
              {summary.length} Teams
            </span>
          )}
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
            <i className="fa fa-exclamation-circle"></i>
            <span>{error}</span>
          </div>
        )}

        {!summary.length && !error && (
          <div className="text-center py-5">
            <i className="fa fa-inbox fa-3x text-muted mb-3"></i>
            <p className="text-muted">No match data available yet. Start scouting to see insights here.</p>
          </div>
        )}

        {summary.length > 0 && (
          <>
            <div className="mb-4">
              <h6 className="fw-semibold mb-3">
                <i className="fa fa-chart-line me-2 text-primary"></i>
                Performance Overview
              </h6>
              <div className="chart-container mb-4" style={{ position: 'relative', height: '300px' }}>
                <canvas aria-label="team stats chart" ref={chartRef} />
              </div>
            </div>

            <div className="mb-4">
              <h6 className="fw-semibold mb-3">
                <i className="fa fa-table me-2 text-success"></i>
                Team Statistics
              </h6>
              <div className="table-responsive">
                <table className="table table-hover table-striped">
                  <thead className="table-light">
                    <tr>
                      <th className="fw-bold">Team</th>
                      <th className="fw-bold">Matches</th>
                      <th className="fw-bold">Auto Score</th>
                      <th className="fw-bold">Teleop Score</th>
                      <th className="fw-bold">Mobility</th>
                      <th className="fw-bold">Endgame</th>
                      <th className="fw-bold">Fouls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map(entry => (
                      <tr key={entry.team}>
                        <td className="fw-semibold">{entry.team}</td>
                        <td>
                          <span className="badge bg-secondary">{entry.matches}</span>
                        </td>
                        <td>
                          <span className="badge bg-primary">{entry.autoScore}</span>
                        </td>
                        <td>
                          <span className="badge bg-success">{entry.teleopScore}</span>
                        </td>
                        <td>
                          <span className="badge bg-info">{entry.mobilityCount}</span>
                        </td>
                        <td className="small">
                          <span className="text-muted">N:</span>{entry.endgameCounts.none}
                          <span className="text-muted ms-2">P:</span>{entry.endgameCounts.park}
                          <span className="text-muted ms-2">S:</span>{entry.endgameCounts.shallow}
                          <span className="text-muted ms-2">D:</span>{entry.endgameCounts.deep}
                        </td>
                        <td>
                          <span className="badge bg-danger">{entry.foulCount}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-top pt-3">
              <h6 className="fw-semibold mb-3">
                <i className="fa fa-robot me-2 text-warning"></i>
                AI Insights (Optional)
              </h6>
              <button
                aria-label="ask genai"
                className="btn btn-outline-primary"
                onClick={askGenAI}
                disabled={genaiText.length > 0}
              >
                <i className="fa fa-sparkles me-2"></i>
                Generate AI Insights
              </button>
              {genaiText && (
                <div className="alert alert-info mt-3">
                  <strong className="d-block mb-2">
                    <i className="fa fa-lightbulb me-2"></i>
                    AI Analysis:
                  </strong>
                  {genaiText}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
