import React from 'react';
import { Wifi, Server, Radio, Sun, Moon, Settings, LogOut } from 'lucide-react';

const Header = ({ isScanning, isDark, themeMode, setThemeMode, currentNetwork, setShowConfig, onLogout }) => {
    return (
        <header className={`relative z-30 px-4 lg:px-5 py-2.5 flex justify-between items-center flex-none border-b transition-all duration-500 backdrop-blur-xl ${isDark ? 'bg-[#070b14]/80 border-slate-800/40' : 'bg-white/80 border-slate-200'}`}>
            <div className="flex items-center gap-3">
                {/* Logo icon */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-500 ${isScanning
                    ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-lg shadow-cyan-500/25'
                    : (isDark ? 'bg-slate-800 border border-slate-700/50' : 'bg-slate-100 border border-slate-200')
                }`}>
                    <Wifi className={`w-4 h-4 ${isScanning ? 'text-white' : (isDark ? 'text-slate-500' : 'text-slate-400')}`} />
                </div>

                <div>
                    <div className="flex items-center gap-2">
                        <h1 className={`text-sm font-bold tracking-tight font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            NET-WATCHER
                        </h1>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold ${isDark ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'}`}>
                            v6.1
                        </span>
                    </div>
                    <div className={`flex items-center gap-2 text-[9px] font-mono mt-0.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                        <span className="flex items-center gap-1"><Server className="w-2.5 h-2.5" />{currentNetwork.ip}</span>
                        <span className="opacity-30">/</span>
                        <span className="flex items-center gap-1"><Radio className="w-2.5 h-2.5" />{currentNetwork.ssid}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* Theme toggle — pill switch */}
                <button
                    onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
                    title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                    className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 select-none ${
                        isDark
                            ? 'bg-slate-800/70 border-slate-700/50 hover:border-slate-600/70'
                            : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                    }`}
                >
                    {/* Sun icon */}
                    <Sun className={`w-3.5 h-3.5 transition-all duration-300 ${!isDark ? 'text-amber-500 scale-110' : 'text-slate-600'}`} />

                    {/* Sliding pill track */}
                    <div className={`relative w-9 h-5 rounded-full transition-colors duration-300 ${isDark ? 'bg-slate-700' : 'bg-amber-100 border border-amber-200'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full shadow-sm transition-all duration-300 ${
                            isDark
                                ? 'left-[18px] bg-slate-900 border border-slate-600'
                                : 'left-0.5 bg-amber-400 border border-amber-300'
                        }`} />
                    </div>

                    {/* Moon icon */}
                    <Moon className={`w-3.5 h-3.5 transition-all duration-300 ${isDark ? 'text-cyan-400 scale-110' : 'text-slate-400'}`} />
                </button>

                {/* Status */}
                <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold font-mono uppercase tracking-widest border ${isScanning
                    ? (isDark ? 'border-cyan-500/20 text-cyan-400 bg-cyan-500/5' : 'border-cyan-300 text-cyan-600 bg-cyan-50')
                    : (isDark ? 'border-slate-800 text-slate-600 bg-slate-900/50' : 'border-slate-200 text-slate-400 bg-slate-50')
                }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isScanning ? 'bg-cyan-400 status-pulse' : (isDark ? 'bg-slate-700' : 'bg-slate-300')}`} />
                    {isScanning ? 'ACTIVE' : 'IDLE'}
                </div>

                {/* Config */}
                <button onClick={() => setShowConfig(true)}
                    className={`p-2 rounded-lg transition-all ${isDark ? 'text-slate-500 hover:text-white hover:bg-slate-800/60' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}>
                    <Settings className="w-4 h-4" />
                </button>

                {/* Logout */}
                <button onClick={onLogout} title="Cerrar sesión"
                    className={`p-2 rounded-lg transition-all ${isDark ? 'text-slate-600 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}>
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        </header>
    );
};

export default Header;
