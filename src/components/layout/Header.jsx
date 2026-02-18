import React from 'react';
import { Wifi, Server, Radio, Sun, Moon, Monitor, Settings } from 'lucide-react';

const Header = ({ isScanning, isDark, themeMode, setThemeMode, currentNetwork, setShowConfig }) => {
    return (
        <header className={`relative z-30 px-5 py-3 flex justify-between items-center flex-none border-b transition-all duration-500 glass-panel ${isDark ? 'bg-slate-950/90 border-slate-800/60' : 'bg-white/90 border-slate-200/80'}`}>
            {/* Left - Logo & Info */}
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${isScanning
                    ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-500/30'
                    : (isDark ? 'bg-slate-800 border border-slate-700' : 'bg-slate-100 border border-slate-200')
                }`}>
                    <Wifi className={`w-5 h-5 transition-all ${isScanning ? 'text-white animate-pulse' : (isDark ? 'text-slate-500' : 'text-slate-400')}`} />
                </div>
                <div>
                    <h1 className={`text-base font-bold tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        NET-WATCHER
                        <span className={`text-[9px] px-2 py-0.5 rounded-md font-mono font-bold ${isDark ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'}`}>
                            v6.1
                        </span>
                    </h1>
                    <div className={`flex items-center gap-3 text-[10px] font-medium mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        <span className="flex items-center gap-1.5 font-mono">
                            <Server className="w-3 h-3" /> {currentNetwork.ip}
                        </span>
                        <span className="opacity-20">|</span>
                        <span className="flex items-center gap-1.5">
                            <Radio className="w-3 h-3" /> {currentNetwork.ssid}
                        </span>
                    </div>
                </div>
            </div>

            {/* Right - Controls */}
            <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <div className={`flex p-1 rounded-xl border ${isDark ? 'bg-slate-900/80 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                    {[
                        { mode: 'light', Icon: Sun, activeColor: 'text-amber-400' },
                        { mode: 'system', Icon: Monitor, activeColor: 'text-indigo-400' },
                        { mode: 'dark', Icon: Moon, activeColor: 'text-cyan-400' },
                    ].map(({ mode, Icon, activeColor }) => (
                        <button key={mode} onClick={() => setThemeMode(mode)}
                            className={`p-1.5 rounded-lg transition-all ${themeMode === mode
                                ? `${isDark ? 'bg-slate-700/80' : 'bg-white shadow-sm'} ${activeColor}`
                                : `${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`
                            }`}
                            title={mode.charAt(0).toUpperCase() + mode.slice(1)}
                        >
                            <Icon className="w-3.5 h-3.5" />
                        </button>
                    ))}
                </div>

                {/* Status Badge */}
                <div className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all duration-500 border flex items-center gap-2 ${isScanning
                    ? (isDark ? 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10' : 'border-cyan-300 text-cyan-600 bg-cyan-50')
                    : (isDark ? 'border-slate-700 text-slate-500 bg-slate-900/50' : 'border-slate-200 text-slate-400 bg-slate-50')
                }`}>
                    {isScanning && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 status-dot" />}
                    {isScanning ? 'Activo' : 'Standby'}
                </div>

                {/* Settings */}
                <button onClick={() => setShowConfig(true)}
                    className={`p-2.5 rounded-xl transition-all ${isDark
                        ? 'hover:bg-slate-800 text-slate-500 hover:text-white'
                        : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                    }`}
                >
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
};

export default Header;
