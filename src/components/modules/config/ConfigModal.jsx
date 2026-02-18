import React, { useState } from 'react';
import { X, Wifi, Lock, RefreshCw, Zap, Camera, Router, Globe, Github, UploadCloud } from 'lucide-react';
import Button from '../../common/Button';

const ConfigModal = ({
    showConfig,
    setShowConfig,
    isDark,
    currentNetwork,
    scanNetworks,
    isSearchingWifi,
    availableNetworks,
    connectToNetwork,
    hardwareList,
    scanHardware,
    isScanningHardware,
    toggleDeviceStatus,
    cloudStatus,
    isSyncing,
    handleCloudSync,
    configTab,
    setConfigTab
}) => {
    if (!showConfig) return null;

    const textPrimary = isDark ? 'text-white' : 'text-slate-900';
    const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';
    const accentColor = isDark ? 'text-cyan-400' : 'text-cyan-600';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-opacity duration-300">
            <div className={`w-full max-w-md shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[600px] transition-all transform scale-100 ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200'}`}>
                {/* Modal Header */}
                <div className={`px-6 py-4 border-b flex justify-between items-center ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${textPrimary}`}>Configuración</h3>
                    <button onClick={() => setShowConfig(false)} className={`p-1 rounded-full hover:bg-opacity-10 transition-colors ${isDark ? 'hover:bg-white text-slate-400' : 'hover:bg-black text-slate-400'}`}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className={`flex border-b ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50'}`}>
                    {['network', 'hardware', 'cloud'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setConfigTab(tab)}
                            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors relative
                            ${configTab === tab
                                    ? (isDark ? 'text-cyan-400' : 'text-cyan-600')
                                    : textSecondary}
                        `}
                        >
                            {tab === 'network' ? 'WiFi' : tab === 'hardware' ? 'Dispositivos' : 'Cloud'}
                            {configTab === tab && <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? 'bg-cyan-400' : 'bg-cyan-600'}`}></div>}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className={`p-6 overflow-y-auto custom-scrollbar flex-1 ${textSecondary}`}>
                    {configTab === 'network' && (
                        <div className="space-y-4">
                            <div className={`p-4 rounded-xl border flex justify-between items-center ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                <div>
                                    <p className="text-[10px] uppercase font-bold opacity-60 mb-1">Red Actual</p>
                                    <span className={`font-mono text-sm font-bold ${textPrimary}`}>{currentNetwork.ssid}</span>
                                </div>
                                <span className={`text-xs font-mono bg-opacity-10 px-2 py-1 rounded ${isDark ? 'bg-white text-slate-300' : 'bg-black text-slate-600'}`}>{currentNetwork.ip}</span>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <p className="text-[10px] uppercase font-bold opacity-60">Redes Disponibles</p>
                                <button onClick={scanNetworks} className={`text-[10px] font-bold uppercase flex items-center gap-1 ${accentColor}`}>
                                    <RefreshCw className={`w-3 h-3 ${isSearchingWifi ? 'animate-spin' : ''}`} /> Scan
                                </button>
                            </div>

                            <div className="space-y-2">
                                {availableNetworks.map((net, i) => (
                                    <div key={i} onClick={() => connectToNetwork(net.ssid)} className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all border border-transparent ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50 hover:border-slate-200'}`}>
                                        <div className="flex items-center gap-3">
                                            <Wifi className="w-4 h-4 opacity-50" />
                                            <span className={`text-xs font-medium ${textPrimary}`}>{net.ssid}</span>
                                        </div>
                                        <Lock className="w-3 h-3 opacity-40" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {configTab === 'hardware' && (
                        <div className="space-y-4">
                            <div className={`p-5 rounded-xl border text-center ${isDark ? 'bg-slate-800/20 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                <h4 className={`text-xs font-bold uppercase mb-2 ${textPrimary}`}>Infraestructura</h4>
                                <p className="text-[10px] opacity-60 mb-4">Gestione cámaras y extensores para ampliar la cobertura.</p>
                                <Button onClick={scanHardware} disabled={isScanningHardware} variant="primary" isDark={isDark} className="w-full">
                                    {isScanningHardware ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                    {isScanningHardware ? 'Escaneando...' : 'Buscar Dispositivos'}
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {hardwareList.map((dev) => (
                                    <div key={dev.id} className={`flex items-center justify-between p-3 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                        <div className="flex items-center gap-3">
                                            {dev.type === 'camera' ? <Camera className="w-4 h-4 text-indigo-500" /> : <Router className="w-4 h-4 text-emerald-500" />}
                                            <div>
                                                <div className={`text-xs font-bold ${textPrimary}`}>{dev.name}</div>
                                                <div className="text-[10px] opacity-50 font-mono">{dev.ip}</div>
                                            </div>
                                        </div>
                                        <button onClick={() => toggleDeviceStatus(dev.id)} className={`px-2 py-1 text-[9px] font-bold uppercase rounded-md border ${(dev.status === 'online' || dev.status === 'recording')
                                                ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10'
                                                : 'border-slate-300 text-slate-400'
                                            }`}>
                                            {dev.status}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {configTab === 'cloud' && (
                        <div className="space-y-6 pt-2">
                            <div className="grid grid-cols-2 gap-4">
                                <a href="https://dash.cloudflare.com/ce60aeb8306dab534d87d2d8b65dbe80/home/overview" target="_blank" rel="noreferrer" className={`p-4 rounded-xl border transition-all hover:scale-105 ${isDark ? 'bg-slate-800/30 border-slate-700 hover:border-orange-500/50' : 'bg-slate-50 border-slate-200 hover:border-orange-400'}`}>
                                    <Globe className="w-5 h-5 text-orange-500 mb-2" />
                                    <div className={`text-xs font-bold ${textPrimary}`}>Cloudflare</div>
                                    <div className="text-[10px] opacity-60">Edge Network</div>
                                    <div className="mt-2 text-[10px] font-bold text-emerald-500">{cloudStatus.cf}</div>
                                </a>
                                <a href="https://github.com/CarlosFullStackAI?tab=repositories" target="_blank" rel="noreferrer" className={`p-4 rounded-xl border transition-all hover:scale-105 ${isDark ? 'bg-slate-800/30 border-slate-700 hover:border-white/50' : 'bg-slate-50 border-slate-200 hover:border-black/30'}`}>
                                    <Github className={`w-5 h-5 mb-2 ${textPrimary}`} />
                                    <div className={`text-xs font-bold ${textPrimary}`}>GitHub</div>
                                    <div className="text-[10px] opacity-60">Repository</div>
                                    <div className="mt-2 text-[10px] font-bold text-emerald-500">{cloudStatus.gh}</div>
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
