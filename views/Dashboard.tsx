import React, { useEffect, useState } from 'react';
import { ViewState } from '../types';
import { getMatches } from '../services/storageService';
import { syncService } from '../services/syncService';
import { 
  Wifi, WifiOff, Database, Target, Settings as SettingsIcon, 
  LogOut, FileText, BarChart2, Plus 
} from 'lucide-react';

interface DashboardProps {
  setView: (view: ViewState) => void;
  user: string | null;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setView, user, onLogout }) => {
  const [matchCount, setMatchCount] = useState(0);
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    const refreshData = () => {
        setMatchCount(getMatches().length);
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
      {/* Header */}
      <header className="flex-none px-6 py-4 flex items-center justify-between bg-white/80 dark:bg-obsidian-light/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 z-10 transition-colors">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-2">
            SAXON<span className="text-matcha">SCOUT</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono border border-slate-200 dark:border-slate-700">2026</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Sync Indicator */}
           <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-colors ${isSynced ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'}`}>
              {isSynced ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span className="hidden md:inline">{isSynced ? 'ONLINE' : 'OFFLINE'}</span>
           </div>
           
           {/* User Profile */}
           <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
              <div className="text-right hidden md:block">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Scouter</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white leading-none">{user}</div>
              </div>
              <button onClick={onLogout} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors" title="Logout">
                <LogOut size={18} />
              </button>
           </div>
        </div>
      </header>

      {/* Main Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Hero Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Primary Action - Scout Match */}
            <button 
              onClick={() => setView('GAME_START')}
              className="md:col-span-2 group relative overflow-hidden bg-obsidian-light dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-left transition-all hover:border-matcha dark:hover:border-matcha hover:shadow-2xl hover:shadow-matcha/10"
            >
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                <Target size={240} className="text-black dark:text-matcha" />
              </div>
              
              <div className="relative z-10 h-full flex flex-col justify-between space-y-12">
                <div>
                   <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-matcha/20 text-matcha-dark dark:text-matcha text-xs font-bold uppercase tracking-wider mb-4">
                     <Plus size={12} strokeWidth={4} /> New Entry
                   </span>
                   <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                     Scout Match
                   </h2>
                   <p className="text-slate-500 dark:text-slate-400 max-w-md text-lg">
                     Begin data collection for qualifications. Ensure you have the correct match number.
                   </p>
                </div>
                
                <div className="flex items-center gap-3 text-sm font-bold text-slate-900 dark:text-white group-hover:text-matcha transition-colors">
                  <span>START SESSION</span>
                  <div className="h-px w-12 bg-current opacity-50"></div>
                </div>
              </div>
            </button>

            {/* User Stats Card */}
            <div className="bg-white dark:bg-obsidian-light rounded-3xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col justify-between relative overflow-hidden transition-colors">
               <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
               
               <div>
                 <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                   <Database size={14} /> Your Contribution
                 </div>
                 <div className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
                   {matchCount}
                 </div>
                 <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                   Matches Submitted
                 </div>
               </div>
               
               {/* Footer Decoration */}
               <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">
                      Data saved locally & synced automatically.
                  </div>
               </div>
            </div>
          </div>

          {/* Secondary Actions Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            
            <ActionCard 
              icon={<BarChart2 size={24} />} 
              label="Analysis" 
              sublabel="Charts & Data"
              onClick={() => setView('DATA_VIEW')}
            />

            <ActionCard 
              icon={<FileText size={24} />} 
              label="Picklist" 
              sublabel="Rankings"
              onClick={() => setView('PICKLIST')}
            />

            <ActionCard 
              icon={<SettingsIcon size={24} />} 
              label="Settings" 
              sublabel="Config & Sync"
              onClick={() => setView('SETTINGS')}
            />
            
            {/* Empty slot / Coming Soon */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center p-6 text-slate-300 dark:text-slate-700 transition-colors">
               <span className="text-xs font-bold uppercase tracking-widest">More Soon</span>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

// Helper Component for consistency
const ActionCard = ({ icon, label, sublabel, onClick }: any) => (
  <button 
    onClick={onClick}
    className="flex flex-col p-6 bg-white dark:bg-obsidian-light border border-slate-200 dark:border-slate-800 rounded-3xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-lg transition-all text-left group"
  >
    <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl w-fit text-slate-900 dark:text-white group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
      {icon}
    </div>
    <div className="mt-auto">
      <div className="font-bold text-lg text-slate-900 dark:text-white">{label}</div>
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{sublabel}</div>
    </div>
  </button>
);