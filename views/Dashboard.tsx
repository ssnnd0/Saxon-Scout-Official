import React, { useEffect, useState } from 'react';
import { ViewState } from '../types';
import { getMatches } from '../services/storageService';
import { syncService } from '../services/syncService';
import { 
  Wifi, WifiOff, Database, Target, Settings as SettingsIcon, 
  LogOut, FileText, BarChart2, Plus, ClipboardList, Clock, ArrowRight
} from 'lucide-react';

interface DashboardProps {
  setView: (view: ViewState) => void;
  user: string | null;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setView, user, onLogout }) => {
  const [matchCount, setMatchCount] = useState(0);
  const [isSynced, setIsSynced] = useState(false);
  const [lastMatch, setLastMatch] = useState<any>(null);

  useEffect(() => {
    const refreshData = async () => {
        const matches = await getMatches();
        setMatchCount(matches.length);
        if (matches.length > 0) {
            setLastMatch(matches[matches.length - 1]);
        }
    };

    refreshData();
    
    // Init Sync Service
    syncService.init();
    syncService.onStatusChange((status) => {
        setIsSynced(status);
    });
    
    // Subscribe to real-time updates
    const unsubscribe = syncService.onMatchesUpdated(() => {
        refreshData();
    });

    // Set initial status
    setIsSynced(syncService.isConnected);

    return () => {
        unsubscribe();
    };
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-obsidian overflow-hidden">
      {/* Mobile Header (Compact) */}
      <header className="flex-none px-6 py-6 flex items-center justify-between bg-white/80 dark:bg-obsidian-light/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 z-10">
        <div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Welcome</div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
            {user || 'Scouter'}
          </h1>
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-colors ${isSynced ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'}`}>
             {isSynced ? <Wifi size={14} /> : <WifiOff size={14} />}
             <span>{isSynced ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-4">
          
          {/* Quick Status / Last Match Card (Mobile Optimized) */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg">
             <div className="relative z-10 flex justify-between items-end">
                <div>
                    <div className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-2">My Contribution</div>
                    <div className="text-5xl font-black">{matchCount}</div>
                    <div className="text-indigo-200 text-sm font-medium">Matches Scouted</div>
                </div>
                {lastMatch && (
                     <div className="text-right bg-black/20 p-3 rounded-xl backdrop-blur-sm">
                         <div className="text-[10px] font-bold text-indigo-200 uppercase">Last Entry</div>
                         <div className="text-xl font-bold">Match {lastMatch.matchNumber}</div>
                         <div className="text-xs text-indigo-300">Team {lastMatch.teamNumber}</div>
                     </div>
                )}
             </div>
             {/* Decor */}
             <Database className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 rotate-12" />
          </div>

          {/* Primary Action Button */}
           <button 
              onClick={() => setView('GAME_START')}
              className="w-full bg-matcha hover:bg-matcha-dark text-obsidian rounded-3xl p-6 shadow-xl shadow-matcha/20 transition-all active:scale-[0.98] flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center">
                      <Plus size={24} strokeWidth={3} />
                  </div>
                  <div className="text-left">
                      <div className="text-lg font-black uppercase tracking-tight">Scout Match</div>
                      <div className="text-sm font-medium opacity-80">Start new qualification</div>
                  </div>
              </div>
              <ArrowRight size={24} className="transform group-hover:translate-x-1 transition-transform" />
            </button>

          {/* Grid Actions */}
          <div className="grid grid-cols-2 gap-3">
            <ActionCard 
              icon={<ClipboardList size={20} />} 
              label="Pit Scout" 
              color="text-blue-500"
              bg="bg-blue-500/10"
              onClick={() => setView('PIT_SCOUTING')}
            />

            <ActionCard 
              icon={<BarChart2 size={20} />} 
              label="Analysis" 
              color="text-purple-500"
              bg="bg-purple-500/10"
              onClick={() => setView('DATA_VIEW')}
            />

            <ActionCard 
              icon={<FileText size={20} />} 
              label="Picklist" 
              color="text-orange-500"
              bg="bg-orange-500/10"
              onClick={() => setView('PICKLIST')}
            />

            <ActionCard 
              icon={<SettingsIcon size={20} />} 
              label="Settings" 
              color="text-slate-500"
              bg="bg-slate-500/10"
              onClick={() => setView('SETTINGS')}
            />
          </div>

        </div>
      </div>
    </div>
  );
};

const ActionCard = ({ icon, label, color, bg, onClick }: any) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center p-6 bg-white dark:bg-obsidian-light border border-slate-200 dark:border-slate-800 rounded-3xl active:scale-[0.98] transition-all"
  >
    <div className={`mb-3 p-3 rounded-2xl ${bg} ${color}`}>
      {icon}
    </div>
    <div className="font-bold text-sm text-slate-900 dark:text-white">{label}</div>
  </button>
);