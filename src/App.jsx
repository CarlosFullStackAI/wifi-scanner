import React, { useState, useEffect } from 'react';
import { Camera, Router } from 'lucide-react';
import useTheme from './hooks/useTheme';
import useScannerEngine from './hooks/useScannerEngine';
import { formatTime } from './utils/helpers';

import Header from './components/layout/Header';
import SensorPanel from './components/modules/status/SensorPanel';
import LogPanel from './components/modules/logs/LogPanel';
import ScannerCanvas from './components/modules/scanner/ScannerCanvas';
import SettingsPanel from './components/modules/controls/SettingsPanel';
import CommandsPanel from './components/modules/controls/CommandsPanel';
import ConfigModal from './components/modules/config/ConfigModal';
import AiReportModal from './components/modules/config/AiReportModal';

const App = () => {
  const { themeMode, setThemeMode, isDark } = useTheme();

  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [sensitivity, setSensitivity] = useState(65);
  const [stealthMode, setStealthMode] = useState(false);
  const [history, setHistory] = useState(new Array(60).fill(0));

  const addLog = (message, type = 'info') => {
    const time = formatTime();
    setLogs(prev => [...prev.slice(-30), { time, message, type }]);
  };

  const { disturbanceDisplay, history: engineHistory, triggerInterference, currentDisturbanceCtx } = useScannerEngine(isScanning, sensitivity, addLog);

  useEffect(() => { setHistory(engineHistory); }, [engineHistory]);
  useEffect(() => { addLog("NET-WATCHER OS v6.1 STABLE", "system"); }, []);

  // --- CONFIG STATE ---
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
    if (!isScanning) {
      setIsScanning(true);
      addLog("Motor de escaneo iniciado", "success");
    } else {
      setIsScanning(false);
      addLog("Motor detenido", "warning");
    }
  };

  const scanNetworks = () => {
    setIsSearchingWifi(true);
    setAvailableNetworks([]);
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
    setIsScanningHardware(true);
    setHardwareList([]);
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
        addLog(`${dev.name} cambiado a ${newStatus.toUpperCase()}`, "warning");
        return { ...dev, status: newStatus };
      }
      return dev;
    }));
  };

  const handleCloudSync = () => {
    setIsSyncing(true);
    setCloudStatus({ cf: 'UPLOADING...', gh: 'PUSHING...' });
    addLog("Sincronizando con la nube...", "warning");
    setTimeout(() => {
      setIsSyncing(false);
      setCloudStatus({ cf: 'ONLINE', gh: 'SYNCED' });
      addLog("Sincronizacion completada", "success");
    }, 2500);
  };

  const analyzeWithGemini = async () => {
    if (!isScanning) return;
    setIsAnalyzing(true);
    setShowModal(true);
    addLog("Solicitando analisis neuronal...", "info");
    setTimeout(() => {
      setAiReport({
        status: "PRECAUCION",
        probability: "87%",
        analysis: "Se detectan fluctuaciones consistentes con movimiento biologico en el sector norte. Patron no repetitivo.",
        action: "VERIFICAR CAMARA 2"
      });
      setIsAnalyzing(false);
      addLog("Reporte recibido", "success");
    }, 2000);
  };

  return (
    <div className={`h-screen font-sans text-sm relative overflow-hidden flex flex-col transition-colors duration-500 ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-700'}`}>

      {/* Background grid */}
      <div className={`absolute inset-0 ${isDark ? 'bg-grid-dark' : 'bg-grid-light'} opacity-50 pointer-events-none`} />

      {/* Ambient glow */}
      {isScanning && isDark && (
        <>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
        </>
      )}

      <Header
        isScanning={isScanning}
        isDark={isDark}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        currentNetwork={currentNetwork}
        setShowConfig={setShowConfig}
      />

      <main className="relative z-20 p-4 lg:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 flex-1 overflow-hidden">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-3 flex flex-col gap-4 lg:gap-5 h-full overflow-hidden">
          <SensorPanel disturbanceDisplay={disturbanceDisplay} isDark={isDark} />
          <LogPanel logs={logs} isDark={isDark} />
        </div>

        {/* CENTER - SCANNER */}
        <div className="lg:col-span-6 flex flex-col gap-4 lg:gap-5 h-full">
          <div className={`scanner-container relative flex-1 rounded-2xl overflow-hidden transition-all duration-500 ${isDark ? 'border border-slate-800/80 shadow-2xl shadow-black/40' : 'border border-slate-200 shadow-xl shadow-slate-200/50'} ${isScanning && isDark ? 'animate-border-glow' : ''}`}>
            <ScannerCanvas
              isScanning={isScanning}
              disturbanceCtx={currentDisturbanceCtx}
              isDark={isDark}
              hardwareList={hardwareList}
              stealthMode={stealthMode}
            />

            {/* Hardware overlay */}
            {hardwareList.map(dev => (
              <div key={dev.id}
                className={`absolute p-2 rounded-xl flex items-center justify-center transition-all duration-700 transform hover:scale-125 cursor-pointer animate-fade-in ${isDark ? 'glass-panel-dark' : 'glass-panel-light'}`}
                style={{
                  top: `${20 + (dev.id * 15)}%`,
                  left: `${10 + (dev.id * 20)}%`,
                  borderColor: dev.status === 'recording' || dev.status === 'online' ? '#10b981' : undefined
                }}
                title={dev.name}
              >
                {dev.type === 'camera'
                  ? <Camera className={`w-3.5 h-3.5 ${dev.status === 'recording' ? 'text-emerald-400' : (isDark ? 'text-slate-500' : 'text-slate-400')}`} />
                  : <Router className={`w-3.5 h-3.5 ${dev.status === 'online' ? 'text-emerald-400' : (isDark ? 'text-slate-500' : 'text-slate-400')}`} />
                }
              </div>
            ))}

            {/* Scanning overlay label */}
            {isScanning && (
              <div className="absolute top-3 left-3 z-10 animate-fade-in">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${isDark ? 'bg-slate-900/80 text-cyan-400 border border-cyan-500/20' : 'bg-white/80 text-cyan-600 border border-cyan-200'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 status-dot" />
                  Escaneando
                </div>
              </div>
            )}
          </div>

          {/* History bar */}
          <div className={`h-16 rounded-xl p-3 flex items-end gap-[2px] overflow-hidden glass-panel transition-colors ${isDark ? 'glass-panel-dark' : 'glass-panel-light'}`}>
            {history.map((h, i) => {
              const isLow = h < 60;
              return (
                <div key={i}
                  style={{ height: `${Math.max(4, h)}%` }}
                  className={`history-bar flex-1 rounded-sm ${isLow
                    ? (isDark ? 'bg-red-500/70' : 'bg-red-400/60')
                    : (isDark ? 'bg-cyan-500/40' : 'bg-cyan-400/30')
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-3 flex flex-col gap-4 lg:gap-5 h-full">
          <SettingsPanel
            sensitivity={sensitivity}
            setSensitivity={setSensitivity}
            stealthMode={stealthMode}
            setStealthMode={setStealthMode}
            isDark={isDark}
          />
          <CommandsPanel
            isScanning={isScanning}
            toggleScan={toggleScan}
            triggerInterference={triggerInterference}
            isAnalyzing={isAnalyzing}
            analyzeWithGemini={analyzeWithGemini}
            isDark={isDark}
          />
        </div>
      </main>

      <ConfigModal
        showConfig={showConfig} setShowConfig={setShowConfig} isDark={isDark}
        currentNetwork={currentNetwork} scanNetworks={scanNetworks}
        isSearchingWifi={isSearchingWifi} availableNetworks={availableNetworks}
        connectToNetwork={connectToNetwork} hardwareList={hardwareList}
        scanHardware={scanHardware} isScanningHardware={isScanningHardware}
        toggleDeviceStatus={toggleDeviceStatus} cloudStatus={cloudStatus}
        isSyncing={isSyncing} handleCloudSync={handleCloudSync}
        configTab={configTab} setConfigTab={setConfigTab}
      />

      <AiReportModal showModal={showModal} setShowModal={setShowModal} aiReport={aiReport} isDark={isDark} />
    </div>
  );
};

export default App;
