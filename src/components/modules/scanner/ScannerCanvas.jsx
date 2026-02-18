import React, { useRef, useEffect, useCallback } from 'react';
import { getDynamicColor } from '../../../utils/helpers';

const ScannerCanvas = ({ isScanning, disturbanceCtx, isDark }) => {
    const canvasRef = useRef(null);
    const requestRef = useRef();
    const particlesRef = useRef([]);
    const scanLinePos = useRef(0);

    useEffect(() => {
        const p = [];
        for (let i = 0; i < 100; i++) {
            p.push({
                x: Math.random(),
                y: Math.random(),
                vx: (Math.random() - 0.5) * 0.0003,
                vy: (Math.random() - 0.5) * 0.0003,
                size: Math.random() > 0.85 ? 3 : Math.random() > 0.5 ? 2 : 1,
            });
        }
        particlesRef.current = p;
    }, []);

    // Responsive canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const resize = () => {
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
        };
        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(canvas.parentElement);
        return () => observer.disconnect();
    }, []);

    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const dpr = window.devicePixelRatio || 1;

        const distLevel = disturbanceCtx.current ? disturbanceCtx.current.disturbance : 0;
        const mainColor = getDynamicColor(distLevel, isDark);

        const bgColor = isDark ? '#0f172a' : '#f8fafc';
        const gridColor = isDark ? 'rgba(30,41,59,0.5)' : 'rgba(226,232,240,0.6)';
        const particleBase = isDark ? '#475569' : '#94a3b8';

        // Background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, w, h);

        // Grid
        const gridSpacing = 50 * dpr;
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < w; x += gridSpacing) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
        for (let y = 0; y < h; y += gridSpacing) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
        ctx.stroke();

        // Radial gradient center glow
        if (isScanning) {
            const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.4);
            grad.addColorStop(0, `${mainColor}${isDark ? '08' : '05'}`);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
        }

        // Scan line
        if (isScanning) {
            scanLinePos.current += 3 * dpr;
            if (scanLinePos.current > w) scanLinePos.current = 0;
        }

        // Particles (normalized 0-1 coords)
        particlesRef.current.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0;
            if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;

            if (distLevel > 30) {
                const agitation = distLevel / 2000;
                p.x += (Math.random() - 0.5) * agitation;
                p.y += (Math.random() - 0.5) * agitation;
            }

            const px = p.x * w;
            const py = p.y * h;
            const distToScan = Math.abs(px - scanLinePos.current);
            let alpha = isDark ? 0.35 : 0.5;
            let color = particleBase;

            if (isScanning && distToScan < 100 * dpr) {
                alpha = 0.3 + 0.7 * (1 - distToScan / (100 * dpr));
                color = mainColor;
            }

            ctx.fillStyle = color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(px, py, p.size * dpr, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Scan beam
        if (isScanning) {
            const beamWidth = 80 * dpr;
            const gradient = ctx.createLinearGradient(scanLinePos.current - beamWidth, 0, scanLinePos.current, 0);
            gradient.addColorStop(0, 'transparent');
            gradient.addColorStop(1, `${mainColor}${isDark ? '18' : '0d'}`);
            ctx.fillStyle = gradient;
            ctx.fillRect(scanLinePos.current - beamWidth, 0, beamWidth, h);

            ctx.strokeStyle = mainColor;
            ctx.lineWidth = 2 * dpr;
            ctx.globalAlpha = isDark ? 0.6 : 0.3;
            ctx.beginPath();
            ctx.moveTo(scanLinePos.current, 0);
            ctx.lineTo(scanLinePos.current, h);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Waveform
        if (isScanning) {
            const waveH = 70 * dpr;
            const waveY = h - waveH;

            ctx.fillStyle = isDark ? 'rgba(15,23,42,0.85)' : 'rgba(248,250,252,0.85)';
            ctx.fillRect(0, waveY, w, waveH);

            // Separator line
            ctx.strokeStyle = isDark ? 'rgba(51,65,85,0.4)' : 'rgba(203,213,225,0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, waveY);
            ctx.lineTo(w, waveY);
            ctx.stroke();

            ctx.beginPath();
            const midY = waveY + waveH / 2;
            ctx.moveTo(0, midY);
            for (let i = 0; i < w; i += 3 * dpr) {
                const amp = (8 + distLevel * 0.5) * dpr;
                const freq = 0.04 + distLevel * 0.0008;
                const y = midY + Math.sin(i * freq / dpr - scanLinePos.current * 0.08 / dpr) * amp * (0.5 + Math.random() * 0.5);
                ctx.lineTo(i, y);
            }
            ctx.strokeStyle = mainColor;
            ctx.lineWidth = 2 * dpr;
            if (isDark) {
                ctx.shadowColor = mainColor;
                ctx.shadowBlur = 8 * dpr;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        requestRef.current = requestAnimationFrame(animate);
    }, [isScanning, isDark, disturbanceCtx]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [animate]);

    return (
        <canvas ref={canvasRef} className="w-full h-full" />
    );
};

export default ScannerCanvas;
