import React from 'react';

const Button = ({ onClick, disabled, active, variant = 'primary', children, className = "", isDark }) => {
    const base = "relative overflow-hidden transition-all duration-300 rounded-xl font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2.5 px-4 py-3 disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-[0.97]";

    const variants = {
        primary: active
            ? `${base} bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]`
            : `${base} ${isDark
                ? 'bg-slate-800/80 text-slate-300 border border-slate-700/50 hover:bg-slate-700/80 hover:text-cyan-400 hover:border-cyan-500/30'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-cyan-50 hover:text-cyan-600 hover:border-cyan-300 shadow-sm'
            }`,
        danger: `${base} ${isDark
            ? 'border border-slate-700/50 hover:border-red-500/40 hover:bg-red-500/10 text-slate-400 hover:text-red-400 bg-slate-800/50'
            : 'border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-500 hover:text-red-600 bg-white'
        }`,
        action: `${base} bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-500/25 border-none`,
    };

    return (
        <button onClick={onClick} disabled={disabled} className={`${variants[variant] || base} ${className}`}>
            {children}
        </button>
    );
};

export default Button;
