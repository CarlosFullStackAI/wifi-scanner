import React from 'react';
import { X, BrainCircuit, AlertTriangle, ShieldAlert, Target } from 'lucide-react';

const AiReportModal = ({ showModal, setShowModal, aiReport, isDark }) => {
    if (!showModal || !aiReport) return null;

    const t1 = isDark ? 'text-white' : 'text-slate-900';
    const t2 = isDark ? 'text-slate-400' : 'text-slate-500';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
            <div className={`modal-enter w-full max-w-lg rounded-2xl overflow-hidden ${isDark ? 'glass border-violet-500/15' : 'glass-light border-violet-100'}`}>
                {/* Header */}
                <div className={`px-5 py-3.5 border-b flex justify-between items-center ${isDark ? 'bg-violet-500/[0.03] border-violet-500/10' : 'bg-violet-50/30 border-violet-100'}`}>
                    <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-violet-500/10' : 'bg-violet-100'}`}>
                            <BrainCircuit className="w-3.5 h-3.5 text-violet-400" />
                        </div>
                        <span className={`font-bold uppercase text-[10px] tracking-[0.15em] font-mono ${isDark ? 'text-violet-300' : 'text-violet-800'}`}>
                            Informe Tactico
                        </span>
                    </div>
                    <button onClick={() => setShowModal(false)}
                        className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-white/5 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 grid gap-3.5">
                    <div className="grid grid-cols-2 gap-3">
                        <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-white/[0.02] border border-slate-700/20' : 'bg-slate-50 border border-slate-100'}`}>
                            <div className="flex items-center justify-center gap-1 mb-2">
                                <Target className="w-2.5 h-2.5 text-violet-400" />
                                <p className={`text-[8px] uppercase font-bold tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Probabilidad</p>
                            </div>
                            <p className={`text-3xl font-mono font-black ${t1}`}>{aiReport.probability}</p>
                        </div>
                        <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-white/[0.02] border border-slate-700/20' : 'bg-slate-50 border border-slate-100'}`}>
                            <div className="flex items-center justify-center gap-1 mb-2">
                                <ShieldAlert className="w-2.5 h-2.5 text-red-400" />
                                <p className={`text-[8px] uppercase font-bold tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Nivel</p>
                            </div>
                            <p className={`text-lg font-black uppercase ${aiReport.status.includes('SEGURO') ? 'text-emerald-400' : 'text-red-400'}`}>
                                {aiReport.status}
                            </p>
                        </div>
                    </div>

                    <div className={`p-4 rounded-xl border-l-2 border-violet-500 ${isDark ? 'bg-white/[0.01]' : 'bg-violet-50/30'}`}>
                        <p className={`text-xs leading-relaxed ${t2}`}>{aiReport.analysis}</p>
                    </div>

                    <div className={`p-4 rounded-xl flex items-center gap-3 ${isDark ? 'bg-amber-500/[0.03] border border-amber-500/10' : 'bg-amber-50 border border-amber-100'}`}>
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-amber-500/10' : 'bg-amber-100'}`}>
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                            <p className={`text-[8px] uppercase font-bold tracking-widest mb-0.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Accion</p>
                            <p className={`text-sm font-bold uppercase font-mono ${t1}`}>{aiReport.action}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiReportModal;
