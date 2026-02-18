import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Lock, Signal, Globe, ArrowUpDown, Clock, RefreshCw } from 'lucide-react';
import Panel from '../../common/Panel';

const WifiPanel = ({ currentNetwork, isDark, onScanNetworks }) => {
    const [uptime, setUptime] = useState(0);
    const [speed, setSpeed] = useState({ down: 0, up: 0 });

    useEffect(() => {
        const interval = setInterval(() => {
            setUptime(prev => prev + 1);
            setSpeed({
                down: (45 + Math.random() * 30).toFixed(1),
                up: (12 + Math.random() * 10).toFixed(1),
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatUptime = (s) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const isConnected = currentNetwork.status === 'connected';

    return (
        <Panel title="Red WiFi" icon={Wifi} isDark={isDark} className="flex-none">
            <div className="space-y-3">
                {/* Connection status */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isConnected
                            ? (isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200')
                            : (isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200')
                        }`}>
                            {isConnected
                                ? <Wifi className="w-4 h-4 text-emerald-400" />
                                : <WifiOff className="w-4 h-4 text-red-400" />
                            }
                        </div>
                        <div>
                            <div className={`text-xs font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {currentNetwork.ssid}
                            </div>
                            <div className={`text-[8px] uppercase tracking-widest font-bold ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isConnected ? 'Conectado' : 'Desconectado'}
                            </div>
                        </div>
                    </div>
                    <button onClick={onScanNetworks}
                        className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/5 text-slate-600' : 'hover:bg-slate-100 text-slate-400'}`}>
                        <RefreshCw className="w-3 h-3" />
                    </button>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-2">
                    <InfoItem icon={Globe} label="IP" value={currentNetwork.ip} isDark={isDark} />
                    <InfoItem icon={Lock} label="Seguridad" value="WPA3" isDark={isDark} />
                    <InfoItem icon={Clock} label="Uptime" value={formatUptime(uptime)} isDark={isDark} mono />
                    <InfoItem icon={Signal} label="Signal" value="92%" isDark={isDark} accent />
                </div>

                {/* Speed */}
                <div className={`p-2.5 rounded-xl ${isDark ? 'bg-white/[0.02] border border-slate-700/20' : 'bg-slate-50 border border-slate-100'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <ArrowUpDown className={`w-3 h-3 ${isDark ? 'text-cyan-500' : 'text-cyan-600'}`} />
                            <span className={`text-[8px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                Velocidad
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center justify-around mt-2">
                        <div className="text-center">
                            <div className={`text-[8px] uppercase ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Down</div>
                            <div className={`text-sm font-black font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                {speed.down}
                                <span className="text-[8px] ml-0.5 opacity-60">Mb</span>
                            </div>
                        </div>
                        <div className={`w-px h-6 ${isDark ? 'bg-slate-700/30' : 'bg-slate-200'}`} />
                        <div className="text-center">
                            <div className={`text-[8px] uppercase ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Up</div>
                            <div className={`text-sm font-black font-mono ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                                {speed.up}
                                <span className="text-[8px] ml-0.5 opacity-60">Mb</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signal bars */}
                <div className="flex items-end gap-[3px] h-5 justify-center">
                    {[85, 90, 75, 92, 88, 70, 95, 82, 78, 91, 86, 73].map((v, i) => (
                        <div key={i}
                            className={`w-1.5 rounded-sm transition-all ${isDark ? 'bg-cyan-500/30' : 'bg-cyan-400/25'}`}
                            style={{ height: `${v}%` }}
                        />
                    ))}
                </div>
            </div>
        </Panel>
    );
};

const InfoItem = ({ icon: Icon, label, value, isDark, mono, accent }) => (
    <div className={`p-2 rounded-lg ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
        <div className="flex items-center gap-1 mb-0.5">
            <Icon className={`w-2.5 h-2.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
            <span className={`text-[7px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                {label}
            </span>
        </div>
        <div className={`text-[11px] font-bold ${mono ? 'font-mono' : ''} ${accent
            ? (isDark ? 'text-cyan-400' : 'text-cyan-600')
            : (isDark ? 'text-white' : 'text-slate-900')
        }`}>
            {value}
        </div>
    </div>
);

export default WifiPanel;
