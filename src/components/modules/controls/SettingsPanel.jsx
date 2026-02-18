import React from 'react';
import { Sliders, EyeOff, Eye } from 'lucide-react';
import Panel from '../../common/Panel';

const SettingsPanel = ({ sensitivity, setSensitivity, stealthMode, setStealthMode, isDark }) => {
    return (
        <Panel title="Ajustes" icon={Sliders} className="flex-none" isDark={isDark}>
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between items-center mb-2.5">
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            Sensibilidad
                        </span>
                        <span className={`text-base font-black font-mono ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                            {sensitivity}
                            <span className="text-[9px] ml-0.5 opacity-60">%</span>
                        </span>
                    </div>
                    <input type="range" min="0" max="100" value={sensitivity}
                        onChange={(e) => setSensitivity(parseInt(e.target.value))}
                        className={`w-full h-1 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}
                    />
                    <div className="flex justify-between mt-1">
                        <span className={`text-[8px] uppercase tracking-wider ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>Min</span>
                        <span className={`text-[8px] uppercase tracking-wider ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>Max</span>
                    </div>
                </div>

                <div className={`flex items-center justify-between pt-3 border-t ${isDark ? 'border-slate-700/30' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-2">
                        {stealthMode
                            ? <EyeOff className="w-3 h-3 text-violet-400" />
                            : <Eye className={`w-3 h-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                        }
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            Stealth
                        </span>
                    </div>
                    <button onClick={() => setStealthMode(!stealthMode)}
                        className={`w-10 h-5 rounded-full relative transition-all duration-300 ${stealthMode
                            ? 'bg-violet-500 shadow-md shadow-violet-500/20'
                            : (isDark ? 'bg-slate-800' : 'bg-slate-300')
                        }`}
                    >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow ${stealthMode ? 'left-[22px]' : 'left-0.5'}`} />
                    </button>
                </div>
            </div>
        </Panel>
    );
};

export default SettingsPanel;
