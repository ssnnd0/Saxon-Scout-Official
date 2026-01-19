import React, { useState } from 'react';
import { ViewState } from '../types';
import { Menu, X, Home, Target, Settings, Database, List, LogOut } from 'lucide-react';

interface NavigationProps {
  setView: (view: ViewState) => void;
  currentView: ViewState;
  onLogout?: () => void;
  user: string | null;
  variant?: 'mobile' | 'sidebar';
}

export const Navigation: React.FC<NavigationProps> = ({ setView, currentView, onLogout, user, variant = 'mobile' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleNav = (view: ViewState) => {
    setView(view);
    setIsOpen(false);
  };

  const navItems = [
    { view: 'DASHBOARD' as ViewState, label: 'Dashboard', icon: <Home size={20} /> },
    { view: 'GAME_START' as ViewState, label: 'Scout Match', icon: <Target size={20} /> },
    { view: 'PICKLIST' as ViewState, label: 'Picklist', icon: <List size={20} /> },
    { view: 'DATA_VIEW' as ViewState, label: 'Data Analysis', icon: <Database size={20} /> },
    { view: 'SETTINGS' as ViewState, label: 'Settings', icon: <Settings size={20} /> },
  ];

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
                    onClick={() => handleNav(item.view)}
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

  // Mobile Variant (Original Floating Button + Modal)
  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-matcha hover:bg-matcha-dark text-obsidian rounded-full shadow-lg shadow-matcha/30 transition-transform hover:scale-105 active:scale-95"
        aria-label="Open Navigation"
      >
        <Menu size={28} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          ></div>

          <div className="relative w-full max-w-sm bg-white dark:bg-obsidian-light border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">MENU</h2>
                    {user && <p className="text-sm text-slate-500 font-bold">Logged in as {user}</p>}
                </div>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            <div className="p-4 space-y-2 overflow-y-auto flex-1">
                {navItems.map((item) => (
                    <button
                        key={item.view}
                        onClick={() => handleNav(item.view)}
                        className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${
                            currentView === item.view 
                                ? 'bg-matcha text-obsidian shadow-lg shadow-matcha/20 font-bold' 
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                    >
                        {item.icon}
                        <span className="text-lg">{item.label}</span>
                    </button>
                ))}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-black/20">
                {onLogout && (
                     <button
                        onClick={() => {
                            onLogout();
                            setIsOpen(false);
                        }}
                        className="w-full p-4 rounded-xl flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors font-bold"
                     >
                        <LogOut size={20} />
                        Sign Out
                     </button>
                )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};