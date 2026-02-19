import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Wifi, Loader2, AlertTriangle, Eye, EyeOff } from 'lucide-react';

const SERVER = 'http://localhost:3001';

const LockScreen = ({ onAuth, isDark }) => {
    const [pin, setPin]         = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');
    const [shake, setShake]     = useState(false);
    const [showPin, setShowPin] = useState(false);
    const inputRef              = useRef(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    const handleSubmit = async (e) => {
        e?.preventDefault();
        if (!pin.trim() || loading) return;
        setLoading(true);
        setError('');

        try {
            const res  = await fetch(`${SERVER}/api/auth`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ pin: pin.trim().toUpperCase() }),
                signal:  AbortSignal.timeout(6000),
            });
            const data = await res.json();

            if (data.ok && data.token) {
                onAuth(data.token);
            } else {
                setError(data.error || 'PIN incorrecto');
                setPin('');
                setShake(true);
                setTimeout(() => setShake(false), 500);
                inputRef.current?.focus();
            }
        } catch {
            setError('No se pudo conectar al servidor. Asegúrate de que esté corriendo.');
            setShake(true);
            setTimeout(() => setShake(false), 500);
        } finally {
            setLoading(false);
        }
    };

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
                <div className={`rounded-2xl p-6 border ${
                    isDark
                        ? 'bg-white/[0.03] border-slate-700/40 backdrop-blur-sm'
                        : 'bg-white border-slate-200 shadow-xl shadow-slate-100'
                }`}>
                    <div className="flex items-center gap-2 mb-4">
                        <ShieldCheck className={`w-4 h-4 ${isDark ? 'text-cyan-500' : 'text-cyan-600'}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Introduce el PIN del servidor
                        </span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        {/* PIN input */}
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type={showPin ? 'text' : 'password'}
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
                            <button
                                type="button"
                                onClick={() => setShowPin(v => !v)}
                                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${
                                    isDark ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

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
                            disabled={!pin.trim() || loading}
                            className={`w-full py-3 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                                isDark
                                    ? 'bg-cyan-500/15 border-2 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 hover:border-cyan-500/50'
                                    : 'bg-cyan-600 text-white border-2 border-cyan-700 hover:bg-cyan-700'
                            }`}
                        >
                            {loading
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</>
                                : <><ShieldCheck className="w-4 h-4" /> Acceder</>
                            }
                        </button>
                    </form>
                </div>

                {/* Help text */}
                <p className={`text-center text-[9px] mt-4 leading-relaxed ${isDark ? 'text-slate-700' : 'text-slate-400'}`}>
                    El PIN se muestra en la terminal donde corre <span className="font-mono">npm run server</span>
                </p>
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
