import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../components/Button';
import { ViewState, MatchData } from '../types';
import { getMatches } from '../services/storageService';
import { generateStrategySummary } from '../services/geminiService';
import { syncService } from '../services/syncService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Search, Trophy, TrendingUp, AlertTriangle, Filter, ArrowLeft, X, Users, Zap, Activity } from 'lucide-react';
import { parse } from 'marked';

interface DataViewProps {
  setView: (view: ViewState) => void;
}

export const DataView: React.FC<DataViewProps> = ({ setView }) => {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filterAlliance, setFilterAlliance] = useState<'All' | 'Red' | 'Blue'>('All');
  const [filterZone, setFilterZone] = useState<string>('All');

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'matches' | 'teams' | 'charts'>('teams');

  useEffect(() => {
    const loadData = () => {
        setMatches(getMatches());
    };

    loadData();
    
    // Subscribe to real-time updates from other scouts
    const unsubscribe = syncService.onMatchesUpdated(() => {
        loadData();
    });

    return () => {
        unsubscribe();
    };
  }, []);

  const availableZones = useMemo(() => {
    const zones = new Set(matches.map(m => m.startingZone).filter(Boolean));
    return Array.from(zones).sort();
  }, [matches]);

  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      const matchSearch = 
        m.teamNumber.includes(searchTerm) || 
        m.matchNumber.toString().includes(searchTerm) ||
        (m.scouterInitials || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchAlliance = filterAlliance === 'All' || m.alliance === filterAlliance;
      const matchZone = filterZone === 'All' || m.startingZone === filterZone;

      return matchSearch && matchAlliance && matchZone;
    }).reverse();
  }, [matches, searchTerm, filterAlliance, filterZone]);

  const stats = useMemo(() => {
    if (filteredMatches.length === 0) return null;
    
    // Scoring: Fuel = 1, Tower L1(10)/L2(20)/L3(30) + Auto L1(15)
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

    return Object.entries(data).map(([team, d]) => ({
        teamNumber: team,
        matchesPlayed: d.count,
        avgAuto: d.autoFuel / d.count,
        avgTeleop: d.teleFuel / d.count,
        avgTotal: (d.autoFuel + d.teleFuel) / d.count,
        climbRate: (d.climb / d.count) * 100
    })).sort((a, b) => b.avgTotal - a.avgTotal);
  }, [filteredMatches]);

  const handleAiAnalysis = async () => {
    setLoading(true);
    const result = await generateStrategySummary(filteredMatches);
    setAiAnalysis(result);
    setLoading(false);
  };

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
                    <button onClick={() => setActiveTab('teams')} className={`px-4 py-1 rounded text-xs font-bold transition-colors ${activeTab === 'teams' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400'}`}>Teams</button>
                    <button onClick={() => setActiveTab('charts')} className={`px-4 py-1 rounded text-xs font-bold transition-colors ${activeTab === 'charts' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400'}`}>Charts</button>
                    <button onClick={() => setActiveTab('matches')} className={`px-4 py-1 rounded text-xs font-bold transition-colors ${activeTab === 'matches' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400'}`}>Matches</button>
                </div>
             </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white pl-10 pr-4 py-2 rounded-lg outline-none focus:border-indigo-500"
                />
            </div>
             <select 
                value={filterAlliance} 
                onChange={(e) => setFilterAlliance(e.target.value as any)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg px-3 py-2 outline-none"
            >
                <option value="All">All Alliances</option>
                <option value="Red">Red</option>
                <option value="Blue">Blue</option>
            </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        
        {/* KPI Cards */}
        {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border-l-4 border-fuel shadow-md">
                    <div className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold flex items-center gap-2 mb-1">
                        <TrendingUp size={14} /> Avg Score
                    </div>
                    <div className="text-4xl font-black text-slate-900 dark:text-white">{stats.avgScore.toFixed(1)}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border-l-4 border-amber-500 shadow-md">
                    <div className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold flex items-center gap-2 mb-1">
                        <Trophy size={14} /> Max Score
                    </div>
                    <div className="text-4xl font-black text-slate-900 dark:text-white">{stats.maxScore}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border-l-4 border-tower shadow-md">
                    <div className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold flex items-center gap-2 mb-1">
                        <AlertTriangle size={14} /> Climb %
                    </div>
                    <div className="text-4xl font-black text-slate-900 dark:text-white">{stats.climbRate.toFixed(0)}%</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl flex items-center justify-center shadow-md">
                     <Button 
                        variant="ghost" 
                        onClick={handleAiAnalysis}
                        disabled={loading}
                        className="w-full h-full border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                        {loading ? 'Thinking...' : '✨ Ask Gemini'}
                    </Button>
                </div>
            </div>
        )}

        {/* AI Output */}
        {aiAnalysis && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/30 p-6 rounded-2xl backdrop-blur-sm">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-2 text-lg">✨ Strategic Insight</h3>
                    <button onClick={() => setAiAnalysis(null)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={20}/></button>
                </div>
                <div 
                  className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: parse(aiAnalysis) as string }}
                ></div>
            </div>
        )}

        {/* Tables */}
        {activeTab === 'teams' && (
             <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xl">
             <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                 <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Users size={20} className="text-indigo-500 dark:text-indigo-400"/> Team Performance Aggregates</h3>
                 <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Based on {filteredMatches.length} matches</span>
             </div>
             <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse min-w-[600px]">
                     <thead>
                         <tr className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                             <th className="p-4">Rank</th>
                             <th className="p-4">Team</th>
                             <th className="p-4 text-center">Avg Fuel</th>
                             <th className="p-4 text-center">Avg Climb %</th>
                             <th className="p-4 text-center">Matches</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                         {teamStats.map((t, i) => (
                             <tr key={t.teamNumber} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                 <td className="p-4 font-mono text-slate-500">#{i + 1}</td>
                                 <td className="p-4 font-bold text-xl text-slate-900 dark:text-white">
                                     {t.teamNumber}
                                 </td>
                                 <td className="p-4 text-center font-bold text-lg flex items-center justify-center gap-1">
                                    <span className="text-fuel-dark dark:text-fuel">{t.avgTotal.toFixed(1)}</span>
                                    <span className="text-xs text-slate-500 font-normal">({t.avgAuto.toFixed(1)} A)</span>
                                 </td>
                                 <td className="p-4 text-center font-bold text-lg">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div className={`h-full ${t.climbRate > 80 ? 'bg-emerald-500' : t.climbRate > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${t.climbRate}%`}}></div>
                                        </div>
                                        <span className="text-slate-900 dark:text-white">{t.climbRate.toFixed(0)}%</span>
                                    </div>
                                 </td>
                                 <td className="p-4 text-center font-mono text-slate-500 dark:text-slate-400">{t.matchesPlayed}</td>
                             </tr>
                         ))}
                         {teamStats.length === 0 && (
                             <tr>
                                 <td colSpan={5} className="p-8 text-center text-slate-500">No data matches your filters.</td>
                             </tr>
                         )}
                     </tbody>
                 </table>
             </div>
         </div>
        )}

        {/* Charts Container */}
        {activeTab === 'charts' && stats && (
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 h-[500px] w-full shadow-lg">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                        <XAxis dataKey="name" stroke="currentColor" className="text-slate-500 dark:text-slate-400" fontSize={12} />
                        <YAxis stroke="currentColor" className="text-slate-500 dark:text-slate-400" fontSize={12} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--tw-colors-slate-800)', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                            itemStyle={{ color: '#f8fafc' }}
                        />
                        <Legend />
                        <Bar dataKey="score" fill="#8b5cf6" name="Total Points" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="fuel" fill="#D4AF37" name="Fuel Count" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        )}
        
        {activeTab === 'matches' && (
             <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xl">
                <table className="w-full text-left border-collapse">
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
                                <td className="p-4 font-mono text-slate-600 dark:text-slate-300 font-bold">{m.matchNumber}</td>
                                <td className={`p-4 font-bold text-lg ${m.alliance === 'Red' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                    {m.teamNumber}
                                    <span className="text-xs text-slate-500 font-normal ml-2">{m.scouterInitials}</span>
                                </td>
                                <td className="p-4 text-center text-fuel-dark dark:text-fuel font-bold text-xl">{m.autoFuelScored + m.teleopFuelScored}</td>
                                <td className="p-4 text-right">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${m.endgameTowerLevel === 'Failed' ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300' : (m.endgameTowerLevel !== 'None' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400')}`}>
                                        {m.endgameTowerLevel}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
};