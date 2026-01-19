import React, { useState, useEffect, useMemo } from 'react';
import QRCode from "react-qr-code";
import { Button } from '../components/Button';
import { ViewState, MatchData } from '../types';
import { getMatches } from '../services/storageService';
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';

interface QRCodeViewProps {
  setView: (view: ViewState) => void;
}

const MAX_QR_SIZE = 1500;

export const QRCodeView: React.FC<QRCodeViewProps> = ({ setView }) => {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchData | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setMatches(getMatches().reverse()); // Newest first
  }, []);

  const chunks = useMemo(() => {
    if (!selectedMatch) return [];
    const json = JSON.stringify(selectedMatch);
    if (json.length <= MAX_QR_SIZE) return [json];
    
    const totalChunks = Math.ceil(json.length / MAX_QR_SIZE);
    const result = [];
    for (let i = 0; i < totalChunks; i++) {
        result.push(json.slice(i * MAX_QR_SIZE, (i + 1) * MAX_QR_SIZE));
    }
    return result;
  }, [selectedMatch]);

  // Reset page when match changes
  useEffect(() => {
      setPage(0);
  }, [selectedMatch]);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-obsidian text-slate-900 dark:text-white transition-colors">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 bg-white dark:bg-obsidian-light">
            <Button variant="ghost" onClick={() => setView('DASHBOARD')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                <ArrowLeft size={24} />
            </Button>
            <h2 className="text-xl font-black">Data Transfer</h2>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* List of Matches */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-2 border-r border-slate-200 dark:border-slate-800 ${selectedMatch ? 'hidden md:block' : 'block'}`}>
                <h3 className="text-slate-500 font-bold uppercase text-xs mb-2">Saved Matches ({matches.length})</h3>
                {matches.map(m => (
                    <button 
                        key={m.id}
                        onClick={() => setSelectedMatch(m)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${selectedMatch?.id === m.id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <div className="flex justify-between items-start">
                            <span className="font-black text-xl text-slate-900 dark:text-white">Match {m.matchNumber}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${m.alliance === 'Red' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>{m.alliance}</span>
                        </div>
                        <div className="flex justify-between mt-2 text-slate-500 dark:text-slate-400 text-sm">
                            <span>Team {m.teamNumber}</span>
                            <span>{new Date(m.lastModified || 0).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                    </button>
                ))}
                {matches.length === 0 && (
                    <div className="text-center text-slate-500 mt-10 p-4 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
                        No matches saved yet.
                    </div>
                )}
            </div>

            {/* QR Display Area */}
            <div className={`flex-[2] bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-6 ${!selectedMatch ? 'hidden md:flex' : 'flex'}`}>
                {selectedMatch ? (
                    <div className="flex flex-col items-center w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* Mobile Back Button */}
                        <button onClick={() => setSelectedMatch(null)} className="md:hidden self-start mb-4 text-slate-500 flex items-center gap-2">
                            <ArrowLeft size={16} /> Back to List
                        </button>

                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Match {selectedMatch.matchNumber}</h3>
                            <p className="text-slate-500 dark:text-slate-400">Team {selectedMatch.teamNumber} • {selectedMatch.scouterInitials}</p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl shadow-2xl shadow-indigo-500/10">
                            <div className="h-64 w-64">
                                <QRCode
                                    size={256}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    value={chunks[page]}
                                    viewBox={`0 0 256 256`}
                                />
                            </div>
                        </div>

                        {/* Pagination */}
                        {chunks.length > 1 && (
                            <div className="flex items-center gap-6 mt-6">
                                <Button 
                                    variant="secondary"
                                    disabled={page === 0}
                                    onClick={() => setPage(p => p - 1)}
                                    className="p-3 rounded-full"
                                >
                                    <ChevronLeft size={24} />
                                </Button>
                                <span className="font-mono text-slate-500 font-bold">
                                    {page + 1} / {chunks.length}
                                </span>
                                <Button 
                                    variant="secondary"
                                    disabled={page === chunks.length - 1}
                                    onClick={() => setPage(p => p + 1)}
                                    className="p-3 rounded-full"
                                >
                                    <ChevronRight size={24} />
                                </Button>
                            </div>
                        )}

                        <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                                <div className="text-xs text-slate-500 uppercase font-bold">Score</div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">
                                    {selectedMatch.autoFuelScored + selectedMatch.teleopFuelScored}
                                </div>
                                <div className="text-[10px] text-slate-400">FUEL</div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                                <div className="text-xs text-slate-500 uppercase font-bold">Climb</div>
                                <div className="flex items-center justify-center gap-2 mt-1">
                                    {selectedMatch.endgameTowerLevel !== 'None' && selectedMatch.endgameTowerLevel !== 'Failed' 
                                        ? <CheckCircle className="text-emerald-500" size={24} /> 
                                        : <XCircle className="text-slate-400" size={24} />
                                    }
                                </div>
                                <div className="text-[10px] text-slate-400 mt-1">{selectedMatch.endgameTowerLevel}</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-slate-400 text-center">
                        <p className="font-bold text-lg mb-2">Select a match to view QR</p>
                        <p className="text-sm">Scan codes to transfer data to master scout.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  )
}