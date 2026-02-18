import { useState, useEffect, useRef } from 'react';

// Target classification table
// detectionH = height range where the WiFi sensor registers movement (center of mass zone)
// distMin/distMax = realistic indoor distance from router in meters
const TARGETS = [
    { type: 'animal',     label: 'Animal Pequeño', sub: 'Perro / Gato',          hMin: 0.30, hMax: 0.60, dHMin: 0.10, dHMax: 0.40, iMin: 15, iMax: 38 },
    { type: 'adolescent', label: 'Adolescente',     sub: 'Joven 12–17 años',      hMin: 1.30, hMax: 1.62, dHMin: 0.65, dHMax: 1.20, iMin: 39, iMax: 62 },
    { type: 'adult',      label: 'Adulto',          sub: 'Persona mayor de edad', hMin: 1.63, hMax: 1.92, dHMin: 0.90, dHMax: 1.55, iMin: 63, iMax: 97 },
];

const classify = (impact) => {
    for (const t of TARGETS) {
        if (impact >= t.iMin && impact <= t.iMax) {
            const height         = (t.hMin + Math.random() * (t.hMax - t.hMin)).toFixed(2);
            const detectionH     = (t.dHMin + Math.random() * (t.dHMax - t.dHMin)).toFixed(2);
            // Distance: closer targets = stronger signal disturbance; range 1–14m
            const distanceM      = (1.2 + Math.random() * 12.8).toFixed(1);
            const confidence     = 62 + Math.floor(Math.random() * 33);
            const x = 0.15 + Math.random() * 0.70;
            const y = 0.15 + Math.random() * 0.60;
            return { ...t, height, detectionH, distanceM, confidence, x, y, timestamp: Date.now() };
        }
    }
    return null;
};

const useScannerEngine = (isScanning, initialSensitivity = 65, addLogCallback) => {
    const statusRef    = useRef({ disturbance: 0 });
    const detectionRef = useRef(null); // shared with canvas
    const [disturbanceDisplay, setDisturbanceDisplay] = useState(0);
    const [history, setHistory]           = useState(new Array(60).fill(0));
    const [lastDetection, setLastDetection] = useState(null);
    const sensitivityRef  = useRef(initialSensitivity);
    const nextEventRef    = useRef(0);

    useEffect(() => { sensitivityRef.current = initialSensitivity; }, [initialSensitivity]);

    useEffect(() => {
        let interval;
        if (isScanning) {
            nextEventRef.current = 40 + Math.floor(Math.random() * 60);

            interval = setInterval(() => {
                const sens = sensitivityRef.current;
                const recovery = Math.max(0.1, 1.2 - sens * 0.01);
                let currentDist = statusRef.current.disturbance;
                currentDist = Math.max(0, currentDist - recovery);

                nextEventRef.current -= 1;
                if (nextEventRef.current <= 0) {
                    // Pick random impact within full range then classify
                    const rawImpact = 15 + Math.random() * 82;
                    const scaled    = rawImpact * (0.6 + sens / 160);
                    const clampedImpact = Math.min(97, rawImpact);

                    const det = classify(clampedImpact);
                    if (det) {
                        setLastDetection(det);
                        detectionRef.current = { ...det, alpha: 1.0 };

                        const logType = det.type === 'adult' ? 'danger' : det.type === 'adolescent' ? 'warning' : 'info';
                        addLogCallback?.(
                            `${det.label} — ${det.height}m · det. a ${det.detectionH}m · ${det.distanceM}m del router`,
                            logType
                        );
                    }

                    currentDist = Math.min(100, currentDist + scaled);
                    nextEventRef.current = 60 + Math.floor(Math.random() * 140);
                }

                statusRef.current.disturbance = currentDist;
                setDisturbanceDisplay(Math.floor(currentDist));

                const noise = Math.random() * 5;
                const signalVal = Math.max(0, Math.min(100, 92 + noise - currentDist * 0.85));
                setHistory(prev => [...prev.slice(1), Math.floor(signalVal)]);
            }, 50);
        } else {
            statusRef.current.disturbance = 0;
            detectionRef.current = null;
            setDisturbanceDisplay(0);
            setLastDetection(null);
        }
        return () => clearInterval(interval);
    }, [isScanning]);

    const triggerInterference = () => {
        if (!isScanning) return;
        const sens = sensitivityRef.current;
        const impact = 75 + sens * 0.2;
        const det = classify(impact);
        if (det) {
            setLastDetection(det);
            detectionRef.current = { ...det, alpha: 1.0 };
            addLogCallback?.(`⚠ ${det.label} — ${det.height}m · det. ${det.detectionH}m · ${det.distanceM}m router`, 'danger');
        }
        statusRef.current.disturbance = Math.min(100, impact);
        setDisturbanceDisplay(Math.floor(impact));
    };

    return { disturbanceDisplay, history, triggerInterference, currentDisturbanceCtx: statusRef, lastDetection, detectionRef };
};

export default useScannerEngine;
