import React, { useState, useEffect, useRef } from 'react';
import useTheme from './hooks/useTheme';
import useScannerEngine from './hooks/useScannerEngine';
import { formatTime } from './utils/helpers';

// Components
import Header from './components/layout/Header';
import SensorPanel from './components/modules/status/SensorPanel';
import LogPanel from './components/modules/logs/LogPanel';
import ScannerCanvas from './components/modules/scanner/ScannerCanvas';
import SettingsPanel from './components/modules/controls/SettingsPanel';
import CommandsPanel from './components/modules/controls/CommandsPanel';
import ConfigModal from './components/modules/config/ConfigModal';
import AiReportModal from './components/modules/config/AiReportModal';

const App = () => {
  // --- THEME ---
  const { themeMode, setThemeMode, isDark } = useTheme();

  // --- STATE ---
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [sensitivity, setSensitivity] = useState(65);
  const [stealthMode, setStealthMode] = useState(false);
  const [history, setHistory] = useState(new Array(60).fill(0));

  // --- LOGGING ---
  const addLog = (message, type = 'info') => {
    const time = formatTime();
    setLogs(prev => [...prev.slice(-20), { time, message, type }]);
  };

  // --- ENGINE ---
  const { disturbanceDisplay, history: engineHistory, triggerInterference, currentDisturbanceCtx } = useScannerEngine(isScanning, sensitivity, addLog);

  // Sync history from engine
  useEffect(() => {
    setHistory(engineHistory);
  }, [engineHistory]);

  // Initial Log
  useEffect(() => {
    addLog("NET-WATCHER OS v6.1 STABLE", "system");
  }, []);

  // --- CONFIG STATE ---
  const [showConfig, setShowConfig] = useState(false);
  const [configTab, setConfigTab] = useState('network');
  const [availableNetworks, setAvailableNetworks] = useState([]);
  const [currentNetwork, setCurrentNetwork] = useState({ ssid: 'SECURE-NET-01', status: 'connected', ip: '192.168.1.105' });
  const [isSearchingWifi, setIsSearchingWifi] = useState(false);

  // --- HARDWARE STATE ---
  const [hardwareList, setHardwareList] = useState([]);
  const [isScanningHardware, setIsScanningHardware] = useState(false);

  // --- CLOUD STATE ---
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState({ cf: 'ONLINE', gh: 'SYNCED' });

  // --- AI STATE ---
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // --- HANDLERS ---
  const toggleScan = () => {
    if (!isScanning) {
      setIsScanning(true);
      addLog("Motor de escaneo iniciado", "success");
    } else {
      setIsScanning(false);
      addLog("Motor detenido", "warning");
    }
  };

  const handleTriggerInterference = () => {
    triggerInterference();
  }

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
      setCurrentNetwork({ ssid: ssid, status: 'connected', ip: '192.168.1.' + Math.floor(Math.random() * 255) });
      addLog(`Conexión establecida: ${ssid}`, "success");
    }, 1000);
  };

  const scanHardware = () => {
    setIsScanningHardware(true);
    setHardwareList([]);
    addLog("Buscando nodos Mesh y Cámaras...", "info");
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
      addLog("Sincronización completada", "success");
    }, 2500);
  };

  const analyzeWithGemini = async () => {
    if (!isScanning) return;
    setIsAnalyzing(true);
    setShowModal(true);
    addLog("Solicitando análisis neuronal...", "info");
    try {
      setTimeout(() => {
        setAiReport({
          status: "PRECAUCIÓN",
          probability: "87%",
          analysis: "Se detectan fluctuaciones consistentes con movimiento biológico en el sector norte. Patrón no repetitivo.",
          action: "VERIFICAR CÁMARA 2"
        });
        setIsAnalyzing(false);
        addLog("Reporte recibido", "success");
      }, 2000);
    } catch (e) {
      setIsAnalyzing(false);
    }
  };

  // --- RENDER ---
  const containerClass = isDark
    ? 'bg-slate-950 text-slate-200'
    : 'bg-slate-50 text-slate-700';

  const panelClass = isDark
    ? 'bg-slate-900/50 border-slate-800'
    : 'bg-white/60 border-slate-200 shadow-sm';

  return (
    <div className={`min-h-screen font-sans text-xs relative overflow-hidden flex flex-col transition-colors duration-500 ${containerClass}`}>

      <Header
        isScanning={isScanning}
        isDark={isDark}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        currentNetwork={currentNetwork}
        setShowConfig={setShowConfig}
      />

      {/* MAIN GRID */}
      <main className="relative z-20 p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden">

        {/* COL IZQUIERDA */}
        <div className="lg:col-span-1 flex flex-col gap-6 h-full overflow-hidden">
          <SensorPanel disturbanceDisplay={disturbanceDisplay} isDark={isDark} />
          <LogPanel logs={logs} isDark={isDark} />
        </div>

        {/* COL CENTRAL (SCANNER) */}
        <div className="lg:col-span-2 flex flex-col gap-6 h-full">
          <div className={`relative flex-1 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ${isDark ? 'border border-slate-800 bg-slate-900 shadow-black/50' : 'border border-slate-200 bg-white shadow-slate-200/50'}`}>
            <ScannerCanvas
              isScanning={isScanning}
              disturbanceCtx={currentDisturbanceCtx}
              isDark={isDark}
              hardwareList={hardwareList}
              stealthMode={stealthMode}
            />

            {/* Hardware Icons Overlay if needed, or included in canvas? 
                    The original code rendered them as DOM elements on top of canvas div.
                    I should add them here.
                */}
            {hardwareList.map(dev => (
              <div key={dev.id}
                className={`absolute p-2 rounded-full shadow-lg flex items-center justify-center transition-all duration-1000 transform hover:scale-110 cursor-pointer ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white/90 border-slate-100'}`}
                style={{
                  top: `${20 + (dev.id * 15)}%`,
                  left: `${10 + (dev.id * 20)}%`,
                  borderWidth: '2px',
                  borderColor: dev.status === 'recording' || dev.status === 'online' ? '#10b981' : (isDark ? '#475569' : '#cbd5e1')
                }}
                title={dev.name}
              >
                {dev.type === 'camera' ? <Camera className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} /> : <Router className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />}
              </div>
            ))}
          </div>

          <div className={`h-20 rounded-2xl p-4 flex items-end gap-1 overflow-hidden border transition-colors ${panelClass}`}>
            {history.map((h, i) => (
              <div key={i}
                style={{ height: `${h}%` }}
                className={`flex-1 rounded-full transition-all duration-500 ${h < 60 ? 'bg-red-400' : (isDark ? 'bg-slate-700' : 'bg-slate-200')}`}
              ></div>
            ))}
          </div>
        </div>

        {/* COL DERECHA */}
        <div className="lg:col-span-1 flex flex-col gap-6 h-full">
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
            triggerInterference={handleTriggerInterference}
            isAnalyzing={isAnalyzing}
            analyzeWithGemini={analyzeWithGemini}
            isDark={isDark}
          />
        </div>
      </main>

      <ConfigModal
        showConfig={showConfig}
        setShowConfig={setShowConfig}
        isDark={isDark}
        currentNetwork={currentNetwork}
        scanNetworks={scanNetworks}
        isSearchingWifi={isSearchingWifi}
        availableNetworks={availableNetworks}
        connectToNetwork={connectToNetwork}
        hardwareList={hardwareList}
        scanHardware={scanHardware}
        isScanningHardware={isScanningHardware}
        toggleDeviceStatus={toggleDeviceStatus}
        cloudStatus={cloudStatus}
        isSyncing={isSyncing}
        handleCloudSync={handleCloudSync}
        configTab={configTab}
        setConfigTab={setConfigTab}
      />

      <AiReportModal
        showModal={showModal}
        setShowModal={setShowModal}
        aiReport={aiReport}
        isDark={isDark}
      />

    </div>
  );
};

export default App;
