import React from 'react';
import { X, Wifi, Lock, RefreshCw, Zap, Camera, Router, Globe, Github, UploadCloud, Signal } from 'lucide-react';
import Button from '../../common/Button';

const ConfigModal = ({
    showConfig, setShowConfig, isDark,
    currentNetwork, scanNetworks, isSearchingWifi, availableNetworks, connectToNetwork,
    hardwareList, scanHardware, isScanningHardware, toggleDeviceStatus,
    cloudStatus, isSyncing, handleCloudSync,
    configTab, setConfigTab
}) => {
    if (!showConfig) return null;

    const text1 = isDark ? 'text-white' : 'text-slate-900';
    const text2 = isDark ? 'text-slate-400' : 'text-slate-500';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-fade-in">
            <div className={`w-full max-w-md rounded-2xl overflow-hidden flex flex-col max-h-[600px] transition-all glass-panel ${isDark ? 'glass-panel-dark' : 'glass-panel-light'}`}>
                {/* Header */}
                <div className={`px-5 py-4 border-b flex justify-between items-center ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                    <h3 className={`text-sm font-bold uppercase tracking-wider ${text1}`}>Configuracion</h3>
                    <button onClick={() => setShowConfig(false)}
                        className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-400'}`}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Tabs */}
                <div className={`flex border-b ${isDark ? 'border-slate-700/50 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
                    {[
                        { key: 'network', label: 'WiFi' },
                        { key: 'hardware', label: 'Dispositivos' },
                        { key: 'cloud', label: 'Cloud' },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setConfigTab(tab.key)}
                            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative
                                ${configTab === tab.key ? (isDark ? 'text-cyan-400' : 'text-cyan-600') : text2}
                            `}
                        >
                            {tab.label}
                            {configTab === tab.key && (
                                <div className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full ${isDark ? 'bg-cyan-400' : 'bg-cyan-600'}`} />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className={`p-5 overflow-y-auto custom-scrollbar flex-1 ${text2}`}>
                    {configTab === 'network' && (
                        <div className="space-y-4">
                            <div className={`p-4 rounded-xl border flex justify-between items-center ${isDark ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                                <div>
                                    <p className="text-[9px] uppercase font-bold opacity-50 mb-1">Red Actual</p>
                                    <span className={`font-mono text-sm font-bold ${text1}`}>{currentNetwork.ssid}</span>
                                </div>
                                <span className={`text-[10px] font-mono px-2 py-1 rounded-lg ${isDark ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                    {currentNetwork.ip}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <p className="text-[10px] uppercase font-bold opacity-50">Redes Disponibles</p>
                                <button onClick={scanNetworks} className={`text-[10px] font-bold uppercase flex items-center gap-1 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                                    <RefreshCw className={`w-3 h-3 ${isSearchingWifi ? 'animate-spin' : ''}`} /> Scan
                                </button>
                            </div>

                            <div className="space-y-1.5">
                                {availableNetworks.map((net, i) => (
                                    <div key={i} onClick={() => connectToNetwork(net.ssid)}
                                        className={`flex justify-between items-center p-3 rounded-xl cursor-pointer transition-all border border-transparent ${isDark ? 'hover:bg-slate-800/50 hover:border-slate-700' : 'hover:bg-slate-50 hover:border-slate-200'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Signal className={`w-4 h-4 ${net.signal > 70 ? 'text-emerald-400' : net.signal > 40 ? 'text-amber-400' : 'text-red-400'}`} />
                                            <div>
                                                <span className={`text-xs font-semibold ${text1}`}>{net.ssid}</span>
                                                <span className={`text-[9px] ml-2 px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                                                    {net.sec}
                                                </span>
                                            </div>
                                        </div>
                                        <Lock className="w-3 h-3 opacity-30" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {configTab === 'hardware' && (
                        <div className="space-y-4">
                            <div className={`p-5 rounded-xl border text-center ${isDark ? 'bg-slate-800/20 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                                <h4 className={`text-xs font-bold uppercase mb-1.5 ${text1}`}>Infraestructura</h4>
                                <p className="text-[10px] opacity-50 mb-4">Gestione camaras y extensores de red.</p>
                                <Button onClick={scanHardware} disabled={isScanningHardware} variant="primary" isDark={isDark} className="w-full">
                                    {isScanningHardware ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                    {isScanningHardware ? 'Escaneando...' : 'Buscar Dispositivos'}
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {hardwareList.map(dev => (
                                    <div key={dev.id} className={`flex items-center justify-between p-3 rounded-xl border animate-fade-in ${isDark ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200'}`}>
                                        <div className="flex items-center gap-3">
                                            {dev.type === 'camera'
                                                ? <Camera className="w-4 h-4 text-indigo-400" />
                                                : <Router className="w-4 h-4 text-emerald-400" />
                                            }
                                            <div>
                                                <div className={`text-xs font-semibold ${text1}`}>{dev.name}</div>
                                                <div className="text-[9px] opacity-40 font-mono">{dev.ip}</div>
                                            </div>
                                        </div>
                                        <button onClick={() => toggleDeviceStatus(dev.id)}
                                            className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-lg border transition-colors ${(dev.status === 'online' || dev.status === 'recording')
                                                ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                                                : (isDark ? 'border-slate-600 text-slate-500' : 'border-slate-300 text-slate-400')
                                            }`}
                                        >
                                            {dev.status}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {configTab === 'cloud' && (
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-3">
                                <a href="https://dash.cloudflare.com/ce60aeb8306dab534d87d2d8b65dbe80/home/overview" target="_blank" rel="noreferrer"
                                    className={`p-4 rounded-xl border transition-all hover:scale-[1.03] ${isDark ? 'bg-slate-800/30 border-slate-700/50 hover:border-orange-500/40' : 'bg-slate-50 border-slate-200 hover:border-orange-300'}`}
                                >
                                    <Globe className="w-5 h-5 text-orange-400 mb-2" />
                                    <div className={`text-xs font-bold ${text1}`}>Cloudflare</div>
                                    <div className="text-[9px] opacity-40 mb-2">Edge Network</div>
                                    <div className="text-[10px] font-bold text-emerald-400">{cloudStatus.cf}</div>
                                </a>
                                <a href="https://github.com/CarlosFullStackAI?tab=repositories" target="_blank" rel="noreferrer"
                                    className={`p-4 rounded-xl border transition-all hover:scale-[1.03] ${isDark ? 'bg-slate-800/30 border-slate-700/50 hover:border-white/20' : 'bg-slate-50 border-slate-200 hover:border-slate-400'}`}
                                >
                                    <Github className={`w-5 h-5 mb-2 ${text1}`} />
                                    <div className={`text-xs font-bold ${text1}`}>GitHub</div>
                                    <div className="text-[9px] opacity-40 mb-2">Repository</div>
                                    <div className="text-[10px] font-bold text-emerald-400">{cloudStatus.gh}</div>
                                </a>
                            </div>
                            <Button onClick={handleCloudSync} disabled={isSyncing} variant="primary" isDark={isDark} className="w-full">
                                {isSyncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
                                {isSyncing ? 'Sincronizando...' : 'Ejecutar Respaldo'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConfigModal;
