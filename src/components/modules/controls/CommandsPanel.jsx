import React from 'react';
import { Terminal, Zap, UserX, BrainCircuit, RefreshCw } from 'lucide-react';
import Panel from '../../common/Panel';
import Button from '../../common/Button';

const CommandsPanel = ({ isScanning, toggleScan, triggerInterference, isAnalyzing, analyzeWithGemini, isDark }) => {
    return (
        <Panel title="Comandos" icon={Terminal} className="flex-1 min-h-0" isDark={isDark}>
            <div className="flex flex-col gap-2.5 h-full justify-center">
                <Button onClick={toggleScan} active={isScanning} variant="primary" isDark={isDark}>
                    <Zap className="w-3.5 h-3.5" />
                    {isScanning ? 'Detener' : 'Iniciar Escaneo'}
                </Button>

                <Button onClick={triggerInterference} disabled={!isScanning} variant="danger" isDark={isDark}>
                    <UserX className="w-3.5 h-3.5" />
                    Simular Intruso
                </Button>

                <div className="flex-1 min-h-2" />

                <Button onClick={analyzeWithGemini} disabled={!isScanning || isAnalyzing} variant="action" isDark={isDark}>
                    {isAnalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5" />}
                    {isAnalyzing ? 'Analizando...' : 'Analisis IA'}
                </Button>
            </div>
        </Panel>
    );
};

export default CommandsPanel;
