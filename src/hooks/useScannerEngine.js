import { useState, useEffect, useRef } from 'react';

const useScannerEngine = (isScanning, initialSensitivity = 65, addLogCallback) => {
    const statusRef = useRef({ disturbance: 0 });
    const [disturbanceDisplay, setDisturbanceDisplay] = useState(0);
    const [history, setHistory] = useState(new Array(60).fill(0));
    const sensitivityRef = useRef(initialSensitivity);
    const nextEventRef = useRef(0);

    useEffect(() => {
        sensitivityRef.current = initialSensitivity;
    }, [initialSensitivity]);

    useEffect(() => {
        let interval;
        if (isScanning) {
            // First event fires in 2-5 seconds
            nextEventRef.current = 40 + Math.floor(Math.random() * 60);

            interval = setInterval(() => {
                const sens = sensitivityRef.current;
                // Slower recovery so spikes stay visible longer
                const recovery = Math.max(0.1, 1.2 - (sens * 0.01));

                let currentDist = statusRef.current.disturbance;
                currentDist = Math.max(0, currentDist - recovery);

                // ── Random interference events ──────────────────────────
                nextEventRef.current -= 1;
                if (nextEventRef.current <= 0) {
                    const roll = Math.random();
                    let impact, label;

                    if (roll < 0.35) {
                        // Fluctuación leve  (every ~3-6s)
                        impact = 25 + Math.random() * 20;
                        label = `Fluctuación de señal [${Math.floor(impact)}%]`;
                    } else if (roll < 0.70) {
                        // Interferencia moderada
                        impact = 50 + Math.random() * 20;
                        label = `Interferencia detectada [${Math.floor(impact)}%]`;
                    } else {
                        // Alerta alta
                        impact = 75 + Math.random() * 22;
                        label = `⚠ INTRUSIÓN DETECTADA [${Math.floor(impact)}%]`;
                    }

                    // Scale by sensitivity
                    const scaled = impact * (0.6 + sens / 160);
                    currentDist = Math.min(100, currentDist + scaled);
                    addLogCallback?.(label, impact > 70 ? 'danger' : impact > 45 ? 'warning' : 'info');

                    // Next event: 3-10 seconds (60-200 ticks at 50ms)
                    nextEventRef.current = 60 + Math.floor(Math.random() * 140);
                }

                statusRef.current.disturbance = currentDist;
                setDisturbanceDisplay(Math.floor(currentDist));

                const noise = Math.random() * 5;
                const signalVal = Math.max(0, Math.min(100, 92 + noise - (currentDist * 0.85)));
                setHistory(prev => [...prev.slice(1), Math.floor(signalVal)]);
            }, 50);
        } else {
            statusRef.current.disturbance = 0;
            setDisturbanceDisplay(0);
        }
        return () => clearInterval(interval);
    }, [isScanning]);

    const triggerInterference = () => {
        if (!isScanning) return;
        const sens = sensitivityRef.current;
        const impact = 80 + (sens * 0.2);
        statusRef.current.disturbance = Math.min(100, impact);
        setDisturbanceDisplay(Math.floor(impact));
        addLogCallback?.(`⚠ PERTURBACIÓN MANUAL [${Math.floor(impact)}%]`, 'danger');
    };

    return {
        disturbanceDisplay,
        history,
        triggerInterference,
        currentDisturbanceCtx: statusRef,
    };
};

export default useScannerEngine;
