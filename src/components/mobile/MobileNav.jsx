import React from 'react';
import { Radio, Crosshair, Wifi, History } from 'lucide-react';

const TABS = [
    { id: 'scanner',   label: 'Scanner',  Icon: Radio     },
    { id: 'detection', label: 'Detec.',   Icon: Crosshair },
    { id: 'wifi',      label: 'Red',      Icon: Wifi      },
    { id: 'history',   label: 'Historial',Icon: History   },
];

const MobileNav = ({ activeTab, onChange, isDark, hasAlert }) => (
    <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t transition-colors duration-300 safe-area-pb ${
        isDark
            ? 'bg-[#070b14]/96 border-slate-800/70 backdrop-blur-xl'
            : 'bg-white/96 border-slate-200 backdrop-blur-xl'
    }`}>
        {TABS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
                <button
                    key={id}
                    onClick={() => onChange(id)}
                    className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all relative ${
                        active
                            ? (isDark ? 'text-cyan-400' : 'text-cyan-600')
                            : (isDark ? 'text-slate-600 active:text-slate-400' : 'text-slate-400 active:text-slate-600')
                    }`}
                >
                    {/* Active indicator line */}
                    {active && (
                        <span className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full ${isDark ? 'bg-cyan-400' : 'bg-cyan-500'}`} />
                    )}

                    {/* Alert dot */}
                    {id === 'detection' && hasAlert && !active && (
                        <span className="absolute top-2 right-[calc(50%-10px)] w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    )}

                    <Icon className="w-4.5 h-4.5" style={{ width: '1.125rem', height: '1.125rem' }} />
                    <span className="text-[9px] font-bold uppercase tracking-wide leading-none">{label}</span>
                </button>
            );
        })}

    </nav>
);

export default MobileNav;
