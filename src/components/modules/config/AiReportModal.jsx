import React from 'react';
import { X, BrainCircuit, AlertTriangle } from 'lucide-react';

const AiReportModal = ({ showModal, setShowModal, aiReport, isDark }) => {
    if (!showModal || !aiReport) return null;

    const textPrimary = isDark ? 'text-white' : 'text-slate-900';
    const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
            <div className={`w-full max-w-lg shadow-2xl rounded-2xl overflow-hidden border ${isDark ? 'bg-slate-900 border-indigo-500/30' : 'bg-white border-indigo-100'}`}>
                <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'bg-indigo-900/20 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
                    <div className="flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5 text-indigo-500" />
                        <span className={`font-bold uppercase text-xs tracking-wider ${isDark ? 'text-indigo-200' : 'text-indigo-800'}`}>Informe Táctico</span>
                    </div>
                    <button onClick={() => setShowModal(false)}><X className={`w-5 h-5 hover:opacity-100 opacity-60 ${textPrimary}`} /></button>
                </div>
                <div className="p-6 grid gap-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-xl text-center border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                            <p className="text-[10px] uppercase font-bold opacity-50 mb-1">Probabilidad</p>
                            <p className={`text-3xl font-mono font-bold ${textPrimary}`}>{aiReport.probability}</p>
                        </div>
                        <div className={`p-4 rounded-xl text-center border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                            <p className="text-[10px] uppercase font-bold opacity-50 mb-1">Clasificación</p>
                            <p className={`text-xl font-bold uppercase ${aiReport.status.includes('SEGURO') ? 'text-emerald-500' : 'text-red-500'}`}>{aiReport.status}</p>
                        </div>
                    </div>
                    <div className={`p-4 rounded-xl border-l-4 border-indigo-500 ${isDark ? 'bg-slate-800/30' : 'bg-indigo-50/50'}`}>
                        <p className={`text-xs leading-relaxed ${textSecondary}`}>{aiReport.analysis}</p>
                    </div>
                    <div className={`p-4 rounded-xl flex items-center gap-4 ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                        <div>
                            <p className="text-[10px] uppercase font-bold opacity-50">Acción Recomendada</p>
                            <p className={`text-sm font-bold uppercase ${textPrimary}`}>{aiReport.action}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiReportModal;
