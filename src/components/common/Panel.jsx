import React from 'react';

const Panel = ({ children, title, icon: Icon, className = "", isDark }) => {
    const panelClass = isDark
        ? 'bg-slate-900/50 border-slate-800'
        : 'bg-white/60 border-slate-200 shadow-sm';
    const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';
    const accentColor = isDark ? 'text-cyan-400' : 'text-cyan-600';

    return (
        <div className={`relative backdrop-blur-xl border rounded-2xl overflow-hidden flex flex-col transition-colors duration-500 ${panelClass} ${className}`}>
            {title && (
                <div className={`px-4 py-3 flex items-center justify-between flex-none border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${textSecondary}`}>
                        {Icon && <Icon className={`w-4 h-4 ${accentColor}`} />}
                        {title}
                    </div>
                    <div className="flex gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                        <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                    </div>
                </div>
            )}
            <div className="p-4 relative z-10 flex-1 overflow-hidden flex flex-col">{children}</div>
        </div>
    );
};

export default Panel;
