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
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-obsidian overflow-y-auto">
      <div className="flex-1 w-full max-w-xl mx-auto p-6 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center mb-6">
             <button onClick={() => setView('DASHBOARD')} className="mr-4 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                <ArrowLeft size={24} />
             </button>
             <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">New Session</h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Pre-Match Configuration</p>
             </div>
        </div>

        <div className="space-y-6">
            
            {/* Alliance Toggle */}
             <div className="bg-white dark:bg-obsidian-light p-1 rounded-2xl flex shadow-sm border border-slate-200 dark:border-slate-800">
                <button 
                className={`flex-1 py-4 rounded-xl font-black text-lg transition-all ${matchData.alliance === Alliance.Red ? 'bg-red-600 text-white shadow-lg shadow-red-900/30' : 'text-slate-400'}`}
                onClick={() => updateField('alliance', Alliance.Red)}
                >RED</button>
                <button 
                className={`flex-1 py-4 rounded-xl font-black text-lg transition-all ${matchData.alliance === Alliance.Blue ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400'}`}
                onClick={() => updateField('alliance', Alliance.Blue)}
                >BLUE</button>
            </div>

            {/* Match & Initials */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Match #</label>
                    <input type="number" value={matchData.matchNumber} onChange={(e) => updateField('matchNumber', e.target.value)} placeholder="1" className="w-full h-16 rounded-2xl bg-white dark:bg-obsidian-light border border-slate-200 dark:border-slate-800 text-center text-2xl font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-matcha" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Scouter</label>
                    <input type="text" value={matchData.scouterInitials} onChange={(e) => updateField('scouterInitials', e.target.value.toUpperCase())} placeholder="XYZ" maxLength={3} className="w-full h-16 rounded-2xl bg-white dark:bg-obsidian-light border border-slate-200 dark:border-slate-800 text-center text-2xl font-black text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-matcha" />
                </div>
            </div>

            {/* Team Selection */}
             <div className="space-y-2 relative">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-2"><Hash size={12}/> Team</label>
                
                {/* Auto-Suggestions from Schedule */}
                {suggestedTeamsFromMatch.length > 0 && (
                    <div className="flex gap-2 mb-2 overflow-x-auto pb-2 no-scrollbar">
                        {suggestedTeamsFromMatch.map(t => (
                            <button key={t} onClick={() => selectTeam(t.toString())} className={`flex-none w-16 h-12 rounded-xl font-bold transition-all text-sm ${matchData.teamNumber === t.toString() ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-obsidian-light border border-slate-200 dark:border-slate-800 text-slate-500'}`}>{t}</button>
                        ))}
                    </div>
                )}
                
                <input type="number" value={matchData.teamNumber} onChange={handleTeamInputChange} placeholder="Team Number..." autoComplete="off" className="w-full h-20 pl-6 rounded-2xl bg-white dark:bg-obsidian-light border border-slate-200 dark:border-slate-800 text-4xl font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-matcha" />
                
                {suggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto mt-2">
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
                <div className="bg-white dark:bg-obsidian-light p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Info size={24} />
                    </div>
                    <div>
                        <h4 className="font-black text-lg text-slate-900 dark:text-white leading-none">{tbaInfo.nickname}</h4>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <MapPin size={10} /> {tbaInfo.city}, {tbaInfo.state_prov}
                        </div>
                    </div>
                </div>
            )}
            
            <div className="pt-8">
                <Button variant="success" fullWidth disabled={!isValid} onClick={() => setView('AUTO_START')} className="h-16 text-xl shadow-xl shadow-matcha/20">
                    START PRE-MATCH
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};