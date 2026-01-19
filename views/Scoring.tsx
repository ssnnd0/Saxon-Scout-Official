import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/Button';
import { MatchData, ViewState, MatchPhase, GamePiece, ScoutingEvent } from '../types';
import { KEYBINDS } from '../constants';
import { Target, ArrowDown, Package, Play, FastForward, AlertCircle, CheckSquare, XSquare, Undo2, ArrowRight } from 'lucide-react';

interface ScoringProps {
  phase: MatchPhase;
  matchData: MatchData;
  setMatchData: React.Dispatch<React.SetStateAction<MatchData>>;
  setView: (view: ViewState) => void;
}

export const Scoring: React.FC<ScoringProps> = ({ phase, matchData, setMatchData, setView }) => {
  const [lastAction, setLastAction] = useState<string>('');
  const [timerWarning, setTimerWarning] = useState(false);

  const isAuto = phase === MatchPhase.Auto;

  // Scoreboard Data
  const fuelCount = isAuto 
    ? (matchData.autoFuelScored || 0) 
    : (matchData.teleopFuelScored || 0);

  // Live Counts for Buttons (Phase Specific)
  const currentPhaseEvents = isAuto ? matchData.autoEvents : matchData.teleopEvents;
  
  const scoreHubCount = isAuto ? matchData.autoFuelScored : matchData.teleopFuelScored;
  const missHubCount = isAuto ? matchData.autoFuelMissed : matchData.teleopFuelMissed;
  
  // Intake Counts
  const groundIntakeCount = currentPhaseEvents.filter(e => e.action === 'Pickup' && e.location === 'Ground').length;
  const outpostIntakeCount = currentPhaseEvents.filter(e => e.action === 'Pickup' && e.location === 'Outpost').length;

  useEffect(() => {
    setTimerWarning(false);
    let t: number;
    if (isAuto) {
      t = window.setTimeout(() => setTimerWarning(true), 12000); // Warn at 12s (3s left in Auto)
    } else {
      t = window.setTimeout(() => setTimerWarning(true), 120000); // Warn at 2:00 (15s left in Teleop)
    }
    return () => clearTimeout(t);
  }, [phase]);

  const addEvent = useCallback((action: string, piece: GamePiece, location: string) => {
    const event: ScoutingEvent = {
      timestamp: Date.now(),
      phase,
      action,
      piece,
      location,
      value: 1
    };

    setLastAction(`${action} ${location}`);

    setMatchData(prev => {
      const newData = { ...prev };
      const isAutoPhase = phase === MatchPhase.Auto;

      // Fuel Logic
      if (piece === GamePiece.Fuel) {
        if (action === 'Score') {
            isAutoPhase ? newData.autoFuelScored++ : newData.teleopFuelScored++;
        } else if (action === 'Miss') {
            isAutoPhase ? newData.autoFuelMissed++ : newData.teleopFuelMissed++;
        } else if (action === 'Pickup') {
            if (location === 'Ground') newData.fuelIntakeGround++;
            else newData.fuelIntakeSource++; // Mapped to 'Source' field in types, visually 'Outpost'
        }
      }
      
      // Auto Leave Line Logic
      if (isAutoPhase && !prev.leaveLine && (action === 'Score' || action === 'Pickup')) {
        newData.leaveLine = true;
      }

      const listName = phase === MatchPhase.Auto ? 'autoEvents' : 'teleopEvents';
      newData[listName] = [...prev[listName], event];
      return newData;
    });
  }, [phase, setMatchData]);

  const handleUndo = useCallback(() => {
      setMatchData(prev => {
          const newData = { ...prev };
          const listName = phase === MatchPhase.Auto ? 'autoEvents' : 'teleopEvents';
          const events = [...prev[listName]];
          
          if (events.length === 0) return prev; // Nothing to undo

          const lastEvent = events.pop();
          newData[listName] = events;

          if (lastEvent) {
               setLastAction(`Undo: ${lastEvent.action}`);
               const isAutoPhase = phase === MatchPhase.Auto;

               if (lastEvent.piece === GamePiece.Fuel) {
                    if (lastEvent.action === 'Score') {
                        isAutoPhase ? newData.autoFuelScored-- : newData.teleopFuelScored--;
                    } else if (lastEvent.action === 'Miss') {
                        isAutoPhase ? newData.autoFuelMissed-- : newData.teleopFuelMissed--;
                    } else if (lastEvent.action === 'Pickup') {
                        if (lastEvent.location === 'Ground') newData.fuelIntakeGround--;
                        else newData.fuelIntakeSource--;
                    }
               }
          }
          return newData;
      });
  }, [phase, setMatchData]);

  // Keybinds
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const key = e.key.toLowerCase();
      if (key === KEYBINDS.SCORE_FUEL) addEvent('Score', GamePiece.Fuel, 'Hub');
      if (key === KEYBINDS.DROP_FUEL) addEvent('Miss', GamePiece.Fuel, 'Hub');
      if (key === KEYBINDS.PICK_GROUND) addEvent('Pickup', GamePiece.Fuel, 'Ground');
      if (key === KEYBINDS.PICK_OUTPOST) addEvent('Pickup', GamePiece.Fuel, 'Outpost');
      if (key === 'z' && (e.ctrlKey || e.metaKey)) handleUndo();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addEvent, handleUndo]);

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white overflow-hidden relative">
      
      {/* Top Bar: Status & Scoreboard */}
      <div className="h-16 flex-none bg-white dark:bg-obsidian border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-20 shadow-xl transition-colors">
        <div className="flex items-center gap-3">
             <div className={`px-3 py-1.5 rounded-lg font-black uppercase tracking-wider flex items-center gap-2 text-sm ${isAuto ? 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30' : 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30'}`}>
                {isAuto ? <Play size={16} fill="currentColor" /> : <FastForward size={16} fill="currentColor" />}
                {isAuto ? 'AUTO' : 'TELEOP'}
            </div>
            <div className="hidden md:flex flex-col">
                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Team {matchData.teamNumber}</span>
                 <span className="text-xs text-slate-400 dark:text-slate-300 font-medium truncate max-w-[150px]">{lastAction || 'Ready'}</span>
            </div>
        </div>

        {/* Center Timer/Progress */}
        <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-1/3 flex flex-col justify-end pb-1 opacity-30 md:opacity-100 pointer-events-none">
            <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${timerWarning ? 'bg-red-500' : (isAuto ? 'bg-purple-500' : 'bg-blue-500')} transition-all duration-1000 ease-linear`} 
                    style={{ width: '100%' }}
                ></div>
            </div>
        </div>

        <div className="flex items-center gap-4">
             <Button 
                variant="ghost" 
                onClick={handleUndo} 
                disabled={currentPhaseEvents.length === 0}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
            >
                <Undo2 size={24} />
            </Button>
            <div className="text-right">
                <span className="text-4xl font-black text-matcha glow-matcha leading-none block">{fuelCount}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block text-right">Scored</span>
            </div>
        </div>
      </div>

      {/* Main Control Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 p-3 md:p-6 bg-slate-100 dark:bg-gradient-to-b dark:from-slate-900 dark:to-obsidian transition-colors">
        
        {/* Left: Intake Controls (Thumb Friendly) */}
        <div className="order-2 md:order-1 col-span-1 md:col-span-3 flex flex-row md:flex-col gap-3">
            <Button 
                onClick={() => addEvent('Pickup', GamePiece.Fuel, 'Ground')}
                className="flex-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl flex flex-col items-center justify-center gap-2 group relative active:scale-95 transition-all shadow-sm"
            >
                <div className="absolute top-2 left-2 bg-slate-100 dark:bg-slate-950/50 px-2 py-0.5 rounded text-[10px] font-bold text-slate-400">GROUND</div>
                <ArrowDown size={32} className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                <span className="text-2xl font-black">{groundIntakeCount}</span>
            </Button>
            <Button 
                onClick={() => addEvent('Pickup', GamePiece.Fuel, 'Outpost')}
                className="flex-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl flex flex-col items-center justify-center gap-2 group relative active:scale-95 transition-all shadow-sm"
            >
                <div className="absolute top-2 left-2 bg-slate-100 dark:bg-slate-950/50 px-2 py-0.5 rounded text-[10px] font-bold text-slate-400">SOURCE</div>
                <Package size={32} className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                <span className="text-2xl font-black">{outpostIntakeCount}</span>
            </Button>
        </div>

        {/* Center: Primary Scoring Loop (Focus Area) */}
        <div className="order-1 md:order-2 col-span-1 md:col-span-6 flex flex-col gap-3">
             {/* SCORE Button - Huge Target */}
             <button 
                onClick={() => addEvent('Score', GamePiece.Fuel, 'Hub')}
                className="flex-grow rounded-3xl bg-matcha hover:bg-matcha-dark active:bg-matcha-dark/90 text-obsidian shadow-[0_0_30px_rgba(168,198,108,0.2)] border-4 border-matcha-light/30 transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-2 relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Target size={80} strokeWidth={2.5} className="drop-shadow-lg" />
                <span className="text-4xl md:text-6xl font-black tracking-tighter drop-shadow-md">SCORE</span>
                <span className="absolute top-4 right-6 text-2xl font-black opacity-50">{scoreHubCount}</span>
            </button>

            {/* MISS Button - Accessibility below */}
            <button 
                onClick={() => addEvent('Miss', GamePiece.Fuel, 'Hub')}
                className="h-24 md:h-32 rounded-2xl bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 border-2 border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-200 flex items-center justify-center gap-4 transition-all active:scale-[0.98]"
            >
                <AlertCircle size={32} />
                <div className="text-left">
                    <span className="block text-2xl font-black tracking-wide">MISS</span>
                    <span className="block text-xs font-bold opacity-70">RECORD FAILURE</span>
                </div>
                <div className="ml-4 text-3xl font-black opacity-50">{missHubCount}</div>
            </button>
        </div>

        {/* Right: Modifiers & Status */}
        <div className="order-3 md:order-3 col-span-1 md:col-span-3 flex flex-row md:flex-col gap-3">
            {isAuto ? (
                <div className="flex-1 flex flex-col gap-3">
                     <button 
                        className={`flex-1 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${matchData.leaveLine ? 'bg-matcha/20 border-matcha text-matcha-dark dark:text-matcha shadow-lg shadow-matcha/10' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                        onClick={() => setMatchData(prev => ({...prev, leaveLine: !prev.leaveLine}))}
                    >
                        {matchData.leaveLine ? <CheckSquare size={28} /> : <XSquare size={28} />}
                        <span className="font-black text-sm uppercase">Leave Line</span>
                     </button>

                     <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-2 flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase text-center mb-1">Auto Climb</span>
                        <div className="flex-1 flex gap-1">
                            <button 
                                onClick={() => setMatchData(prev => ({...prev, autoTowerLevel: 'Level 1'}))}
                                className={`flex-1 rounded-lg font-bold text-xs transition-colors ${matchData.autoTowerLevel === 'Level 1' ? 'bg-matcha text-obsidian' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                            >
                                L1
                            </button>
                            <button 
                                onClick={() => setMatchData(prev => ({...prev, autoTowerLevel: 'Failed'}))}
                                className={`flex-1 rounded-lg font-bold text-xs transition-colors ${matchData.autoTowerLevel === 'Failed' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                            >
                                FAIL
                            </button>
                        </div>
                     </div>
                </div>
            ) : (
                <div className="flex-1 bg-white/50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 p-4">
                    <Target size={32} className="opacity-20 mb-2"/>
                    <span className="text-xs font-bold text-center">FOCUS ON<br/>ACCURACY</span>
                </div>
            )}
            
            {/* Advance Button (Mobile: Full Width Bottom, Desktop: Bottom Right) */}
            <Button 
                variant={timerWarning ? 'danger' : 'primary'} 
                className={`h-20 md:h-auto md:flex-1 text-xl font-black shadow-lg ${timerWarning ? 'animate-pulse' : ''}`}
                onClick={() => {
                    setLastAction('');
                    setView(isAuto ? 'TELEOP_SCORING' : 'ENDGAME_SCORING');
                }}
            >
                <div className="flex items-center gap-2">
                    {isAuto ? 'TELEOP' : 'ENDGAME'} <ArrowRight size={24} strokeWidth={3} />
                </div>
            </Button>
        </div>

      </div>
    </div>
  );
};