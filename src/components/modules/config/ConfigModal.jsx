import React from 'react';
import { X, Wifi, Lock, RefreshCw, Zap, Camera, Router, Globe, Github, UploadCloud, Signal } from 'lucide-react';
import Button from '../../common/Button';

const ConfigModal = ({
    showConfig, setShowConfig, isDark,
    currentNetwork, scanNetworks, isSearchingWifi, availableNetworks, connectToNetwork,
    hardwareList, scanHardware, isScanningHardware, toggleDeviceStatus,
    cloudStatus, isSyncing, handleCloudSync, configTab, setConfigTab
}) => {
    if (!showConfig) return null;

    const t1 = isDark ? 'text-white' : 'text-slate-900';
    const t2 = isDark ? 'text-slate-400' : 'text-slate-500';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className={`modal-enter w-full max-w-md rounded-2xl overflow-hidden flex flex-col max-h-[85vh] ${isDark ? 'glass' : 'glass-light'}`}>
                {/* Header */}
                <div className={`px-5 py-3.5 border-b flex justify-between items-center ${isDark ? 'border-slate-700/30' : 'border-slate-100'}`}>
                    <h3 className={`text-xs font-bold uppercase tracking-[0.15em] font-mono ${t1}`}>Configuracion</h3>
                    <button onClick={() => setShowConfig(false)}
                        className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-white/5 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Tabs */}
                <div className={`flex border-b ${isDark ? 'border-slate-700/30' : 'border-slate-100'}`}>
                    {[{ k: 'network', l: 'WiFi' }, { k: 'hardware', l: 'Devices' }, { k: 'cloud', l: 'Cloud' }].map(t => (
                        <button key={t.k} onClick={() => setConfigTab(t.k)}
                            className={`flex-1 py-2.5 text-[9px] font-bold uppercase tracking-[0.2em] transition-all relative ${configTab === t.k
                                ? (isDark ? 'text-cyan-400' : 'text-cyan-600')
                                : (isDark ? 'text-slate-600' : 'text-slate-400')
                            }`}>
                            {t.l}
                            {configTab === t.k && <div className={`absolute bottom-0 left-4 right-4 h-[2px] rounded-full ${isDark ? 'bg-cyan-500' : 'bg-cyan-600'}`} />}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-5 overflow-y-auto scrollbar-thin flex-1">
                    {configTab === 'network' && (
                        <div className="space-y-4">
                            <div className={`p-4 rounded-xl flex justify-between items-center ${isDark ? 'bg-white/[0.02] border border-slate-700/30' : 'bg-slate-50 border border-slate-200'}`}>
                                <div>
                                    <p className={`text-[8px] uppercase font-bold tracking-widest mb-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Red Actual</p>
                                    <span className={`font-mono text-sm font-bold ${t1}`}>{currentNetwork.ssid}</span>
                                </div>
                                <span className={`text-[10px] font-mono px-2 py-1 rounded-md ${isDark ? 'bg-white/[0.03] text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                    {currentNetwork.ip}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <p className={`text-[9px] uppercase font-bold tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Disponibles</p>
                                <button onClick={scanNetworks} className={`text-[9px] font-bold uppercase flex items-center gap-1 ${isDark ? 'text-cyan-500' : 'text-cyan-600'}`}>
                                    <RefreshCw className={`w-2.5 h-2.5 ${isSearchingWifi ? 'animate-spin' : ''}`} /> Scan
                                </button>
                            </div>

                            <div className="space-y-1">
                                {availableNetworks.map((net, i) => (
                                    <div key={i} onClick={() => connectToNetwork(net.ssid)}
                                        className={`flex justify-between items-center p-3 rounded-xl cursor-pointer transition-all ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
                                        <div className="flex items-center gap-2.5">
                                            <Signal className={`w-3.5 h-3.5 ${net.signal > 70 ? 'text-emerald-400' : net.signal > 40 ? 'text-amber-400' : 'text-red-400'}`} />
                                            <span className={`text-xs font-medium ${t1}`}>{net.ssid}</span>
                                            <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${isDark ? 'bg-white/[0.03] text-slate-500' : 'bg-slate-100 text-slate-400'}`}>{net.sec}</span>
                                        </div>
                                        <Lock className="w-3 h-3 opacity-20" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {configTab === 'hardware' && (
                        <div className="space-y-4">
                            <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-white/[0.02] border border-slate-700/30' : 'bg-slate-50 border border-slate-200'}`}>
                                <p className={`text-[9px] uppercase tracking-widest mb-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Infraestructura de Red</p>
                                <Button onClick={scanHardware} disabled={isScanningHardware} variant="primary" isDark={isDark} className="w-full">
                                    {isScanningHardware ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                    {isScanningHardware ? 'Escaneando...' : 'Buscar'}
                                </Button>
                            </div>
                            <div className="space-y-1.5">
                                {hardwareList.map(dev => (
                                    <div key={dev.id} className={`flex items-center justify-between p-3 rounded-xl animate-fade-in ${isDark ? 'bg-white/[0.02] border border-slate-700/20' : 'bg-white border border-slate-200'}`}>
                                        <div className="flex items-center gap-2.5">
                                            {dev.type === 'camera' ? <Camera className="w-3.5 h-3.5 text-violet-400" /> : <Router className="w-3.5 h-3.5 text-emerald-400" />}
                                            <div>
                                                <div className={`text-[11px] font-semibold ${t1}`}>{dev.name}</div>
                                                <div className={`text-[8px] font-mono ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>{dev.ip}</div>
                                            </div>
                                        </div>
                                        <button onClick={() => toggleDeviceStatus(dev.id)}
                                            className={`px-2 py-1 text-[8px] font-bold uppercase rounded-md border transition-colors ${(dev.status === 'online' || dev.status === 'recording')
                                                ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10'
                                                : (isDark ? 'border-slate-700/30 text-slate-600' : 'border-slate-300 text-slate-400')
                                            }`}>
                                            {dev.status}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {configTab === 'cloud' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <a href="https://dash.cloudflare.com/ce60aeb8306dab534d87d2d8b65dbe80/home/overview" target="_blank" rel="noreferrer"
                                    className={`p-4 rounded-xl transition-all hover:scale-[1.02] ${isDark ? 'bg-white/[0.02] border border-slate-700/30 hover:border-orange-500/30' : 'bg-slate-50 border border-slate-200 hover:border-orange-300'}`}>
                                    <Globe className="w-4 h-4 text-orange-400 mb-2" />
                                    <div className={`text-[11px] font-bold ${t1}`}>Cloudflare</div>
                                    <div className={`text-[8px] mb-2 ${isDark ? 'text-slate-700' : 'text-slate-400'}`}>Edge Network</div>
                                    <div className="text-[9px] font-bold font-mono text-emerald-400">{cloudStatus.cf}</div>
                                </a>
                                <a href="https://github.com/CarlosFullStackAI?tab=repositories" target="_blank" rel="noreferrer"
                                    className={`p-4 rounded-xl transition-all hover:scale-[1.02] ${isDark ? 'bg-white/[0.02] border border-slate-700/30 hover:border-white/10' : 'bg-slate-50 border border-slate-200 hover:border-slate-400'}`}>
                                    <Github className={`w-4 h-4 mb-2 ${t1}`} />
                                    <div className={`text-[11px] font-bold ${t1}`}>GitHub</div>
                                    <div className={`text-[8px] mb-2 ${isDark ? 'text-slate-700' : 'text-slate-400'}`}>Repository</div>
                                    <div className="text-[9px] font-bold font-mono text-emerald-400">{cloudStatus.gh}</div>
                                </a>
                            </div>
                            <Button onClick={handleCloudSync} disabled={isSyncing} variant="primary" isDark={isDark} className="w-full">
                                {isSyncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
                                {isSyncing ? 'Sync...' : 'Respaldo'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConfigModal;
