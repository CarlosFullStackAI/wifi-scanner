import React, { useRef, useEffect, useCallback } from 'react';
import { getDynamicColor } from '../../../utils/helpers';

const ScannerCanvas = ({ isScanning, disturbanceCtx, isDark }) => {
    const canvasRef = useRef(null);
    const reqRef = useRef();
    const particles = useRef([]);
    const scanPos = useRef(0);
    const time = useRef(0);
    const flashRef = useRef(0); // flash intensity 0-1

    // Init particles
    useEffect(() => {
        const arr = [];
        for (let i = 0; i < 140; i++) {
            arr.push({
                x: Math.random(), y: Math.random(),
                vx: (Math.random() - 0.5) * 0.0002,
                vy: (Math.random() - 0.5) * 0.0002,
                s: Math.random() > 0.9 ? 2.5 : Math.random() > 0.5 ? 1.5 : 1,
            });
        }
        particles.current = arr;
    }, []);

    // Responsive
    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;
        const resize = () => {
            const r = c.parentElement.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            c.width = r.width * dpr;
            c.height = r.height * dpr;
            c.style.width = r.width + 'px';
            c.style.height = r.height + 'px';
        };
        resize();
        const obs = new ResizeObserver(resize);
        obs.observe(c.parentElement);
        return () => obs.disconnect();
    }, []);

    const animate = useCallback(() => {
        const c = canvasRef.current;
        if (!c) return;
        const ctx = c.getContext('2d');
        const w = c.width, h = c.height;
        const dpr = window.devicePixelRatio || 1;
        time.current += 0.02;

        const dist = disturbanceCtx.current ? disturbanceCtx.current.disturbance : 0;
        const color = getDynamicColor(dist, isDark);
        const bg = isDark ? '#070b14' : '#f8fafc';

        // Trigger flash when new high-disturbance event detected
        if (dist > 55 && flashRef.current < dist / 100) {
            flashRef.current = Math.min(1, dist / 80);
        }
        flashRef.current = Math.max(0, flashRef.current - 0.04);

        // Clear
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Radial gradient
        const rg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.5);
        rg.addColorStop(0, isDark ? 'rgba(6,182,212,0.02)' : 'rgba(6,182,212,0.01)');
        rg.addColorStop(1, 'transparent');
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, w, h);

        // Grid — glitches when disturbance is high
        const gs = 40 * dpr;
        const gridShift = dist > 50 ? (Math.random() - 0.5) * dist * 0.15 : 0;
        ctx.strokeStyle = dist > 60
            ? `rgba(239,68,68,${0.06 + dist * 0.002})`
            : isDark ? 'rgba(30,41,59,0.25)' : 'rgba(226,232,240,0.5)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let x = gridShift; x < w; x += gs) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
        for (let y = gridShift; y < h; y += gs) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
        ctx.stroke();

        // Center crosshair + rings
        if (isScanning) {
            const cx = w / 2, cy = (h - 60 * dpr) / 2;
            const ringAlpha = 0.06 + dist * 0.001;
            ctx.strokeStyle = dist > 60
                ? `rgba(239,68,68,${ringAlpha})`
                : isDark ? 'rgba(6,182,212,0.08)' : 'rgba(6,182,212,0.05)';
            ctx.lineWidth = 1;
            for (let i = 1; i <= 3; i++) {
                const radius = i * Math.min(w, h) * 0.12;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.beginPath();
            ctx.moveTo(cx - 20 * dpr, cy); ctx.lineTo(cx + 20 * dpr, cy);
            ctx.moveTo(cx, cy - 20 * dpr); ctx.lineTo(cx, cy + 20 * dpr);
            ctx.stroke();
        }

        // Scan sweep
        if (isScanning) {
            scanPos.current += 2.5 * dpr;
            if (scanPos.current > w) scanPos.current = 0;
        }

        // Particles with strong shake on interference
        particles.current.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0;
            if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;

            if (dist > 20) {
                // Much more dramatic shake: 15x stronger
                const shake = dist / 400;
                p.x += (Math.random() - 0.5) * shake;
                p.y += (Math.random() - 0.5) * shake;
            }

            const px = p.x * w, py = p.y * h;
            const dts = Math.abs(px - scanPos.current);
            let a = isDark ? 0.2 : 0.4;
            let col = isDark ? '#334155' : '#94a3b8';

            if (isScanning && dts < 80 * dpr) {
                a = 0.3 + 0.7 * (1 - dts / (80 * dpr));
                col = color;
            } else if (dist > 40) {
                // All particles tinted during interference
                a = 0.15 + (dist / 400);
                col = color;
            }

            ctx.globalAlpha = a;
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(px, py, p.s * dpr, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Network lines
        if (isScanning) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 0.5;
            const pts = particles.current;
            for (let i = 0; i < pts.length; i++) {
                for (let j = i + 1; j < pts.length; j++) {
                    const dx = (pts[i].x - pts[j].x) * w;
                    const dy = (pts[i].y - pts[j].y) * h;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < 80 * dpr) {
                        ctx.globalAlpha = (1 - d / (80 * dpr)) * 0.08;
                        ctx.beginPath();
                        ctx.moveTo(pts[i].x * w, pts[i].y * h);
                        ctx.lineTo(pts[j].x * w, pts[j].y * h);
                        ctx.stroke();
                    }
                }
            }
            ctx.globalAlpha = 1;
        }

        // Scan beam
        if (isScanning) {
            const bw = 100 * dpr;
            const g = ctx.createLinearGradient(scanPos.current - bw, 0, scanPos.current, 0);
            g.addColorStop(0, 'transparent');
            g.addColorStop(1, isDark ? `${color}12` : `${color}08`);
            ctx.fillStyle = g;
            ctx.fillRect(scanPos.current - bw, 0, bw, h);

            ctx.globalAlpha = isDark ? 0.5 : 0.2;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5 * dpr;
            ctx.beginPath();
            ctx.moveTo(scanPos.current, 0);
            ctx.lineTo(scanPos.current, h);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Waveform
        if (isScanning) {
            const wh = 55 * dpr;
            const wy = h - wh;

            const wbg = ctx.createLinearGradient(0, wy, 0, h);
            wbg.addColorStop(0, isDark ? 'rgba(7,11,20,0.9)' : 'rgba(248,250,252,0.9)');
            wbg.addColorStop(1, isDark ? 'rgba(7,11,20,0.95)' : 'rgba(248,250,252,0.95)');
            ctx.fillStyle = wbg;
            ctx.fillRect(0, wy, w, wh);

            ctx.strokeStyle = isDark ? 'rgba(51,65,85,0.2)' : 'rgba(203,213,225,0.4)';
            ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(0, wy); ctx.lineTo(w, wy); ctx.stroke();

            const mid = wy + wh / 2;
            ctx.beginPath();
            ctx.moveTo(0, mid);
            for (let i = 0; i < w; i += 2 * dpr) {
                // Much bigger amplitude on high disturbance
                const amp = (4 + dist * 0.55) * dpr;
                const freq = 0.03 + dist * 0.0008;
                const noise = 0.5 + Math.random() * 0.5;
                const y = mid + Math.sin(i * freq / dpr - time.current * 3) * amp * noise;
                ctx.lineTo(i, y);
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = dist > 50 ? 2.5 * dpr : 1.5 * dpr;
            if (isDark) {
                ctx.shadowColor = color;
                ctx.shadowBlur = dist > 50 ? 12 * dpr : 6 * dpr;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // ── Alert flash overlay ─────────────────────────────────────────────
        if (flashRef.current > 0.01) {
            // Full-screen red vignette flash
            const flashG = ctx.createRadialGradient(w / 2, h / 2, h * 0.1, w / 2, h / 2, w * 0.8);
            flashG.addColorStop(0, `rgba(239,68,68,0)`);
            flashG.addColorStop(1, `rgba(239,68,68,${flashRef.current * 0.35})`);
            ctx.fillStyle = flashG;
            ctx.fillRect(0, 0, w, h);

            // Horizontal scan glitch lines
            const lineCount = Math.floor(flashRef.current * 8);
            for (let i = 0; i < lineCount; i++) {
                const gy = Math.random() * h;
                const gw = Math.random() * w * 0.6;
                const gx = Math.random() * (w - gw);
                ctx.fillStyle = `rgba(239,68,68,${Math.random() * 0.3})`;
                ctx.fillRect(gx, gy, gw, 1 * dpr);
            }
        }

        reqRef.current = requestAnimationFrame(animate);
    }, [isScanning, isDark, disturbanceCtx]);

    useEffect(() => {
        reqRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(reqRef.current);
    }, [animate]);

    return <canvas ref={canvasRef} className="w-full h-full" />;
};

export default ScannerCanvas;
