import React from 'react';
import { Terminal, UserX, BrainCircuit, RefreshCw } from 'lucide-react';
import Panel from '../../common/Panel';
import Button from '../../common/Button';

const CommandsPanel = ({ isScanning, triggerInterference, isAnalyzing, analyzeWithGemini, isDark }) => {
    return (
        <Panel title="Comandos" icon={Terminal} className="flex-1 min-h-0" isDark={isDark}>
            <div className="flex gap-2">
                <Button onClick={triggerInterference} disabled={!isScanning} variant="danger" isDark={isDark} className="flex-1">
                    <UserX className="w-3.5 h-3.5" />
                    Simular Intruso
                </Button>

                <Button onClick={analyzeWithGemini} disabled={!isScanning || isAnalyzing} variant="action" isDark={isDark} className="flex-1">
                    {isAnalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5" />}
                    {isAnalyzing ? 'Analizando...' : 'Análisis IA'}
                </Button>
            </div>
        </Panel>
    );
};

export default CommandsPanel;
