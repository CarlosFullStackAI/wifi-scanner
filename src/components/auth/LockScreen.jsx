import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Wifi, Loader2, AlertTriangle, Eye, EyeOff, Mail, Hash, Link } from 'lucide-react';

const LS_SERVER = 'nw_server_url';
const getServer = () =>
    (typeof window !== 'undefined' && localStorage.getItem(LS_SERVER)) || 'http://localhost:3001';

const LockScreen = ({ onAuth, isDark }) => {
    const [mode, setMode]       = useState('email'); // 'email' | 'pin'
    const [email, setEmail]     = useState('');
    const [password, setPassword] = useState('');
    const [pin, setPin]         = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');
    const [shake, setShake]     = useState(false);
    const [showPwd, setShowPwd] = useState(false);
    const [serverUrl, setServerUrl] = useState(getServer);
    const [showUrlCfg, setShowUrlCfg] = useState(false);
    const [urlDraft, setUrlDraft]     = useState('');
    const emailRef              = useRef(null);
    const pinRef                = useRef(null);

    useEffect(() => {
        if (mode === 'email') emailRef.current?.focus();
        else                  pinRef.current?.focus();
        setError('');
    }, [mode]);

    const triggerShake = (msg) => {
        setError(msg);
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();
        setLoading(true);
        setError('');

        const body = mode === 'email'
            ? { email: email.trim(), password }
            : { pin: pin.trim().toUpperCase() };

        const isLocal = serverUrl.includes('localhost') || serverUrl.includes('127.0.0.1');
        try {
            const res  = await fetch(`${serverUrl}/api/auth`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(body),
                signal:  AbortSignal.timeout(6000),
                ...(isLocal && { targetAddressSpace: 'loopback' }),
            });
            const data = await res.json();

            if (data.ok && data.token) {
                onAuth(data.token);
            } else {
                if (mode === 'email') setPassword('');
                else setPin('');
                triggerShake(data.error || 'Credenciales incorrectas');
                if (mode === 'email') emailRef.current?.focus();
                else                  pinRef.current?.focus();
            }
        } catch {
            triggerShake('No se pudo conectar al servidor. Asegúrate de que esté corriendo.');
        } finally {
            setLoading(false);
        }
    };

    const canSubmit = mode === 'email' ? (email.trim() && password) : pin.trim();

    return (
        <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-colors duration-500 ${
            isDark ? 'bg-[#070b14] text-slate-200' : 'bg-slate-50 text-slate-700'
        }`}>
            {/* Background grid */}
            <div className={`absolute inset-0 ${isDark ? 'bg-grid' : 'bg-grid-light'} pointer-events-none opacity-50`} />

            {/* Ambient glow */}
            {isDark && (
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-cyan-500/[0.06] blur-[80px] pointer-events-none" />
            )}

            <div className={`relative z-10 w-full max-w-sm mx-4 transition-transform duration-300 ${shake ? 'animate-shake' : ''}`}>

                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border-2 ${
                        isDark
                            ? 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_32px_rgba(6,182,212,0.2)]'
                            : 'bg-cyan-50 border-cyan-200 shadow-lg shadow-cyan-100'
                    }`}>
                        <Wifi className={`w-8 h-8 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                    </div>
                    <h1 className={`text-xl font-black tracking-[0.2em] font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        NET-WATCHER
                    </h1>
                    <span className={`text-[10px] font-mono font-bold mt-1 tracking-[0.3em] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                        ACCESO RESTRINGIDO
                    </span>
                </div>

                {/* Card */}
                <div className={`rounded-2xl border overflow-hidden ${
                    isDark
                        ? 'bg-white/[0.03] border-slate-700/40 backdrop-blur-sm'
                        : 'bg-white border-slate-200 shadow-xl shadow-slate-100'
                }`}>

                    {/* Tabs */}
                    <div className={`flex border-b ${isDark ? 'border-slate-700/40' : 'border-slate-100'}`}>
                        {[
                            { id: 'email', label: 'Correo', Icon: Mail },
                            { id: 'pin',   label: 'PIN',    Icon: Hash },
                        ].map(({ id, label, Icon }) => (
                            <button
                                key={id}
                                onClick={() => setMode(id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] transition-all ${
                                    mode === id
                                        ? (isDark ? 'text-cyan-400 border-b-2 border-cyan-400 -mb-px bg-cyan-500/5' : 'text-cyan-600 border-b-2 border-cyan-500 -mb-px bg-cyan-50/50')
                                        : (isDark ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600')
                                }`}
                            >
                                <Icon className="w-3 h-3" />{label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-3">

                            {mode === 'email' ? (
                                <>
                                    {/* Email */}
                                    <input
                                        ref={emailRef}
                                        type="email"
                                        value={email}
                                        onChange={e => { setEmail(e.target.value); setError(''); }}
                                        placeholder="correo@ejemplo.com"
                                        autoComplete="email"
                                        className={`w-full py-3 px-4 rounded-xl text-sm outline-none transition-all border-2 ${
                                            error
                                                ? 'border-red-500/50 bg-red-500/5'
                                                : isDark
                                                    ? 'bg-black/30 border-slate-700/50 text-white placeholder-slate-600 focus:border-cyan-500/50'
                                                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-cyan-400'
                                        }`}
                                    />
                                    {/* Password */}
                                    <div className="relative">
                                        <input
                                            type={showPwd ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => { setPassword(e.target.value); setError(''); }}
                                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                            placeholder="Contraseña"
                                            autoComplete="current-password"
                                            className={`w-full py-3 px-4 pr-11 rounded-xl text-sm outline-none transition-all border-2 ${
                                                error
                                                    ? 'border-red-500/50 bg-red-500/5'
                                                    : isDark
                                                        ? 'bg-black/30 border-slate-700/50 text-white placeholder-slate-600 focus:border-cyan-500/50'
                                                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-cyan-400'
                                            }`}
                                        />
                                        <button type="button" onClick={() => setShowPwd(v => !v)}
                                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${isDark ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'}`}>
                                            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                /* PIN input */
                                <div className="relative">
                                    <input
                                        ref={pinRef}
                                        type={showPwd ? 'text' : 'password'}
                                        value={pin}
                                        onChange={e => { setPin(e.target.value.toUpperCase()); setError(''); }}
                                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                        placeholder="••••••"
                                        maxLength={12}
                                        autoComplete="off"
                                        className={`w-full py-3 px-4 pr-11 rounded-xl text-base font-mono font-bold tracking-[0.3em] text-center outline-none transition-all border-2 ${
                                            error
                                                ? 'border-red-500/50 bg-red-500/5'
                                                : isDark
                                                    ? 'bg-black/30 border-slate-700/50 text-white placeholder-slate-700 focus:border-cyan-500/50'
                                                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-300 focus:border-cyan-400'
                                        }`}
                                    />
                                    <button type="button" onClick={() => setShowPwd(v => !v)}
                                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${isDark ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'}`}>
                                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <span className="text-[10px] text-red-400 leading-relaxed">{error}</span>
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={!canSubmit || loading}
                                className={`w-full py-3 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                                    isDark
                                        ? 'bg-cyan-500/15 border-2 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 hover:border-cyan-500/50'
                                        : 'bg-cyan-600 text-white border-2 border-cyan-700 hover:bg-cyan-700'
                                }`}
                            >
                                {loading
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</>
                                    : <><ShieldCheck className="w-4 h-4" /> Iniciar sesión</>
                                }
                            </button>
                        </form>
                    </div>
                </div>

                {/* Help text */}
                <p className={`text-center text-[9px] mt-4 leading-relaxed ${isDark ? 'text-slate-700' : 'text-slate-400'}`}>
                    {mode === 'pin'
                        ? <>El PIN se muestra en la terminal donde corre <span className="font-mono">npm run server</span></>
                        : 'Usa el correo y contraseña configurados en el servidor'
                    }
                </p>

                {/* Server URL config */}
                <div className="mt-3">
                    <button
                        onClick={() => { setShowUrlCfg(v => !v); setUrlDraft(serverUrl); }}
                        className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-widest transition-colors ${
                            isDark ? 'text-slate-700 hover:text-slate-500' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <Link className="w-2.5 h-2.5" />
                        Servidor: {serverUrl.replace(/^https?:\/\//, '').substring(0, 32)}
                    </button>
                    {showUrlCfg && (
                        <div className={`mt-2 p-3 rounded-xl border ${isDark ? 'bg-black/40 border-slate-700/40' : 'bg-slate-50 border-slate-200'}`}>
                            <p className={`text-[9px] mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                URL del servidor (local o túnel cloudflared)
                            </p>
                            <input
                                type="url"
                                value={urlDraft}
                                onChange={e => setUrlDraft(e.target.value)}
                                placeholder="https://xxxx.trycloudflare.com"
                                className={`w-full py-2 px-3 rounded-lg text-[10px] font-mono outline-none border transition-all ${
                                    isDark
                                        ? 'bg-black/30 border-slate-700/50 text-white placeholder-slate-600 focus:border-cyan-500/50'
                                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-cyan-400'
                                }`}
                            />
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={() => {
                                        const u = urlDraft.trim().replace(/\/$/, '');
                                        if (u) {
                                            localStorage.setItem(LS_SERVER, u);
                                            setServerUrl(u);
                                        }
                                        setShowUrlCfg(false);
                                    }}
                                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors ${
                                        isDark ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' : 'bg-cyan-600 text-white hover:bg-cyan-700'
                                    }`}
                                >Guardar</button>
                                <button
                                    onClick={() => { localStorage.setItem(LS_SERVER, 'http://localhost:3001'); setServerUrl('http://localhost:3001'); setShowUrlCfg(false); }}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors ${
                                        isDark ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >Reset</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CSS for shake animation */}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-8px); }
                    40% { transform: translateX(8px); }
                    60% { transform: translateX(-5px); }
                    80% { transform: translateX(5px); }
                }
                .animate-shake { animation: shake 0.4s ease-in-out; }
            `}</style>
        </div>
    );
};

export default LockScreen;
