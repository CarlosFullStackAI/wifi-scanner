import React, { useState, useEffect } from 'react';
import { Crosshair, PawPrint, User, UserCheck, Clock } from 'lucide-react';
import Panel from '../../common/Panel';

const TYPE_CONFIG = {
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
    return `${Math.floor(s / 60)}m ${s % 60}s`;
};

const DetectionPanel = ({ lastDetection, isScanning, isDark }) => {
    const [, tick] = useState(0);

    // Re-render every second so "ago" timer updates
    useEffect(() => {
        const t = setInterval(() => tick(n => n + 1), 1000);
        return () => clearInterval(t);
    }, []);

    const cfg = lastDetection ? TYPE_CONFIG[lastDetection.type] : null;
    const Icon = cfg?.icon ?? Crosshair;

    return (
        <Panel title="Detección" icon={Crosshair} isDark={isDark} className="flex-none">
            {!isScanning ? (
                <div className={`flex items-center justify-center py-4 text-center ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>
                    <div>
                        <Crosshair className="w-6 h-6 mx-auto mb-1 opacity-30" />
                        <p className="text-[9px] uppercase tracking-widest">Escaneo inactivo</p>
                    </div>
                </div>
            ) : !lastDetection ? (
                <div className={`flex items-center gap-2 py-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 status-pulse flex-shrink-0" />
                    <span className="text-[9px] uppercase tracking-widest font-bold">Monitoreando zona...</span>
                </div>
            ) : (
                <div className={`rounded-xl border p-3 ${cfg.bg} ${cfg.border}`}>
                    <div className="flex items-start justify-between gap-2">
                        {/* Icon + name */}
                        <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} border ${cfg.border}`}>
                                <Icon className={`w-5 h-5 ${cfg.color}`} />
                            </div>
                            <div>
                                <div className={`text-xs font-black ${cfg.color}`}>{lastDetection.label}</div>
                                <div className={`text-[8px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{lastDetection.sub}</div>
                            </div>
                        </div>

                        {/* Threat level */}
                        <div className="text-right flex-shrink-0">
                            <div className={`text-[7px] uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Riesgo</div>
                            <div className={`text-[10px] font-black ${cfg.threatColor}`}>{cfg.threat}</div>
                        </div>
                    </div>

                    {/* Stats — row 1 */}
                    <div className="grid grid-cols-3 gap-1.5 mt-2.5">
                        <Stat label="Altura obj." value={`${lastDetection.height}m`} isDark={isDark} />
                        <Stat label="Detect. en" value={`${lastDetection.detectionH}m`} isDark={isDark} highlight />
                        <Stat label="Conf." value={`${lastDetection.confidence}%`} isDark={isDark} />
                    </div>
                    {/* Stats — row 2 */}
                    <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                        <Stat label="Dist. router" value={`${lastDetection.distanceM}m`} isDark={isDark} highlight />
                        <Stat label="Hace" value={fmtAgo(lastDetection.timestamp)} isDark={isDark} />
                    </div>
                </div>
            )}
        </Panel>
    );
};

const Stat = ({ label, value, isDark, highlight }) => (
    <div className={`rounded-lg p-1.5 text-center ${highlight ? (isDark ? 'bg-white/[0.06]' : 'bg-white/80') : (isDark ? 'bg-black/20' : 'bg-white/60')}`}>
        <div className={`text-[7px] uppercase tracking-widest ${highlight ? (isDark ? 'text-cyan-600' : 'text-cyan-500') : (isDark ? 'text-slate-600' : 'text-slate-400')}`}>{label}</div>
        <div className={`text-[10px] font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</div>
    </div>
);

export default DetectionPanel;
