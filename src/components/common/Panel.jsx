import React from 'react';

const Panel = ({ children, title, icon: Icon, className = "", isDark }) => {
    return (
        <div className={`relative rounded-2xl overflow-hidden flex flex-col transition-all duration-500 ${isDark ? 'glass' : 'glass-light'} ${className}`}>
            {title && (
                <div className={`px-4 py-2.5 flex items-center justify-between flex-none border-b ${isDark ? 'border-slate-700/30' : 'border-slate-100'}`}>
                    <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {Icon && <Icon className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-500' : 'text-cyan-600'}`} />}
                        {title}
                    </div>
                    <div className="flex gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-cyan-500/30' : 'bg-cyan-400/40'}`} />
                        <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-slate-700/50' : 'bg-slate-200'}`} />
                    </div>
                </div>
            )}
            <div className="p-4 flex-1 overflow-hidden flex flex-col">{children}</div>
        </div>
    );
};

export default Panel;
