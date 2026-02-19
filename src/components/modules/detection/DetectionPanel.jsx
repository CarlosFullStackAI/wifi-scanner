import React, { useState, useEffect, useRef } from 'react';
import { Crosshair, PawPrint, User, UserCheck, Clock, ListFilter, Bird, Rabbit } from 'lucide-react';
import Panel from '../../common/Panel';

const TYPE_CONFIG = {
    bird: {
        icon: Bird,
        color: 'text-sky-400',
        bg: 'bg-sky-500/10',
        border: 'border-sky-500/20',
        dot: 'bg-sky-400',
        threat: 'MÍNIMO',
        threatColor: 'text-sky-400',
    },
    rabbit: {
        icon: Rabbit,
        color: 'text-violet-400',
        bg: 'bg-violet-500/10',
        border: 'border-violet-500/20',
        dot: 'bg-violet-400',
        threat: 'MÍNIMO',
        threatColor: 'text-violet-400',
    },
    animal: {
        icon: PawPrint,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        dot: 'bg-amber-400',
        threat: 'BAJO',
        threatColor: 'text-emerald-400',
    },
    adolescent: {
        icon: User,
        color: 'text-orange-400',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20',
        dot: 'bg-orange-400',
        threat: 'MEDIO',
        threatColor: 'text-orange-400',
    },
    adult: {
        icon: UserCheck,
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        dot: 'bg-red-400',
        threat: 'ALTO',
        threatColor: 'text-red-400',
    },
};

const fmtAgo = (ts) => {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    return `${Math.floor(s / 3600)}h`;
};

const fmtTime = (ts) =>
    new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

const DetectionPanel = ({ lastDetection, detectionHistory = [], isScanning, isDark }) => {
    const [, tick] = useState(0);
    const histRef  = useRef(null);

    useEffect(() => {
        const t = setInterval(() => tick(n => n + 1), 1000);
        return () => clearInterval(t);
    }, []);

    const cfg  = lastDetection ? TYPE_CONFIG[lastDetection.type] : null;
    const Icon = cfg?.icon ?? Crosshair;

    return (
        <Panel title="Detección" icon={Crosshair} isDark={isDark} className="flex-1 min-h-0">
            <div className="flex flex-col gap-3 h-full overflow-hidden">

                {/* ── Current detection ─────────────────────────────── */}
                {!isScanning ? (
                    <div className={`flex items-center justify-center py-3 text-center ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>
                        <div>
                            <Crosshair className="w-5 h-5 mx-auto mb-1 opacity-30" />
                            <p className="text-[9px] uppercase tracking-widest">Escaneo inactivo</p>
                        </div>
                    </div>
                ) : !lastDetection ? (
                    <div className={`flex items-center gap-2 py-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 status-pulse flex-shrink-0" />
                        <span className="text-[9px] uppercase tracking-widest font-bold">Monitoreando zona...</span>
                    </div>
                ) : (
                    <div className={`rounded-xl border p-2.5 flex-shrink-0 ${cfg.bg} ${cfg.border}`}>
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg} border ${cfg.border}`}>
                                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                                </div>
                                <div>
                                    <div className={`text-[11px] font-black leading-none ${cfg.color}`}>{lastDetection.label}</div>
                                    <div className={`text-[8px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{lastDetection.sub}</div>
                                </div>
                            </div>
                            <div className={`text-[9px] font-black px-2 py-0.5 rounded-md ${cfg.bg} border ${cfg.border} ${cfg.threatColor}`}>
                                {cfg.threat}
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                            <Stat label="Obj." value={`${lastDetection.height}m`} isDark={isDark} />
                            <Stat label="Det." value={`${lastDetection.detectionH}m`} isDark={isDark} highlight />
                            <Stat label="Dist." value={`${lastDetection.distanceM}m`} isDark={isDark} highlight />
                            <Stat label="Conf." value={`${lastDetection.confidence}%`} isDark={isDark} />
                        </div>
                    </div>
                )}

                {/* ── History ───────────────────────────────────────── */}
                {detectionHistory.length > 0 && (
                    <div className="flex flex-col min-h-0 flex-1">
                        <div className={`flex items-center gap-1.5 mb-1.5 flex-shrink-0`}>
                            <ListFilter className={`w-3 h-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                            <span className={`text-[8px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                Historial · {detectionHistory.length}
                            </span>
                        </div>

                        <div ref={histRef} className="overflow-y-auto flex-1 space-y-[3px] scrollbar-thin pr-0.5">
                            {detectionHistory.map((det, i) => {
                                const hcfg = TYPE_CONFIG[det.type];
                                const HIcon = hcfg.icon;
                                const isFirst = i === 0;
                                return (
                                    <div key={det.timestamp + i}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all ${isFirst
                                            ? (isDark ? `${hcfg.bg} border ${hcfg.border}` : `${hcfg.bg} border ${hcfg.border}`)
                                            : (isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50')
                                        }`}>
                                        {/* Type dot */}
                                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${hcfg.dot}`} />

                                        {/* Icon */}
                                        <HIcon className={`w-3 h-3 flex-shrink-0 ${hcfg.color}`} />

                                        {/* Label + stats */}
                                        <div className="flex-1 min-w-0">
                                            <span className={`text-[9px] font-bold ${hcfg.color}`}>{det.label}</span>
                                            <span className={`text-[8px] font-mono ml-1.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                                {det.height}m · {det.distanceM}m
                                            </span>
                                        </div>

                                        {/* Time */}
                                        <div className="text-right flex-shrink-0">
                                            <div className={`text-[8px] font-mono ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>
                                                {fmtTime(det.timestamp)}
                                            </div>
                                            <div className={`text-[7px] ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>
                                                hace {fmtAgo(det.timestamp)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

            </div>
        </Panel>
    );
};

const Stat = ({ label, value, isDark, highlight }) => (
    <div className={`rounded-md p-1 text-center ${highlight ? (isDark ? 'bg-white/[0.06]' : 'bg-white/80') : (isDark ? 'bg-black/20' : 'bg-white/60')}`}>
        <div className={`text-[6px] uppercase tracking-widest ${highlight ? (isDark ? 'text-cyan-600' : 'text-cyan-500') : (isDark ? 'text-slate-600' : 'text-slate-400')}`}>{label}</div>
        <div className={`text-[9px] font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</div>
    </div>
);

export default DetectionPanel;
