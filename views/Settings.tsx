import React, { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ViewState, LocalUser, UserPreferences } from '../types';
import { clearMatches, getMatches, getSettings, saveSettings, getTeams, getSchedule, getLocalUsers, saveLocalUsers, getUserPreferences, saveUserPreferences } from '../services/storageService';
import { fetchMatchSchedule, fetchEventTeams } from '../services/frcEventsService';
import { APP_VERSION } from '../constants';
import { syncService } from '../services/syncService';
import { AUTHORIZED_USERS } from '../env-login';
import { ArrowLeft, Moon, Sun, Monitor, Trash2, UserPlus, Shield, User, BarChart2, Save, Crown } from 'lucide-react';

interface SettingsProps {
  setView: (view: ViewState) => void;
}

export const Settings: React.FC<SettingsProps> = ({ setView }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'admin'>('profile');
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Profile State
  const [prefs, setPrefs] = useState<UserPreferences>({ theme: 'system', defaultInitials: '' });
  const [stats, setStats] = useState({ matchesScouted: 0 });

  // Admin State
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [year, setYear] = useState('');
  const [eventCode, setEventCode] = useState('');
  const [syncUrl, setSyncUrl] = useState('');
  const [cacheStatus, setCacheStatus] = useState('');
  const [loading, setLoading] = useState(false);
  
  // User Management
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [newUser, setNewUser] = useState({ username: '', pin: '', role: 'scout' as const });

  useEffect(() => {
    // Auth Check
    const u = localStorage.getItem('saxon_user');
    setCurrentUser(u);
    
    // Determine Role
    const localUsers = getLocalUsers();
    const localUser = localUsers.find(lu => lu.username === u);
    const isEnvAdmin = u === 'admin';
    const isLocalAdmin = localUser?.role === 'admin';
    
    setIsAdmin(isEnvAdmin || isLocalAdmin);
    setUsers(localUsers);

    // Load Prefs
    const loadedPrefs = getUserPreferences();
    setPrefs(loadedPrefs);

    // Load Stats
    const matches = getMatches();
    const myMatches = matches.filter(m => m.scoutName === u);
    setStats({ matchesScouted: myMatches.length });

    // Load Admin Settings only if allowed (visually we hide it, but load data anyway for state simplicity)
    const s = getSettings();
    setUsername(s.frcApiUsername);
    setToken(s.frcApiToken);
    setYear(s.eventYear);
    setEventCode(s.eventCode);
    setSyncUrl(s.syncServerUrl || '');
    updateCacheStatus();
  }, []);

  const updateCacheStatus = () => {
    const teams = getTeams();
    const matches = getSchedule();
    setCacheStatus(`${teams.length} teams, ${matches.length} matches cached`);
  };

  // Preference Handlers
  const handleThemeChange = (theme: 'system' | 'light' | 'dark' | 'gold') => {
    const newPrefs = { ...prefs, theme };
    setPrefs(newPrefs);
    
    // Apply immediately
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-gold');
    
    if (theme === 'gold') {
        root.classList.add('dark', 'theme-gold');
    } else if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        root.classList.add('dark');
    }
  };

  const handleSaveProfile = () => {
    saveUserPreferences(prefs);
    // Force re-apply logic
    handleThemeChange(prefs.theme);
    alert("Profile Preferences Saved");
  };

  // Admin Handlers
  const handleSaveAdminSettings = () => {
    if (!isAdmin) return;
    saveSettings({ 
        frcApiUsername: username, 
        frcApiToken: token, 
        eventYear: year, 
        eventCode: eventCode,
        syncServerUrl: syncUrl
    });
    if (syncUrl) syncService.init();
    alert("System Configuration Saved");
  };

  const handleAddUser = () => {
    if (!newUser.username || !newUser.pin) return alert("Missing fields");
    // Check conflicts
    if (users.find(u => u.username === newUser.username) || AUTHORIZED_USERS[newUser.username]) {
        return alert("Username taken");
    }
    const updatedUsers = [...users, { ...newUser }];
    setUsers(updatedUsers);
    saveLocalUsers(updatedUsers);
    setNewUser({ username: '', pin: '', role: 'scout' });
  };

  const handleDeleteUser = (usernameToDelete: string) => {
      if (confirm(`Delete user ${usernameToDelete}?`)) {
          const updated = users.filter(u => u.username !== usernameToDelete);
          setUsers(updated);
          saveLocalUsers(updated);
      }
  };

  const handleClearData = () => {
    if (confirm("Are you sure you want to delete ALL scouting data? This cannot be undone.")) {
      clearMatches();
      alert("Data cleared.");
      // Refresh stats
      setStats({ matchesScouted: 0 });
    }
  };

  const handleFetchData = async () => {
    if (!username || !token) {
        alert("Please save FRC API Credentials first");
        return;
    }
    setLoading(true);
    try {
        const teams = await fetchEventTeams();
        const matches = await fetchMatchSchedule();
        updateCacheStatus();
        alert(`Success! Fetched ${teams.length} teams and ${matches.length} matches.`);
    } catch (e) {
        alert("Failed to fetch data. Check credentials and internet connection.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-obsidian text-slate-900 dark:text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-obsidian-light">
         <div className="flex items-center gap-4">
             <Button variant="ghost" onClick={() => setView('DASHBOARD')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                <ArrowLeft size={24} />
             </Button>
             <h2 className="text-2xl font-black">Settings</h2>
         </div>
         
         <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
             <button 
                onClick={() => setActiveTab('profile')} 
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all ${activeTab === 'profile' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`}
             >
                <User size={16} /> Profile
             </button>
             {isAdmin && (
                <button 
                    onClick={() => setActiveTab('admin')} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all ${activeTab === 'admin' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-500' : 'text-slate-500'}`}
                >
                    <Shield size={16} /> Admin
                </button>
             )}
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* === PROFILE TAB === */}
        {activeTab === 'profile' && (
            <div className="space-y-6 max-w-2xl mx-auto">
                
                {/* Stats Card */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="text-indigo-100 font-bold uppercase tracking-wider text-xs mb-1 flex items-center gap-2"><BarChart2 size={14}/> Contribution</div>
                        <div className="text-5xl font-black mb-1">{stats.matchesScouted}</div>
                        <div className="text-indigo-100 font-medium">Matches Scouted by {currentUser}</div>
                    </div>
                    <User className="absolute -bottom-4 -right-4 w-40 h-40 text-white/10" />
                </div>

                {/* Personal Config */}
                <div className="bg-white dark:bg-obsidian-light border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
                    <h3 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-2">Preferences</h3>
                    
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Appearance</label>
                        <div className="grid grid-cols-4 gap-2">
                             <button 
                                onClick={() => handleThemeChange('light')}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${prefs.theme === 'light' ? 'bg-indigo-50 border-indigo-500 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                             >
                                <Sun size={20} /> <span className="text-xs font-bold">Light</span>
                             </button>
                             <button 
                                onClick={() => handleThemeChange('dark')}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${prefs.theme === 'dark' ? 'bg-indigo-50 border-indigo-500 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                             >
                                <Moon size={20} /> <span className="text-xs font-bold">Dark</span>
                             </button>
                             <button 
                                onClick={() => handleThemeChange('gold')}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${prefs.theme === 'gold' ? 'bg-gold/10 border-gold text-gold' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                             >
                                <Crown size={20} /> <span className="text-xs font-bold">Gold</span>
                             </button>
                             <button 
                                onClick={() => handleThemeChange('system')}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${prefs.theme === 'system' ? 'bg-indigo-50 border-indigo-500 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                             >
                                <Monitor size={20} /> <span className="text-xs font-bold">System</span>
                             </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                         <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Default Initials</label>
                         <Input 
                            value={prefs.defaultInitials}
                            onChange={(e) => setPrefs({...prefs, defaultInitials: e.target.value.toUpperCase()})}
                            placeholder="XYZ"
                            maxLength={3}
                            className="uppercase"
                         />
                         <p className="text-xs text-slate-400">Automatically fills on Match Start screen.</p>
                    </div>

                    <div className="pt-2">
                        <Button variant="primary" fullWidth onClick={handleSaveProfile} className="flex items-center justify-center gap-2">
                            <Save size={18} /> Save Preferences
                        </Button>
                    </div>
                </div>

                <div className="bg-white dark:bg-obsidian-light border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
                  <h3 className="text-lg font-bold">Data Management</h3>
                  <Button variant="secondary" fullWidth onClick={() => {
                    const data = getMatches();
                    const w = window.open();
                    if (w) w.document.write(`<pre style="background:#111;color:#eee;padding:20px;">${JSON.stringify(data, null, 2)}</pre>`);
                  }}>
                    View Raw JSON
                  </Button>
                </div>
            </div>
        )}

        {/* === ADMIN TAB === */}
        {activeTab === 'admin' && isAdmin && (
            <div className="space-y-6 max-w-2xl mx-auto">
                
                {/* User Management */}
                <div className="bg-white dark:bg-obsidian-light border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                         <h3 className="text-lg font-bold flex items-center gap-2"><UserPlus size={20}/> User Management</h3>
                    </div>

                    {/* Add User */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                        <Input 
                            label="New Username" 
                            value={newUser.username} 
                            onChange={(e) => setNewUser({...newUser, username: e.target.value})} 
                        />
                         <Input 
                            label="PIN" 
                            value={newUser.pin} 
                            onChange={(e) => setNewUser({...newUser, pin: e.target.value})} 
                        />
                        <div className="flex gap-2">
                             <select 
                                className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 h-[50px] text-sm dark:text-white"
                                value={newUser.role}
                                onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                             >
                                <option value="scout">Scout</option>
                                <option value="admin">Admin</option>
                             </select>
                             <Button onClick={handleAddUser} variant="success" className="h-[50px]">+</Button>
                        </div>
                    </div>

                    {/* List Users */}
                    <div className="space-y-2">
                         <h4 className="text-xs font-bold text-slate-500 uppercase">Registered Users</h4>
                         
                         {/* Static Users */}
                         {Object.keys(AUTHORIZED_USERS).map(u => (
                             <div key={u} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg opacity-70">
                                 <span className="font-bold flex items-center gap-2">
                                    {u} <span className="bg-slate-200 dark:bg-slate-800 text-[10px] px-2 py-0.5 rounded-full">ENV</span>
                                 </span>
                                 <span className="text-xs text-slate-400">System Protected</span>
                             </div>
                         ))}

                         {/* Local Users */}
                         {users.map((u) => (
                              <div key={u.username} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <span className="font-bold flex items-center gap-2">
                                   {u.username} 
                                   <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'}`}>{u.role.toUpperCase()}</span>
                                </span>
                                <button onClick={() => handleDeleteUser(u.username)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                            </div>
                         ))}
                    </div>
                </div>

                {/* API Config */}
                <div className="bg-white dark:bg-obsidian-light border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
                    <h3 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-2">FRC Event API</h3>
                    <Input 
                        label="Username" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <Input 
                        label="Auth Token" 
                        type="password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <Input 
                            label="Year" 
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                        />
                        <Input 
                            label="Event Code" 
                            value={eventCode}
                            onChange={(e) => setEventCode(e.target.value)}
                        />
                    </div>
                    
                    <div className="pt-2">
                        <p className="text-xs text-slate-400 mb-2">Current Cache: {cacheStatus}</p>
                        <Button variant="outline" fullWidth onClick={handleFetchData} disabled={loading}>
                            {loading ? 'Syncing...' : 'Update Event Data'}
                        </Button>
                    </div>
                </div>

                {/* Sync Config */}
                <div className="bg-white dark:bg-obsidian-light border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
                    <h3 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-2">Cloud Infrastructure</h3>
                    <Input 
                        label="Sync Server URL" 
                        value={syncUrl}
                        onChange={(e) => setSyncUrl(e.target.value)}
                    />
                    <Button variant="success" fullWidth onClick={handleSaveAdminSettings}>
                        Save Admin Configuration
                    </Button>
                </div>
                
                {/* Danger Zone */}
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-6 space-y-4">
                     <h3 className="text-lg font-bold text-red-600 dark:text-red-400">Danger Zone</h3>
                     <Button variant="danger" fullWidth onClick={handleClearData}>
                        WIPE ALL SCOUTING DATA
                    </Button>
                </div>

            </div>
        )}
        
        {!isAdmin && activeTab === 'admin' && (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <Shield size={48} className="mb-2 opacity-50"/>
                <p>Restricted Area. Admin Access Required.</p>
            </div>
        )}

        <div className="text-center text-slate-400 text-xs pt-8 pb-4">
            <p>Built for Team 611 & 526</p>
            <p>Version {APP_VERSION}</p>
        </div>
      </div>
    </div>
  );
};