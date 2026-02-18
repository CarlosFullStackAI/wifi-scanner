import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Lock, Signal, Globe, ArrowUpDown, Clock, RefreshCw, Eye, EyeOff, ChevronDown, ChevronUp, X, Check, Loader2, ShieldCheck, ShieldAlert, Unplug } from 'lucide-react';
import Panel from '../../common/Panel';

const WifiPanel = ({
    currentNetwork, isDark,
    onScanNetworks, isSearchingWifi, availableNetworks,
    onConnect, addLog
}) => {
    const [uptime, setUptime] = useState(0);
    const [speed, setSpeed] = useState({ down: 0, up: 0 });
    const [showNetworks, setShowNetworks] = useState(false);
    const [selectedNet, setSelectedNet] = useState(null);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

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

    const handleScan = () => {
        setShowNetworks(true);
        setSelectedNet(null);
        setPassword('');
        onScanNetworks();
    };

    const handleSelectNetwork = (net) => {
        if (selectedNet?.ssid === net.ssid) {
            setSelectedNet(null);
            setPassword('');
        } else {
            setSelectedNet(net);
            setPassword('');
            setShowPassword(false);
        }
    };

    const handleConnect = () => {
        if (!selectedNet) return;
        if (selectedNet.sec !== 'OPEN' && password.length < 1) return;

        setIsConnecting(true);
        if (addLog) addLog(`Autenticando en ${selectedNet.ssid}...`, "info");

        setTimeout(() => {
            onConnect(selectedNet.ssid);
            setIsConnecting(false);
            setSelectedNet(null);
            setPassword('');
            setShowNetworks(false);
            if (addLog) addLog(`Conectado a ${selectedNet.ssid}`, "success");
        }, 1500);
    };

    const handleDisconnect = () => {
        if (addLog) addLog(`Desconectando de ${currentNetwork.ssid}...`, "warning");
        onConnect('SIN CONEXION');
    };

    const isConnected = currentNetwork.status === 'connected' && currentNetwork.ssid !== 'SIN CONEXION';

    const getSignalBars = (signal) => {
        if (signal > 80) return 4;
        if (signal > 60) return 3;
        if (signal > 40) return 2;
        return 1;
    };

    const getSignalColor = (signal) => {
        if (signal > 70) return 'text-emerald-400';
        if (signal > 40) return 'text-amber-400';
        return 'text-red-400';
    };

    return (
        <Panel title="Red WiFi" icon={Wifi} isDark={isDark} className="flex-none">
            <div className="space-y-3">
                {/* Current connection */}
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
                            <div className={`text-xs font-bold font-mono truncate max-w-[120px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {currentNetwork.ssid}
                            </div>
                            <div className={`text-[8px] uppercase tracking-widest font-bold ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isConnected ? 'Conectado' : 'Desconectado'}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {isConnected && (
                            <button onClick={handleDisconnect}
                                title="Desconectar"
                                className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-red-500/10 text-slate-600 hover:text-red-400' : 'hover:bg-red-50 text-slate-400 hover:text-red-500'}`}>
                                <Unplug className="w-3 h-3" />
                            </button>
                        )}
                        <button onClick={handleScan}
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/5 text-slate-600 hover:text-cyan-400' : 'hover:bg-slate-100 text-slate-400 hover:text-cyan-600'}`}>
                            <RefreshCw className={`w-3 h-3 ${isSearchingWifi ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Info grid (only when connected) */}
                {isConnected && (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <InfoItem icon={Globe} label="IP" value={currentNetwork.ip} isDark={isDark} />
                            <InfoItem icon={Lock} label="Seguridad" value="WPA3" isDark={isDark} />
                            <InfoItem icon={Clock} label="Uptime" value={formatUptime(uptime)} isDark={isDark} mono />
                            <InfoItem icon={Signal} label="Signal" value="92%" isDark={isDark} accent />
                        </div>

                        {/* Speed */}
                        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-white/[0.02] border border-slate-700/20' : 'bg-slate-50 border border-slate-100'}`}>
                            <div className="flex items-center gap-1.5">
                                <ArrowUpDown className={`w-3 h-3 ${isDark ? 'text-cyan-500' : 'text-cyan-600'}`} />
                                <span className={`text-[8px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                    Velocidad
                                </span>
                            </div>
                            <div className="flex items-center justify-around mt-2">
                                <div className="text-center">
                                    <div className={`text-[8px] uppercase ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Down</div>
                                    <div className={`text-sm font-black font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                        {speed.down}<span className="text-[8px] ml-0.5 opacity-60">Mb</span>
                                    </div>
                                </div>
                                <div className={`w-px h-6 ${isDark ? 'bg-slate-700/30' : 'bg-slate-200'}`} />
                                <div className="text-center">
                                    <div className={`text-[8px] uppercase ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Up</div>
                                    <div className={`text-sm font-black font-mono ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                                        {speed.up}<span className="text-[8px] ml-0.5 opacity-60">Mb</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Network selector toggle */}
                <button onClick={() => { if (!showNetworks) handleScan(); else setShowNetworks(false); }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${isDark
                        ? 'bg-white/[0.02] border border-slate-700/20 text-slate-400 hover:border-cyan-500/20 hover:text-cyan-400'
                        : 'bg-slate-50 border border-slate-200 text-slate-500 hover:border-cyan-300 hover:text-cyan-600'
                    }`}>
                    <span className="flex items-center gap-2">
                        <Signal className="w-3.5 h-3.5" />
                        Redes disponibles
                        {availableNetworks.length > 0 && (
                            <span className={`text-[8px] px-1.5 py-0.5 rounded ${isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
                                {availableNetworks.length}
                            </span>
                        )}
                    </span>
                    {showNetworks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {/* Available networks list */}
                {showNetworks && (
                    <div className="space-y-1.5 animate-fade-in">
                        {isSearchingWifi && (
                            <div className={`flex items-center justify-center gap-2 py-4 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="uppercase tracking-widest font-bold">Escaneando...</span>
                            </div>
                        )}

                        {!isSearchingWifi && availableNetworks.length === 0 && (
                            <div className={`text-center py-4 text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                <WifiOff className="w-5 h-5 mx-auto mb-2 opacity-30" />
                                <span className="uppercase tracking-widest font-bold">Sin redes detectadas</span>
                            </div>
                        )}

                        {availableNetworks.map((net, i) => {
                            const bars = getSignalBars(net.signal);
                            const isSelected = selectedNet?.ssid === net.ssid;
                            const isCurrent = currentNetwork.ssid === net.ssid;

                            return (
                                <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                                    {/* Network row */}
                                    <button
                                        onClick={() => !isCurrent && handleSelectNetwork(net)}
                                        disabled={isCurrent}
                                        className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left ${isSelected
                                            ? (isDark ? 'bg-cyan-500/5 border border-cyan-500/20' : 'bg-cyan-50 border border-cyan-200')
                                            : isCurrent
                                                ? (isDark ? 'bg-emerald-500/5 border border-emerald-500/15 cursor-default' : 'bg-emerald-50 border border-emerald-200 cursor-default')
                                                : (isDark ? 'bg-white/[0.01] border border-slate-700/15 hover:bg-white/[0.03] hover:border-slate-600/30' : 'bg-white border border-slate-100 hover:bg-slate-50 hover:border-slate-200')
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            {/* Signal bars */}
                                            <div className="flex items-end gap-[2px] h-4 w-5">
                                                {[1, 2, 3, 4].map(b => (
                                                    <div key={b}
                                                        className={`w-1 rounded-sm transition-colors ${b <= bars ? getSignalColor(net.signal).replace('text-', 'bg-') : (isDark ? 'bg-slate-700/40' : 'bg-slate-200')}`}
                                                        style={{ height: `${b * 25}%` }}
                                                    />
                                                ))}
                                            </div>
                                            <div>
                                                <div className={`text-[11px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                    {net.ssid}
                                                </div>
                                                <div className={`text-[8px] font-mono ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                                    {net.signal}% / {net.sec}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            {isCurrent && (
                                                <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-400">
                                                    Conectado
                                                </span>
                                            )}
                                            {net.sec !== 'OPEN' ? (
                                                <Lock className={`w-3 h-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                                            ) : (
                                                <ShieldAlert className="w-3 h-3 text-amber-400" />
                                            )}
                                        </div>
                                    </button>

                                    {/* Password input (expanded) */}
                                    {isSelected && !isCurrent && (
                                        <div className={`mt-1.5 p-3 rounded-xl animate-fade-in ${isDark ? 'bg-white/[0.02] border border-slate-700/20' : 'bg-slate-50 border border-slate-100'}`}>
                                            {net.sec !== 'OPEN' ? (
                                                <>
                                                    <label className={`text-[8px] font-bold uppercase tracking-widest block mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                        Contrasena de red
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={showPassword ? 'text' : 'password'}
                                                            value={password}
                                                            onChange={(e) => setPassword(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                                                            placeholder="Ingresa la contrasena..."
                                                            className={`w-full py-2 px-3 pr-16 rounded-lg text-xs font-mono outline-none transition-all ${isDark
                                                                ? 'bg-black/30 border border-slate-700/40 text-white placeholder-slate-700 focus:border-cyan-500/40'
                                                                : 'bg-white border border-slate-200 text-slate-900 placeholder-slate-300 focus:border-cyan-400'
                                                            }`}
                                                            autoFocus
                                                        />
                                                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                            <button onClick={() => setShowPassword(!showPassword)}
                                                                className={`p-1 rounded transition-colors ${isDark ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'}`}>
                                                                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-2 mb-2">
                                                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                                                    <span className={`text-[9px] ${isDark ? 'text-amber-400/80' : 'text-amber-600'}`}>
                                                        Red abierta (sin contrasena)
                                                    </span>
                                                </div>
                                            )}

                                            {/* Action buttons */}
                                            <div className="flex gap-2 mt-2.5">
                                                <button onClick={() => { setSelectedNet(null); setPassword(''); }}
                                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${isDark
                                                        ? 'bg-slate-800/40 text-slate-500 hover:text-slate-300 border border-slate-700/30'
                                                        : 'bg-slate-100 text-slate-400 hover:text-slate-600 border border-slate-200'
                                                    }`}>
                                                    <X className="w-3 h-3" />
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={handleConnect}
                                                    disabled={isConnecting || (net.sec !== 'OPEN' && password.length < 1)}
                                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed ${isDark
                                                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/15'
                                                        : 'bg-cyan-50 text-cyan-600 border border-cyan-200 hover:bg-cyan-100'
                                                    }`}>
                                                    {isConnecting
                                                        ? <><Loader2 className="w-3 h-3 animate-spin" /> Conectando</>
                                                        : <><Check className="w-3 h-3" /> Conectar</>
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Signal bars (compact, only when connected and networks hidden) */}
                {isConnected && !showNetworks && (
                    <div className="flex items-end gap-[3px] h-4 justify-center">
                        {[85, 90, 75, 92, 88, 70, 95, 82, 78, 91, 86, 73].map((v, i) => (
                            <div key={i}
                                className={`w-1.5 rounded-sm transition-all ${isDark ? 'bg-cyan-500/30' : 'bg-cyan-400/25'}`}
                                style={{ height: `${v}%` }}
                            />
                        ))}
                    </div>
                )}
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
