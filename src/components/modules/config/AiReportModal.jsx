import React from 'react';
import { X, BrainCircuit, AlertTriangle, ShieldAlert, Target } from 'lucide-react';

const AiReportModal = ({ showModal, setShowModal, aiReport, isDark }) => {
    if (!showModal || !aiReport) return null;

    const text1 = isDark ? 'text-white' : 'text-slate-900';
    const text2 = isDark ? 'text-slate-400' : 'text-slate-500';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-md p-6 animate-fade-in">
            <div className={`w-full max-w-lg rounded-2xl overflow-hidden glass-panel ${isDark ? 'glass-panel-dark border-indigo-500/20' : 'glass-panel-light border-indigo-100'}`}>
                {/* Header */}
                <div className={`px-5 py-4 border-b flex justify-between items-center ${isDark ? 'bg-indigo-900/10 border-indigo-500/15' : 'bg-indigo-50/50 border-indigo-100'}`}>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                            <BrainCircuit className="w-4 h-4 text-indigo-400" />
                        </div>
                        <span className={`font-bold uppercase text-xs tracking-wider ${isDark ? 'text-indigo-200' : 'text-indigo-800'}`}>
                            Informe Tactico
                        </span>
                    </div>
                    <button onClick={() => setShowModal(false)}
                        className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-400'}`}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 grid gap-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className={`p-4 rounded-xl text-center border ${isDark ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex items-center justify-center gap-1.5 mb-2">
                                <Target className="w-3 h-3 text-indigo-400" />
                                <p className="text-[9px] uppercase font-bold opacity-40">Probabilidad</p>
                            </div>
                            <p className={`text-3xl font-mono font-bold ${text1}`}>{aiReport.probability}</p>
                        </div>
                        <div className={`p-4 rounded-xl text-center border ${isDark ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex items-center justify-center gap-1.5 mb-2">
                                <ShieldAlert className="w-3 h-3 text-red-400" />
                                <p className="text-[9px] uppercase font-bold opacity-40">Clasificacion</p>
                            </div>
                            <p className={`text-lg font-bold uppercase ${aiReport.status.includes('SEGURO') ? 'text-emerald-400' : 'text-red-400'}`}>
                                {aiReport.status}
                            </p>
                        </div>
                    </div>

                    {/* Analysis */}
                    <div className={`p-4 rounded-xl border-l-4 border-indigo-500 ${isDark ? 'bg-slate-800/20' : 'bg-indigo-50/30'}`}>
                        <p className={`text-xs leading-relaxed ${text2}`}>{aiReport.analysis}</p>
                    </div>

                    {/* Action */}
                    <div className={`p-4 rounded-xl flex items-center gap-4 ${isDark ? 'bg-amber-500/5 border border-amber-500/15' : 'bg-amber-50 border border-amber-100'}`}>
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-[9px] uppercase font-bold opacity-40 mb-0.5">Accion Recomendada</p>
                            <p className={`text-sm font-bold uppercase ${text1}`}>{aiReport.action}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiReportModal;
