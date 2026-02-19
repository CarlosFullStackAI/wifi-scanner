import React, { useRef, useEffect } from 'react';

// ── Physical room constants ────────────────────────────────────────────────
const ROOM_W = 10;       // metres wide
const ROOM_H = 8;        // metres tall
const ROUTER_X = 0.30;   // normalised position of router
const ROUTER_Y = 0.50;

// ── Wave-physics constants ─────────────────────────────────────────────────
const LAMBDA = 0.125;           // ~2.4 GHz WiFi wavelength (m)
const ATTN   = 0.18;            // attenuation per metre
const R_WALL = 0.65;            // wall reflection coefficient
const TWO_PI_OVER_LAMBDA = (2 * Math.PI) / LAMBDA;

// ── Heatmap grid ──────────────────────────────────────────────────────────
const GRID_W = 60;
const GRID_H = 48;

// ── Build 9 mirror sources (1 direct + 4 first-order + 4 corner) ──────────
const SOURCES = (() => {
    const rx = ROUTER_X * ROOM_W;
    const ry = ROUTER_Y * ROOM_H;
    const R2 = R_WALL * R_WALL;
    return [
        { x: rx,              y: ry,              amp: 1.0  },  // direct
        { x: -rx,             y: ry,              amp: R_WALL }, // left wall
        { x: 2 * ROOM_W - rx, y: ry,              amp: R_WALL }, // right wall
        { x: rx,              y: -ry,             amp: R_WALL }, // top wall
        { x: rx,              y: 2 * ROOM_H - ry, amp: R_WALL }, // bottom wall
        { x: -rx,             y: -ry,             amp: R2 },     // TL corner
        { x: 2 * ROOM_W - rx, y: -ry,             amp: R2 },     // TR corner
        { x: -rx,             y: 2 * ROOM_H - ry, amp: R2 },     // BL corner
        { x: 2 * ROOM_W - rx, y: 2 * ROOM_H - ry, amp: R2 },    // BR corner
    ];
})();

// ── Pre-compute source→cell distances (static, computed once) ─────────────
const DIST_CACHE = (() => {
    const cache = new Array(GRID_W * GRID_H);
    for (let gy = 0; gy < GRID_H; gy++) {
        for (let gx = 0; gx < GRID_W; gx++) {
            const px = ((gx + 0.5) / GRID_W) * ROOM_W;
            const py = ((gy + 0.5) / GRID_H) * ROOM_H;
            cache[gy * GRID_W + gx] = SOURCES.map(src => {
                const dx = px - src.x;
                const dy = py - src.y;
                return Math.sqrt(dx * dx + dy * dy);
            });
        }
    }
    return cache;
})();

// ── Compute heatmap for a given time phase ────────────────────────────────
function computeHeatmap(tPhase) {
    const map = new Float32Array(GRID_W * GRID_H);
    for (let i = 0; i < GRID_W * GRID_H; i++) {
        const dists = DIST_CACHE[i];
        let sig = 0;
        for (let s = 0; s < SOURCES.length; s++) {
            const d = dists[s];
            sig += SOURCES[s].amp * Math.exp(-d * ATTN) * Math.cos(TWO_PI_OVER_LAMBDA * d - tPhase);
        }
        map[i] = sig;
    }
    return map;
}

// ── Type colours ──────────────────────────────────────────────────────────
const TYPE_RGB = {
    bird:       [56,  189, 248],   // sky-400
    rabbit:     [167, 139, 250],   // violet-400
    animal:     [251, 191, 36],    // amber-400
    adolescent: [251, 146, 60],    // orange-400
    adult:      [248, 113, 113],   // red-400
};

