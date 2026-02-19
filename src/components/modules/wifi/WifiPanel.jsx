import React, { useState, useEffect, useCallback } from 'react';
import {
    Wifi, WifiOff, Lock, Signal, Globe, ArrowUpDown, Clock,
    RefreshCw, Eye, EyeOff, ChevronDown, ChevronUp, X, Check,
    Loader2, ShieldAlert, Unplug, AlertTriangle, Settings, Link
} from 'lucide-react';
import Panel from '../../common/Panel';
import { getAddressSpace } from '../../../utils/helpers';

// ─── localStorage key ────────────────────────────────────────────────────────
const LS_KEY = 'nw_server_url';

const isLocalhost = () =>
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const getInitialUrl = () => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null;
    if (saved) return saved;
    // Always try localhost:3001 by default — works from any domain if the user
    // runs "npm run server" on this machine (Chrome allows HTTPS→localhost via PNA header)
    return 'http://localhost:3001';
};

// ─── Demo fallback ───────────────────────────────────────────────────────────
const DEMO_NETWORKS = [
    { ssid: 'MOVISTAR-FIBRA-99', signal: 92, sec: 'WPA3', band: '5 GHz', channel: '36', radio: '802.11ax' },
    { ssid: 'INVITADOS_CORP',    signal: 68, sec: 'WPA2', band: '2.4 GHz', channel: '6',  radio: '802.11n'  },
    { ssid: 'CAFE_FREE',         signal: 41, sec: 'OPEN', band: '2.4 GHz', channel: '11', radio: '802.11n'  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getSignalBars = (s) => s > 80 ? 4 : s > 60 ? 3 : s > 35 ? 2 : 1;
const signalColorClass = (s) => s > 70 ? 'bg-emerald-400' : s > 40 ? 'bg-amber-400' : 'bg-red-400';
const signalTextClass  = (s) => s > 70 ? 'text-emerald-400' : s > 40 ? 'text-amber-400' : 'text-red-400';

const fmt = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return [h, m, sec].map(n => String(n).padStart(2, '0')).join(':');
};

// ─── Component ───────────────────────────────────────────────────────────────
const WifiPanel = ({ isDark, addLog, authToken = '' }) => {
    const [current, setCurrent]     = useState({ connected: false, ssid: '', ip: '', signal: 0, speed: { rx: 0, tx: 0 } });
    const [networks, setNetworks]   = useState([]);
    const [scanning, setScanning]   = useState(false);
    const [showList, setShowList]   = useState(false);
    const [selected, setSelected]   = useState(null);
    const [password, setPassword]   = useState('');
    const [showPwd, setShowPwd]     = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [serverOnline, setServerOnline] = useState(false);
    const [uptime, setUptime]       = useState(0);
    const [liveSpeed, setLiveSpeed] = useState({ down: 0, up: 0 });
    const [connectError, setConnectError] = useState('');

    // ── Dynamic server URL (persisted in localStorage) ─────────────────────
    const [serverUrl, setServerUrl]   = useState(getInitialUrl);
    const [showUrlCfg, setShowUrlCfg] = useState(false);
    const [urlDraft, setUrlDraft]     = useState('');
    const onLocalhost = isLocalhost();

    const saveUrl = useCallback((url) => {
        const u = url.trim().replace(/\/$/, '');
        setServerUrl(u);
        if (u) localStorage.setItem(LS_KEY, u);
        else   localStorage.removeItem(LS_KEY);
        setShowUrlCfg(false);
        setServerOnline(false);
    }, []);

    // apiFetch uses the dynamic serverUrl
    const apiFetch = useCallback(async (path, opts = {}) => {
        if (!serverUrl) return null;
        try {
            const addrSpace = getAddressSpace(serverUrl);
            const res = await fetch(serverUrl + '/api' + path, {
                ...opts,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Auth-Token': authToken,
                    ...(opts.headers || {}),
                },
                signal: AbortSignal.timeout(7000),
                ...(addrSpace && { targetAddressSpace: addrSpace }),
            });
            return await res.json();
        } catch {
            return null;
        }
    }, [serverUrl, authToken]);

    // Auto-discover tunnel URL from local server (only when on localhost)
    useEffect(() => {
        if (!onLocalhost) return;
        const check = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/tunnel', { signal: AbortSignal.timeout(2000), targetAddressSpace: 'local' });
                const data = await res.json();
                if (data?.url && data.url !== serverUrl) {
                    // Tunnel URL available — don't auto-save, just show it in placeholder
                }
            } catch { /* server not up yet */ }
        };
        const t = setTimeout(check, 3000);
        return () => clearTimeout(t);
    }, [onLocalhost, serverUrl]);

    // Uptime & speed animation
    useEffect(() => {
        const t = setInterval(() => {
            setUptime(p => p + 1);
            setLiveSpeed({
                down: (20 + Math.random() * 80).toFixed(1),
                up:   (5  + Math.random() * 40).toFixed(1),
            });
        }, 1000);
        return () => clearInterval(t);
    }, []);

    // Fetch current connection
    const refreshCurrent = useCallback(async () => {
        if (!serverUrl) { setServerOnline(false); return; }
        const data = await apiFetch('/current');
        if (data?.ok) {
            setServerOnline(true);
            setCurrent(data);
        } else {
            setServerOnline(false);
        }
    }, [apiFetch, serverUrl]);

    useEffect(() => {
        refreshCurrent();
        const t = setInterval(refreshCurrent, 5000);
        return () => clearInterval(t);
    }, [refreshCurrent]);

    // Scan networks
    const handleScan = useCallback(async () => {
        setScanning(true);
        setShowList(true);
        setSelected(null);
        setPassword('');
        setConnectError('');

        if (serverOnline) {
            const data = await apiFetch('/networks');
            if (data?.ok) {
                setNetworks(data.networks);
                addLog?.(`${data.networks.length} redes encontradas`, 'success');
            } else {
                setNetworks(DEMO_NETWORKS);
                addLog?.('Usando datos de demo (servidor no disponible)', 'warning');
            }
        } else {
            await new Promise(r => setTimeout(r, 800));
            setNetworks(DEMO_NETWORKS);
            addLog?.('Modo demo: servidor local no activo', 'warning');
        }
        setScanning(false);
    }, [serverOnline, addLog]);

    // Connect
    const handleConnect = async () => {
        if (!selected) return;
        if (selected.sec !== 'OPEN' && !password) return;
        setConnecting(true);
        setConnectError('');
        addLog?.(`Autenticando en ${selected.ssid}...`, 'info');

        if (serverOnline) {
            const data = await apiFetch('/connect', {
                method: 'POST',
                body: JSON.stringify({ ssid: selected.ssid, password, security: selected.sec }),
            });
            if (data?.ok) {
                addLog?.(`Conectado a ${selected.ssid}`, 'success');
                setTimeout(refreshCurrent, 2000);
            } else {
                setConnectError(data?.error || 'Error al conectar');
                addLog?.(`Error: ${data?.error}`, 'danger');
            }
        } else {
            await new Promise(r => setTimeout(r, 1200));
            setCurrent({ connected: true, ssid: selected.ssid, ip: '192.168.1.' + Math.floor(Math.random() * 200 + 2), signal: selected.signal, speed: { rx: 200, tx: 150 } });
            addLog?.(`Conectado a ${selected.ssid} (demo)`, 'success');
        }

        setConnecting(false);
        setSelected(null);
        setPassword('');
        setShowList(false);
    };

    // Disconnect
    const handleDisconnect = async () => {
        addLog?.(`Desconectando de ${current.ssid}...`, 'warning');
        if (serverOnline) await apiFetch('/disconnect', { method: 'POST' });
        setCurrent({ connected: false, ssid: '', ip: '', signal: 0, speed: { rx: 0, tx: 0 } });
        addLog?.('Desconectado', 'warning');
    };

    const isConnected = current.connected && !!current.ssid;

    return (
        <Panel title="Red WiFi" icon={Wifi} isDark={isDark} className="flex-none">
            <div className="space-y-3">

                {/* Server status + URL config */}
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                        <div className={`flex items-center gap-1.5 flex-1 min-w-0 px-2 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest truncate ${
                            serverOnline
                                ? (isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
                                : (isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600')
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${serverOnline ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            <span className="truncate">
                                {serverOnline
                                    ? `Servidor activo · ${serverUrl.replace(/^https?:\/\//, '').slice(0, 24)}`
                                    : `Sin servidor · npm run server`
                                }
                            </span>
                        </div>
                        <button
                            onClick={() => { setUrlDraft(serverUrl); setShowUrlCfg(v => !v); }}
                            title="Configurar URL del servidor"
                            className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${isDark ? 'hover:bg-white/5 text-slate-600 hover:text-slate-400' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                        >
                            <Settings className="w-3 h-3" />
                        </button>
                    </div>

                    {showUrlCfg && (
                        <div className={`p-2.5 rounded-xl space-y-2 ${isDark ? 'bg-white/[0.02] border border-slate-700/20' : 'bg-slate-50 border border-slate-100'}`}>
                            <div className={`flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                <Link className="w-2.5 h-2.5" />
                                URL del servidor (local o tunel)
                            </div>
                            <div className="flex gap-1.5">
                                <input
                                    value={urlDraft}
                                    onChange={e => setUrlDraft(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && saveUrl(urlDraft)}
                                    placeholder="https://xxxx.trycloudflare.com"
                                    autoFocus
                                    className={`flex-1 py-1.5 px-2.5 rounded-lg text-[10px] font-mono outline-none transition-all ${isDark
                                        ? 'bg-black/30 border border-slate-700/40 text-white placeholder-slate-700 focus:border-cyan-500/40'
                                        : 'bg-white border border-slate-200 text-slate-900 placeholder-slate-300 focus:border-cyan-400'
                                    }`}
                                />
                                <button onClick={() => saveUrl(urlDraft)}
                                    className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all ${isDark
                                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/15'
                                        : 'bg-cyan-50 text-cyan-600 border border-cyan-200 hover:bg-cyan-100'
                                    }`}>
                                    <Check className="w-3 h-3" />
                                </button>
                            </div>
                            <p className={`text-[7px] leading-relaxed ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                {onLocalhost
                                    ? 'Usa http://localhost:3001 (local) o la URL del tunel cloudflared para acceso remoto.'
                                    : 'Corre npm run server en tu PC → cloudflared mostrará una URL pública. Pégala aquí.'
                                }
                            </p>
                        </div>
                    )}
                </div>

                {/* Current connection header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isConnected
                            ? (isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200')
                            : (isDark ? 'bg-slate-800 border border-slate-700/40' : 'bg-slate-100 border border-slate-200')
                        }`}>
                            {isConnected ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className={`w-4 h-4 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />}
                        </div>
                        <div>
                            <div className={`text-xs font-bold font-mono truncate max-w-[130px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {isConnected ? current.ssid : 'Sin conexion'}
                            </div>
                            <div className={`text-[8px] uppercase tracking-widest font-bold ${isConnected ? 'text-emerald-400' : (isDark ? 'text-slate-600' : 'text-slate-400')}`}>
                                {isConnected ? `${current.signal}% · ${current.ip}` : 'Desconectado'}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {isConnected && (
                            <button onClick={handleDisconnect} title="Desconectar"
                                className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-red-500/10 text-slate-600 hover:text-red-400' : 'hover:bg-red-50 text-slate-400 hover:text-red-500'}`}>
                                <Unplug className="w-3 h-3" />
                            </button>
                        )}
                        <button onClick={refreshCurrent} title="Actualizar"
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/5 text-slate-600' : 'hover:bg-slate-100 text-slate-400'}`}>
                            <RefreshCw className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* Stats (when connected) */}
                {isConnected && (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <InfoItem icon={Globe} label="IP" value={current.ip || '---'} isDark={isDark} />
                            <InfoItem icon={Clock} label="Uptime" value={fmt(uptime)} isDark={isDark} mono />
                        </div>
                        <div className={`p-2.5 rounded-xl ${isDark ? 'bg-white/[0.02] border border-slate-700/20' : 'bg-slate-50 border border-slate-100'}`}>
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <ArrowUpDown className={`w-3 h-3 ${isDark ? 'text-cyan-500' : 'text-cyan-600'}`} />
                                <span className={`text-[8px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Velocidad</span>
                            </div>
                            <div className="flex items-center justify-around">
                                <div className="text-center">
                                    <div className={`text-[7px] uppercase ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>↓ Bajada</div>
                                    <div className={`text-sm font-black font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                        {serverOnline ? current.speed?.rx : liveSpeed.down}
                                        <span className="text-[8px] ml-0.5 opacity-60">Mb</span>
                                    </div>
                                </div>
                                <div className={`w-px h-6 ${isDark ? 'bg-slate-700/30' : 'bg-slate-200'}`} />
                                <div className="text-center">
                                    <div className={`text-[7px] uppercase ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>↑ Subida</div>
                                    <div className={`text-sm font-black font-mono ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                                        {serverOnline ? current.speed?.tx : liveSpeed.up}
                                        <span className="text-[8px] ml-0.5 opacity-60">Mb</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Scan button */}
                <button onClick={() => { if (!showList) handleScan(); else setShowList(false); }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${isDark
                        ? 'bg-white/[0.02] border border-slate-700/20 text-slate-400 hover:border-cyan-500/20 hover:text-cyan-400'
                        : 'bg-slate-50 border border-slate-200 text-slate-500 hover:border-cyan-300 hover:text-cyan-600'
                    }`}>
                    <span className="flex items-center gap-2">
                        <Signal className="w-3.5 h-3.5" />
                        {serverOnline ? 'Buscar redes reales' : 'Redes disponibles'}
                        {networks.length > 0 && !scanning && (
                            <span className={`text-[8px] px-1.5 py-0.5 rounded ${isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
                                {networks.length}
                            </span>
                        )}
                    </span>
                    {scanning
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : showList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                    }
                </button>

                {/* Networks list */}
                {showList && (
                    <div className="space-y-1.5">
                        {scanning && (
                            <div className={`flex items-center justify-center gap-2 py-5 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="uppercase tracking-widest font-bold">Escaneando...</span>
                            </div>
                        )}

                        {!scanning && networks.length === 0 && (
                            <div className={`text-center py-5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                <WifiOff className="w-5 h-5 mx-auto mb-1 opacity-30" />
                                <p className="text-[9px] uppercase tracking-widest">Sin redes detectadas</p>
                            </div>
                        )}

                        {!scanning && networks.map((net, i) => {
                            const bars = getSignalBars(net.signal);
                            const isSel = selected?.ssid === net.ssid;
                            const isCurr = current.ssid === net.ssid && isConnected;

                            return (
                                <div key={net.ssid + i} className="animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                                    <button onClick={() => { if (!isCurr) { setSelected(isSel ? null : net); setPassword(''); setConnectError(''); } }}
                                        disabled={isCurr}
                                        className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left ${isSel
                                            ? (isDark ? 'bg-cyan-500/5 border border-cyan-500/20' : 'bg-cyan-50 border border-cyan-200')
                                            : isCurr
                                                ? (isDark ? 'bg-emerald-500/5 border border-emerald-500/15 cursor-default' : 'bg-emerald-50 border border-emerald-200 cursor-default')
                                                : (isDark ? 'bg-white/[0.01] border border-slate-700/20 hover:bg-white/[0.03] hover:border-slate-600/30' : 'bg-white border border-slate-100 hover:bg-slate-50')
                                        }`}>
                                        <div className="flex items-center gap-2.5">
                                            {/* Signal bars */}
                                            <div className="flex items-end gap-[2px] h-4 w-5 flex-shrink-0">
                                                {[1, 2, 3, 4].map(b => (
                                                    <div key={b}
                                                        className={`w-1 rounded-sm ${b <= bars ? signalColorClass(net.signal) : (isDark ? 'bg-slate-700/40' : 'bg-slate-200')}`}
                                                        style={{ height: `${b * 25}%` }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="min-w-0">
                                                <div className={`text-[11px] font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{net.ssid}</div>
                                                <div className={`text-[8px] font-mono ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                                    <span className={signalTextClass(net.signal)}>{net.signal}%</span>
                                                    {' · '}{net.sec}{' · '}{net.band}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            {isCurr && <span className="text-[8px] font-bold uppercase text-emerald-400">Activa</span>}
                                            {net.sec !== 'OPEN'
                                                ? <Lock className={`w-3 h-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                                                : <ShieldAlert className="w-3 h-3 text-amber-400" />
                                            }
                                        </div>
                                    </button>

                                    {/* Password form */}
                                    {isSel && !isCurr && (
                                        <div className={`mt-1 p-3 rounded-xl ${isDark ? 'bg-white/[0.02] border border-slate-700/20' : 'bg-slate-50 border border-slate-100'}`}>
                                            {net.sec !== 'OPEN' ? (
                                                <>
                                                    <label className={`text-[8px] font-bold uppercase tracking-widest block mb-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                        Contrasena — {net.ssid}
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={showPwd ? 'text' : 'password'}
                                                            value={password}
                                                            onChange={e => { setPassword(e.target.value); setConnectError(''); }}
                                                            onKeyDown={e => e.key === 'Enter' && handleConnect()}
                                                            placeholder="••••••••"
                                                            autoFocus
                                                            className={`w-full py-2 px-3 pr-9 rounded-lg text-xs font-mono outline-none transition-all ${isDark
                                                                ? 'bg-black/30 border border-slate-700/40 text-white placeholder-slate-700 focus:border-cyan-500/40'
                                                                : 'bg-white border border-slate-200 text-slate-900 placeholder-slate-300 focus:border-cyan-400'
                                                            }`}
                                                        />
                                                        <button onClick={() => setShowPwd(!showPwd)}
                                                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors ${isDark ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'}`}>
                                                            {showPwd ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                                                    <span className={`text-[9px] ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Red abierta — sin contrasena</span>
                                                </div>
                                            )}

                                            {connectError && (
                                                <div className="flex items-center gap-1.5 mt-2">
                                                    <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                                                    <span className="text-[9px] text-red-400">{connectError}</span>
                                                </div>
                                            )}

                                            <div className="flex gap-2 mt-2.5">
                                                <button onClick={() => { setSelected(null); setPassword(''); setConnectError(''); }}
                                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${isDark
                                                        ? 'bg-slate-800/40 text-slate-500 hover:text-slate-300 border border-slate-700/30'
                                                        : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-200'
                                                    }`}>
                                                    <X className="w-3 h-3" /> Cancelar
                                                </button>
                                                <button onClick={handleConnect}
                                                    disabled={connecting || (net.sec !== 'OPEN' && !password)}
                                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed ${isDark
                                                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/15'
                                                        : 'bg-cyan-50 text-cyan-600 border border-cyan-200 hover:bg-cyan-100'
                                                    }`}>
                                                    {connecting
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

                {/* Signal bars (when connected & list hidden) */}
                {isConnected && !showList && (
                    <div className="flex items-end gap-[3px] h-4 justify-center pt-1">
                        {[85, 90, 75, 92, 88, 70, 95, 82].map((v, i) => (
                            <div key={i}
                                className={`w-1.5 rounded-sm ${isDark ? 'bg-cyan-500/25' : 'bg-cyan-400/20'}`}
                                style={{ height: `${v}%` }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Panel>
    );
};

const InfoItem = ({ icon: Icon, label, value, isDark, mono }) => (
    <div className={`p-2 rounded-lg ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
        <div className="flex items-center gap-1 mb-0.5">
            <Icon className={`w-2.5 h-2.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
            <span className={`text-[7px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{label}</span>
        </div>
        <div className={`text-[11px] font-bold ${mono ? 'font-mono' : ''} ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</div>
    </div>
);

export default WifiPanel;
