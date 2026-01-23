import React from 'react';
import { Button } from '../components/Button';
import { MatchData, ViewState } from '../types';
import { Copy, CheckCircle } from 'lucide-react';

interface SummaryProps {
  matchData: MatchData;
  reset: () => void;
  setView: (view: ViewState) => void;
}

export const Summary: React.FC<SummaryProps> = ({ matchData, reset, setView }) => {
  return (
    <div className="flex flex-col h-full p-6 items-center justify-center space-y-8 bg-slate-50 dark:bg-obsidian text-slate-900 dark:text-white transition-colors">
      <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
        <div className="inline-flex items-center justify-center p-6 bg-matcha/20 rounded-full text-matcha-dark dark:text-matcha mb-4">
            <CheckCircle size={64} />
        </div>
        <div>
            <h2 className="text-4xl font-black mb-2">Match Complete</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">Data saved successfully.</p>
        </div>
      </div>

      <div className="w-full max-w-sm bg-white dark:bg-obsidian-light border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
         <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-slate-500 font-bold uppercase text-xs">Match</span>
            <span className="text-slate-900 dark:text-white font-mono font-bold text-xl">#{matchData.matchNumber}</span>
         </div>
         <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-slate-500 font-bold uppercase text-xs">Team</span>
            <span className="text-slate-900 dark:text-white font-mono font-bold text-xl">{matchData.teamNumber}</span>
         </div>
         <div className="flex justify-between items-center">
            <span className="text-slate-500 font-bold uppercase text-xs">Total Score</span>
            <span className="text-gold-dark dark:text-gold font-mono font-black text-xl">
                 {(matchData.autoFuelScored || 0) + (matchData.teleopFuelScored || 0)} Fuel
            </span>
         </div>
      </div>

      <div className="w-full max-w-sm space-y-4 pt-4">
        <Button variant="primary" fullWidth onClick={reset} className="h-16 text-lg font-black tracking-wide shadow-lg shadow-matcha/20">
          Scout Next Match
        </Button>
        <div className="grid grid-cols-2 gap-4">
            <Button variant="secondary" fullWidth onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(matchData));
                alert("Data copied to clipboard");
            }}>
            <Copy size={18} className="mr-2"/> Copy JSON
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setView('DASHBOARD')}>
            Dashboard
            </Button>
        </div>
      </div>
    </div>
  );
};