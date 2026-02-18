import React from 'react';

const Panel = ({ children, title, icon: Icon, className = "", isDark }) => {
    return (
        <div className={`relative glass-panel rounded-2xl overflow-hidden flex flex-col transition-all duration-500 ${isDark ? 'glass-panel-dark' : 'glass-panel-light'} ${className}`}>
            {title && (
                <div className={`px-4 py-3 flex items-center justify-between flex-none border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                    <div className={`flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {Icon && <Icon className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />}
                        {title}
                    </div>
                    <div className="flex gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-400/30'}`} />
                        <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                    </div>
                </div>
            )}
            <div className="p-4 relative z-10 flex-1 overflow-hidden flex flex-col">{children}</div>
        </div>
    );
};

export default Panel;
