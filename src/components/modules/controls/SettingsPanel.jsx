import React from 'react';
import { Sliders, EyeOff, Eye } from 'lucide-react';
import Panel from '../../common/Panel';

const SettingsPanel = ({ sensitivity, setSensitivity, stealthMode, setStealthMode, isDark }) => {
    return (
        <Panel title="Ajustes" icon={Sliders} className="flex-none" isDark={isDark}>
            <div className="space-y-2.5">
                {/* Sensitivity — compact */}
                <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-bold uppercase tracking-widest shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Sensibilidad
                    </span>
                    <input type="range" min="0" max="100" value={sensitivity}
                        onChange={e => setSensitivity(parseInt(e.target.value))}
                        className={`flex-1 h-1 rounded-full accent-cyan-400 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}
                    />
                    <span className={`text-[11px] font-black font-mono w-8 text-right shrink-0 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                        {sensitivity}
                    </span>
                </div>

                {/* Stealth — compact */}
                <div className={`flex items-center justify-between pt-2 border-t ${isDark ? 'border-slate-700/30' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-1.5">
                        {stealthMode
                            ? <EyeOff className="w-3 h-3 text-violet-400" />
                            : <Eye className={`w-3 h-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                        }
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            Modo Stealth
                        </span>
                    </div>
                    <button onClick={() => setStealthMode(!stealthMode)}
                        className={`w-9 h-[18px] rounded-full relative transition-all duration-300 shrink-0 ${stealthMode ? 'bg-violet-500' : isDark ? 'bg-slate-800' : 'bg-slate-300'}`}>
                        <div className={`absolute top-[2px] w-[14px] h-[14px] bg-white rounded-full transition-all duration-300 shadow ${stealthMode ? 'left-[19px]' : 'left-[2px]'}`} />
                    </button>
                </div>
            </div>
        </Panel>
    );
};

export default SettingsPanel;
