import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Navigation } from './components/Navigation';
import { MatchData, ViewState, Alliance, MatchPhase } from './types';
import { getUserPreferences, saveMatch } from './services/storageService';
import { syncService } from './services/syncService';

// Lazy Load Views
const Login = lazy(() => import('./views/Login').then(module => ({ default: module.Login })));
const Dashboard = lazy(() => import('./views/Dashboard').then(module => ({ default: module.Dashboard })));
const Settings = lazy(() => import('./views/Settings').then(module => ({ default: module.Settings })));
const GameStart = lazy(() => import('./views/GameStart').then(module => ({ default: module.GameStart })));
const AutoStart = lazy(() => import('./views/AutoStart').then(module => ({ default: module.AutoStart })));
const Scoring = lazy(() => import('./views/Scoring').then(module => ({ default: module.Scoring })));
const Endgame = lazy(() => import('./views/Endgame').then(module => ({ default: module.Endgame })));
const Summary = lazy(() => import('./views/Summary').then(module => ({ default: module.Summary })));
const DataView = lazy(() => import('./views/DataView').then(module => ({ default: module.DataView })));
const Picklist = lazy(() => import('./views/Picklist').then(module => ({ default: module.Picklist })));

const initialMatchData: MatchData = {
  id: '',
  lastModified: 0,
  scoutName: '',
  scouterInitials: '',
  matchNumber: '',
  alliance: Alliance.Red,
  teamNumber: '',
  startingZone: '',
  
  // Auto
  leaveLine: false,
  autoFuelScored: 0,
  autoFuelMissed: 0,
  autoTowerLevel: 'None',

  // Teleop
  teleopFuelScored: 0,
  teleopFuelMissed: 0,
  fuelIntakeGround: 0,
  fuelIntakeSource: 0,

  // Endgame
  endgameTowerLevel: 'None',
  
  // Status
  defensePlayed: false,
  robotDied: false,
  comments: '',

  // Timeline
  events: [],
  autoEvents: [],
  teleopEvents: [],
};

const LoadingSpinner = () => (
  <div className="h-full w-full flex items-center justify-center bg-obsidian">
    <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-matcha"></div>
        <div className="text-matcha font-bold text-sm tracking-widest animate-pulse">LOADING ASSETS...</div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LOGIN');
  const [matchData, setMatchData] = useState<MatchData>(initialMatchData);
  const [user, setUser] = useState<string | null>(localStorage.getItem('saxon_user'));

  // Init Theme Effect
  useEffect(() => {
    const prefs = getUserPreferences();
    const root = document.documentElement;
    
    // Clear existing
    root.classList.remove('dark', 'theme-gold');

    if (prefs.theme === 'gold') {
        root.classList.add('dark', 'theme-gold');
    } else if (prefs.theme === 'dark' || (prefs.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        root.classList.add('dark');
    }
    
    // Initialize sync service globally
    syncService.init();
  }, []);

  useEffect(() => {
    if (user) {
        if (view === 'LOGIN') setView('DASHBOARD');
    } else {
        setView('LOGIN');
    }
  }, [user]);

  // Real-time Auto-Save & Sync
  useEffect(() => {
      // Only sync if we have valid match identifiers
      if (!matchData.id || !matchData.matchNumber || !matchData.teamNumber) return;

      const timeoutId = setTimeout(() => {
          const timestamp = Date.now();
          const payload = { ...matchData, lastModified: timestamp };
          
          // Save locally
          saveMatch(payload);
          
          // Sync remotely
          syncService.uploadMatch(payload);
      }, 1000); // 1 second debounce

      return () => clearTimeout(timeoutId);
  }, [matchData]);

  const handleLogin = (username: string) => {
      localStorage.setItem('saxon_user', username);
      setUser(username);
      
      // Try to pre-fill initials
      const prefs = getUserPreferences();
      setMatchData(prev => ({ 
          ...prev, 
          scoutName: username, 
          scouterInitials: prefs.defaultInitials || username.slice(0,3).toUpperCase() 
      }));
      
      setView('DASHBOARD');
  };

  const handleLogout = () => {
      localStorage.removeItem('saxon_user');
      setUser(null);
      setView('LOGIN');
  };

  const resetMatch = () => {
    let nextMatchNum = '1';
    if (matchData.matchNumber) {
        const parsed = parseInt(matchData.matchNumber, 10);
        if (!isNaN(parsed)) {
            nextMatchNum = (parsed + 1).toString();
        }
    }

    const prefs = getUserPreferences();

    setMatchData({
      ...initialMatchData,
      scoutName: user || 'Anon',
      scouterInitials: prefs.defaultInitials || (user ? user.slice(0,3).toUpperCase() : 'UNK'),
      matchNumber: nextMatchNum,
      alliance: matchData.alliance,
      id: Date.now().toString(), // Generate new ID
      lastModified: Date.now()
    });
    setView('GAME_START');
  };

  const renderView = () => {
    switch (view) {
      case 'LOGIN':
        return <Login onLogin={handleLogin} />;
      case 'DASHBOARD':
        return <Dashboard setView={setView} user={user} onLogout={handleLogout} />;
      case 'SETTINGS':
        return <Settings setView={setView} />;
      case 'GAME_START':
        return <GameStart matchData={matchData} setMatchData={setMatchData} setView={setView} />;
      case 'AUTO_START':
        return <AutoStart matchData={matchData} setMatchData={setMatchData} setView={setView} />;
      case 'AUTO_SCORING':
        return <Scoring phase={MatchPhase.Auto} matchData={matchData} setMatchData={setMatchData} setView={setView} />;
      case 'TELEOP_SCORING':
        return <Scoring phase={MatchPhase.Teleop} matchData={matchData} setMatchData={setMatchData} setView={setView} />;
      case 'ENDGAME_SCORING':
        return <Endgame matchData={matchData} setMatchData={setMatchData} setView={setView} />;
      case 'SUMMARY':
        return <Summary matchData={matchData} reset={resetMatch} setView={setView} />;
      case 'DATA_VIEW':
        return <DataView setView={setView} />;
      case 'PICKLIST':
        return <Picklist setView={setView} />;
      default:
        return <Dashboard setView={setView} user={user} onLogout={handleLogout} />;
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden font-sans selection:bg-matcha selection:text-obsidian flex flex-row text-slate-900 dark:text-white bg-slate-50 dark:bg-obsidian">
       {/* Desktop Sidebar (Medium Screens and up) */}
       {view !== 'LOGIN' && (
         <aside className="hidden md:block w-64 h-full flex-none border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-obsidian-light z-20 relative">
            <Navigation 
                setView={setView} 
                currentView={view} 
                onLogout={handleLogout} 
                user={user}
                variant="sidebar"
            />
         </aside>
       )}

      {/* Main Content Area */}
      <main className="flex-1 w-full h-full relative flex flex-col overflow-hidden bg-slate-50/90 dark:bg-obsidian/90 backdrop-blur-sm transition-all">
        <Suspense fallback={<LoadingSpinner />}>
            {renderView()}
        </Suspense>
        
        {/* Mobile Navigation FAB (Small Screens only) */}
        {view !== 'LOGIN' && (
            <div className="md:hidden">
                <Navigation 
                    setView={setView} 
                    currentView={view} 
                    onLogout={handleLogout} 
                    user={user}
                    variant="mobile"
                />
            </div>
        )}
      </main>
    </div>
  );
};

export default App;