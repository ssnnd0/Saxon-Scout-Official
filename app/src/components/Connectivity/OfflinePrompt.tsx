import React, { useState, useEffect } from 'react';
import { isOnline } from '../../lib/dataSync';
import type { DirHandle } from '../../lib/fsStore';

interface OfflinePromptProps {
  root: DirHandle | null;
  onSelectFolder: () => Promise<void>;
}

/**
 * Component that displays a prompt to select a download folder when offline
 * Only shows when WiFi is unavailable and no folder is selected
 */
export const OfflinePrompt: React.FC<OfflinePromptProps> = ({ root, onSelectFolder }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Check connectivity status
  useEffect(() => {
    const checkConnectivity = async () => {
      const online = await isOnline();
      setIsOffline(!online);
      
      // Only show prompt if offline and no folder selected
      setShowPrompt(!online && !root);
    };

    // Check immediately
    checkConnectivity();

    // Set up listeners for online/offline events
    const handleOnline = () => {
      setIsOffline(false);
      setShowPrompt(false);
    };

    const handleOffline = async () => {
      setIsOffline(true);
      // Only show prompt if no folder is selected
      if (!root) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check periodically (every 30 seconds)
    const interval = setInterval(checkConnectivity, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [root]);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 pb-2 sm:pb-5 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="p-2 rounded-lg bg-yellow-600 shadow-lg sm:p-3">
          <div className="flex items-center justify-between flex-wrap">
            <div className="w-0 flex-1 flex items-center">
              <span className="flex p-2 rounded-lg bg-yellow-800">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              <p className="ml-3 font-medium text-white truncate">
                <span className="md:hidden">You're offline! Select a local folder for data.</span>
                <span className="hidden md:inline">You're currently offline. Please select a local folder to store your scouting data.</span>
              </p>
            </div>
            <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
              <button
                onClick={onSelectFolder}
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-yellow-600 bg-white hover:bg-yellow-50"
              >
                Select Folder
              </button>
            </div>
            <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-2">
              <button
                type="button"
                onClick={() => setShowPrompt(false)}
                className="-mr-1 flex p-2 rounded-md hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflinePrompt;