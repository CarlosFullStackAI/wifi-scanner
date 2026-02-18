import React from 'react';
import { Activity, ShieldCheck, ShieldAlert } from 'lucide-react';
import Panel from '../../common/Panel';
import { getDynamicColor } from '../../../utils/helpers';

const SensorPanel = ({ disturbanceDisplay, isDark }) => {
    const color = getDynamicColor(disturbanceDisplay, isDark);
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (disturbanceDisplay / 100) * circumference;
    const isAlert = disturbanceDisplay > 60;

    return (
        <Panel title="Sensor" icon={Activity} className="flex-none" isDark={isDark}>
            <div className="flex flex-col items-center gap-4 py-2">
                {/* Circular gauge */}
                <div className="relative w-32 h-32">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r={radius}
                            fill="none"
                            stroke={isDark ? '#1e293b' : '#e2e8f0'}
                            strokeWidth="8"
                        />
                        <circle cx="60" cy="60" r={radius}
                            fill="none"
                            stroke={color}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            className="gauge-ring"
                            style={{ filter: isDark ? `drop-shadow(0 0 6px ${color}40)` : 'none' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold font-mono transition-colors duration-300" style={{ color }}>
                            {disturbanceDisplay}
                        </span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            %
                        </span>
                    </div>
                </div>

                {/* Status badge */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${isAlert
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : (isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-200')
                }`}>
                    {isAlert
                        ? <><ShieldAlert className="w-3.5 h-3.5" /> Anomalia</>
                        : <><ShieldCheck className="w-3.5 h-3.5" /> Nominal</>
                    }
                </div>
            </div>
        </Panel>
    );
};

export default SensorPanel;
