import React, { useState, useEffect, useCallback } from 'react';
import { MatchData, ViewState, MatchPhase, GamePiece, ScoutingEvent } from '../types';
import { KEYBINDS } from '../constants';
import { Target, ArrowDown, Package, Play, FastForward, Undo2, ArrowRight } from 'lucide-react';
import { useLongPress } from '../hooks/useLongPress';

interface ScoringProps {
  phase: MatchPhase;
  matchData: MatchData;
  setMatchData: React.Dispatch<React.SetStateAction<MatchData>>;
  setView: (view: ViewState) => void;
}

export const Scoring: React.FC<ScoringProps> = ({ phase, matchData, setMatchData, setView }) => {
  const [lastAction, setLastAction] = useState<string>('');
  const [timerWarning, setTimerWarning] = useState(false);
  const [isHoldingScore, setIsHoldingScore] = useState(false);

  const isAuto = phase === MatchPhase.Auto;

  // Live Counts for Display
  const currentPhaseEvents = isAuto ? matchData.autoEvents : matchData.teleopEvents;
  const scoreHubCount = isAuto ? matchData.autoFuelScored : matchData.teleopFuelScored;
  const missHubCount = isAuto ? matchData.autoFuelMissed : matchData.teleopFuelMissed;
  const groundIntakeCount = currentPhaseEvents.filter(e => e.action === 'Pickup' && e.location === 'Ground').length;
  const outpostIntakeCount = currentPhaseEvents.filter(e => e.action === 'Pickup' && e.location === 'Outpost').length;

  useEffect(() => {
    setTimerWarning(false);
    let t: number;
    if (isAuto) {
      t = window.setTimeout(() => setTimerWarning(true), 12000); // Warn at 12s
    } else {
      t = window.setTimeout(() => setTimerWarning(true), 120000); // Warn at 2:00
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
    
    // Haptic Feedback (if supported)
    if (navigator.vibrate) navigator.vibrate(10);

    setMatchData(prev => {
      const newData = { ...prev };
      const isAutoPhase = phase === MatchPhase.Auto;

      // Fuel Logic
      if (piece === GamePiece.Fuel) {
        if (action === 'Score') {
            isAutoPhase ? newData.autoFuelScored++ : newData.teleopFuelScored++;
        } else if (action === 'Miss') {
            isAutoPhase ? newData.autoFuelMissed-- : newData.teleopFuelMissed--;
        } else if (action === 'Pickup') {
            if (location === 'Ground') newData.fuelIntakeGround++;
            else newData.fuelIntakeSource++;
        }
      }
      
      if (isAutoPhase && !prev.leaveLine && (action === 'Score' || action === 'Pickup')) {
        newData.leaveLine = true;
      }

      const listName = phase === MatchPhase.Auto ? 'autoEvents' : 'teleopEvents';
      newData[listName] = [...prev[listName], event];
      return newData;
    });
  }, [phase, setMatchData]);

  // Press and hold score button
  const scoreButtonLongPress = useLongPress(
    () => addEvent('Score', GamePiece.Fuel, 'Hub'),
    {
      delay: 300,
      holdInterval: 100,
      onStart: () => {
        setIsHoldingScore(true);
        if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
      },
      onEnd: () => setIsHoldingScore(false),
      onHold: () => {
        if (navigator.vibrate) navigator.vibrate(5);
      }
    }
  );

  const handleUndo = useCallback(() => {
      setMatchData(prev => {
          const newData = { ...prev };
          const listName = phase === MatchPhase.Auto ? 'autoEvents' : 'teleopEvents';
          const events = [...prev[listName]];
          
          if (events.length === 0) return prev; 

          const lastEvent = events.pop();
          newData[listName] = events;

          if (lastEvent) {
               setLastAction(`Undo: ${lastEvent.action}`);
               const isAutoPhase = phase === MatchPhase.Auto;

               if (lastEvent.piece === GamePiece.Fuel) {
                    if (lastEvent.action === 'Score') {
                        isAutoPhase ? newData.autoFuelScored-- : newData.teleopFuelScored--;
                    } else if (lastEvent.action === 'Miss') {
                        isAutoPhase ? newData.autoFuelMissed++ : newData.teleopFuelMissed++;
                    } else if (lastEvent.action === 'Pickup') {
                        if (lastEvent.location === 'Ground') newData.fuelIntakeGround--;
                        else newData.fuelIntakeSource--;
                    }
               }
          }
          return newData;
      });
  }, [phase, setMatchData]);

  return (
    <div className="flex flex-col h-screen w-full bg-obsidian text-white overflow-hidden">
      
      {/* 1. TOP BAR: Status, Timer, Phase */}
      <div className="flex-none h-16 bg-obsidian-light border-b border-slate-800 flex items-center justify-between px-4 z-20 shadow-xl relative">
        <div className="flex items-center gap-3">
             <div className={`px-3 py-1.5 rounded-lg font-black uppercase tracking-wider flex items-center gap-2 text-sm ${isAuto ? 'bg-purple-900 text-purple-300' : 'bg-blue-900 text-blue-300'}`}>
                {isAuto ? <Play size={16} fill="currentColor" /> : <FastForward size={16} fill="currentColor" />}
                {isAuto ? 'AUTO' : 'TELE'}
            </div>
            <div className="flex flex-col">
                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Team {matchData.teamNumber}</span>
                 <span className="text-xs text-slate-300 font-medium truncate max-w-[100px]">{lastAction || 'Ready'}</span>
            </div>
        </div>

        {/* Timer Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
             <div className={`h-full ${timerWarning ? 'bg-red-500' : (isAuto ? 'bg-purple-500' : 'bg-blue-500')} transition-all duration-1000 ease-linear`} style={{ width: '100%' }}></div>
        </div>

        <button 
             onClick={() => setView(isAuto ? 'TELEOP_SCORING' : 'ENDGAME_SCORING')}
             className={`px-4 py-2 rounded-lg font-black flex items-center gap-2 transition-all ${timerWarning ? 'bg-red-600 animate-pulse' : 'bg-slate-700'}`}
        >
            {isAuto ? 'TELEOP' : 'ENDGAME'} <ArrowRight size={18} />
        </button>
      </div>

      {/* 2. MIDDLE ZONE: Modifiers & Miss */}
      <div className="flex-none h-24 grid grid-cols-4 gap-1 p-1 bg-slate-900">
          <button 
            onClick={handleUndo} 
            disabled={currentPhaseEvents.length === 0}
            className="col-span-1 bg-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-400 active:bg-slate-700 disabled:opacity-30"
          >
              <Undo2 size={24} />
              <span className="text-[10px] font-bold uppercase mt-1">Undo</span>
          </button>

          <button 
             onClick={() => addEvent('Miss', GamePiece.Fuel, 'Hub')}
             className="col-span-2 bg-red-900/30 border border-red-900/50 rounded-lg flex flex-col items-center justify-center text-red-400 active:bg-red-900/50"
          >
              <span className="text-2xl font-black">{missHubCount}</span>
              <span className="text-[10px] font-bold uppercase">Missed</span>
          </button>

          {isAuto ? (
               <button 
                  className={`col-span-1 rounded-lg flex flex-col items-center justify-center transition-all active:bg-slate-700 ${matchData.leaveLine ? 'bg-matcha text-obsidian' : 'bg-slate-800 text-slate-500'}`}
                  onClick={() => setMatchData(prev => ({...prev, leaveLine: !prev.leaveLine}))}
              >
                  <span className="text-xs font-black uppercase text-center leading-tight">Leave<br/>Line</span>
               </button>
          ) : (
            <div className="col-span-1 bg-slate-800 rounded-lg flex items-center justify-center">
                 <Target size={20} className="text-slate-600" />
            </div>
          )}
      </div>

      {/* 3. THUMB ZONE: Primary Actions */}
      <div className="flex-1 grid grid-cols-2 gap-1 p-1 bg-slate-900">
          
          {/* Left Column: Intake */}
          <div className="flex flex-col gap-1">
              <button 
                  onClick={() => addEvent('Pickup', GamePiece.Fuel, 'Ground')}
                  className="flex-1 bg-slate-800 rounded-xl flex flex-col items-center justify-center active:scale-[0.98] transition-transform active:bg-slate-700"
              >
                  <ArrowDown size={32} className="text-slate-500 mb-1" />
                  <span className="text-3xl font-black">{groundIntakeCount}</span>
                  <span className="text-xs font-bold text-slate-500 uppercase">Ground</span>
              </button>
              <button 
                  onClick={() => addEvent('Pickup', GamePiece.Fuel, 'Outpost')}
                  className="flex-1 bg-slate-800 rounded-xl flex flex-col items-center justify-center active:scale-[0.98] transition-transform active:bg-slate-700"
              >
                  <Package size={32} className="text-slate-500 mb-1" />
                  <span className="text-3xl font-black">{outpostIntakeCount}</span>
                  <span className="text-xs font-bold text-slate-500 uppercase">Source</span>
              </button>
          </div>

          {/* Right Column: SCORE (Massive) */}
          <button 
              onClick={() => addEvent('Score', GamePiece.Fuel, 'Hub')}
              {...scoreButtonLongPress}
              className={`bg-matcha rounded-xl flex flex-col items-center justify-center active:scale-[0.98] transition-all relative overflow-hidden group shadow-[0_0_30px_rgba(168,198,108,0.15)] ${isHoldingScore ? 'scale-95 shadow-[0_0_50px_rgba(168,198,108,0.4)]' : ''}`}
          >
               <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
               <Target size={64} className="text-obsidian mb-4 opacity-80" />
               <span className="text-7xl font-black text-obsidian leading-none">{scoreHubCount}</span>
               <span className="text-sm font-black text-obsidian uppercase tracking-widest mt-2 bg-black/10 px-4 py-1 rounded-full">
                 {isHoldingScore ? 'HOLD' : 'SCORE'}
               </span>
          </button>
      </div>
    </div>
  );
};