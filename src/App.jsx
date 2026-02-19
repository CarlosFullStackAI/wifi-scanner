import React, { useState, useEffect } from 'react';
import { Camera, Router, ShieldCheck, ShieldOff } from 'lucide-react';
import './App.css';
import useTheme from './hooks/useTheme';
import useScannerEngine from './hooks/useScannerEngine';
import { formatTime, getDynamicColor } from './utils/helpers';

import Header from './components/layout/Header';
import LogPanel from './components/modules/logs/LogPanel';
import ScannerCanvas from './components/modules/scanner/ScannerCanvas';
import SettingsPanel from './components/modules/controls/SettingsPanel';
import CommandsPanel from './components/modules/controls/CommandsPanel';
import ConfigModal from './components/modules/config/ConfigModal';
import AiReportModal from './components/modules/config/AiReportModal';
import WifiPanel from './components/modules/wifi/WifiPanel';
import SystemConfigPanel from './components/modules/config/SystemConfigPanel';
import DetectionPanel from './components/modules/detection/DetectionPanel';

const App = () => {
  const { themeMode, setThemeMode, isDark } = useTheme();
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [sensitivity, setSensitivity] = useState(65);
  const [stealthMode, setStealthMode] = useState(false);
  const [history, setHistory] = useState(new Array(60).fill(0));

  const addLog = (message, type = 'info') => {
    const time = formatTime();
    setLogs(prev => [...prev.slice(-40), { time, message, type }]);
  };

  const { disturbanceDisplay, history: engineHistory, triggerInterference, currentDisturbanceCtx, lastDetection, detectionHistory, detectionRef } = useScannerEngine(isScanning, sensitivity, addLog);

  useEffect(() => { setHistory(engineHistory); }, [engineHistory]);
  useEffect(() => { addLog("NET-WATCHER OS v6.1 STABLE", "system"); }, []);

  const [showConfig, setShowConfig] = useState(false);
  const [configTab, setConfigTab] = useState('network');
  const [availableNetworks, setAvailableNetworks] = useState([]);
  const [currentNetwork, setCurrentNetwork] = useState({ ssid: 'SECURE-NET-01', status: 'connected', ip: '192.168.1.105' });
  const [isSearchingWifi, setIsSearchingWifi] = useState(false);
  const [hardwareList, setHardwareList] = useState([]);
  const [isScanningHardware, setIsScanningHardware] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState({ cf: 'ONLINE', gh: 'SYNCED' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const toggleScan = () => {
    if (!isScanning) { setIsScanning(true); addLog("Motor de escaneo iniciado", "success"); }
    else { setIsScanning(false); addLog("Motor detenido", "warning"); }
  };

  const scanNetworks = () => {
    setIsSearchingWifi(true); setAvailableNetworks([]);
    addLog("Escaneando espectro local...", "info");
    setTimeout(() => {
      setAvailableNetworks([
        { ssid: 'MOVISTAR-FIBRA-99', signal: 92, sec: 'WPA3' },
        { ssid: 'INVITADOS_CORP', signal: 60, sec: 'WPA2' },
        { ssid: 'CAFE_FREE', signal: 45, sec: 'OPEN' },
      ]);
      setIsSearchingWifi(false);
      addLog("3 redes encontradas", "success");
    }, 1500);
  };

  const connectToNetwork = (ssid) => {
    addLog(`Conectando a ${ssid}...`, "info");
    setTimeout(() => {
      setCurrentNetwork({ ssid, status: 'connected', ip: '192.168.1.' + Math.floor(Math.random() * 255) });
      addLog(`Conexion establecida: ${ssid}`, "success");
    }, 1000);
  };

  const scanHardware = () => {
    setIsScanningHardware(true); setHardwareList([]);
    addLog("Buscando nodos Mesh y Camaras...", "info");
    setTimeout(() => {
      setHardwareList([
        { id: 1, name: 'Extensor Pasillo', type: 'extender', ip: '192.168.1.20', status: 'online', signal: 85 },
        { id: 2, name: 'Cam Puerta Ppal', type: 'camera', ip: '192.168.1.35', status: 'recording', signal: 90 },
        { id: 3, name: 'Cam Patio', type: 'camera', ip: '192.168.1.36', status: 'standby', signal: 72 },
        { id: 4, name: 'Repeater Sala', type: 'extender', ip: '192.168.1.21', status: 'online', signal: 60 },
      ]);
      setIsScanningHardware(false);
      addLog("4 dispositivos vinculados", "success");
    }, 2000);
  };

  const toggleDeviceStatus = (id) => {
    setHardwareList(prev => prev.map(dev => {
      if (dev.id === id) {
        const newStatus = dev.type === 'camera'
          ? (dev.status === 'recording' ? 'standby' : 'recording')
          : (dev.status === 'online' ? 'offline' : 'online');
        addLog(`${dev.name} => ${newStatus.toUpperCase()}`, "warning");
        return { ...dev, status: newStatus };
      }
      return dev;
    }));
  };

  const handleCloudSync = () => {
    setIsSyncing(true); setCloudStatus({ cf: 'UPLOADING...', gh: 'PUSHING...' });
    addLog("Sincronizando con la nube...", "warning");
    setTimeout(() => {
      setIsSyncing(false); setCloudStatus({ cf: 'ONLINE', gh: 'SYNCED' });
      addLog("Sincronizacion completada", "success");
    }, 2500);
  };

  const analyzeWithGemini = async () => {
    if (!isScanning) return;
    setIsAnalyzing(true); setShowModal(true);
    addLog("Solicitando analisis neuronal...", "info");
    setTimeout(() => {
      setAiReport({
        status: "PRECAUCION", probability: "87%",
        analysis: "Se detectan fluctuaciones consistentes con movimiento biologico en el sector norte. Patron no repetitivo.",
        action: "VERIFICAR CAMARA 2"
      });
      setIsAnalyzing(false);
      addLog("Reporte recibido", "success");
    }, 2000);
  };

  return (
    <div className={`h-screen font-sans text-sm relative overflow-hidden flex flex-col transition-colors duration-500 ${isDark ? 'bg-[#070b14] text-slate-200' : 'bg-slate-50 text-slate-700'}`}>

      {/* Background */}
      <div className={`absolute inset-0 ${isDark ? 'bg-grid' : 'bg-grid-light'} pointer-events-none`} />

      {/* Ambient glows */}
      {isDark && (
        <>
          <div className="ambient-glow top-[-100px] left-1/4 w-[500px] h-[300px] bg-cyan-500/[0.04]" />
          <div className="ambient-glow bottom-[-50px] right-[10%] w-[400px] h-[300px] bg-indigo-500/[0.04]" style={{ animationDelay: '2s' }} />
          {isScanning && (
            <div className="ambient-glow top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-400/[0.06]" />
          )}
        </>
      )}

      <Header isScanning={isScanning} isDark={isDark} themeMode={themeMode} setThemeMode={setThemeMode} currentNetwork={currentNetwork} setShowConfig={setShowConfig} />

      <main className="relative z-10 p-3 lg:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 flex-1 min-h-0">
        {/* LEFT - WiFi + Logs */}
        <div className="lg:col-span-3 flex flex-col gap-3 lg:gap-4 min-h-0">
          <WifiPanel currentNetwork={currentNetwork} isDark={isDark} onScanNetworks={scanNetworks} isSearchingWifi={isSearchingWifi} availableNetworks={availableNetworks} onConnect={connectToNetwork} addLog={addLog} />
          <LogPanel logs={logs} isDark={isDark} className="flex-1" />
        </div>

        {/* CENTER - Scanner */}
        <div className="lg:col-span-5 flex flex-col gap-3 lg:gap-4 min-h-0">
          <div className={`scanlines relative flex-1 rounded-2xl overflow-hidden transition-all duration-700 ${isDark
            ? `border bg-[#0a0f1a] shadow-2xl shadow-black/60 ${isScanning ? 'border-cyan-500/20 shadow-cyan-500/5' : 'border-slate-800/60'}`
            : 'border border-slate-200 bg-white shadow-xl shadow-slate-200/50'
          }`}>
            <ScannerCanvas isScanning={isScanning} disturbanceCtx={currentDisturbanceCtx} detectionRef={detectionRef} isDark={isDark} />

            {hardwareList.map(dev => {
              const active = dev.status === 'recording' || dev.status === 'online';
              return (
                <div key={dev.id}
                  className={`absolute p-2.5 rounded-xl flex items-center gap-2 animate-fade-in cursor-pointer transition-all hover:scale-110 ${isDark ? 'glass' : 'glass-light'} ${active ? 'neon-border' : ''}`}
                  style={{ top: `${15 + (dev.id * 17)}%`, left: `${8 + (dev.id * 18)}%` }}
                  title={`${dev.name} - ${dev.ip}`}
                >
                  {dev.type === 'camera'
                    ? <Camera className={`w-3.5 h-3.5 ${active ? 'text-cyan-400' : 'text-slate-500'}`} />
                    : <Router className={`w-3.5 h-3.5 ${active ? 'text-emerald-400' : 'text-slate-500'}`} />
                  }
                  <span className={`text-[9px] font-mono font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {dev.name.split(' ').pop()}
                  </span>
                </div>
              );
            })}

            {isScanning && (
              <div className="absolute top-3 left-3 z-10 animate-fade-in">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono uppercase tracking-[0.2em] ${isDark ? 'bg-black/60 text-cyan-400 border border-cyan-500/20 backdrop-blur-sm' : 'bg-white/80 text-cyan-600 border border-cyan-200 backdrop-blur-sm'}`}>
                  <span className="w-2 h-2 rounded-full bg-cyan-400 status-pulse" />
                  SCANNING
                </div>
              </div>
            )}

            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className={`text-center ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>
                  <div className="text-4xl font-mono font-bold tracking-widest mb-2 opacity-30">OFFLINE</div>
                  <div className="text-[10px] uppercase tracking-[0.3em] opacity-20">Presione Iniciar Escaneo</div>
                </div>
              </div>
            )}
          </div>

          {/* Scanner toggle hero button */}
          <button
            onClick={toggleScan}
            className={`
              relative w-full rounded-2xl py-4 flex items-center justify-between px-5 gap-4
              font-bold tracking-widest uppercase transition-all duration-300 overflow-hidden
              border-2 active:scale-[0.97] flex-shrink-0
              ${isScanning
                ? `border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_28px_rgba(6,182,212,0.18)] ${isDark ? '' : 'shadow-cyan-200'}`
                : isDark
                  ? 'border-slate-700/60 bg-slate-800/40 hover:border-cyan-500/30 hover:bg-cyan-500/5'
                  : 'border-slate-200 bg-white hover:border-cyan-300 hover:bg-cyan-50 shadow-sm'
              }
            `}
          >
            {/* Pulse rings */}
            {isScanning && (
              <>
                <span className="absolute inset-0 rounded-2xl border-2 border-cyan-400/25 animate-ping" style={{ animationDuration: '1.8s' }} />
                <span className="absolute inset-0 rounded-2xl border border-cyan-300/10 animate-ping" style={{ animationDuration: '2.6s', animationDelay: '0.4s' }} />
              </>
            )}

            {/* Left: icon + label */}
            <div className="relative z-10 flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center border-2 transition-all duration-300 flex-shrink-0 ${
                isScanning
                  ? 'bg-cyan-500/15 border-cyan-500/40 shadow-[0_0_16px_rgba(6,182,212,0.3)]'
                  : isDark ? 'bg-slate-700/50 border-slate-600/50' : 'bg-slate-100 border-slate-200'
              }`}>
                {isScanning
                  ? <ShieldCheck className="w-6 h-6 text-cyan-400" />
                  : <ShieldOff className={`w-6 h-6 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                }
              </div>
              <div className="text-left">
                <div className={`text-sm font-black tracking-[0.12em] leading-none ${isScanning ? 'text-cyan-400' : isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {isScanning ? 'VIGILANCIA ACTIVA' : 'INICIAR VIGILANCIA'}
                </div>
                <div className={`text-[9px] mt-1 font-medium tracking-widest ${isScanning ? 'text-cyan-500/70' : isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                  {isScanning ? 'Pulsa para detener' : 'Activa el escaneo de red'}
                </div>
              </div>
            </div>

            {/* Right: mini disturbance gauge + signal bars */}
            <div className="relative z-10 flex items-center gap-4 flex-shrink-0">
              {/* Signal history bars */}
              <div className="flex items-end gap-[2px] h-7 w-14">
                {history.slice(-14).map((h, i) => (
                  <div key={i}
                    style={{ height: `${Math.max(8, h)}%` }}
                    className={`flex-1 rounded-sm ${h < 60 ? 'bg-red-500/60' : isDark ? 'bg-cyan-500/30' : 'bg-cyan-400/30'}`}
                  />
                ))}
              </div>
              {/* Mini circular gauge */}
              {(() => {
                const gColor = getDynamicColor(disturbanceDisplay, isDark);
                const r = 20, circ = 2 * Math.PI * r;
                const offset = circ - (disturbanceDisplay / 100) * circ;
                return (
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r={r} fill="none" stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="4" />
                      <circle cx="24" cy="24" r={r} fill="none" stroke={gColor} strokeWidth="4"
                        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                        style={isDark ? { filter: `drop-shadow(0 0 4px ${gColor}80)` } : {}}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-black font-mono leading-none" style={{ color: gColor }}>{disturbanceDisplay}</span>
                      <span className={`text-[6px] font-bold uppercase ${isDark ? 'text-slate-700' : 'text-slate-400'}`}>dist</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </button>
        </div>

        {/* RIGHT - Detection + Commands + Settings + System */}
        <div className="lg:col-span-4 flex flex-col gap-3 lg:gap-4 min-h-0 overflow-hidden">
          <DetectionPanel lastDetection={lastDetection} detectionHistory={detectionHistory} isScanning={isScanning} isDark={isDark} />
          <CommandsPanel isScanning={isScanning} triggerInterference={triggerInterference} isAnalyzing={isAnalyzing} analyzeWithGemini={analyzeWithGemini} isDark={isDark} />
          <SettingsPanel sensitivity={sensitivity} setSensitivity={setSensitivity} stealthMode={stealthMode} setStealthMode={setStealthMode} isDark={isDark} />
          <SystemConfigPanel isDark={isDark} cloudStatus={cloudStatus} isSyncing={isSyncing} handleCloudSync={handleCloudSync} setShowConfig={setShowConfig} />
        </div>
      </main>

      {/* Footer status bar */}
      <footer className={`relative z-10 px-5 py-1.5 flex items-center justify-between text-[9px] font-mono border-t ${isDark ? 'bg-[#070b14]/90 border-slate-800/40 text-slate-600' : 'bg-white/80 border-slate-200 text-slate-400'}`}>
        <div className="flex items-center gap-4">
          <span>NET-WATCHER v6.1</span>
          <span className="opacity-40">|</span>
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isScanning ? 'bg-cyan-400' : 'bg-slate-600'}`} />
            {isScanning ? 'ONLINE' : 'STANDBY'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>{currentNetwork.ssid}</span>
          <span className="opacity-40">|</span>
          <span>{currentNetwork.ip}</span>
        </div>
      </footer>

      <ConfigModal showConfig={showConfig} setShowConfig={setShowConfig} isDark={isDark} currentNetwork={currentNetwork} scanNetworks={scanNetworks} isSearchingWifi={isSearchingWifi} availableNetworks={availableNetworks} connectToNetwork={connectToNetwork} hardwareList={hardwareList} scanHardware={scanHardware} isScanningHardware={isScanningHardware} toggleDeviceStatus={toggleDeviceStatus} cloudStatus={cloudStatus} isSyncing={isSyncing} handleCloudSync={handleCloudSync} configTab={configTab} setConfigTab={setConfigTab} />
      <AiReportModal showModal={showModal} setShowModal={setShowModal} aiReport={aiReport} isDark={isDark} />
    </div>
  );
};

export default App;
