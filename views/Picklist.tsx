import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { ViewState, RankedTeam } from '../types';
import { getMatches, getPicklist, savePicklist } from '../services/storageService';

interface PicklistProps {
  setView: (view: ViewState) => void;
}

export const Picklist: React.FC<PicklistProps> = ({ setView }) => {
  const [rankings, setRankings] = useState<RankedTeam[]>([]);

  useEffect(() => {
    const saved = getPicklist();
    if (saved.length > 0) {
      setRankings(saved);
    } else {
      // Auto-generate initial rankings based on average score
      const matches = getMatches();
      const teams = Array.from(new Set(matches.map(m => m.teamNumber)));
      const stats = teams.map(team => {
        const teamMatches = matches.filter(m => m.teamNumber === team);
        
        // Calculate average Total Score
        const totalScore = teamMatches.reduce((acc, m) => {
            let score = (m.autoFuelScored * 1) + (m.teleopFuelScored * 1);
            if (m.autoTowerLevel === 'Level 1') score += 15;
            if (m.endgameTowerLevel === 'Level 1') score += 10;
            if (m.endgameTowerLevel === 'Level 2') score += 20;
            if (m.endgameTowerLevel === 'Level 3') score += 30;
            return acc + score;
        }, 0);
        
        // Fuel only avg
        const totalFuel = teamMatches.reduce((acc, m) => acc + m.autoFuelScored + m.teleopFuelScored, 0);

        return {
            teamNumber: team,
            avg: teamMatches.length ? totalScore / teamMatches.length : 0,
            avgFuel: teamMatches.length ? totalFuel / teamMatches.length : 0
        };
      });
      
      const sorted = stats.sort((a, b) => b.avg - a.avg).map((s, i) => ({
          teamNumber: s.teamNumber,
          rank: i + 1,
          notes: `Avg Score: ${s.avg.toFixed(1)} | Avg Fuel: ${s.avgFuel.toFixed(1)}`,
          avgFuel: s.avgFuel
      }));
      setRankings(sorted);
    }
  }, []);

  const move = (index: number, direction: -1 | 1) => {
    const newRankings = [...rankings];
    if (index + direction < 0 || index + direction >= newRankings.length) return;
    
    const temp = newRankings[index];
    newRankings[index] = newRankings[index + direction];
    newRankings[index + direction] = temp;
    
    // Re-index ranks
    newRankings.forEach((r, i) => r.rank = i + 1);
    setRankings(newRankings);
    savePicklist(newRankings);
  };

  return (
    <div className="flex flex-col h-full p-4 bg-slate-50 dark:bg-obsidian text-slate-900 dark:text-white transition-colors">
      <div className="flex items-center mb-4">
         <Button variant="ghost" onClick={() => setView('DASHBOARD')} className="mr-2 px-2 hover:bg-slate-200 dark:hover:bg-slate-800">←</Button>
         <h2 className="text-xl font-bold">Alliance Picklist</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {rankings.map((team, index) => (
            <div key={team.teamNumber} className="bg-white dark:bg-obsidian-light p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-sm">
                <div className="flex items-center space-x-4">
                    <span className="text-2xl font-black text-slate-400 dark:text-slate-600 w-8">{index + 1}</span>
                    <div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white">Team {team.teamNumber}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{team.notes}</div>
                    </div>
                </div>
                <div className="flex flex-col space-y-1">
                    <button onClick={() => move(index, -1)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white px-2">▲</button>
                    <button onClick={() => move(index, 1)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white px-2">▼</button>
                </div>
            </div>
        ))}
        {rankings.length === 0 && (
            <div className="text-center text-slate-500 mt-10">No teams to rank yet.</div>
        )}
      </div>
      
      <div className="mt-4">
        <Button variant="outline" fullWidth onClick={() => {
            const csv = rankings.map(r => `${r.rank},${r.teamNumber},"${r.notes}"`).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'picklist.csv';
            a.click();
        }}>Export CSV</Button>
      </div>
    </div>
  );
};