import React from 'react';
import { Sliders, EyeOff, Eye } from 'lucide-react';
import Panel from '../../common/Panel';

const SettingsPanel = ({ sensitivity, setSensitivity, stealthMode, setStealthMode, isDark }) => {
    return (
        <Panel title="Ajustes" icon={Sliders} className="flex-none" isDark={isDark}>
            <div className="space-y-5">
                {/* Sensitivity */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Sensibilidad
                        </span>
                        <span className={`text-sm font-bold font-mono ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                            {sensitivity}%
                        </span>
                    </div>
                    <input
                        type="range" min="0" max="100" value={sensitivity}
                        onChange={(e) => setSensitivity(parseInt(e.target.value))}
                        className={`w-full h-1.5 rounded-full cursor-pointer ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}
                    />
                    <div className="flex justify-between mt-1.5">
                        <span className={`text-[9px] ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>Baja</span>
                        <span className={`text-[9px] ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>Alta</span>
                    </div>
                </div>

                {/* Stealth Mode */}
                <div className={`flex items-center justify-between pt-4 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-2">
                        {stealthMode
                            ? <EyeOff className={`w-3.5 h-3.5 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
                            : <Eye className={`w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                        }
                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Modo Silencioso
                        </span>
                    </div>
                    <button onClick={() => setStealthMode(!stealthMode)}
                        className={`w-11 h-6 rounded-full relative transition-all duration-300 ${stealthMode
                            ? 'bg-indigo-500 shadow-lg shadow-indigo-500/20'
                            : (isDark ? 'bg-slate-700' : 'bg-slate-300')
                        }`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${stealthMode ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>
            </div>
        </Panel>
    );
};

export default SettingsPanel;
