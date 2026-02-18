import React from 'react';
import { Activity, ShieldCheck, ShieldAlert } from 'lucide-react';
import Panel from '../../common/Panel';
import { getDynamicColor } from '../../../utils/helpers';

const SensorPanel = ({ disturbanceDisplay, isDark, isScanning }) => {
    const color = getDynamicColor(disturbanceDisplay, isDark);
    const r = 48;
    const circ = 2 * Math.PI * r;
    const offset = circ - (disturbanceDisplay / 100) * circ;
    const isAlert = disturbanceDisplay > 60;

    return (
        <Panel title="Sensor" icon={Activity} className="flex-none" isDark={isDark}>
            <div className="flex flex-col items-center gap-3 py-1">
                {/* Gauge */}
                <div className="relative w-28 h-28">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 110 110">
                        {/* Track */}
                        <circle cx="55" cy="55" r={r} fill="none"
                            stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="6" />
                        {/* Value */}
                        <circle cx="55" cy="55" r={r} fill="none"
                            stroke={color} strokeWidth="6" strokeLinecap="round"
                            strokeDasharray={circ} strokeDashoffset={offset}
                            className="gauge-transition"
                            style={isDark ? { filter: `drop-shadow(0 0 8px ${color}50)` } : {}}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black font-mono leading-none" style={{ color }}>
                            {disturbanceDisplay}
                        </span>
                        <span className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                            DIST%
                        </span>
                    </div>
                </div>

                {/* Badge */}
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${isAlert
                    ? 'bg-red-500/10 text-red-400 border border-red-500/15'
                    : isScanning
                        ? (isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' : 'bg-emerald-50 text-emerald-600 border border-emerald-200')
                        : (isDark ? 'bg-slate-800/50 text-slate-600 border border-slate-700/30' : 'bg-slate-100 text-slate-400 border border-slate-200')
                }`}>
                    {isAlert ? <><ShieldAlert className="w-3 h-3" /> Anomalia</> :
                     isScanning ? <><ShieldCheck className="w-3 h-3" /> Nominal</> :
                     <span>Inactivo</span>}
                </div>
            </div>
        </Panel>
    );
};

export default SensorPanel;
