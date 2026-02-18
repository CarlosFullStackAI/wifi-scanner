import React from 'react';
import { Settings, Globe, Github, Camera, Router, Cloud, UploadCloud, RefreshCw, Shield, Cpu, HardDrive, Gauge } from 'lucide-react';
import Panel from '../../common/Panel';

const SystemConfigPanel = ({ isDark, cloudStatus, isSyncing, handleCloudSync, hardwareList, setShowConfig }) => {
    const cams = hardwareList.filter(d => d.type === 'camera');
    const extenders = hardwareList.filter(d => d.type === 'extender');
    const onlineCount = hardwareList.filter(d => d.status === 'online' || d.status === 'recording').length;

    return (
        <Panel title="Sistema" icon={Settings} isDark={isDark} className="flex-none">
            <div className="space-y-3">
                {/* Cloud status */}
                <div className="grid grid-cols-2 gap-2">
                    <a href="https://dash.cloudflare.com/ce60aeb8306dab534d87d2d8b65dbe80/home/overview"
                        target="_blank" rel="noreferrer"
                        className={`p-2.5 rounded-xl transition-all hover:scale-[1.02] cursor-pointer ${isDark ? 'bg-white/[0.02] border border-slate-700/20 hover:border-orange-500/25' : 'bg-slate-50 border border-slate-100 hover:border-orange-300'}`}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <Globe className="w-3 h-3 text-orange-400" />
                            <span className={`text-[8px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                Cloudflare
                            </span>
                        </div>
                        <div className={`text-[10px] font-bold font-mono ${cloudStatus.cf === 'ONLINE' ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {cloudStatus.cf}
                        </div>
                    </a>
                    <a href="https://github.com/CarlosFullStackAI?tab=repositories"
                        target="_blank" rel="noreferrer"
                        className={`p-2.5 rounded-xl transition-all hover:scale-[1.02] cursor-pointer ${isDark ? 'bg-white/[0.02] border border-slate-700/20 hover:border-white/10' : 'bg-slate-50 border border-slate-100 hover:border-slate-400'}`}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <Github className={`w-3 h-3 ${isDark ? 'text-white' : 'text-slate-700'}`} />
                            <span className={`text-[8px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                GitHub
                            </span>
                        </div>
                        <div className={`text-[10px] font-bold font-mono ${cloudStatus.gh === 'SYNCED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {cloudStatus.gh}
                        </div>
                    </a>
                </div>

                {/* Hardware summary */}
                <div className={`p-2.5 rounded-xl ${isDark ? 'bg-white/[0.02] border border-slate-700/20' : 'bg-slate-50 border border-slate-100'}`}>
                    <div className="flex items-center gap-1.5 mb-2">
                        <Cpu className={`w-3 h-3 ${isDark ? 'text-cyan-500' : 'text-cyan-600'}`} />
                        <span className={`text-[8px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                            Hardware
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <HWItem icon={Camera} label="Camaras" value={cams.length} isDark={isDark} color="text-violet-400" />
                        <HWItem icon={Router} label="Nodos" value={extenders.length} isDark={isDark} color="text-emerald-400" />
                        <HWItem icon={Shield} label="Online" value={onlineCount} isDark={isDark} color="text-cyan-400" />
                    </div>
                </div>

                {/* System info */}
                <div className="grid grid-cols-2 gap-2">
                    <SysItem icon={HardDrive} label="Memoria" value="2.1 GB" isDark={isDark} />
                    <SysItem icon={Gauge} label="CPU" value="12%" isDark={isDark} />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button onClick={handleCloudSync} disabled={isSyncing}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all disabled:opacity-30 ${isDark
                            ? 'bg-slate-800/50 border border-slate-700/30 text-slate-300 hover:bg-slate-700/50 hover:text-cyan-400'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-cyan-50 hover:text-cyan-600 shadow-sm'
                        }`}>
                        {isSyncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
                        {isSyncing ? 'Sync...' : 'Respaldo'}
                    </button>
                    <button onClick={() => setShowConfig(true)}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all ${isDark
                            ? 'bg-slate-800/50 border border-slate-700/30 text-slate-400 hover:bg-slate-700/50 hover:text-white'
                            : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 shadow-sm'
                        }`}>
                        <Settings className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </Panel>
    );
};

const HWItem = ({ icon: Icon, label, value, isDark, color }) => (
    <div className="text-center">
        <Icon className={`w-3.5 h-3.5 mx-auto mb-1 ${color}`} />
        <div className={`text-sm font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</div>
        <div className={`text-[7px] uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{label}</div>
    </div>
);

const SysItem = ({ icon: Icon, label, value, isDark }) => (
    <div className={`p-2 rounded-lg flex items-center gap-2 ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
        <Icon className={`w-3 h-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
        <div>
            <div className={`text-[7px] uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{label}</div>
            <div className={`text-[10px] font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</div>
        </div>
    </div>
);

export default SystemConfigPanel;