// ─────────────────────────────────────────────────────────────────────────
const FloorPlanCanvas = ({ isScanning, detectionRef, detectionHistory = [], isDark }) => {
    const canvasRef  = useRef(null);
    const animRef    = useRef(null);
    const tRef       = useRef(0);

    // Keep reactive props in refs so the animation loop doesn't need to restart
    const detHistRef  = useRef(detectionHistory);
    const isDarkRef   = useRef(isDark);
    const isScanRef   = useRef(isScanning);

    useEffect(() => { detHistRef.current = detectionHistory; }, [detectionHistory]);
    useEffect(() => { isDarkRef.current  = isDark; },           [isDark]);
    useEffect(() => { isScanRef.current  = isScanning; },       [isScanning]);

    // ── Single mount: canvas loop ──────────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            canvas.width  = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        resize();

        const draw = () => {
            const W    = canvas.width;
            const H    = canvas.height;
            const dark = isDarkRef.current;
            const scan = isScanRef.current;

            if (W === 0 || H === 0) { animRef.current = requestAnimationFrame(draw); return; }

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = dark ? '#070b14' : '#f8fafc';
            ctx.fillRect(0, 0, W, H);

            const mg = { top: 24, right: 16, bottom: 32, left: 32 };
            const dW = W - mg.left - mg.right;
            const dH = H - mg.top  - mg.bottom;

            // ── Idle state ─────────────────────────────────────────────
            if (!scan) {
                ctx.fillStyle = dark ? 'rgba(100,116,139,0.3)' : 'rgba(148,163,184,0.4)';
                ctx.font      = 'bold 12px "JetBrains Mono",monospace';
                ctx.textAlign = 'center';
                ctx.fillText('PLANO INACTIVO', W / 2, H / 2 - 8);
                ctx.font = '8px "JetBrains Mono",monospace';
                ctx.fillText('Inicia el escaneo para ver las ondas', W / 2, H / 2 + 8);
                animRef.current = requestAnimationFrame(draw);
                return;
            }

            tRef.current += 0.012;
            const t = tRef.current;

            // ── Heatmap ────────────────────────────────────────────────
            const map = computeHeatmap(t);
            let minV = Infinity, maxV = -Infinity;
            for (let i = 0; i < map.length; i++) {
                if (map[i] < minV) minV = map[i];
                if (map[i] > maxV) maxV = map[i];
            }
            const range = maxV - minV || 1;
            const cW = dW / GRID_W;
            const cH = dH / GRID_H;

            for (let gy = 0; gy < GRID_H; gy++) {
                for (let gx = 0; gx < GRID_W; gx++) {
                    const v = (map[gy * GRID_W + gx] - minV) / range; // 0–1
                    let r, g, b, a;
                    if (dark) {
                        if (v < 0.3) {
                            const k = v / 0.3;
                            r = 7; g = Math.floor(11 + k * 30); b = Math.floor(20 + k * 60); a = 0.3 + k * 0.4;
                        } else if (v < 0.65) {
                            const k = (v - 0.3) / 0.35;
                            r = 7; g = Math.floor(41 + k * 182); b = Math.floor(80 + k * 132); a = 0.7 + k * 0.2;
                        } else {
                            const k = (v - 0.65) / 0.35;
                            r = Math.floor(13 + k * 242); g = Math.floor(223 + k * 32); b = Math.floor(212 + k * 43); a = 0.9 + k * 0.1;
                        }
                    } else {
                        if (v < 0.35) {
                            const k = v / 0.35;
                            r = 224; g = 242; b = 254; a = 0.15 + k * 0.35;
                        } else if (v < 0.7) {
                            const k = (v - 0.35) / 0.35;
                            r = Math.floor(224 - k * 80); g = Math.floor(242 - k * 60); b = Math.floor(254 - k * 80); a = 0.5 + k * 0.3;
                        } else {
                            const k = (v - 0.7) / 0.3;
                            r = Math.floor(144 - k * 40); g = Math.floor(182 - k * 50); b = Math.floor(174 - k * 40); a = 0.8 + k * 0.2;
                        }
                    }
                    ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
                    ctx.fillRect(
                        mg.left + gx * cW, mg.top + gy * cH,
                        Math.ceil(cW) + 1,  Math.ceil(cH) + 1
                    );
                }
            }

            // ── Room outline ───────────────────────────────────────────
            ctx.strokeStyle = dark ? 'rgba(6,182,212,0.55)' : 'rgba(8,145,178,0.55)';
            ctx.lineWidth   = 2;
            ctx.strokeRect(mg.left, mg.top, dW, dH);

            // ── Door (bottom-left gap + arc) ───────────────────────────
            const doorW = dW * 0.08;
            ctx.clearRect(mg.left + 1, mg.top + dH - 1, doorW - 1, 2);
            ctx.strokeStyle = dark ? 'rgba(6,182,212,0.9)' : 'rgba(8,145,178,0.9)';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(mg.left, mg.top + dH); ctx.lineTo(mg.left + doorW, mg.top + dH); ctx.stroke();
            ctx.strokeStyle = dark ? 'rgba(6,182,212,0.25)' : 'rgba(8,145,178,0.25)';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.beginPath(); ctx.arc(mg.left, mg.top + dH, doorW, -Math.PI / 2, 0); ctx.stroke();
            ctx.setLineDash([]);

            // ── Dimension labels ───────────────────────────────────────
            ctx.fillStyle = dark ? 'rgba(100,116,139,0.65)' : 'rgba(100,116,139,0.8)';
            ctx.font      = 'bold 8px "JetBrains Mono",monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${ROOM_W}m`, mg.left + dW / 2, H - 6);
            ctx.save();
            ctx.translate(10, mg.top + dH / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(`${ROOM_H}m`, 0, 0);
            ctx.restore();

            // ── Router: expanding rings + dot ──────────────────────────
            const rX = mg.left + ROUTER_X * dW;
            const rY = mg.top  + ROUTER_Y * dH;
            const pulse = 0.5 + 0.5 * Math.sin(t * 3);

            for (let ri = 0; ri < 3; ri++) {
                const phase = (t * 0.7 + ri / 3) % 1;
                const rr    = 6 + phase * 30;
                const ra    = (1 - phase) * 0.35;
                ctx.strokeStyle = dark ? `rgba(6,182,212,${ra})` : `rgba(8,145,178,${ra})`;
                ctx.lineWidth   = 1;
                ctx.beginPath(); ctx.arc(rX, rY, rr, 0, Math.PI * 2); ctx.stroke();
            }
            ctx.fillStyle = dark ? '#22d3ee' : '#0891b2';
            ctx.beginPath(); ctx.arc(rX, rY, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(rX, rY, 2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle  = dark ? 'rgba(6,182,212,0.9)' : 'rgba(8,145,178,0.9)';
            ctx.font       = 'bold 7px "JetBrains Mono",monospace';
            ctx.textAlign  = 'left';
            ctx.fillText('ROUTER', rX + 8, rY - 4);

            // ── Detection history markers ──────────────────────────────
            const dets = detHistRef.current.slice(0, 6);
            dets.forEach((det, i) => {
                if (det.x == null || det.y == null) return;
                const mx = mg.left + det.x * dW;
                const my = mg.top  + det.y * dH;
                const [cr, cg, cb] = TYPE_RGB[det.type] || TYPE_RGB.adult;
                const alpha = 1 - (i / 7);

                if (i === 0) {
                    const ringR = 10 + pulse * 5;
                    ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha * 0.5})`;
                    ctx.lineWidth   = 1.5;
                    ctx.beginPath(); ctx.arc(mx, my, ringR, 0, Math.PI * 2); ctx.stroke();
                }
                ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
                ctx.beginPath(); ctx.arc(mx, my, i === 0 ? 5 : 3, 0, Math.PI * 2); ctx.fill();

                if (i === 0) {
                    ctx.fillStyle  = `rgba(${cr},${cg},${cb},0.9)`;
                    ctx.font       = 'bold 7px "JetBrains Mono",monospace';
                    ctx.textAlign  = 'left';
                    ctx.fillText(det.label, mx + 8, my - 2);
                    ctx.fillStyle  = dark ? 'rgba(100,116,139,0.7)' : 'rgba(71,85,105,0.7)';
                    ctx.font       = '6px "JetBrains Mono",monospace';
                    ctx.fillText(`${det.distanceM}m del router`, mx + 8, my + 7);
                }
            });

            // ── Live detection reticle (from ref) ─────────────────────
            const live = detectionRef?.current;
            if (live && live.x != null && live.y != null) {
                const mx = mg.left + live.x * dW;
                const my = mg.top  + live.y * dH;
                const [cr, cg, cb] = TYPE_RGB[live.type] || TYPE_RGB.adult;
                const la = live.alpha ?? 1;
                const sz = 9, bOff = 7, bs = 5;

                ctx.strokeStyle = `rgba(${cr},${cg},${cb},${la * 0.85})`;
                ctx.lineWidth   = 1;
                ctx.beginPath();
                ctx.moveTo(mx - sz, my); ctx.lineTo(mx + sz, my);
                ctx.moveTo(mx, my - sz); ctx.lineTo(mx, my + sz);
                ctx.stroke();

                ctx.strokeStyle = `rgba(${cr},${cg},${cb},${la})`;
                ctx.lineWidth   = 2;
                ctx.beginPath();
                // top-left
                ctx.moveTo(mx - bOff, my - bOff + bs); ctx.lineTo(mx - bOff, my - bOff); ctx.lineTo(mx - bOff + bs, my - bOff);
                // top-right
                ctx.moveTo(mx + bOff - bs, my - bOff); ctx.lineTo(mx + bOff, my - bOff); ctx.lineTo(mx + bOff, my - bOff + bs);
                // bottom-right
                ctx.moveTo(mx + bOff, my + bOff - bs); ctx.lineTo(mx + bOff, my + bOff); ctx.lineTo(mx + bOff - bs, my + bOff);
                // bottom-left
                ctx.moveTo(mx - bOff + bs, my + bOff); ctx.lineTo(mx - bOff, my + bOff); ctx.lineTo(mx - bOff, my + bOff - bs);
                ctx.stroke();
            }

            // ── Scale bar ──────────────────────────────────────────────
            const mPx  = dW / ROOM_W;
            const sbLen = mPx * 2;
            const sbX  = W - mg.right - sbLen;
            const sbY  = H - mg.bottom + 12;
            ctx.strokeStyle = dark ? 'rgba(6,182,212,0.45)' : 'rgba(8,145,178,0.5)';
            ctx.lineWidth   = 1.5;
            ctx.beginPath();
            ctx.moveTo(sbX, sbY); ctx.lineTo(sbX + sbLen, sbY);
            ctx.moveTo(sbX, sbY - 3); ctx.lineTo(sbX, sbY + 3);
            ctx.moveTo(sbX + sbLen, sbY - 3); ctx.lineTo(sbX + sbLen, sbY + 3);
            ctx.stroke();
            ctx.fillStyle  = dark ? 'rgba(100,116,139,0.55)' : 'rgba(100,116,139,0.7)';
            ctx.font       = '6px "JetBrains Mono",monospace';
            ctx.textAlign  = 'center';
            ctx.fillText('2 m', sbX + sbLen / 2, sbY + 9);

            // ── Live tag ───────────────────────────────────────────────
            ctx.fillStyle  = dark ? 'rgba(6,182,212,0.55)' : 'rgba(8,145,178,0.65)';
            ctx.font       = 'bold 7px "JetBrains Mono",monospace';
            ctx.textAlign  = 'right';
            ctx.fillText('PLANO WiFi · EN VIVO', W - mg.right, mg.top - 6);

            animRef.current = requestAnimationFrame(draw);
        };

        animRef.current = requestAnimationFrame(draw);
        return () => {
            cancelAnimationFrame(animRef.current);
            ro.disconnect();
        };
    }, []); // single mount — reactive data via refs

    return <canvas ref={canvasRef} className="w-full h-full" style={{ display: 'block' }} />;
};

export default FloorPlanCanvas;
