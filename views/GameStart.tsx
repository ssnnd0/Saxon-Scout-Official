import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Alliance, MatchData, ViewState, Team, ScheduledMatch } from '../types';
import { getSchedule, getTeams, getUserPreferences } from '../services/storageService';
import { fetchTeamDetails, TBATeamDetails } from '../services/tbaService';
import { ArrowLeft, User, Hash, Users, MapPin, Info } from 'lucide-react';

interface GameStartProps {
  matchData: MatchData;
  setMatchData: React.Dispatch<React.SetStateAction<MatchData>>;
  setView: (view: ViewState) => void;
}

export const GameStart: React.FC<GameStartProps> = ({ matchData, setMatchData, setView }) => {
  const [cachedSchedule, setCachedSchedule] = useState<ScheduledMatch[]>([]);
  const [cachedTeams, setCachedTeams] = useState<Team[]>([]);
  const [suggestions, setSuggestions] = useState<Team[]>([]);
  const [suggestedTeamsFromMatch, setSuggestedTeamsFromMatch] = useState<number[]>([]);
  const [tbaInfo, setTbaInfo] = useState<TBATeamDetails | null>(null);

  useEffect(() => {
    setCachedSchedule(getSchedule());
    setCachedTeams(getTeams());
    
    if (!matchData.scouterInitials) {
        const prefs = getUserPreferences();
        if (prefs.defaultInitials) {
            setMatchData(prev => ({ ...prev, scouterInitials: prefs.defaultInitials }));
        }
    }
  }, []);

  useEffect(() => {
    if (matchData.matchNumber && cachedSchedule.length > 0) {
        const matchNum = parseInt(matchData.matchNumber);
        const match = cachedSchedule.find(m => m.matchNumber === matchNum);
        if (match) {
            const alliancePrefix = matchData.alliance === Alliance.Red ? 'Red' : 'Blue';
            const teams = match.teams
                .filter(t => t.station.startsWith(alliancePrefix))
                .map(t => t.teamNumber);
            setSuggestedTeamsFromMatch(teams);
        } else {
            setSuggestedTeamsFromMatch([]);
        }
    } else {
        setSuggestedTeamsFromMatch([]);
    }
  }, [matchData.matchNumber, matchData.alliance, cachedSchedule]);

  // Fetch TBA Details on team change
  useEffect(() => {
    const timer = setTimeout(async () => {
        if (matchData.teamNumber && matchData.teamNumber.length >= 2) {
            const details = await fetchTeamDetails(matchData.teamNumber);
            setTbaInfo(details);
        } else {
            setTbaInfo(null);
        }
    }, 500);
    return () => clearTimeout(timer);
  }, [matchData.teamNumber]);

  const updateField = (field: keyof MatchData, value: any) => {
    setMatchData(prev => ({ ...prev, [field]: value }));
  };

  const handleTeamInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    updateField('teamNumber', val);
    
    if (val.length > 0) {
        const filtered = cachedTeams.filter(t => 
            t.teamNumber.toString().startsWith(val) || 
            t.nameShort.toLowerCase().includes(val.toLowerCase())
        ).slice(0, 5);
        setSuggestions(filtered);
    } else {
        setSuggestions([]);
    }
  };

  const selectTeam = (teamNum: string) => {
    updateField('teamNumber', teamNum);
    setSuggestions([]);
  };

  const isValid = matchData.matchNumber && matchData.teamNumber && matchData.scouterInitials;

  return (
    <div className="flex flex-col h-full w-full p-4 md:p-12 items-center justify-center bg-slate-50 dark:bg-obsidian overflow-y-auto">
      <div className="w-full max-w-4xl bg-white/90 dark:bg-obsidian-light/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-3xl p-6 md:p-8 shadow-2xl">
        
        <div className="flex items-center mb-8 pb-6 border-b border-slate-200 dark:border-slate-700">
             <button onClick={() => setView('DASHBOARD')} className="mr-6 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <ArrowLeft size={24} />
             </button>
             <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white">Match Setup</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Configure details before starting</p>
             </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2"><Users size={16}/> Alliance</label>
                    <div className="flex gap-4 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                        <button 
                        className={`flex-1 py-4 rounded-lg font-black text-lg transition-all ${matchData.alliance === Alliance.Red ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800'}`}
                        onClick={() => updateField('alliance', Alliance.Red)}
                        >RED</button>
                        <button 
                        className={`flex-1 py-4 rounded-lg font-black text-lg transition-all ${matchData.alliance === Alliance.Blue ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800'}`}
                        onClick={() => updateField('alliance', Alliance.Blue)}
                        >BLUE</button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input label="Match #" type="number" value={matchData.matchNumber} onChange={(e) => updateField('matchNumber', e.target.value)} placeholder="1" className="text-center font-mono text-xl" />
                    <Input label="Initials" type="text" value={matchData.scouterInitials} onChange={(e) => updateField('scouterInitials', e.target.value.toUpperCase())} placeholder="XYZ" className="text-center uppercase font-bold text-xl" maxLength={3} />
                </div>
            </div>

            <div className="space-y-6 flex flex-col">
                 <div className="space-y-2 relative">
                    <label className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2"><Hash size={16}/> Team Selection</label>
                    {suggestedTeamsFromMatch.length > 0 && (
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
                            {suggestedTeamsFromMatch.map(t => (
                                <button key={t} onClick={() => selectTeam(t.toString())} className={`flex-none px-6 py-3 rounded-lg font-bold transition-all ${matchData.teamNumber === t.toString() ? 'bg-indigo-600 text-white ring-2 ring-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>{t}</button>
                            ))}
                        </div>
                    )}
                    <Input type="number" value={matchData.teamNumber} onChange={handleTeamInputChange} placeholder="Team Number..." autoComplete="off" className="text-4xl font-black h-20 pl-6" />
                    {suggestions.length > 0 && (
                        <div className="absolute z-50 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-b-xl shadow-2xl max-h-48 overflow-y-auto mt-1">
                            {suggestions.map(team => (
                                <div key={team.teamNumber} className="px-6 py-4 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700/50 last:border-0 flex justify-between items-center" onClick={() => selectTeam(team.teamNumber.toString())}>
                                    <span className="font-bold text-lg">{team.teamNumber}</span>
                                    <span className="text-slate-500 dark:text-slate-400 text-sm">{team.nameShort}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* TBA Team Card Preview */}
                {tbaInfo && (
                    <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-black text-xl text-indigo-600 dark:text-indigo-400">{tbaInfo.nickname}</h4>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">TBA Profile</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                <MapPin size={14} className="text-slate-400" />
                                {tbaInfo.city}, {tbaInfo.state_prov}, {tbaInfo.country}
                            </div>
                            {tbaInfo.motto && (
                                <div className="flex items-start gap-2 text-[10px] text-slate-400 italic leading-tight">
                                    <Info size={12} className="shrink-0 mt-0.5" />
                                    "{tbaInfo.motto}"
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                <div className="pt-4 mt-auto">
                    <Button variant="success" fullWidth disabled={!isValid} onClick={() => setView('AUTO_START')} className="h-16 text-xl shadow-xl shadow-matcha/20">START PRE-MATCH</Button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};