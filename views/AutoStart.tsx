import React from 'react';
import { Button } from '../components/Button';
import { FieldMap } from '../components/FieldMap';
import { MatchData, ViewState } from '../types';
import { ArrowLeft, CheckCircle, Crosshair, PlayCircle } from 'lucide-react';

interface AutoStartProps {
  matchData: MatchData;
  setMatchData: React.Dispatch<React.SetStateAction<MatchData>>;
  setView: (view: ViewState) => void;
}

export const AutoStart: React.FC<AutoStartProps> = ({ matchData, setMatchData, setView }) => {
  const isRed = matchData.alliance === 'Red';

  return (
    <div className="flex flex-col h-full w-full p-4 md:p-6 text-slate-900 dark:text-white bg-slate-50 dark:bg-obsidian">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center">
            <Button variant="ghost" onClick={() => setView('GAME_START')} className="mr-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800">
                <ArrowLeft size={24} />
            </Button>
            <div>
                <h2 className="text-2xl font-black">PRE-MATCH</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Match {matchData.matchNumber} • Team {matchData.teamNumber}</p>
            </div>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-black border ${isRed ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'}`}>
            {matchData.alliance} Alliance
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-6xl mx-auto">
        
        {/* Map Container - Relative for absolute positioning of overlay */}
        <div className="relative w-full aspect-[2/1] bg-white dark:bg-obsidian-light rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden group">
            
            {/* Field Map Background */}
            <div className="absolute inset-0">
                 <FieldMap 
                    selectedZone={matchData.startingZone}
                    onSelectZone={(zone) => setMatchData(prev => ({ ...prev, startingZone: zone }))}
                    alliance={matchData.alliance}
                />
            </div>

            {/* Hint Text (Fades out when zone selected) */}
            {!matchData.startingZone && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/50 backdrop-blur-sm text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 animate-pulse">
                        <Crosshair size={20} /> Tap your starting position
                    </div>
                </div>
            )}

            {/* Overlay Start Panel - Positioned opposite to selection buttons */}
            {/* If Red (Zones on Right), panel goes Left. If Blue (Zones on Left), panel goes Right. */}
            <div className={`absolute top-0 bottom-0 w-1/3 min-w-[280px] p-6 flex flex-col justify-center pointer-events-none transition-all duration-500 ${isRed ? 'left-0 bg-gradient-to-r' : 'right-0 bg-gradient-to-l'} from-white/90 via-white/50 to-transparent dark:from-obsidian-light/90 dark:via-obsidian-light/50`}>
                 
                 <div className={`pointer-events-auto bg-white/80 dark:bg-obsidian/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 transform transition-all duration-500 ${matchData.startingZone ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-50 grayscale'}`}>
                     
                     <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-widest mb-1">Starting Zone</p>
                        <div className="text-2xl font-black text-slate-900 dark:text-white tracking-wide">
                            {matchData.startingZone ? (
                                <span className="text-matcha flex items-center gap-2">
                                    <CheckCircle size={24} className="fill-matcha stroke-obsidian"/> 
                                    {matchData.startingZone.replace('-', ' ').replace(matchData.alliance, '').trim().toUpperCase()}
                                </span>
                            ) : (
                                <span className="text-slate-400">---</span>
                            )}
                        </div>
                     </div>

                     <div className="pt-2">
                        <Button 
                            variant="success" 
                            fullWidth 
                            disabled={!matchData.startingZone}
                            onClick={() => setView('AUTO_SCORING')}
                            className="h-16 text-xl shadow-lg shadow-matcha/20 flex items-center justify-center gap-3"
                        >
                            <PlayCircle size={24} fill="currentColor" className="text-obsidian" />
                            START AUTO
                        </Button>
                     </div>

                 </div>
            </div>
        </div>
        
        {/* Mobile-only hint if needed below, usually the overlay covers it */}
        <div className="md:hidden mt-4 text-xs text-slate-400 text-center px-6">
            If the interface is too cramped, try rotating your device to landscape.
        </div>
      </div>
    </div>
  );
};