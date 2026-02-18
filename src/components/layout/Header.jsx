import React from 'react';
import { Wifi, Server, Radio, Sun, Moon, Monitor, Settings } from 'lucide-react';

const Header = ({
    isScanning,
    isDark,
    themeMode,
    setThemeMode,
    currentNetwork,
    setShowConfig
}) => {
    const textPrimary = isDark ? 'text-white' : 'text-slate-900';
    const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';

    return (
        <header className={`relative z-30 px-6 py-4 flex justify-between items-center backdrop-blur-md flex-none border-b transition-colors duration-500 ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
            <div className="flex items-center gap-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${isScanning ? 'bg-cyan-500 shadow-lg shadow-cyan-500/30' : (isDark ? 'bg-slate-800' : 'bg-slate-100')}`}>
                    <Wifi className={`w-5 h-5 ${isScanning ? 'text-white animate-pulse' : (isDark ? 'text-slate-500' : 'text-slate-400')}`} />
                </div>
                <div>
                    <h1 className={`text-lg font-bold tracking-tight ${textPrimary}`}>NET-WATCHER <span className={`text-[10px] px-1.5 py-0.5 rounded-md align-top ml-1 ${isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-700'}`}>v6.1</span></h1>
                    <div className={`flex items-center gap-3 text-[10px] font-medium mt-0.5 ${textSecondary}`}>
                        <span className="flex items-center gap-1.5"><Server className="w-3 h-3" /> {currentNetwork.ip}</span>
                        <span className="opacity-30">|</span>
                        <span className="flex items-center gap-1.5"><Radio className="w-3 h-3" /> {currentNetwork.ssid}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className={`flex p-1 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <button onClick={() => setThemeMode('light')} className={`p-1.5 rounded-md transition-all ${themeMode === 'light' ? (isDark ? 'bg-slate-700 text-white' : 'bg-white shadow-sm text-amber-500') : 'text-slate-400 hover:text-slate-500'}`} title="Claro">
                        <Sun className="w-4 h-4" />
                    </button>
                    <button onClick={() => setThemeMode('system')} className={`p-1.5 rounded-md transition-all ${themeMode === 'system' ? (isDark ? 'bg-slate-700 text-white' : 'bg-white shadow-sm text-indigo-500') : 'text-slate-400 hover:text-slate-500'}`} title="Sistema">
                        <Monitor className="w-4 h-4" />
                    </button>
                    <button onClick={() => setThemeMode('dark')} className={`p-1.5 rounded-md transition-all ${themeMode === 'dark' ? (isDark ? 'bg-slate-700 text-white' : 'bg-white shadow-sm text-slate-800') : 'text-slate-400 hover:text-slate-500'}`} title="Oscuro">
                        <Moon className="w-4 h-4" />
                    </button>
                </div>

                <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all duration-300 border ${isScanning ? 'border-cyan-500/30 text-cyan-600 bg-cyan-500/10' : (isDark ? 'border-slate-800 text-slate-500 bg-slate-900' : 'border-slate-200 text-slate-400 bg-slate-50')}`}>
                    {isScanning ? 'Monitoreo Activo' : 'Standby'}
                </div>
                <button onClick={() => setShowConfig(true)} className={`p-2.5 rounded-lg transition-all ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'}`}>
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
};

export default Header;
