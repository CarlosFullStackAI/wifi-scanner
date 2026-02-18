import React from 'react';
import { Settings, Globe, Github, RefreshCw, UploadCloud } from 'lucide-react';
import Panel from '../../common/Panel';

const SystemConfigPanel = ({ isDark, cloudStatus, isSyncing, handleCloudSync, setShowConfig }) => {
    return (
        <Panel title="Sistema" icon={Settings} isDark={isDark} className="flex-none">
            <div className="flex items-center gap-2">
                {/* Cloudflare */}
                <a href="https://dash.cloudflare.com/ce60aeb8306dab534d87d2d8b65dbe80/home/overview"
                    target="_blank" rel="noreferrer"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all hover:scale-[1.02] flex-1 ${isDark ? 'bg-white/[0.02] border border-slate-700/20 hover:border-orange-500/25' : 'bg-slate-50 border border-slate-100 hover:border-orange-300'}`}>
                    <Globe className="w-3 h-3 text-orange-400 shrink-0" />
                    <div className="min-w-0">
                        <div className={`text-[7px] font-bold uppercase tracking-widest truncate ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>CF</div>
                        <div className={`text-[9px] font-bold font-mono ${cloudStatus.cf === 'ONLINE' ? 'text-emerald-400' : 'text-amber-400'}`}>{cloudStatus.cf}</div>
                    </div>
                </a>

                {/* GitHub */}
                <a href="https://github.com/CarlosFullStackAI?tab=repositories"
                    target="_blank" rel="noreferrer"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all hover:scale-[1.02] flex-1 ${isDark ? 'bg-white/[0.02] border border-slate-700/20 hover:border-white/10' : 'bg-slate-50 border border-slate-100 hover:border-slate-400'}`}>
                    <Github className={`w-3 h-3 shrink-0 ${isDark ? 'text-white' : 'text-slate-700'}`} />
                    <div className="min-w-0">
                        <div className={`text-[7px] font-bold uppercase tracking-widest truncate ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>GH</div>
                        <div className={`text-[9px] font-bold font-mono ${cloudStatus.gh === 'SYNCED' ? 'text-emerald-400' : 'text-amber-400'}`}>{cloudStatus.gh}</div>
                    </div>
                </a>

                {/* Sync */}
                <button onClick={handleCloudSync} disabled={isSyncing}
                    className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all disabled:opacity-30 ${isDark
                        ? 'bg-slate-800/50 border border-slate-700/30 text-slate-400 hover:text-cyan-400'
                        : 'bg-white border border-slate-200 text-slate-500 hover:text-cyan-600 shadow-sm'}`}>
                    {isSyncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
                </button>

                {/* Config */}
                <button onClick={() => setShowConfig(true)}
                    className={`flex items-center justify-center px-2.5 py-1.5 rounded-lg transition-all ${isDark
                        ? 'bg-slate-800/50 border border-slate-700/30 text-slate-500 hover:text-white'
                        : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-700 shadow-sm'}`}>
                    <Settings className="w-3 h-3" />
                </button>
            </div>
        </Panel>
    );
};

export default SystemConfigPanel;
