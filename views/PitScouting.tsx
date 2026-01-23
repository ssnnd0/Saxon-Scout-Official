import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { PitData, ViewState } from '../types';
import { getPitData, savePitData, getTeams, getUserPreferences } from '../services/storageService';
import { ArrowLeft, Save, Search, CheckCircle2, Circle, Camera } from 'lucide-react';

interface PitScoutingProps {
  setView: (view: ViewState) => void;
}

const initialPitData: PitData = {
  teamNumber: '',
  lastModified: 0,
  scouterName: '',
  drivetrain: 'Swerve',
  motors: '',
  weight: '',
  batteries: '',
  bump: false,
  trench: false,
  climb: 'None',
  archetype: 'All-Rounder',
  experience: '',
  intake: 'Both',
  ballCapacity: '',
  preload: '',
  shooters: '',
  canFeed: false,
  minDist: '',
  maxDist: '',
  bps: '',
  autoAlign: false,
  notes: ''
};

export const PitScouting: React.FC<PitScoutingProps> = ({ setView }) => {
  const [data, setData] = useState<PitData>(initialPitData);
  const [cachedTeams, setCachedTeams] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCachedTeams(getTeams());
    const prefs = getUserPreferences();
    setData(prev => ({ ...prev, scouterName: localStorage.getItem('saxon_user') || 'Anon' }));
  }, []);

  const handleTeamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setData(prev => ({ ...prev, teamNumber: val }));
    setSaved(false);

    // Look up existing pit data
    const existingData = getPitData().find(p => p.teamNumber === val);
    if (existingData) {
      setData(existingData);
    } else {
       // Reset fields if new team, keep meta
       setData(prev => ({ ...initialPitData, teamNumber: val, scouterName: prev.scouterName }));
    }

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
    setData(prev => ({ ...prev, teamNumber: teamNum }));
    setSuggestions([]);
    
    const existingData = getPitData().find(p => p.teamNumber === teamNum);
    if (existingData) {
      setData(existingData);
    }
  };

  const updateField = (field: keyof PitData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    if (!data.teamNumber) return alert("Enter Team Number");
    savePitData(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Toggle = ({ label, value, field }: { label: string, value: boolean, field: keyof PitData }) => (
    <button 
      onClick={() => updateField(field, !value)}
      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${value ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
    >
      <span className="font-bold">{label}</span>
      {value ? <CheckCircle2 className="text-indigo-500" /> : <Circle className="text-slate-300" />}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-obsidian text-slate-900 dark:text-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-obsidian-light sticky top-0 z-30 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-4">
             <Button variant="ghost" onClick={() => setView('DASHBOARD')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                <ArrowLeft size={24} />
             </Button>
             <h2 className="text-xl font-black">Pit Scouting</h2>
         </div>
         <Button variant={saved ? 'success' : 'primary'} onClick={handleSave} className="py-2 px-6 flex items-center gap-2">
            {saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
            {saved ? 'Saved' : 'Save'}
         </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Team Selector */}
          <div className="relative z-20">
             <label className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 block">Team Identification</label>
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="number" 
                  value={data.teamNumber} 
                  onChange={handleTeamChange} 
                  className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-3xl font-black focus:ring-2 focus:ring-matcha focus:outline-none"
                  placeholder="Team #"
                />
             </div>
             {suggestions.length > 0 && (
                <div className="absolute w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl mt-2 overflow-hidden">
                    {suggestions.map(t => (
                        <div key={t.teamNumber} onClick={() => selectTeam(t.teamNumber.toString())} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 flex justify-between">
                            <span className="font-bold">{t.teamNumber}</span>
                            <span className="text-slate-500 text-sm">{t.nameShort}</span>
                        </div>
                    ))}
                </div>
             )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Chassis & Physical */}
            <div className="bg-white dark:bg-obsidian-light p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-lg font-black flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    Physical Specs
                </h3>
                
                <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase">Drivetrain</label>
                    <div className="grid grid-cols-2 gap-2">
                        {['Swerve', 'Tank', 'Mecanum', 'Other'].map(type => (
                            <button 
                                key={type}
                                onClick={() => updateField('drivetrain', type)}
                                className={`py-2 rounded-lg text-sm font-bold border transition-all ${data.drivetrain === type ? 'bg-matcha text-obsidian border-matcha' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <Input label="Motors (Type/Count)" value={data.motors} onChange={e => updateField('motors', e.target.value)} placeholder="e.g. 4x Kraken" />
                
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Weight (lbs)" type="number" value={data.weight} onChange={e => updateField('weight', e.target.value)} />
                    <Input label="Batteries (#)" type="number" value={data.batteries} onChange={e => updateField('batteries', e.target.value)} />
                </div>
            </div>

            {/* Mobility */}
            <div className="bg-white dark:bg-obsidian-light p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-lg font-black flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    Mobility & Climb
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                    <Toggle label="Can Cross Bump" value={data.bump} field="bump" />
                    <Toggle label="Under Trench" value={data.trench} field="trench" />
                </div>

                <div className="space-y-3 pt-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Climb Capability</label>
                    <div className="grid grid-cols-4 gap-2">
                        {['None', 'L1', 'L2', 'L3'].map(lvl => (
                            <button 
                                key={lvl}
                                onClick={() => updateField('climb', lvl)}
                                className={`py-3 rounded-lg text-sm font-bold border transition-all ${data.climb === lvl ? 'bg-gold text-obsidian border-gold' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                            >
                                {lvl}
                            </button>
                        ))}
                    </div>
                </div>
                
                 <div className="space-y-3 pt-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Archetype</label>
                    <div className="flex flex-wrap gap-2">
                         {['Offense', 'Defense', 'Support', 'All-Rounder'].map(arch => (
                            <button 
                                key={arch}
                                onClick={() => updateField('archetype', arch)}
                                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${data.archetype === arch ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                            >
                                {arch}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Scoring */}
            <div className="bg-white dark:bg-obsidian-light p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-lg font-black flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    Scoring Capabilities
                </h3>

                <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase">Intake</label>
                    <div className="grid grid-cols-4 gap-2">
                         {['Ground', 'Source', 'Both', 'None'].map(type => (
                            <button 
                                key={type}
                                onClick={() => updateField('intake', type)}
                                className={`py-2 rounded-lg text-xs font-bold border transition-all ${data.intake === type ? 'bg-matcha text-obsidian border-matcha' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <Input label="Ball Cap" type="number" value={data.ballCapacity} onChange={e => updateField('ballCapacity', e.target.value)} />
                     <Input label="Preload" type="number" value={data.preload} onChange={e => updateField('preload', e.target.value)} />
                </div>

                <Input label="Shooters (Config)" value={data.shooters} onChange={e => updateField('shooters', e.target.value)} placeholder="e.g. Dual Wheel Hooded" />

                <div className="grid grid-cols-2 gap-4">
                     <Toggle label="Can Feed?" value={data.canFeed} field="canFeed" />
                     <Toggle label="Auto Align" value={data.autoAlign} field="autoAlign" />
                </div>
            </div>

            {/* Performance */}
            <div className="bg-white dark:bg-obsidian-light p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-lg font-black flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    Performance Stats
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Min Dist" value={data.minDist} onChange={e => updateField('minDist', e.target.value)} placeholder="Subwoofer" />
                    <Input label="Max Dist" value={data.maxDist} onChange={e => updateField('maxDist', e.target.value)} placeholder="Wing Line" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <Input label="BPS (Balls/Sec)" type="number" value={data.bps} onChange={e => updateField('bps', e.target.value)} />
                    <Input label="Experience" value={data.experience} onChange={e => updateField('experience', e.target.value)} placeholder="e.g. 5 Years" />
                </div>

                <div className="pt-2">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Notes</label>
                    <textarea 
                        value={data.notes}
                        onChange={e => updateField('notes', e.target.value)}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-matcha focus:outline-none min-h-[100px] resize-none"
                        placeholder="General observations, reliability issues, auto path details..."
                    />
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};