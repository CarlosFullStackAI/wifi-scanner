import React from 'react';
import { Sliders } from 'lucide-react';
import Panel from '../../common/Panel';

const SettingsPanel = ({ sensitivity, setSensitivity, stealthMode, setStealthMode, isDark }) => {
    const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';
    const accentColor = isDark ? 'text-cyan-400' : 'text-cyan-600';

    return (
        <Panel title="Ajustes" icon={Sliders} className="flex-none" isDark={isDark}>
            <div className="space-y-6">
                <div>
                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider mb-2">
                        <span className={textSecondary}>Sensibilidad</span>
                        <span className={accentColor}>{sensitivity}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={sensitivity}
                        onChange={(e) => setSensitivity(parseInt(e.target.value))}
                        className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${isDark ? 'bg-slate-700 accent-cyan-400' : 'bg-slate-200 accent-cyan-600'}`}
                    />
                </div>
                <div className={`flex items-center justify-between border-t pt-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${textSecondary}`}>Modo Silencioso</span>
                    <button onClick={() => setStealthMode(!stealthMode)}
                        className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${stealthMode ? 'bg-indigo-500' : (isDark ? 'bg-slate-700' : 'bg-slate-300')}`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 shadow-sm ${stealthMode ? 'left-6' : 'left-1'}`}></div>
                    </button>
                </div>
            </div>
        </Panel>
    );
};

export default SettingsPanel;
