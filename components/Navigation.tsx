import React from 'react';
import { ViewState } from '../types';
import { Home, Target, Settings, Database, List, LogOut, ClipboardList } from 'lucide-react';

interface NavigationProps {
  setView: (view: ViewState) => void;
  currentView: ViewState;
  onLogout?: () => void;
  user: string | null;
  variant?: 'mobile' | 'sidebar';
}

export const Navigation: React.FC<NavigationProps> = ({ setView, currentView, onLogout, user, variant = 'mobile' }) => {
  
  const navItems = [
    { view: 'DASHBOARD' as ViewState, label: 'Home', icon: <Home size={22} /> },
    { view: 'GAME_START' as ViewState, label: 'Scout', icon: <Target size={22} /> },
    { view: 'PIT_SCOUTING' as ViewState, label: 'Pit', icon: <ClipboardList size={22} /> },
    { view: 'DATA_VIEW' as ViewState, label: 'Data', icon: <Database size={22} /> },
    { view: 'SETTINGS' as ViewState, label: 'Config', icon: <Settings size={22} /> },
  ];

  // Immersive views where we hide the bottom nav to prevent accidents
  const hideMobileNav = ['AUTO_START', 'AUTO_SCORING', 'TELEOP_SCORING', 'ENDGAME_SCORING'].includes(currentView);

  if (variant === 'sidebar') {
    return (
      <div className="flex flex-col h-full w-full">
         <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
             <div className="w-10 h-10 bg-matcha rounded-xl flex items-center justify-center shadow-lg shadow-matcha/20">
                <span className="font-black text-obsidian text-lg">S</span>
             </div>
             <div>
                 <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                    SAXON<span className="text-matcha">SCOUT</span>
                 </h1>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Team 611</p>
             </div>
         </div>
         
         <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
             <div className="px-3 mb-2 text-xs font-black text-slate-400 uppercase tracking-widest">Menu</div>
             {navItems.map((item) => (
                <button
                    key={item.view}
                    onClick={() => setView(item.view)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-bold text-sm ${
                        currentView === item.view 
                            ? 'bg-matcha text-obsidian shadow-md shadow-matcha/20' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                    {item.icon}
                    {item.label}
                </button>
             ))}
              <button
                onClick={() => setView('PICKLIST')}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-bold text-sm ${
                    currentView === 'PICKLIST'
                        ? 'bg-matcha text-obsidian shadow-md shadow-matcha/20' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
                <List size={22} />
                Picklist
            </button>
         </div>

         <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black/20">
             {user && (
                 <div className="flex items-center gap-3 mb-4 px-2">
                     <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                         {user.substring(0,2).toUpperCase()}
                     </div>
                     <div className="overflow-hidden">
                         <div className="text-sm font-bold truncate text-slate-900 dark:text-white">{user}</div>
                         <div className="text-xs text-slate-500">Scouter</div>
                     </div>
                 </div>
             )}
             {onLogout && (
                 <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all text-xs font-bold text-slate-500"
                 >
                    <LogOut size={16} />
                    Sign Out
                 </button>
             )}
         </div>
      </div>
    );
  }

  // Mobile Bottom Navigation Bar
  if (hideMobileNav) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 dark:bg-obsidian-light/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-50 px-4 pb-4 pt-2">
       <div className="flex justify-between items-center h-full max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-all duration-200 ${isActive ? 'text-matcha' : 'text-slate-400 dark:text-slate-500'}`}
              >
                <div className={`p-1.5 rounded-full transition-all ${isActive ? 'bg-matcha/10 -translate-y-1' : ''}`}>
                    {item.icon}
                </div>
                <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                    {item.label}
                </span>
              </button>
            )
          })}
       </div>
    </div>
  );
};
