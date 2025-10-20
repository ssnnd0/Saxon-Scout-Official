import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeName = 'light' | 'dark' | 'auto' | 'emerald' | 'crimson' | 'amethyst' | 'amber' | 'high-contrast';
export type NavPosition = 'top' | 'left';

export interface AppSettings {
  theme: ThemeName;
  navPosition: NavPosition;
  navCollapsedByDefault: boolean;
  notifications: boolean;
  autoSave: boolean;
  dataRetention: number;
  exportFormat: 'csv' | 'json' | 'both';
}

const DEFAULTS: AppSettings = {
  theme: 'light',
  navPosition: 'top',
  navCollapsedByDefault: false,
  notifications: true,
  autoSave: true,
  dataRetention: 30,
  exportFormat: 'both',
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem('saxon-scout-settings');
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      theme: (parsed.theme as ThemeName) || DEFAULTS.theme,
      navPosition: (parsed.navPosition as NavPosition) || DEFAULTS.navPosition,
      navCollapsedByDefault: parsed.navCollapsedByDefault === true,
      notifications: parsed.notifications !== false,
      autoSave: parsed.autoSave !== false,
      dataRetention: Number.isFinite(parsed.dataRetention) ? parsed.dataRetention : DEFAULTS.dataRetention,
      exportFormat: (parsed.exportFormat as AppSettings['exportFormat']) || DEFAULTS.exportFormat,
    };
  } catch {
    return DEFAULTS;
  }
}

function saveSettings(s: AppSettings) {
  localStorage.setItem('saxon-scout-settings', JSON.stringify(s));
}

function applyTheme(theme: ThemeName) {
  const root = document.documentElement;
  const cleanup = () => {};

  if (theme === 'auto') {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const set = () => {
      if (mq.matches) root.setAttribute('data-theme', 'dark');
      else root.removeAttribute('data-theme');
    };
    set();
    mq.addEventListener('change', set);
    return () => mq.removeEventListener('change', set);
  }

  if (theme === 'light') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
  return cleanup;
}

interface SettingsContextValue {
  settings: AppSettings;
  update: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  bulkUpdate: (patch: Partial<AppSettings>) => void;
}

export const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    const dispose = applyTheme(settings.theme);
    return () => {
      try { dispose && dispose(); } catch {}
    };
  }, [settings.theme]);

  const value = useMemo<SettingsContextValue>(() => ({
    settings,
    update: (key, value) => setSettings(prev => ({ ...prev, [key]: value })),
    bulkUpdate: (patch) => setSettings(prev => ({ ...prev, ...patch })),
  }), [settings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
