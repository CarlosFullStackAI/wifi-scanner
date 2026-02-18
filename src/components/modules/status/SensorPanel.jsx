import React from 'react';
import { Activity } from 'lucide-react';
import Panel from '../../common/Panel';
import { getDynamicColor } from '../../../utils/helpers';

const SensorPanel = ({ disturbanceDisplay, isDark }) => {
    return (
        <Panel title="Sensor Status" icon={Activity} className="h-1/3" isDark={isDark}>
            <div className="space-y-6 h-full justify-center flex flex-col">
                <div className="flex justify-between items-end">
                    <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Perturbación</span>
                    <span className="text-3xl font-bold font-mono transition-colors duration-300" style={{ color: getDynamicColor(disturbanceDisplay, isDark) }}>{disturbanceDisplay}%</span>
                </div>
                <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <div
                        className="h-full rounded-full transition-all duration-300 ease-out shadow-lg"
                        style={{ width: `${disturbanceDisplay}%`, backgroundColor: getDynamicColor(disturbanceDisplay, isDark) }}
                    ></div>
                </div>
                <div className="text-center">
                    <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wide transition-all ${disturbanceDisplay > 60 ? 'bg-red-500/10 text-red-500 border border-red-500/20' : (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')}`}>
                        {disturbanceDisplay > 60 ? 'Actividad Anómala' : 'Espectro Nominal'}
                    </span>
                </div>
            </div>
        </Panel>
    );
};

export default SensorPanel;
