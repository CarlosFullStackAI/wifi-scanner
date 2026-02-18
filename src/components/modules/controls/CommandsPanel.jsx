import React from 'react';
import { Terminal, Zap, UserX, BrainCircuit, RefreshCw, ShieldCheck, ShieldOff } from 'lucide-react';
import Panel from '../../common/Panel';
import Button from '../../common/Button';

const CommandsPanel = ({ isScanning, toggleScan, triggerInterference, isAnalyzing, analyzeWithGemini, isDark }) => {
    return (
        <Panel title="Comandos" icon={Terminal} className="flex-1 min-h-0" isDark={isDark}>
            <div className="flex flex-col gap-3 h-full">

                {/* ── Hero scanner toggle ─────────────────────────────── */}
                <button
                    onClick={toggleScan}
                    className={`
                        relative w-full rounded-2xl py-5 flex flex-col items-center justify-center gap-3
                        font-bold tracking-widest uppercase transition-all duration-300 overflow-hidden
                        border-2 active:scale-[0.97]
                        ${isScanning
                            ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.18)]'
                            : isDark
                                ? 'bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:shadow-[0_0_20px_rgba(6,182,212,0.08)]'
                                : 'bg-white border-slate-200 hover:border-cyan-300 hover:bg-cyan-50 shadow-sm'
                        }
                    `}
                >
                    {/* Pulse ring when scanning */}
                    {isScanning && (
                        <>
                            <span className="absolute inset-0 rounded-2xl border-2 border-cyan-400/30 animate-ping" style={{ animationDuration: '1.8s' }} />
                            <span className="absolute inset-0 rounded-2xl border border-cyan-400/10 animate-ping" style={{ animationDuration: '2.4s', animationDelay: '0.3s' }} />
                        </>
                    )}

                    {/* Icon */}
                    <div className={`
                        relative z-10 w-14 h-14 rounded-full flex items-center justify-center
                        border-2 transition-all duration-300
                        ${isScanning
                            ? 'bg-cyan-500/15 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                            : isDark
                                ? 'bg-slate-700/50 border-slate-600/50'
                                : 'bg-slate-100 border-slate-200'
                        }
                    `}>
                        {isScanning
                            ? <ShieldCheck className="w-7 h-7 text-cyan-400" />
                            : <ShieldOff className={`w-7 h-7 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                        }
                    </div>

                    {/* Label */}
                    <div className="relative z-10 text-center">
                        <div className={`text-base font-black tracking-[0.15em] ${isScanning ? 'text-cyan-400' : isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            {isScanning ? 'VIGILANCIA ACTIVA' : 'INICIAR VIGILANCIA'}
                        </div>
                        <div className={`text-[9px] mt-0.5 font-medium tracking-widest ${isScanning ? 'text-cyan-500/70' : isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                            {isScanning ? 'Pulsa para detener el escaneo' : 'Activa el modo de escaneo'}
                        </div>
                    </div>

                    {/* Status dot */}
                    <div className="relative z-10 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-cyan-400 status-pulse' : isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-[0.2em] ${isScanning ? 'text-cyan-500' : isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                            {isScanning ? 'ONLINE' : 'STANDBY'}
                        </span>
                    </div>
                </button>

                {/* ── Secondary controls ──────────────────────────────── */}
                <div className="flex gap-2">
                    <Button onClick={triggerInterference} disabled={!isScanning} variant="danger" isDark={isDark} className="flex-1">
                        <UserX className="w-3.5 h-3.5" />
                        Simular Intruso
                    </Button>

                    <Button onClick={analyzeWithGemini} disabled={!isScanning || isAnalyzing} variant="action" isDark={isDark} className="flex-1">
                        {isAnalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5" />}
                        {isAnalyzing ? 'Analizando...' : 'Análisis IA'}
                    </Button>
                </div>

            </div>
        </Panel>
    );
};

export default CommandsPanel;
