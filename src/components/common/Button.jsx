import React from 'react';

const Button = ({ onClick, disabled, active, variant = 'primary', children, className = "", isDark }) => {
    let baseStyle = "relative overflow-hidden transition-all duration-300 rounded-lg font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95";

    if (variant === 'primary') {
        if (active) {
            return <button onClick={onClick} disabled={disabled} className={`${baseStyle} bg-cyan-500/20 text-cyan-500 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] ${className}`}>{children}</button>
        }
        return <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-cyan-600 shadow-sm'} ${className}`}>{children}</button>
    }
    if (variant === 'danger') {
        return <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${isDark ? 'border border-slate-800 hover:border-red-500/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400' : 'border border-slate-200 hover:border-red-400 hover:bg-red-50 text-slate-500 hover:text-red-600'} ${className}`}>{children}</button>
    }
    if (variant === 'action') {
        return <button onClick={onClick} disabled={disabled} className={`${baseStyle} bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 border-none ${className}`}>{children}</button>
    }

    return <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>;
};

export default Button;
