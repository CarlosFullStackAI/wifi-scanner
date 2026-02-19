import React from 'react';

const Panel = ({ children, title, icon: Icon, className = "", isDark }) => {
    return (
        <div className={`relative rounded-2xl overflow-hidden flex flex-col transition-all duration-500 ${isDark ? 'glass' : 'glass-light'} ${className}`}>

            {/* Top gradient accent line */}
            <div className={`absolute top-0 left-0 right-0 h-px pointer-events-none z-10 ${
                isDark
                    ? 'bg-gradient-to-r from-transparent via-cyan-500/45 to-transparent'
                    : 'bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent'
            }`} />

            {title && (
                <div className={`px-4 py-2.5 flex items-center justify-between flex-none border-b ${isDark ? 'border-slate-700/30' : 'border-slate-100'}`}>
                    <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {Icon && (
                            <div className={`relative flex items-center justify-center ${isDark ? 'text-cyan-500' : 'text-cyan-600'}`}>
                                <Icon className="w-3.5 h-3.5" />
                            </div>
                        )}
                        {title}
                    </div>

                    {/* Header indicators */}
                    <div className="flex gap-1 items-center">
                        <span className="relative flex h-1.5 w-1.5">
                            <span
                                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-45 ${isDark ? 'bg-cyan-500' : 'bg-cyan-400'}`}
                                style={{ animationDuration: '3.2s' }}
                            />
                            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isDark ? 'bg-cyan-500/55' : 'bg-cyan-400/65'}`} />
                        </span>
                        <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-slate-700/50' : 'bg-slate-200'}`} />
                    </div>
                </div>
            )}

            <div className="p-4 flex-1 overflow-hidden flex flex-col">{children}</div>
        </div>
    );
};

export default Panel;
