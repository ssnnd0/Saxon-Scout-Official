import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../components/Button';
import { ViewState, MatchData, Team, PitData } from '../types';
import { getMatches, getTeams, getPitData } from '../services/storageService';
import { generateStrategySummary, generateTeamProfile } from '../services/geminiService';
import { syncService } from '../services/syncService';
import { fetchTeamDetails, TBATeamDetails } from '../services/tbaService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Search, Trophy, TrendingUp, AlertTriangle, Filter, ArrowLeft, X, Users, Zap, Activity, Info, MapPin, ExternalLink, Sparkles, Scale, Cpu, Settings2, FileText, Clipboard, Battery, Crosshair } from 'lucide-react';
import { parse } from 'marked';

interface DataViewProps {
  setView: (view: ViewState) => void;
}

export const DataView: React.FC<DataViewProps> = ({ setView }) => {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [cachedTeams, setCachedTeams] = useState<Team[]>([]);
  const [allPitData, setAllPitData] = useState<PitData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filterAlliance, setFilterAlliance] = useState<'All' | 'Red' | 'Blue'>('All');
  const [filterZone, setFilterZone] = useState<string>('All');

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'matches' | 'teams' | 'charts'>('teams');

  // Spotlight State
  const [spotlightTeam, setSpotlightTeam] = useState<string | null>(null);
  const [spotlightDetails, setSpotlightDetails] = useState<TBATeamDetails | null>(null);
  const [spotlightAiProfile, setSpotlightAiProfile] = useState<string | null>(null);
  const [spotlightLoading, setSpotlightLoading] = useState(false);
  const [modalTab, setModalTab] = useState<'overview' | 'specs'>('overview');

  useEffect(() => {
    const loadData = () => {
        setMatches(getMatches());
        setCachedTeams(getTeams());
        setAllPitData(getPitData());
    };

    loadData();
    
    const unsubscribe = syncService.onMatchesUpdated(() => {
        loadData();
    });

    return () => {
        unsubscribe();
    };
  }, []);

  // Fetch Spotlight Details
  useEffect(() => {
    if (spotlightTeam) {
        setModalTab('overview'); // Reset tab
        const fetchSpotlight = async () => {
            setSpotlightLoading(true);
            const [details, aiProfile] = await Promise.all([
                fetchTeamDetails(spotlightTeam),
                generateTeamProfile(spotlightTeam, matches)
            ]);
            setSpotlightDetails(details);
            setSpotlightAiProfile(aiProfile);
            setSpotlightLoading(false);
        };
        fetchSpotlight();
    } else {
        setSpotlightDetails(null);
        setSpotlightAiProfile(null);
    }
  }, [spotlightTeam]);

  const availableZones = useMemo(() => {
    const zones = new Set(matches.map(m => m.startingZone).filter(Boolean));
    return Array.from(zones).sort();
  }, [matches]);

  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      const team = cachedTeams.find(t => t.teamNumber.toString() === m.teamNumber);
      const nickname = team ? team.nameShort.toLowerCase() : '';

      const matchSearch = 
        m.teamNumber.includes(searchTerm) || 
        m.matchNumber.toString().includes(searchTerm) ||
        nickname.includes(searchTerm.toLowerCase()) ||
        (m.scouterInitials || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchAlliance = filterAlliance === 'All' || m.alliance === filterAlliance;
      const matchZone = filterZone === 'All' || m.startingZone === filterZone;

      return matchSearch && matchAlliance && matchZone;
    }).reverse();
  }, [matches, searchTerm, filterAlliance, filterZone, cachedTeams]);

  const stats = useMemo(() => {
    if (filteredMatches.length === 0) return null;
    
    const calculateScore = (m: MatchData) => {
        let score = (m.autoFuelScored * 1) + (m.teleopFuelScored * 1);
        if (m.autoTowerLevel === 'Level 1') score += 15;
        if (m.endgameTowerLevel === 'Level 1') score += 10;
        if (m.endgameTowerLevel === 'Level 2') score += 20;
        if (m.endgameTowerLevel === 'Level 3') score += 30;
        return score;
    };

    const scores = filteredMatches.map(calculateScore);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const climbRate = (filteredMatches.filter(m => m.endgameTowerLevel !== 'None' && m.endgameTowerLevel !== 'Failed').length / filteredMatches.length) * 100;
    
    let chartData = filteredMatches.map(m => ({
        name: `M${m.matchNumber}`,
        team: m.teamNumber,
        fuel: m.autoFuelScored + m.teleopFuelScored,
        score: calculateScore(m),
        climb: m.endgameTowerLevel !== 'None' && m.endgameTowerLevel !== 'Failed' ? 1 : 0
    })).reverse();

    return { avgScore, maxScore, climbRate, chartData };
  }, [filteredMatches]);

  const teamStats = useMemo(() => {
    const data: Record<string, { count: number, autoFuel: number, teleFuel: number, climb: number }> = {};
    
    filteredMatches.forEach(m => {
        if (!data[m.teamNumber]) {
            data[m.teamNumber] = { count: 0, autoFuel: 0, teleFuel: 0, climb: 0 };
        }
        const s = data[m.teamNumber];
        s.count++;
        s.autoFuel += m.autoFuelScored;
        s.teleFuel += m.teleopFuelScored;
        if (m.endgameTowerLevel !== 'None' && m.endgameTowerLevel !== 'Failed') {
            s.climb++;
        }
    });

    return Object.entries(data).map(([teamNum, d]) => {
        const teamInfo = cachedTeams.find(t => t.teamNumber.toString() === teamNum);
        return {
            teamNumber: teamNum,
            nickname: teamInfo ? teamInfo.nameShort : 'Unknown',
            matchesPlayed: d.count,
            avgAuto: d.autoFuel / d.count,
            avgTeleop: d.teleFuel / d.count,
            avgTotal: (d.autoFuel + d.teleFuel) / d.count,
            climbRate: (d.climb / d.count) * 100
        };
    }).sort((a, b) => b.avgTotal - a.avgTotal);
  }, [filteredMatches, cachedTeams]);

  const handleAiAnalysis = async () => {
    setLoading(true);
    const result = await generateStrategySummary(filteredMatches);
    setAiAnalysis(result);
    setLoading(false);
  };

  // Helper to get pit data for the spotlight team
  const spotlightPitData = useMemo(() => {
    if (!spotlightTeam) return null;
    return allPitData.find(p => p.teamNumber === spotlightTeam);
  }, [spotlightTeam, allPitData]);

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-obsidian text-slate-900 dark:text-white transition-colors">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-obsidian-light/80 backdrop-blur sticky top-0 z-50 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center shadow-lg">
        <div className="flex items-center gap-4">
             <button onClick={() => setView('DASHBOARD')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <ArrowLeft size={24} />
             </button>
             <div>
                <h2 className="text-2xl font-black tracking-tighter">DATA ANALYZER</h2>
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mt-1 w-fit">
                    <button onClick={() => setActiveTab('teams')} className={`px-4 py-1 rounded text-xs font-bold transition-colors ${activeTab === 'teams' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>Teams</button>
                    <button onClick={() => setActiveTab('charts')} className={`px-4 py-1 rounded text-xs font-bold transition-colors ${activeTab === 'charts' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>Charts</button>
                    <button onClick={() => setActiveTab('matches')} className={`px-4 py-1 rounded text-xs font-bold transition-colors ${activeTab === 'matches' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>Matches</button>
                </div>
             </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="Search team or initials..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white pl-10 pr-4 py-2 rounded-lg outline-none focus:border-matcha transition-all"
                />
            </div>
             <select 
                value={filterAlliance} 
                onChange={(e) => setFilterAlliance(e.target.value as any)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-matcha"
            >
                <option value="All">All Alliances</option>
                <option value="Red">Red Alliance</option>
                <option value="Blue">Blue Alliance</option>
            </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        
        {/* KPI Cards */}
        {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border-l-4 border-fuel shadow-md group transition-all hover:scale-[1.02]">
                    <div className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold flex items-center gap-2 mb-1">
                        <TrendingUp size={14} /> Avg Score
                    </div>
                    <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.avgScore.toFixed(1)}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border-l-4 border-gold shadow-md group transition-all hover:scale-[1.02]">
                    <div className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold flex items-center gap-2 mb-1">
                        <Trophy size={14} /> Max Score
                    </div>
                    <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.maxScore}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border-l-4 border-tower shadow-md group transition-all hover:scale-[1.02]">
                    <div className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold flex items-center gap-2 mb-1">
                        <AlertTriangle size={14} /> Climb %
                    </div>
                    <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.climbRate.toFixed(0)}%</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl flex items-center justify-center shadow-md">
                     <Button 
                        variant="ghost" 
                        onClick={handleAiAnalysis}
                        disabled={loading}
                        className="w-full h-full border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-matcha dark:hover:border-matcha hover:text-matcha group transition-all"
                    >
                        <Zap size={18} className={`mr-2 transition-all ${loading ? 'animate-pulse' : 'group-hover:scale-125'}`} />
                        {loading ? 'Thinking...' : '✨ Ask Gemini'}
                    </Button>
                </div>
            </div>
        )}

        {/* AI Output */}
        {aiAnalysis && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/30 p-6 rounded-2xl backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-2 text-lg">✨ Strategic Insight</h3>
                    <button onClick={() => setAiAnalysis(null)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-full hover:bg-black/10 transition-colors"><X size={20}/></button>
                </div>
                <div 
                  className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: parse(aiAnalysis) as string }}
                ></div>
            </div>
        )}

        {/* Tables & Cards */}
        {activeTab === 'teams' && (
             <div className="space-y-4">
                 <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                     <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Users size={20} className="text-indigo-500 dark:text-indigo-400"/> Team Performance</h3>
                     <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Based on {filteredMatches.length} matches</span>
                 </div>
                 
                 {/* Desktop Table */}
                 <div className="hidden md:block bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                                    <th className="p-4">Rank</th>
                                    <th className="p-4">Team</th>
                                    <th className="p-4 text-center">Avg Fuel</th>
                                    <th className="p-4 text-center">Avg Climb %</th>
                                    <th className="p-4 text-center">Matches</th>
                                    <th className="p-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {teamStats.map((t, i) => (
                                    <tr key={t.teamNumber} className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => setSpotlightTeam(t.teamNumber)}>
                                        <td className="p-4 font-mono text-slate-500">#{i + 1}</td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-black text-xl text-slate-900 dark:text-white leading-none">{t.teamNumber}</span>
                                                <span className="text-xs text-slate-500 font-bold uppercase tracking-tight truncate max-w-[180px]">{t.nickname}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <span className="font-black text-2xl text-fuel-dark dark:text-fuel leading-none">{t.avgTotal.toFixed(1)}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">({t.avgAuto.toFixed(1)}A)</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className={`h-full transition-all duration-1000 ${t.climbRate > 80 ? 'bg-emerald-500' : t.climbRate > 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{width: `${t.climbRate}%`}}></div>
                                                </div>
                                                <span className="font-bold text-slate-900 dark:text-white min-w-[3ch]">{t.climbRate.toFixed(0)}%</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center font-mono text-slate-500 dark:text-slate-400 font-bold">{t.matchesPlayed}</td>
                                        <td className="p-4 text-right">
                                            <Info size={18} className="inline text-slate-300 group-hover:text-matcha transition-colors" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 </div>

                 {/* Mobile Cards */}
                 <div className="md:hidden grid grid-cols-1 gap-3">
                     {teamStats.map((t, i) => (
                        <div key={t.teamNumber} onClick={() => setSpotlightTeam(t.teamNumber)} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between active:scale-[0.98] transition-transform">
                            <div className="flex items-center gap-4">
                                <span className="text-xl font-mono text-slate-400 font-black">#{i + 1}</span>
                                <div>
                                    <div className="text-2xl font-black text-slate-900 dark:text-white leading-none">{t.teamNumber}</div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t.nickname}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-black text-fuel-dark dark:text-fuel leading-none">{t.avgTotal.toFixed(1)} <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Fuel</span></div>
                                <div className={`text-xs font-bold ${t.climbRate > 50 ? 'text-emerald-500' : 'text-slate-500'}`}>{t.climbRate.toFixed(0)}% Climb</div>
                            </div>
                        </div>
                     ))}
                 </div>

                 {teamStats.length === 0 && (
                     <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">No teams found for the current search/filter.</div>
                 )}
             </div>
        )}

        {/* Charts Container */}
        {activeTab === 'charts' && stats && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 h-[500px] w-full shadow-lg">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" vertical={false} />
                        <XAxis dataKey="name" stroke="currentColor" className="text-slate-500 dark:text-slate-400" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="currentColor" className="text-slate-500 dark:text-slate-400" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip 
                            cursor={{ fill: 'rgba(168, 198, 108, 0.05)' }}
                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', borderColor: '#334155', color: '#f8fafc', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}
                            itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                        />
                        <Legend iconType="circle" />
                        <Bar dataKey="score" fill="var(--color-matcha-default)" name="Total Points" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar dataKey="fuel" fill="#D4AF37" name="Fuel Count" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        )}
        
        {activeTab === 'matches' && (
             <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xl">
                <table className="hidden md:table w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                            <th className="p-4">Match</th>
                            <th className="p-4">Team</th>
                            <th className="p-4 text-center">Total Fuel</th>
                            <th className="p-4 text-right">Endgame</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredMatches.map((m, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <td className="p-4 font-mono text-slate-600 dark:text-slate-300 font-bold">Q{m.matchNumber}</td>
                                <td className={`p-4 font-bold text-lg ${m.alliance === 'Red' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                    {m.teamNumber}
                                    <span className="text-[10px] text-slate-400 font-bold uppercase ml-3 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">{m.scouterInitials}</span>
                                </td>
                                <td className="p-4 text-center text-fuel-dark dark:text-fuel font-black text-2xl">{m.autoFuelScored + m.teleopFuelScored}</td>
                                <td className="p-4 text-right">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${m.endgameTowerLevel === 'Failed' ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300' : (m.endgameTowerLevel !== 'None' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400')}`}>
                                        {m.endgameTowerLevel}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Mobile Match List */}
                <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredMatches.map((m, i) => (
                        <div key={i} className="p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-mono font-bold text-slate-400 text-xs">QUAL MATCH {m.matchNumber}</span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded tracking-widest ${m.alliance === 'Red' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{m.alliance.toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="text-2xl font-black text-slate-900 dark:text-white">{m.teamNumber}</div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-fuel-dark dark:text-fuel mr-3">{m.autoFuelScored + m.teleopFuelScored}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight ${m.endgameTowerLevel === 'Failed' ? 'bg-red-100 text-red-600' : (m.endgameTowerLevel !== 'None' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500')}`}>
                                        {m.endgameTowerLevel === 'None' ? '-' : m.endgameTowerLevel.replace('Level ', 'L')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* Team Spotlight Modal */}
      {spotlightTeam && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSpotlightTeam(null)}></div>
              
              <div className="relative w-full max-w-2xl bg-white dark:bg-obsidian-light border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in slide-in-from-bottom-4 duration-300">
                  
                  {/* Modal Header */}
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-4 relative">
                      <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-matcha rounded-2xl flex items-center justify-center font-black text-2xl text-obsidian shadow-lg shadow-matcha/20">
                                  {spotlightTeam}
                              </div>
                              <div>
                                  <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                      {spotlightDetails?.nickname || cachedTeams.find(t => t.teamNumber.toString() === spotlightTeam)?.nameShort || 'Team Loading...'}
                                  </h2>
                                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-bold">
                                      <MapPin size={14}/> {spotlightDetails ? `${spotlightDetails.city}, ${spotlightDetails.state_prov}` : 'Location unknown'}
                                  </div>
                              </div>
                          </div>
                          <button onClick={() => setSpotlightTeam(null)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                              <X size={24} />
                          </button>
                      </div>

                      {/* Modal Tab Switcher */}
                      <div className="flex gap-2">
                        <button 
                            onClick={() => setModalTab('overview')} 
                            className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${modalTab === 'overview' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        >
                            Overview
                        </button>
                        <button 
                            onClick={() => setModalTab('specs')} 
                            className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${modalTab === 'specs' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        >
                            Robot Specs (Pit)
                        </button>
                      </div>
                  </div>

                  {/* Modal Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      
                      {/* --- OVERVIEW TAB --- */}
                      {modalTab === 'overview' && (
                          <>
                            {/* AI Spotlight Section */}
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 p-5 relative overflow-hidden group">
                                <Sparkles className="absolute top-2 right-2 text-indigo-400 opacity-20 group-hover:opacity-40 transition-opacity" size={40}/>
                                <h3 className="text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                    <Zap size={14} className="fill-current"/> Gemini Spotlight
                                </h3>
                                {spotlightLoading ? (
                                    <div className="animate-pulse space-y-2">
                                        <div className="h-4 bg-indigo-200 dark:bg-indigo-800 rounded w-3/4"></div>
                                        <div className="h-4 bg-indigo-200 dark:bg-indigo-800 rounded w-1/2"></div>
                                    </div>
                                ) : (
                                    <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed italic">
                                        "{spotlightAiProfile || 'Generating profile...'}"
                                    </p>
                                )}
                            </div>

                            {/* Performance Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Fuel</div>
                                    <div className="text-3xl font-black text-fuel-dark dark:text-fuel">
                                        {teamStats.find(t => t.teamNumber === spotlightTeam)?.avgTotal.toFixed(1)}
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Climb Rate</div>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white">
                                        {teamStats.find(t => t.teamNumber === spotlightTeam)?.climbRate.toFixed(0)}%
                                    </div>
                                </div>
                                <div className="hidden md:block bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TBA Rank</div>
                                    <div className="text-3xl font-black text-amber-500">
                                        -
                                    </div>
                                    <div className="text-[8px] text-slate-500 font-bold uppercase mt-1">Live from TBA</div>
                                </div>
                            </div>

                            {/* Match History Small List */}
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Scouting Logs</h3>
                                <div className="space-y-2">
                                    {matches.filter(m => m.teamNumber === spotlightTeam).map((m, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                    <span className="font-mono text-slate-400 text-xs">M{m.matchNumber}</span>
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${m.alliance === 'Red' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                        {m.alliance.toUpperCase()}
                                                    </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <div className="text-sm font-black">{m.autoFuelScored + m.teleopFuelScored} <span className="text-[10px] text-slate-500">FUEL</span></div>
                                                    </div>
                                                    <div className={`w-3 h-3 rounded-full ${m.endgameTowerLevel !== 'None' && m.endgameTowerLevel !== 'Failed' ? 'bg-emerald-500' : 'bg-slate-400 opacity-20'}`}></div>
                                            </div>
                                        </div>
                                    ))}
                                    {matches.filter(m => m.teamNumber === spotlightTeam).length === 0 && (
                                        <div className="text-center text-slate-400 text-sm py-4">No match data collected.</div>
                                    )}
                                </div>
                            </div>
                          </>
                      )}

                      {/* --- ROBOT SPECS TAB (PIT DATA) --- */}
                      {modalTab === 'specs' && (
                          <div className="space-y-4">
                              {spotlightPitData ? (
                                  <>
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Physical Stats */}
                                        <div className="col-span-2 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                                             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Scale size={14}/> Build Specs</h3>
                                             <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                                                 <div>
                                                     <div className="text-[10px] text-slate-500 uppercase font-bold">Drivetrain</div>
                                                     <div className="font-bold text-slate-900 dark:text-white">{spotlightPitData.drivetrain}</div>
                                                 </div>
                                                 <div>
                                                     <div className="text-[10px] text-slate-500 uppercase font-bold">Weight</div>
                                                     <div className="font-bold text-slate-900 dark:text-white">{spotlightPitData.weight} lbs</div>
                                                 </div>
                                                 <div className="col-span-2">
                                                     <div className="text-[10px] text-slate-500 uppercase font-bold">Motors</div>
                                                     <div className="font-bold text-slate-900 dark:text-white text-sm">{spotlightPitData.motors || 'N/A'}</div>
                                                 </div>
                                             </div>
                                        </div>

                                        {/* Capabilities */}
                                        <div className="col-span-2 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                                             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Cpu size={14}/> Capabilities</h3>
                                             <div className="grid grid-cols-2 gap-4">
                                                 <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 text-center">
                                                     <div className="text-[10px] text-slate-500 uppercase font-bold">Intake</div>
                                                     <div className="font-bold text-matcha-dark dark:text-matcha">{spotlightPitData.intake}</div>
                                                 </div>
                                                 <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 text-center">
                                                     <div className="text-[10px] text-slate-500 uppercase font-bold">Climb</div>
                                                     <div className="font-bold text-gold-dark dark:text-gold">{spotlightPitData.climb}</div>
                                                 </div>
                                                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 text-center">
                                                     <div className="text-[10px] text-slate-500 uppercase font-bold">Shooter</div>
                                                     <div className="font-bold text-slate-900 dark:text-white text-xs truncate">{spotlightPitData.shooters || 'N/A'}</div>
                                                 </div>
                                                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 text-center">
                                                     <div className="text-[10px] text-slate-500 uppercase font-bold">Archetype</div>
                                                     <div className="font-bold text-indigo-500">{spotlightPitData.archetype}</div>
                                                 </div>
                                             </div>
                                        </div>

                                        {/* Notes */}
                                        <div className="col-span-2 bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-800/30">
                                            <h3 className="text-xs font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest flex items-center gap-2 mb-2"><FileText size={14}/> Scouter Notes</h3>
                                            <p className="text-sm text-slate-800 dark:text-slate-200 italic">"{spotlightPitData.notes || 'No notes provided.'}"</p>
                                            <div className="mt-2 text-[10px] text-slate-400 font-bold uppercase text-right">- {spotlightPitData.scouterName}</div>
                                        </div>
                                    </div>
                                  </>
                              ) : (
                                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                                          <Clipboard size={32} />
                                      </div>
                                      <div>
                                          <h3 className="font-bold text-slate-900 dark:text-white">No Pit Data Found</h3>
                                          <p className="text-sm text-slate-500">This team hasn't been pit scouted yet.</p>
                                      </div>
                                      <Button 
                                        variant="outline" 
                                        onClick={() => {
                                            setSpotlightTeam(null);
                                            setView('PIT_SCOUTING');
                                        }}
                                      >
                                          Go to Pit Scouting
                                      </Button>
                                  </div>
                              )}
                          </div>
                      )}

                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                       <Button variant="secondary" fullWidth className="h-12 text-sm" onClick={() => window.open(`https://www.thebluealliance.com/team/${spotlightTeam}`, '_blank')}>
                           <ExternalLink size={16} className="mr-2"/> View on TBA
                       </Button>
                       <Button variant="primary" fullWidth className="h-12 text-sm" onClick={() => setSpotlightTeam(null)}>
                           Close Profile
                       </Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};