import React from 'react';

const Button = ({ onClick, disabled, active, variant = 'primary', children, className = "", isDark }) => {
    const base = "relative overflow-hidden transition-all duration-200 rounded-xl font-bold text-[11px] tracking-wider uppercase flex items-center justify-center gap-2 px-4 py-3 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.97]";

    if (variant === 'primary' && active) {
        return (
            <button onClick={onClick} disabled={disabled}
                className={`${base} bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:bg-cyan-500/15 ${className}`}>
                {children}
            </button>
        );
    }

    if (variant === 'primary') {
        return (
            <button onClick={onClick} disabled={disabled}
                className={`${base} ${isDark
                    ? 'bg-slate-800/60 text-slate-300 border border-slate-700/40 hover:bg-slate-700/60 hover:text-cyan-400 hover:border-cyan-500/20'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-cyan-50 hover:text-cyan-600 hover:border-cyan-300 shadow-sm'
                } ${className}`}>
                {children}
            </button>
        );
    }

    if (variant === 'danger') {
        return (
            <button onClick={onClick} disabled={disabled}
                className={`${base} ${isDark
                    ? 'bg-slate-800/40 border border-slate-700/40 text-slate-400 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400'
                    : 'bg-white border border-slate-200 text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600 shadow-sm'
                } ${className}`}>
                {children}
            </button>
        );
    }

    if (variant === 'action') {
        return (
            <button onClick={onClick} disabled={disabled}
                className={`${base} bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 border-0 ${className}`}>
                {children}
            </button>
        );
    }

    return <button onClick={onClick} disabled={disabled} className={`${base} ${className}`}>{children}</button>;
};

export default Button;
