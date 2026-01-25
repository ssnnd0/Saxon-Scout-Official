import React, { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ViewState, LocalUser, UserPreferences } from '../types';
import { clearMatches, getMatches, getSettings, saveSettings, getTeams, getSchedule, getLocalUsers, saveLocalUsers, getUserPreferences, saveUserPreferences } from '../services/storageService';
import { fetchMatchSchedule as fetchFrcMatches, fetchEventTeams as fetchFrcTeams } from '../services/frcEventsService';
import { fetchMatchSchedule as fetchTbaMatches, fetchEventTeams as fetchTbaTeams } from '../services/tbaService';
import { APP_VERSION } from '../constants';
import { syncService } from '../services/syncService';
import { AUTHORIZED_USERS } from '../env-login';
import { ArrowLeft, Moon, Sun, Monitor, Trash2, UserPlus, Shield, User, BarChart2, Save, Crown, Globe } from 'lucide-react';

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
  const [tbaKey, setTbaKey] = useState('');
  const [year, setYear] = useState('');
  const [eventCode, setEventCode] = useState('');
  const [syncUrl, setSyncUrl] = useState('');
  const [cacheStatus, setCacheStatus] = useState('');
  const [loading, setLoading] = useState(false);
  
  // User Management
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [newUser, setNewUser] = useState({ username: '', pin: '', role: 'scout' as const });

  useEffect(() => {
    const initSettings = async () => {
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
      const matches = await getMatches();
      const myMatches = matches.filter(m => m.scoutName === u);
      setStats({ matchesScouted: myMatches.length });

      // Load Admin Settings
      const s = getSettings();
      setUsername(s.frcApiUsername);
      setToken(s.frcApiToken);
      setTbaKey(s.tbaApiKey || '');
      setYear(s.eventYear);
      setEventCode(s.eventCode);
      setSyncUrl(s.syncServerUrl || '');
      updateCacheStatus();
    };

    initSettings();
  }, []);

  const updateCacheStatus = () => {
    const teams = getTeams();
    const matches = getSchedule();
    setCacheStatus(`${teams.length} teams, ${matches.length} matches cached`);
  };

  const handleThemeChange = (theme: 'system' | 'light' | 'dark' | 'gold') => {
    const newPrefs = { ...prefs, theme };
    setPrefs(newPrefs);
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-gold');
    if (theme === 'gold') root.classList.add('dark', 'theme-gold');
    else if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) root.classList.add('dark');
  };

  const handleSaveProfile = () => {
    saveUserPreferences(prefs);
    handleThemeChange(prefs.theme);
    alert("Profile Preferences Saved");
  };

  const handleSaveAdminSettings = () => {
    if (!isAdmin) return;
    saveSettings({ 
        frcApiUsername: username, 
        frcApiToken: token, 
        tbaApiKey: tbaKey,
        eventYear: year, 
        eventCode: eventCode,
        syncServerUrl: syncUrl
    });
    if (syncUrl) syncService.init();
    alert("System Configuration Saved");
  };

  const handleAddUser = () => {
    if (!newUser.username || !newUser.pin) return alert("Missing fields");
    if (users.find(u => u.username === newUser.username) || AUTHORIZED_USERS[newUser.username]) return alert("Username taken");
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
    if (confirm("Are you sure you want to delete ALL scouting data?")) {
      clearMatches();
      setStats({ matchesScouted: 0 });
    }
  };

  const handleFetchFrcData = async () => {
    if (!username || !token) return alert("Please save FRC API Credentials first");
    setLoading(true);
    try {
        await fetchFrcTeams();
        await fetchFrcMatches();
        updateCacheStatus();
        alert(`Success! Data fetched via FIRST API.`);
    } catch (e) {
        alert("Failed to fetch data via FIRST API.");
    } finally {
        setLoading(false);
    }
  };

  const handleFetchTbaData = async () => {
    if (!tbaKey) return alert("Please save TBA API Key first");
    setLoading(true);
    try {
        await fetchTbaTeams();
        await fetchTbaMatches();
        updateCacheStatus();
        alert(`Success! Data fetched via TBA API.`);
    } catch (e) {
        alert("Failed to fetch data via TBA API.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-obsidian text-slate-900 dark:text-white">
      <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-obsidian-light">
         <div className="flex items-center gap-4">
             <Button variant="ghost" onClick={() => setView('DASHBOARD')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                <ArrowLeft size={24} />
             </Button>
             <h2 className="text-2xl font-black">Settings</h2>
         </div>
         <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
             <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all ${activeTab === 'profile' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`}><User size={16} /> Profile</button>
             {isAdmin && <button onClick={() => setActiveTab('admin')} className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all ${activeTab === 'admin' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-500' : 'text-slate-500'}`}><Shield size={16} /> Admin</button>}
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {activeTab === 'profile' && (
            <div className="space-y-6 max-w-2xl mx-auto">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="text-indigo-100 font-bold uppercase tracking-wider text-xs mb-1 flex items-center gap-2"><BarChart2 size={14}/> Contribution</div>
                        <div className="text-5xl font-black mb-1">{stats.matchesScouted}</div>
                        <div className="text-indigo-100 font-medium">Matches Scouted by {currentUser}</div>
                    </div>
                    <User className="absolute -bottom-4 -right-4 w-40 h-40 text-white/10" />
                </div>
                <div className="bg-white dark:bg-obsidian-light border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
                    <h3 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-2">Preferences</h3>
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Appearance</label>
                        <div className="grid grid-cols-4 gap-2">
                             {['light', 'dark', 'gold', 'system'].map((t) => (
                                <button key={t} onClick={() => handleThemeChange(t as any)} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${prefs.theme === t ? 'bg-indigo-50 border-indigo-500 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                    {t === 'light' ? <Sun size={20} /> : t === 'dark' ? <Moon size={20} /> : t === 'gold' ? <Crown size={20} /> : <Monitor size={20} />}
                                    <span className="text-xs font-bold capitalize">{t}</span>
                                </button>
                             ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                         <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Default Initials</label>
                         <Input value={prefs.defaultInitials} onChange={(e) => setPrefs({...prefs, defaultInitials: e.target.value.toUpperCase()})} placeholder="XYZ" maxLength={3} className="uppercase" />
                    </div>
                    <div className="pt-2"><Button variant="primary" fullWidth onClick={handleSaveProfile} className="flex items-center justify-center gap-2"><Save size={18} /> Save Preferences</Button></div>
                </div>
            </div>
        )}

        {activeTab === 'admin' && isAdmin && (
            <div className="space-y-6 max-w-2xl mx-auto">
                <div className="bg-white dark:bg-obsidian-light border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
                    <h3 className="text-lg font-bold flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2"><Globe size={20}/> The Blue Alliance API</h3>
                    <Input label="TBA Read API Key" type="password" value={tbaKey} onChange={(e) => setTbaKey(e.target.value)} placeholder="v3 API Key" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Button variant="outline" fullWidth onClick={handleFetchTbaData} disabled={loading}>{loading ? 'Syncing...' : 'Fetch via TBA'}</Button>
                    </div>
                </div>

                <div className="bg-white dark:bg-obsidian-light border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
                    <h3 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-2">FRC Events API (FIRST)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                        <Input label="Auth Token" type="password" value={token} onChange={(e) => setToken(e.target.value)} />
                    </div>
                    <Button variant="outline" fullWidth onClick={handleFetchFrcData} disabled={loading}>{loading ? 'Syncing...' : 'Fetch via FIRST'}</Button>
                </div>

                <div className="bg-white dark:bg-obsidian-light border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
                    <h3 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-2">Global Match Config</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <Input label="Year" value={year} onChange={(e) => setYear(e.target.value)} />
                        <Input label="Event Code" value={eventCode} onChange={(e) => setEventCode(e.target.value)} />
                    </div>
                    <Input label="Sync Server URL" value={syncUrl} onChange={(e) => setSyncUrl(e.target.value)} />
                    <Button variant="success" fullWidth onClick={handleSaveAdminSettings}>Save Admin Configuration</Button>
                </div>

                <div className="bg-white dark:bg-obsidian-light border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
                    <h3 className="text-lg font-bold flex items-center gap-2"><UserPlus size={20}/> User Management</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                        <Input label="New User" value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} />
                        <Input label="PIN" value={newUser.pin} onChange={(e) => setNewUser({...newUser, pin: e.target.value})} />
                        <Button onClick={handleAddUser} variant="success" className="h-[50px]">+</Button>
                    </div>
                    <div className="space-y-2">
                         {users.map((u) => (
                              <div key={u.username} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <span className="font-bold">{u.username} <span className="text-[10px] uppercase opacity-50">{u.role}</span></span>
                                <button onClick={() => handleDeleteUser(u.username)} className="text-red-500"><Trash2 size={16}/></button>
                            </div>
                         ))}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};