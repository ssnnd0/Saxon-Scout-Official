import React from 'react';
import { Button } from '../components/Button';
import { exportData } from '../services/storageService';
import { ViewState } from '../types';

interface HomeProps {
  setView: (view: ViewState) => void;
}

export const Home: React.FC<HomeProps> = ({ setView }) => {
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="flex flex-col h-full justify-center items-center space-y-6 p-6">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black text-white mb-2 tracking-tighter">
          SAXON<span className="text-matcha">SCOUT</span>
        </h1>
        <div className="flex flex-col items-center gap-1">
          <p className="text-gold text-sm tracking-[0.2em] font-bold">LANGLEY SAXONS 611</p>
          <p className="text-slate-500 text-xs tracking-widest">SAXON SPARKS 526</p>
        </div>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <Button 
          variant="primary" 
          fullWidth 
          className="h-16 text-lg"
          onClick={() => setView('GAME_START')}
        >
          Start Scouting
        </Button>

        <Button 
          variant="secondary" 
          fullWidth 
          onClick={toggleFullScreen}
        >
          Full Screen
        </Button>

        <Button 
          variant="secondary" 
          fullWidth 
          onClick={exportData}
        >
          Dump Data (JSON)
        </Button>

        <Button 
          variant="ghost" 
          fullWidth 
          onClick={() => setView('SETTINGS')}
        >
          Settings
        </Button>
      </div>
    </div>
  );
};