import React, { useState } from 'react';
import type { DirHandle } from '../lib/fsStore';

interface IndexProps {
  root: DirHandle | null;
  scouter: string;
  onPickFolder: () => void;
  onLogin: (username: string, password: string) => Promise<boolean>;
}

const Index: React.FC<IndexProps> = ({ root, scouter, onPickFolder, onLogin }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLoginClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!showLogin) {
      setShowLogin(true);
      return;
    }
    
    if (!username || !password) {
      setLoginError('Please enter both username and password');
      return;
    }
    
    try {
      setIsLoggingIn(true);
      setLoginError('');
      const success = await onLogin(username, password);
      if (!success) {
        setLoginError('Invalid username or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('An error occurred during login');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && showLogin) {
      const button = e.currentTarget.closest('form')?.querySelector('button[type="button"]') as HTMLButtonElement;
      if (button) {
        button.click();
      }
    }
  };

  return (
  <div className="scout-hero">
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Saxon Navigation */}
      <nav className="scout-nav mb-8">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="scout-nav-brand">
              <div className="scout-nav-logo">
                <i className="fa fa-shield-alt"></i>
              </div>
              <div>
                <div className="text-xl font-bold">Saxon Scout</div>
                <div className="text-sm text-saxon-gold-dark">Team 611</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {!root && (
                <button 
                  className="saxon-btn-outline"
                  onClick={onPickFolder}
                >
                  <i className="fa fa-folder-open mr-2"></i>
                  Select Data Folder
                </button>
              )}
              {root && (
                <span className="saxon-status saxon-status-online">
                  <i className="fa fa-check-circle mr-2"></i>
                  Connected
                </span>
              )}
              {!scouter ? (
                <div className="relative">
                  <button 
                    className="saxon-btn-outline flex items-center"
                    onClick={handleLoginClick}
                    disabled={isLoggingIn}
                  >
                    <i className="fa fa-user mr-2"></i>
                    {showLogin ? 'Sign In' : 'Sign In'}
                  </button>
                  {showLogin && (
                    <form 
                      className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 z-10 border border-gray-200 dark:border-gray-700"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleLoginClick(e as unknown as React.MouseEvent<HTMLButtonElement>);
                      }}
                    >
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Username
                          </label>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Enter username"
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Password
                          </label>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Enter password"
                          />
                        </div>
                        {loginError && (
                          <div className="text-red-500 text-sm">
                            {loginError}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={handleLoginClick}
                          disabled={isLoggingIn}
                          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoggingIn ? 'Signing in...' : 'Sign In'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="mr-3 text-sm text-gray-700 dark:text-gray-300">
                    {scouter}
                  </span>
                  <button 
                    className="saxon-btn-outline"
                    onClick={() => {
                      // Clear the user session
                      onLogin('', '').catch(console.error);
                    }}
                  >
                    <i className="fa fa-sign-out-alt"></i>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main>
        {!root && !scouter && (
          <div className="saxon-card">
            <div className="saxon-card-body">
              {/* System Header */}
              <div className="text-center mb-8">
                <div className="saxon-module-icon text-6xl mx-auto mb-6">
                  <i className="fa fa-rocket"></i>
                </div>
                <h1 className="saxon-hero-title">Saxon Scout v2.1</h1>
                <p className="saxon-hero-description">
                  FRC Scouting System - Local-First Data Collection
                </p>
              </div>

              {/* System Requirements */}
              <div className="saxon-card bg-saxon-gold-light mb-6">
                <div className="saxon-card-body">
                  <h4 className="font-bold mb-4 text-saxon-black">
                    <i className="fa fa-cog mr-2"></i>
                    System Requirements
                  </h4>
                  <div className="saxon-grid-2">
                    <div className="flex items-center space-x-3">
                      <span className="saxon-status saxon-status-online"></span>
                      <div>
                        <div className="font-semibold text-sm">Modern Browser</div>
                        <div className="text-saxon-gold-dark text-xs">Chrome 86+</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="saxon-status saxon-status-online"></span>
                      <div>
                        <div className="font-semibold text-sm">File System API</div>
                        <div className="text-saxon-gold-dark text-xs">Local Access</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="saxon-status saxon-status-online"></span>
                      <div>
                        <div className="font-semibold text-sm">Local Storage</div>
                        <div className="text-saxon-gold-dark text-xs">Available</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="saxon-status saxon-status-online"></span>
                      <div>
                        <div className="font-semibold text-sm">PWA Support</div>
                        <div className="text-saxon-gold-dark text-xs">Enabled</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Setup Instructions */}
              <div className="saxon-alert saxon-alert-info mb-6">
                <h4 className="font-bold mb-4">
                  <i className="fa fa-info-circle mr-2"></i>
                  Initial Setup
                </h4>
                <div className="saxon-grid-3">
                  <div className="flex items-start space-x-3">
                    <span className="saxon-badge text-xs">1</span>
                    <div>
                      <strong>Data Storage</strong>
                      <p className="text-sm mb-0">Select local folder for scouting data</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="saxon-badge text-xs">2</span>
                    <div>
                      <strong>User Login</strong>
                      <p className="text-sm mb-0">Enter scouter name for data attribution</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="saxon-badge text-xs">3</span>
                    <div>
                      <strong>Begin Scouting</strong>
                      <p className="text-sm mb-0">Start collecting match and pit data</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4">
                <button
                  className="saxon-btn text-lg px-8 py-4"
                  onClick={onPickFolder}
                >
                  <i className="fa fa-folder-open mr-3"></i>
                  Select Data Folder
                </button>
                <button
                  className="saxon-btn-outline text-lg px-8 py-4"
                  onClick={onLogin}
                >
                  <i className="fa fa-user mr-3"></i>
                  Sign In
                </button>
              </div>
            </div>

            {/* Feature Overview */}
            <div className="saxon-grid-3 mt-8">
              <div className="saxon-card">
                <div className="saxon-card-body text-center">
                  <div className="saxon-module-icon text-2xl mx-auto mb-4">
                    <i className="fa fa-bolt"></i>
                  </div>
                  <h4 className="font-bold mb-2 text-saxon-black">Quick Scout</h4>
                  <p className="text-saxon-gold-dark text-sm">Match scoring interface with keyboard shortcuts</p>
                </div>
              </div>
              <div className="saxon-card">
                <div className="saxon-card-body text-center">
                  <div className="saxon-module-icon text-2xl mx-auto mb-4">
                    <i className="fa fa-robot"></i>
                  </div>
                  <h4 className="font-bold mb-2 text-saxon-black">Pit Scout</h4>
                  <p className="text-saxon-gold-dark text-sm">Robot capability analysis and documentation</p>
                </div>
              </div>
              <div className="saxon-card">
                <div className="saxon-card-body text-center">
                  <div className="saxon-module-icon text-2xl mx-auto mb-4">
                    <i className="fa fa-chart-line"></i>
                  </div>
                  <h4 className="font-bold mb-2 text-saxon-black">Data Analysis</h4>
                  <p className="text-saxon-gold-dark text-sm">Team statistics and performance insights</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {root && !scouter && (
          <div className="saxon-card max-w-2xl mx-auto">
            <div className="saxon-card-body text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <span className="saxon-status saxon-status-online"></span>
                <span className="font-semibold">Data Folder Connected</span>
              </div>
              <h3 className="mb-4">User Authentication Required</h3>
              <p className="text-saxon-gold-dark mb-6">Please sign in to begin the scouting session</p>
              <button className="saxon-btn" onClick={onLogin}>
                <i className="fa fa-user mr-2"></i>
                Sign In
              </button>
            </div>
          </div>
        )}

        {!root && scouter && (
          <div className="saxon-card max-w-2xl mx-auto">
            <div className="saxon-card-body text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <span className="saxon-status saxon-status-online"></span>
                <span className="font-semibold">Logged in as {scouter}</span>
              </div>
              <h3 className="mb-4">Data Storage Required</h3>
              <p className="text-saxon-gold-dark mb-6">Select a local folder to store scouting data</p>
              <button className="saxon-btn" onClick={onPickFolder}>
                <i className="fa fa-folder-open mr-2"></i>
                Select Data Folder
              </button>
            </div>
          </div>
        )}

        {root && scouter && (
          <div className="saxon-card max-w-4xl mx-auto">
            <div className="saxon-card-body text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <span className="saxon-status saxon-status-online"></span>
                <span className="saxon-status saxon-status-online"></span>
                <span className="font-semibold">System Ready</span>
              </div>
              <h2 className="mb-4 font-bold">Saxon Scout Initialized</h2>
              <p className="text-saxon-gold-dark mb-6">
                User: <strong>{scouter}</strong> | Data Storage: <strong>Connected</strong>
              </p>
              <div className="saxon-data-grid mb-6">
                <div className="saxon-data-card">
                  <div className="saxon-data-value">Ready</div>
                  <div className="saxon-data-label">System Status</div>
                </div>
                <div className="saxon-data-card">
                  <div className="saxon-data-value">Local</div>
                  <div className="saxon-data-label">Storage Mode</div>
                </div>
                <div className="saxon-data-card">
                  <div className="saxon-data-value">v2.1</div>
                  <div className="saxon-data-label">Version</div>
                </div>
              </div>
              <div className="saxon-alert saxon-alert-success">
                <i className="fa fa-check-circle mr-2"></i> 
                All systems operational - Begin scouting session
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  </div>
);
};

export default Index;
