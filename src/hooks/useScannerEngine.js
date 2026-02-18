import { useState, useEffect, useRef } from 'react';

const useScannerEngine = (isScanning, initialSensitivity = 65, addLogCallback) => {
    const statusRef = useRef({ disturbance: 0 });
    const [disturbanceDisplay, setDisturbanceDisplay] = useState(0);
    const [history, setHistory] = useState(new Array(60).fill(0));
    const sensitivityRef = useRef(initialSensitivity);
    const nextEventRef = useRef(0); // ticks until next random event

    useEffect(() => {
        sensitivityRef.current = initialSensitivity;
    }, [initialSensitivity]);

    useEffect(() => {
        let interval;
        if (isScanning) {
            // Schedule first random event in 3-8 seconds (at 50ms tick = 60-160 ticks)
            nextEventRef.current = 60 + Math.floor(Math.random() * 100);

            interval = setInterval(() => {
                const sens = sensitivityRef.current;
                const recovery = Math.max(0.2, 3 - (sens * 0.02));

                let currentDist = statusRef.current.disturbance;
                currentDist = Math.max(0, currentDist - recovery);

                // ── Random interference events ──────────────────────────
                nextEventRef.current -= 1;
                if (nextEventRef.current <= 0) {
                    // Magnitude: small flicker (10-30) to real alert (60-90)
                    const roll = Math.random();
                    let impact;
                    let label;
                    if (roll < 0.55) {
                        impact = 10 + Math.random() * 20; // flicker
                        label = `Fluctuación de señal [${Math.floor(impact)}%]`;
                    } else if (roll < 0.85) {
                        impact = 35 + Math.random() * 25; // moderate
                        label = `Interferencia detectada [${Math.floor(impact)}%]`;
                    } else {
                        impact = 65 + Math.random() * 30; // alert
                        label = `⚠ INTRUSIÓN DETECTADA [${Math.floor(impact)}%]`;
                    }

                    currentDist = Math.min(100, currentDist + impact * (sens / 70));
                    addLogCallback?.(label, impact > 60 ? 'danger' : impact > 30 ? 'warning' : 'info');

                    // Next event in 4-14 seconds (80-280 ticks)
                    nextEventRef.current = 80 + Math.floor(Math.random() * 200);
                }

                statusRef.current.disturbance = currentDist;
                setDisturbanceDisplay(Math.floor(currentDist));

                const noise = Math.random() * 5;
                const signalVal = Math.max(0, Math.min(100, 90 + noise - (currentDist * 0.8)));
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
        const impact = 60 + (sens * 0.4);
        const newDisturbance = Math.min(100, impact);
        statusRef.current.disturbance = newDisturbance;
        setDisturbanceDisplay(Math.floor(newDisturbance));
        addLogCallback?.(`PERTURBACIÓN MANUAL [${Math.floor(impact)}%]`, 'danger');
    };

    return {
        disturbanceDisplay,
        history,
        triggerInterference,
        currentDisturbanceCtx: statusRef,
    };
};

export default useScannerEngine;
