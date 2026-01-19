import React from 'react';
import { Button } from '../components/Button';
import { MatchData, ViewState, TowerLevel } from '../types';
import { saveMatch } from '../services/storageService';
import { syncService } from '../services/syncService';
import { Flag, AlertTriangle, Shield, Check, X, ArrowUpCircle } from 'lucide-react';

interface EndgameProps {
  matchData: MatchData;
  setMatchData: React.Dispatch<React.SetStateAction<MatchData>>;
  setView: (view: ViewState) => void;
}

export const Endgame: React.FC<EndgameProps> = ({ matchData, setMatchData, setView }) => {
  const updateField = (field: keyof MatchData, value: any) => {
    setMatchData(prev => ({ ...prev, [field]: value }));
  };

  const handleFinish = () => {
    const savedMatch = saveMatch(matchData);
    syncService.uploadMatch(savedMatch);
    setView('SUMMARY');
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-obsidian text-slate-900 dark:text-white p-6 md:p-8 transition-colors">
       
       {/* Header */}
       <div className="flex items-center gap-4 mb-6">
            <div className="bg-slate-200 dark:bg-slate-800 p-3 rounded-full border border-slate-300 dark:border-slate-700">
                <Flag className="text-tower" size={32} />
            </div>
            <div>
                <h2 className="text-4xl font-black tracking-tighter">ENDGAME</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm uppercase tracking-widest font-bold">Tower Climb Challenge</p>
            </div>
       </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto">
        
        {/* Left: Climb Selection (Stacked Cards) */}
        <div className="flex flex-col space-y-3">
             <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Climb Result</div>
             
             {/* Level 3 */}
             <button
                onClick={() => updateField('endgameTowerLevel', 'Level 3')}
                className={`relative overflow-hidden group p-6 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between ${matchData.endgameTowerLevel === 'Level 3' ? 'bg-indigo-600 border-indigo-400 shadow-xl shadow-indigo-900/50 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-900 dark:text-white'}`}
            >
                <div className="z-10 flex items-center gap-4">
                    <div className="bg-black/10 dark:bg-white/10 p-3 rounded-lg"><ArrowUpCircle size={32}/></div>
                    <div className="text-left">
                        <div className="text-4xl font-black">L3</div>
                        <div className="font-bold text-lg opacity-90">High Rung</div>
                    </div>
                </div>
                <div className="z-10 flex flex-col items-end">
                    <span className="text-3xl font-black">30</span>
                    <span className="text-xs font-bold uppercase opacity-70">Points</span>
                </div>
                {matchData.endgameTowerLevel === 'Level 3' && <div className="absolute right-0 top-0 p-2 text-white/20"><Check size={80}/></div>}
            </button>

            {/* Level 2 */}
            <button
                onClick={() => updateField('endgameTowerLevel', 'Level 2')}
                className={`relative overflow-hidden group p-6 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between ${matchData.endgameTowerLevel === 'Level 2' ? 'bg-gold border-gold-light shadow-xl shadow-gold/30 text-obsidian' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-900 dark:text-white'}`}
            >
                <div className="z-10 flex items-center gap-4">
                     <div className="bg-black/10 p-3 rounded-lg"><ArrowUpCircle size={32}/></div>
                    <div className="text-left">
                        <div className="text-4xl font-black">L2</div>
                        <div className="font-bold text-lg opacity-90">Mid Rung</div>
                    </div>
                </div>
                <div className="z-10 flex flex-col items-end">
                    <span className="text-3xl font-black">20</span>
                    <span className="text-xs font-bold uppercase opacity-70">Points</span>
                </div>
                {matchData.endgameTowerLevel === 'Level 2' && <div className="absolute right-0 top-0 p-2 text-black/10"><Check size={80}/></div>}
            </button>

            {/* Level 1 */}
            <button
                onClick={() => updateField('endgameTowerLevel', 'Level 1')}
                className={`relative overflow-hidden group p-6 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between ${matchData.endgameTowerLevel === 'Level 1' ? 'bg-matcha border-matcha-light shadow-xl shadow-matcha/30 text-obsidian' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-900 dark:text-white'}`}
            >
                <div className="z-10 flex items-center gap-4">
                    <div className="bg-black/10 p-3 rounded-lg"><ArrowUpCircle size={32}/></div>
                    <div className="text-left">
                        <div className="text-4xl font-black">L1</div>
                        <div className="font-bold text-lg opacity-90">Low Rung</div>
                    </div>
                </div>
                <div className="z-10 flex flex-col items-end">
                    <span className="text-3xl font-black">10</span>
                    <span className="text-xs font-bold uppercase opacity-70">Points</span>
                </div>
                {matchData.endgameTowerLevel === 'Level 1' && <div className="absolute right-0 top-0 p-2 text-black/10"><Check size={80}/></div>}
            </button>
            
            <div className="grid grid-cols-2 gap-4 mt-2">
                 <button
                    onClick={() => updateField('endgameTowerLevel', 'None')}
                    className={`p-4 rounded-xl border-2 font-bold transition-all ${matchData.endgameTowerLevel === 'None' ? 'bg-slate-200 dark:bg-slate-600 border-slate-300 dark:border-slate-500 text-slate-700 dark:text-white' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400 dark:hover:border-slate-500'}`}
                >
                    No Attempt
                </button>
                <button
                    onClick={() => updateField('endgameTowerLevel', 'Failed')}
                    className={`p-4 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${matchData.endgameTowerLevel === 'Failed' ? 'bg-red-100 dark:bg-red-900/50 border-red-500 text-red-700 dark:text-red-200' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 hover:border-red-500'}`}
                >
                    <X size={20} /> Failed
                </button>
            </div>
        </div>

        {/* Right: Status & Notes */}
        <div className="flex flex-col space-y-6">
             <div className="bg-white dark:bg-obsidian-light p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Robot Status</h3>
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => updateField('defensePlayed', !matchData.defensePlayed)}
                        className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${matchData.defensePlayed ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750'}`}
                    >
                        <Shield size={32} />
                        <span className="font-bold">Played Defense</span>
                    </button>
                    <button 
                        onClick={() => updateField('robotDied', !matchData.robotDied)}
                        className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${matchData.robotDied ? 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-600 dark:text-red-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750'}`}
                    >
                        <AlertTriangle size={32} />
                        <span className="font-bold">Robot Died</span>
                    </button>
                </div>
             </div>

             <div className="flex-1 flex flex-col">
                 <label className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Match Notes</label>
                 <textarea
                    className="flex-1 w-full p-4 bg-white dark:bg-obsidian-light border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-matcha text-slate-900 dark:text-white placeholder-slate-400 resize-none text-base"
                    placeholder="Describe robot performance, cycling speed, climb consistency, or any major issues..."
                    value={matchData.comments}
                    onChange={(e) => updateField('comments', e.target.value)}
                 />
             </div>
        </div>

      </div>

      <div className="pt-6">
        <Button variant="success" fullWidth onClick={handleFinish} className="h-20 text-2xl font-black shadow-2xl shadow-emerald-900/30 tracking-widest">
          SUBMIT MATCH DATA
        </Button>
      </div>
    </div>
  );
};