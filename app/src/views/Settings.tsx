import React, { useContext, useState, useEffect } from 'react';
import { toast } from '../lib/toast';
import { SettingsContext, AppSettings } from '../context/SettingsContext';
import { spacing } from '../styles/tokens';

// Extract types from AppSettings
type ThemeType = AppSettings['theme'];
type NavPosition = AppSettings['navPosition'];
type ExportFormat = AppSettings['exportFormat'];

// Extend AppSettings with additional component state
interface SettingsState extends Omit<AppSettings, 'theme' | 'navPosition' | 'exportFormat'> {
  theme: ThemeType;
  navPosition: NavPosition;
  exportFormat: ExportFormat;
  saving: boolean;
}

interface SettingsProps {
  navigateHome: () => void;
}

// Helper type to ensure proper default export
type SettingsComponent = React.FC<SettingsProps> & {
  defaultProps?: Partial<SettingsProps>;
};

const Settings: SettingsComponent = ({ navigateHome }) => {
  const context = useContext(SettingsContext);
  const [settings, setSettings] = useState<SettingsState>({
    theme: 'light',
    navPosition: 'top',
    navCollapsedByDefault: false,
    notifications: true,
    autoSave: true,
    dataRetention: 30,
    exportFormat: 'both',
    saving: false
  });

  // Load settings when component mounts
  useEffect(() => {
    if (context) {
      const { settings: contextSettings } = context;
      setSettings(prev => ({
        ...prev,
        ...contextSettings,
        navPosition: contextSettings.navPosition || 'top',
        saving: false
      }));
    }
  }, [context]);

  // Update a single setting
  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    if (context) {
      context.update(key, value);
    }
  };

  // Save all settings
  const saveSettings = async () => {
    setSettings(prev => ({ ...prev, saving: true }));
    try {
      if (context) {
        await context.bulkUpdate({
          theme: settings.theme,
          navPosition: settings.navPosition,
          navCollapsedByDefault: settings.navCollapsedByDefault,
          notifications: settings.notifications,
          autoSave: settings.autoSave,
          dataRetention: settings.dataRetention,
          exportFormat: settings.exportFormat
        });
        toast.success('Settings saved successfully');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setSettings(prev => ({ ...prev, saving: false }));
    }
  };

  // Reset to default settings
  const resetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      const defaults: AppSettings = {
        theme: 'light',
        navPosition: 'top',
        navCollapsedByDefault: false,
        notifications: true,
        autoSave: true,
        dataRetention: 30,
        exportFormat: 'both'
      };
      
      // Update local state with defaults
      setSettings(prev => ({
        ...defaults,
        saving: false
      }));
      
      // Update context with new settings
      if (context) {
        context.bulkUpdate(defaults)
          .then(() => {
            toast.success('Settings reset to defaults');
          })
          .catch((error) => {
            console.error('Failed to update settings:', error);
            toast.error('Failed to reset settings');
          });
      } else {
        toast.success('Settings reset to defaults');
      }
    }
  };

  // Clear cached data
  const clearData = () => {
    if (window.confirm('Are you sure you want to clear all cached data? This action cannot be undone.')) {
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('saxon-scout-') || key.startsWith('scout-'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        toast.success('Cached data cleared successfully');
      } catch (err) {
        console.error('Failed to clear data:', err);
        toast.error('Failed to clear cached data');
      }
    }
  };

  // Destructure settings for easier access
  const {
    theme,
    navPosition,
    navCollapsedByDefault,
    notifications,
    autoSave,
    dataRetention,
    exportFormat,
    saving
  } = settings;

  return (
    <div className={`min-h-screen bg-gray-50 p-${spacing.lg}`}>
      <div className={`max-w-6xl mx-auto`}>
        {/* Header */}
        <div className={`mb-${spacing.xl}`}>
          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-${spacing.md} mb-${spacing.lg}`}>
            <div className="flex items-center">
              <div className={`bg-yellow-500 p-${spacing.md} rounded-md text-white mr-${spacing.md}`}>
                <i className="fas fa-cog text-2xl"></i>
              </div>
              <div>
                <h1 className={`text-3xl font-bold text-gray-900`}>Settings</h1>
                <p className={`text-yellow-600`}>Configuration and Preferences</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-${spacing.md} py-${spacing.xs} rounded-full text-sm font-medium bg-gray-100 text-gray-800`}>
                v2.1
              </span>
              <button 
                onClick={navigateHome}
                className={`inline-flex items-center px-${spacing.md} py-${spacing.sm} border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500`}
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Home
              </button>
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-${spacing.xl}`}>
          {/* Appearance Settings */}
          <div className={`bg-white shadow rounded-lg overflow-hidden`}>
            <div className={`p-${spacing.xl}`}>
              <h2 className={`text-xl font-bold text-gray-900 mb-${spacing.lg} flex items-center`}>
                <i className="fas fa-palette text-yellow-500 mr-${spacing.sm}"></i>
                Appearance
              </h2>
              
              <div className={`space-y-${spacing.md}`}>
                <div>
                  <label htmlFor="theme" className={`block text-sm font-medium text-gray-700 mb-${spacing.xs}`}>
                    Theme
                  </label>
                  <select
                    id="theme"
                    className={`mt-1 block w-full pl-${spacing.md} pr-10 py-${spacing.sm} text-base border-gray-300 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm rounded-md`}
                    value={theme}
                    onChange={(e) => updateSetting('theme', e.target.value as ThemeType)}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                    <option value="emerald">Emerald</option>
                    <option value="crimson">Crimson</option>
                    <option value="amethyst">Amethyst</option>
                    <option value="amber">Amber</option>
                    <option value="high-contrast">High Contrast</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="navPosition" className={`block text-sm font-medium text-gray-700 mb-${spacing.xs}`}>
                    Navigation Position
                  </label>
                  <select
                    id="navPosition"
                    className={`mt-1 block w-full pl-${spacing.md} pr-10 py-${spacing.sm} text-base border-gray-300 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm rounded-md`}
                    value={navPosition}
                    onChange={(e) => updateSetting('navPosition', e.target.value as NavPosition)}
                  >
                    <option value="top">Top</option>
                    <option value="left">Left</option>
                  </select>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="navCollapsed"
                      name="navCollapsed"
                      type="checkbox"
                      className={`focus:ring-yellow-500 h-4 w-4 text-yellow-600 border-gray-300 rounded`}
                      checked={navCollapsedByDefault}
                      onChange={(e) => updateSetting('navCollapsedByDefault', e.target.checked)}
                    />
                  </div>
                  <div className={`ml-3 text-sm`}>
                    <label htmlFor="navCollapsed" className={`font-medium text-gray-700`}>
                      Collapse Navigation by Default
                    </label>
                    <p className="text-gray-500">Start with the sidebar collapsed (left navigation only)</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="notifications"
                      name="notifications"
                      type="checkbox"
                      className={`focus:ring-yellow-500 h-4 w-4 text-yellow-600 border-gray-300 rounded`}
                      checked={notifications}
                      onChange={(e) => updateSetting('notifications', e.target.checked)}
                    />
                  </div>
                  <div className={`ml-3 text-sm`}>
                    <label htmlFor="notifications" className={`font-medium text-gray-700`}>
                      Enable Notifications
                    </label>
                    <p className="text-gray-500">Receive browser notifications for important events</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Settings */}
          <div className={`bg-white shadow rounded-lg overflow-hidden`}>
            <div className={`p-${spacing.xl}`}>
              <h2 className={`text-xl font-bold text-gray-900 mb-${spacing.lg} flex items-center`}>
                <i className="fas fa-database text-yellow-500 mr-${spacing.sm}"></i>
                Data Management
              </h2>
              
              <div className={`space-y-${spacing.md}`}>
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="autoSave"
                      name="autoSave"
                      type="checkbox"
                      className={`focus:ring-yellow-500 h-4 w-4 text-yellow-600 border-gray-300 rounded`}
                      checked={autoSave}
                      onChange={(e) => updateSetting('autoSave', e.target.checked)}
                    />
                  </div>
                  <div className={`ml-3 text-sm`}>
                    <label htmlFor="autoSave" className={`font-medium text-gray-700`}>
                      Auto Save Data
                    </label>
                    <p className="text-gray-500">Automatically save changes without confirmation</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="dataRetention" className={`block text-sm font-medium text-gray-700 mb-${spacing.xs}`}>
                    Data Retention Period
                  </label>
                  <select
                    id="dataRetention"
                    className={`mt-1 block w-full pl-${spacing.md} pr-10 py-${spacing.sm} text-base border-gray-300 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm rounded-md`}
                    value={dataRetention}
                    onChange={(e) => updateSetting('dataRetention', parseInt(e.target.value))}
                  >
                    <option value={7}>7 days</option>
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                    <option value={365}>1 year</option>
                    <option value={-1}>Forever</option>
                  </select>
                  <p className={`mt-${spacing.xs} text-sm text-gray-500`}>
                    How long to keep local data before automatic cleanup
                  </p>
                </div>

                <div>
                  <label htmlFor="exportFormat" className={`block text-sm font-medium text-gray-700 mb-${spacing.xs}`}>
                    Export Format
                  </label>
                  <select
                    id="exportFormat"
                    className={`mt-1 block w-full pl-${spacing.md} pr-10 py-${spacing.sm} text-base border-gray-300 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm rounded-md`}
                    value={exportFormat}
                    onChange={(e) => updateSetting('exportFormat', e.target.value as ExportFormat)}
                  >
                    <option value="csv">CSV Only</option>
                    <option value="json">JSON Only</option>
                    <option value="both">Both Formats</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className={`mt-${spacing.xl} bg-white shadow rounded-lg overflow-hidden`}>
          <div className={`p-${spacing.xl}`}>
            <h2 className={`text-xl font-bold text-gray-900 mb-${spacing.lg} flex items-center`}>
              <i className="fas fa-info-circle text-yellow-500 mr-${spacing.sm}"></i>
              System Information
            </h2>
            
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-${spacing.xl}`}>
              <div>
                <h3 className={`text-lg font-medium text-gray-900 mb-${spacing.md}`}>Application</h3>
                <dl className={`space-y-${spacing.sm}`}>
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Version</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">2.1.0</dd>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Build</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">Saxon Scout</dd>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Team</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">611 Saxon Robotics</dd>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Season</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">FRC 2025 REEFSCAPE</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className={`text-lg font-medium text-gray-900 mb-${spacing.md}`}>Browser</h3>
                <dl className={`space-y-${spacing.sm}`}>
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">User Agent</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 truncate" title={navigator.userAgent}>
                      {navigator.userAgent.split(' ')[0]}
                    </dd>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Platform</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{navigator.platform}</dd>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Language</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{navigator.language}</dd>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        navigator.onLine ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {navigator.onLine ? 'Online' : 'Offline'}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`mt-${spacing.xl} flex flex-col sm:flex-row justify-center gap-${spacing.md}`}>
          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className={`inline-flex items-center px-${spacing.xl} py-${spacing.md} border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {saving ? (
              <>
                <svg className={`animate-spin -ml-1 mr-${spacing.sm} h-5 w-5 text-white`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <i className={`fas fa-save mr-${spacing.sm}`}></i>
                Save Settings
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={resetSettings}
            className={`inline-flex items-center px-${spacing.xl} py-${spacing.md} border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500`}
          >
            <i className={`fas fa-undo mr-${spacing.sm}`}></i>
            Reset Defaults
          </button>
          
          <button
            type="button"
            onClick={clearData}
            className={`inline-flex items-center px-${spacing.xl} py-${spacing.md} border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
          >
            <i className={`fas fa-trash mr-${spacing.sm}`}></i>
            Clear Data
          </button>
        </div>

        {/* Footer */}
        <div className={`mt-${spacing.xl} pt-${spacing.md} border-t border-gray-200`}>
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <div className="mb-2 md:mb-0">
              <strong>Settings Module</strong> • Team 611 Saxon Robotics
            </div>
            <div>
              FRC 2025 REEFSCAPE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export the component with proper TypeScript types
export default Settings;