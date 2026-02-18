import { useState, useEffect, useRef } from 'react';

const useScannerEngine = (isScanning, initialSensitivity = 65, addLogCallback) => {
    const statusRef = useRef({ disturbance: 0 });
    const [disturbanceDisplay, setDisturbanceDisplay] = useState(0);
    const [history, setHistory] = useState(new Array(60).fill(0));
    const sensitivityRef = useRef(initialSensitivity);

    // Sincronizar sensibilidad con ref para uso en intervalo
    useEffect(() => {
        sensitivityRef.current = initialSensitivity;
    }, [initialSensitivity]);

    // Actualizar historial cuando cambia el display, pero limitando actualizaciones
    // Se extrae la lógica del intervalo principal

    useEffect(() => {
        let interval;
        if (isScanning) {
            interval = setInterval(() => {
                const sens = sensitivityRef.current;
                const recovery = Math.max(0.2, 3 - (sens * 0.02));

                let currentDist = statusRef.current.disturbance;
                currentDist = Math.max(0, currentDist - recovery);
                statusRef.current.disturbance = currentDist;

                // Actualizar estado visual
                setDisturbanceDisplay(Math.floor(currentDist));

                // Generar señal con ruido
                const noise = Math.random() * 5;
                const signalVal = Math.max(0, Math.min(100, 90 + noise - (currentDist * 0.8)));

                setHistory(prev => [...prev.slice(1), Math.floor(signalVal)]);
            }, 50);
        } else {
            // Reset when not scanning
            statusRef.current.disturbance = 0;
            setDisturbanceDisplay(0);
        }
        return () => clearInterval(interval);
    }, [isScanning]);

    const triggerInterference = () => {
        if (!isScanning) return;
        const sens = sensitivityRef.current;
        const impact = 60 + (sens * 0.4);

        // Set disturbance immediately
        const newDisturbance = Math.min(100, impact);
        statusRef.current.disturbance = newDisturbance;
        setDisturbanceDisplay(Math.floor(newDisturbance));

        if (addLogCallback) {
            addLogCallback(`PERTURBACIÓN DETECTADA [${Math.floor(impact)}%]`, "danger");
        }
    };

    return {
        disturbanceDisplay,
        history,
        triggerInterference,
        currentDisturbanceCtx: statusRef // Para acceso directo desde canvas si fuera necesario
    };
};

export default useScannerEngine;
