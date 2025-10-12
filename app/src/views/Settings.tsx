import * as Inferno from 'inferno';
import { useState } from '../lib/inferno-hooks-shim';

interface SettingsProps {
  navigateHome: () => void;
}

export default function Settings({ navigateHome }: SettingsProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [autoSave, setAutoSave] = useState(true);
  const [keyboardShortcuts, setKeyboardShortcuts] = useState(true);

  return (
    <div className="card-modern card">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h4 className="mb-1 fw-bold">Settings</h4>
            <p className="text-muted mb-0 small">Configure your scouting preferences</p>
          </div>
          <button className="btn btn-outline-secondary" onClick={navigateHome}>
            <i className="fa fa-arrow-left me-2"></i>
            Back
          </button>
        </div>

        <div className="alert alert-info d-flex align-items-start gap-2 mb-4">
          <i className="fa fa-info-circle mt-1"></i>
          <div className="small">
            <strong>Coming Soon:</strong> Settings will be fully functional in a future update.
            Your preferences will be saved locally and persist across sessions.
          </div>
        </div>

        <div className="row g-4">
          <div className="col-12">
            <h6 className="fw-semibold mb-3">
              <i className="fa fa-palette me-2 text-primary"></i>
              Appearance
            </h6>
            <div className="card border">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <label className="form-label mb-1 fw-semibold">Theme</label>
                    <p className="small text-muted mb-0">Choose your preferred color scheme</p>
                  </div>
                  <select
                    className="form-select w-auto"
                    value={theme}
                    onChange={(e: any) => setTheme(e.target.value)}
                    disabled
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <h6 className="fw-semibold mb-3">
              <i className="fa fa-cogs me-2 text-success"></i>
              Data Management
            </h6>
            <div className="card border">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <label className="form-label mb-1 fw-semibold">Auto-save</label>
                    <p className="small text-muted mb-0">Automatically save data after each entry</p>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="autoSaveCheck"
                      checked={autoSave}
                      onChange={(e: any) => setAutoSave(e.target.checked)}
                      style={{ width: '3rem', height: '1.5rem' }}
                      disabled
                    />
                  </div>
                </div>
                <hr />
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <label className="form-label mb-1 fw-semibold">Data Location</label>
                    <p className="small text-muted mb-0">Current data folder location</p>
                  </div>
                  <button className="btn btn-outline-primary btn-sm" disabled>
                    <i className="fa fa-folder-open me-2"></i>
                    Change Folder
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <h6 className="fw-semibold mb-3">
              <i className="fa fa-keyboard me-2 text-warning"></i>
              Keyboard Shortcuts
            </h6>
            <div className="card border">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <label className="form-label mb-1 fw-semibold">Enable Keyboard Shortcuts</label>
                    <p className="small text-muted mb-0">Use number keys for quick actions</p>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="keyboardCheck"
                      checked={keyboardShortcuts}
                      onChange={(e: any) => setKeyboardShortcuts(e.target.checked)}
                      style={{ width: '3rem', height: '1.5rem' }}
                      disabled
                    />
                  </div>
                </div>
                <hr />
                <div>
                  <p className="small fw-semibold mb-2">Quick Scout Shortcuts:</p>
                  <div className="row g-2 small text-muted">
                    <div className="col-6 col-md-4">
                      <kbd className="px-2 py-1">1-9</kbd> Grid actions
                    </div>
                    <div className="col-6 col-md-4">
                      <kbd className="px-2 py-1">U</kbd> Undo
                    </div>
                    <div className="col-6 col-md-4">
                      <kbd className="px-2 py-1">M</kbd> Mobility
                    </div>
                    <div className="col-6 col-md-4">
                      <kbd className="px-2 py-1">F</kbd> Foul
                    </div>
                    <div className="col-6 col-md-4">
                      <kbd className="px-2 py-1">S</kbd> Save
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <h6 className="fw-semibold mb-3">
              <i className="fa fa-info-circle me-2 text-info"></i>
              About
            </h6>
            <div className="card border">
              <div className="card-body">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <img src="/app/assets/Logo+611.png" alt="Saxon Scout" style={{ height: '48px' }} />
                  <div>
                    <h5 className="mb-0 fw-bold">Saxon Scout</h5>
                    <p className="small text-muted mb-0">Version 2.0.0</p>
                  </div>
                </div>
                <p className="small mb-3">
                  A local-first FRC scouting application designed for fast, reliable data collection
                  at robotics competitions. All data is stored locally on your device for maximum
                  privacy and offline capability.
                </p>
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary btn-sm" disabled>
                    <i className="fa fa-book me-2"></i>
                    Documentation
                  </button>
                  <button className="btn btn-outline-secondary btn-sm" disabled>
                    <i className="fa fa-question-circle me-2"></i>
                    Help & Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
