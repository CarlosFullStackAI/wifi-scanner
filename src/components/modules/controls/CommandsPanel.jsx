import React from 'react';
import { Database, Zap, UserX, BrainCircuit, RefreshCw } from 'lucide-react';
import Panel from '../../common/Panel';
import Button from '../../common/Button';

const CommandsPanel = ({
    isScanning,
    toggleScan,
    triggerInterference,
    isAnalyzing,
    analyzeWithGemini,
    isDark
}) => {
    return (
        <Panel title="Comandos" icon={Database} className="flex-1" isDark={isDark}>
            <div className="flex flex-col gap-3 h-full justify-center">
                <Button onClick={toggleScan} active={isScanning} variant="primary" isDark={isDark}>
                    <Zap className="w-4 h-4" /> {isScanning ? 'Detener Escaneo' : 'Iniciar Escaneo'}
                </Button>

                <Button onClick={triggerInterference} disabled={!isScanning} variant="danger" isDark={isDark}>
                    <UserX className="w-4 h-4" /> Simular Intruso
                </Button>

                <div className="flex-1"></div>

                <Button onClick={analyzeWithGemini} disabled={!isScanning || isAnalyzing} variant="action" isDark={isDark}>
                    {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                    {isAnalyzing ? 'Analizando...' : 'Análisis IA'}
                </Button>
            </div>
        </Panel>
    );
};

export default CommandsPanel;
