import React from 'react';
import { Button } from '../components/Button';
import { MatchData, ViewState, TowerLevel } from '../types';
import { saveMatch } from '../services/storageService';
import { syncService } from '../services/syncService';
import { Flag, AlertTriangle, Shield, Check, X, ArrowUpCircle, Clock, FastForward, Activity } from 'lucide-react';

interface EndgameProps {
  matchData: MatchData;
  setMatchData: React.Dispatch<React.SetStateAction<MatchData>>;
  setView: (view: ViewState) => void;
}

export const Endgame: React.FC<EndgameProps> = ({ matchData, setMatchData, setView }) => {
  const updateField = (field: keyof MatchData, value: any) => {
    setMatchData(prev => ({ ...prev, [field]: value }));
  };

  const handleFinish = async () => {
    const savedMatch = await saveMatch(matchData);
    syncService.uploadMatch(savedMatch);
    setView('SUMMARY');
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-obsidian text-slate-900 dark:text-white transition-colors">
       
       {/* Header */}
       <div className="flex-none p-6 md:p-8 flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-obsidian-light">
            <div className="bg-slate-200 dark:bg-slate-800 p-3 rounded-full border border-slate-300 dark:border-slate-700">
                <Flag className="text-tower" size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-black tracking-tighter">POST MATCH</h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-bold">Endgame & Summary</p>
            </div>
       </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: CLIMB & PHYSICAL */}
        <div className="space-y-6">
             {/* Climb Section */}
             <div className="bg-white dark:bg-obsidian-light p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2"><ArrowUpCircle size={16}/> Climb Performance</h3>
                
                {/* Level Select */}
                <div className="grid grid-cols-2 gap-3">
                     {['Level 3', 'Level 2', 'Level 1', 'Failed'].map((lvl) => (
                        <button
                            key={lvl}
                            onClick={() => updateField('endgameTowerLevel', lvl as TowerLevel)}
                            className={`p-4 rounded-xl border-2 font-black text-sm uppercase transition-all ${
                                matchData.endgameTowerLevel === lvl 
                                    ? (lvl === 'Failed' ? 'bg-red-500 border-red-500 text-white' : 'bg-matcha border-matcha text-obsidian') 
                                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'
                            }`}
                        >
                            {lvl}
                        </button>
                     ))}
                     <button 
                        onClick={() => updateField('endgameTowerLevel', 'None')}
                        className={`col-span-2 p-3 rounded-xl border border-dashed transition-all text-xs font-bold uppercase ${matchData.endgameTowerLevel === 'None' ? 'bg-slate-200 dark:bg-slate-800 border-slate-400 text-slate-900 dark:text-white' : 'border-slate-300 text-slate-400'}`}
                    >
                        No Climb Attempt
                    </button>
                </div>

                {/* Detailed Climb Data (Only if attempted) */}
                {matchData.endgameTowerLevel !== 'None' && matchData.endgameTowerLevel !== 'Failed' && (
                    <div className="grid grid-cols-2 gap-4 pt-2 animate-in fade-in slide-in-from-top-2">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Time (Sec)</label>
                            <input 
                                type="number" 
                                value={matchData.climbDuration || ''} 
                                onChange={(e) => updateField('climbDuration', parseFloat(e.target.value))}
                                className="w-full p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                                placeholder="0s"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Position</label>
                            <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                                {['Left', 'Center', 'Right'].map(pos => (
                                    <button
                                        key={pos}
                                        onClick={() => updateField('climbPosition', pos)}
                                        className={`flex-1 py-3 text-xs font-bold uppercase ${matchData.climbPosition === pos ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-500'}`}
                                    >
                                        {pos[0]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
             </div>

             {/* Robot Capabilities */}
             <div className="bg-white dark:bg-obsidian-light p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Activity size={16}/> Capabilities</h3>
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => updateField('crossedBump', !matchData.crossedBump)}
                        className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-sm transition-all ${matchData.crossedBump ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-400'}`}
                    >
                        {matchData.crossedBump ? <Check size={16}/> : <X size={16}/>} Crossed Bump
                    </button>
                    <button 
                        onClick={() => updateField('underTrench', !matchData.underTrench)}
                        className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-sm transition-all ${matchData.underTrench ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-400'}`}
                    >
                        {matchData.underTrench ? <Check size={16}/> : <X size={16}/>} Under Trench
                    </button>
                    <button 
                        onClick={() => updateField('robotDied', !matchData.robotDied)}
                        className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-sm transition-all ${matchData.robotDied ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-600' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-400'}`}
                    >
                        <AlertTriangle size={16}/> Robot Died
                    </button>
                </div>
             </div>
        </div>

        {/* RIGHT COLUMN: STRATEGY & TIMES */}
        <div className="space-y-6">
            <div className="bg-white dark:bg-obsidian-light p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
                
                {/* Strategy Types */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Auto Type</label>
                        <select 
                            value={matchData.autoStrategy}
                            onChange={(e) => updateField('autoStrategy', e.target.value)}
                            className="w-full p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm"
                        >
                            <option value="Standard">Standard</option>
                            <option value="Offensive">Offensive</option>
                            <option value="Defensive">Defensive</option>
                            <option value="Disruptor">Disruptor</option>
                            <option value="Do Nothing">Do Nothing</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Tele Type</label>
                         <select 
                            value={matchData.teleopStrategy}
                            onChange={(e) => updateField('teleopStrategy', e.target.value)}
                            className="w-full p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm"
                        >
                            <option value="Cycler">Cycler</option>
                            <option value="Defender">Defender</option>
                            <option value="Feeder">Feeder</option>
                            <option value="Hybrid">Hybrid</option>
                        </select>
                    </div>
                </div>

                {/* Timing Inputs */}
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><Clock size={16}/> Phase Durations (Sec)</h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Attack</label>
                            <input 
                                type="number" 
                                value={matchData.attackDuration || ''} 
                                onChange={(e) => updateField('attackDuration', parseFloat(e.target.value))}
                                className="w-full p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-center"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Defend</label>
                            <input 
                                type="number" 
                                value={matchData.defenseDuration || ''} 
                                onChange={(e) => updateField('defenseDuration', parseFloat(e.target.value))}
                                className="w-full p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-center"
                                placeholder="0"
                            />
                        </div>
                         <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Offload</label>
                            <input 
                                type="number" 
                                value={matchData.feedingDuration || ''} 
                                onChange={(e) => updateField('feedingDuration', parseFloat(e.target.value))}
                                className="w-full p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-center"
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Notes */}
            <div className="bg-white dark:bg-obsidian-light p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col h-[200px]">
                 <label className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Match Notes</label>
                 <textarea
                    className="flex-1 w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-matcha text-slate-900 dark:text-white placeholder-slate-400 resize-none text-sm"
                    placeholder="Describe robot performance, cycling speed, driver skill..."
                    value={matchData.comments}
                    onChange={(e) => updateField('comments', e.target.value)}
                 />
            </div>
        </div>

        </div>
      </div>

      <div className="p-4 bg-white dark:bg-obsidian border-t border-slate-200 dark:border-slate-800">
        <Button variant="success" fullWidth onClick={handleFinish} className="h-16 text-xl font-black shadow-2xl shadow-emerald-900/30 tracking-widest uppercase">
          Finalize Match
        </Button>
      </div>
    </div>
  );
};