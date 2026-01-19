import React from 'react';
import { ZONES } from '../constants';

interface FieldMapProps {
  selectedZone: string;
  onSelectZone: (zone: string) => void;
  alliance: 'Red' | 'Blue';
}

export const FieldMap: React.FC<FieldMapProps> = ({ selectedZone, onSelectZone, alliance }) => {
  return (
    <div className="w-full aspect-[2/1] bg-white dark:bg-slate-900 rounded-xl relative overflow-hidden transition-colors duration-300">
      
      {/* Field Background Lines (2026 REBUILT Schematic) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        {/* Center Line */}
        <div className="absolute top-0 left-1/2 w-0.5 h-full bg-slate-300 dark:bg-slate-700 -translate-x-1/2"></div>
        
        {/* Central Hub (Target) */}
        <div className="absolute top-1/2 left-1/2 w-24 h-24 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10">
            {/* Outer Rim */}
            <div className="absolute inset-0 border-4 border-slate-300 dark:border-slate-600 rounded-full opacity-50"></div>
            {/* Inner Hub */}
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full border-4 border-gold dark:border-gold shadow-lg shadow-gold/20 flex items-center justify-center">
                <div className="text-[8px] font-black text-slate-500 dark:text-slate-400">HUB</div>
            </div>
        </div>

        {/* Alliance Specific Elements */}
        {alliance === 'Blue' ? (
            <>
                {/* Blue Start Line */}
                <div className="absolute top-0 left-12 h-full w-0.5 border-l-2 border-dashed border-blue-500/30"></div>
                {/* Blue Tower */}
                <div className="absolute bottom-4 right-1/4 w-12 h-12 border-2 border-blue-500/50 bg-blue-900/10 rounded-lg flex items-center justify-center">
                    <span className="text-[6px] font-bold text-blue-500">TOWER</span>
                </div>
            </>
        ) : (
            <>
                {/* Red Start Line */}
                <div className="absolute top-0 right-12 h-full w-0.5 border-r-2 border-dashed border-red-500/30"></div>
                {/* Red Tower */}
                <div className="absolute bottom-4 left-1/4 w-12 h-12 border-2 border-red-500/50 bg-red-900/10 rounded-lg flex items-center justify-center">
                    <span className="text-[6px] font-bold text-red-500">TOWER</span>
                </div>
            </>
        )}
      </div>

      {/* Interactive Zones */}
      <svg className="absolute inset-0 w-full h-full z-20" viewBox="0 0 100 100" preserveAspectRatio="none">
        {ZONES.map((zone) => {
          // Filter zones based on alliance
          if (alliance === 'Red' && zone.color === 'blue') return null;
          if (alliance === 'Blue' && zone.color === 'red') return null;

          const isSelected = selectedZone === zone.id;
          
          return (
            <g key={zone.id} onClick={() => onSelectZone(zone.id)} className="cursor-pointer group">
                <rect
                  x={zone.x}
                  y={zone.y}
                  width={zone.w}
                  height={zone.h}
                  className={`
                    transition-all duration-200 
                    ${isSelected 
                        ? 'fill-matcha/60 stroke-matcha stroke-2' 
                        : 'fill-slate-200/50 dark:fill-slate-800/50 stroke-slate-300 dark:stroke-slate-600 hover:fill-matcha/20'}
                  `}
                  rx="2"
                />
                <text 
                    x={zone.x + zone.w/2} 
                    y={zone.y + zone.h/2} 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    className={`text-[3px] font-bold pointer-events-none uppercase ${isSelected ? 'fill-white' : 'fill-slate-500 dark:fill-slate-400'}`}
                >
                    {zone.label.split(' ')[1]}
                </text>
            </g>
          );
        })}
      </svg>
      
      {/* Starting Line Indicators */}
      {alliance === 'Blue' && <div className="absolute top-2 left-2 text-[8px] font-bold text-blue-500">BLUE ALLIANCE</div>}
      {alliance === 'Red' && <div className="absolute top-2 right-2 text-[8px] font-bold text-red-500">RED ALLIANCE</div>}
    </div>
  );
};