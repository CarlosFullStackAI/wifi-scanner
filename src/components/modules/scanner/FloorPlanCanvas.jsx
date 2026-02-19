import React, { useRef, useEffect } from 'react';

// ── Room ───────────────────────────────────────────────────────────────────
const ROOM_W = 10;
const ROOM_H = 8;
const ROUTER_X = 0.30;
const ROUTER_Y = 0.50;

// ── Wave physics ───────────────────────────────────────────────────────────
const LAMBDA = 0.125;
const ATTN   = 0.16;
const R_WALL = 0.65;
const TWO_PI_L = (2 * Math.PI) / LAMBDA;

// ── Heatmap grid ───────────────────────────────────────────────────────────
const GRID_W = 72;
const GRID_H = 56;

// ── Interior obstacles ─────────────────────────────────────────────────────
// x,y,w,h in metres; R=reflection coefficient; atten=blocking factor (0–1)
// fill/stroke = dark-mode RGB; label = caption
const OBSTACLES = [
    { x: 4.0, y: 0.0, w: 0.25, h: 3.2, R: 0.55, atten: 0.78, label: 'Tabique', fill: [55,65,81],   stroke: [100,116,139], lc: [148,163,184] },
    { x: 7.2, y: 0.5, w: 0.70, h: 1.8, R: 0.40, atten: 0.50, label: 'Armario', fill: [92,45,10],   stroke: [180,83,9],    lc: [251,146,60]  },
    { x: 1.5, y: 5.5, w: 2.20, h: 0.9, R: 0.25, atten: 0.38, label: 'Sofá',    fill: [49,46,129],  stroke: [99,102,241],  lc: [165,180,252] },
    { x: 8.5, y: 3.7, w: 0.55, h: 0.7, R: 0.62, atten: 0.72, label: 'Nevera',  fill: [15,23,42],   stroke: [51,65,85],    lc: [100,116,139] },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function lineBlockedBy(x1, y1, x2, y2, obs) {
    const dx = x2 - x1, dy = y2 - y1;
    let tMin = 0, tMax = 1;
    const rxA = obs.x, rxB = obs.x + obs.w;
    const ryA = obs.y, ryB = obs.y + obs.h;

    if (Math.abs(dx) < 1e-9) { if (x1 < rxA || x1 > rxB) return false; }
    else {
        const a = (rxA - x1) / dx, b = (rxB - x1) / dx;
        tMin = Math.max(tMin, Math.min(a, b));
        tMax = Math.min(tMax, Math.max(a, b));
        if (tMin > tMax) return false;
    }
    if (Math.abs(dy) < 1e-9) { if (y1 < ryA || y1 > ryB) return false; }
    else {
        const a = (ryA - y1) / dy, b = (ryB - y1) / dy;
        tMin = Math.max(tMin, Math.min(a, b));
        tMax = Math.min(tMax, Math.max(a, b));
    }
    return tMin <= tMax;
}

// Find entry t of ray (ox,oy,ndx,ndy) into obstacle AABB; returns -1 if no hit
function rayHitObstacle(ox, oy, ndx, ndy, obs) {
    let tMin = 0, tMax = Infinity;
    const rxA = obs.x, rxB = obs.x + obs.w;
    const ryA = obs.y, ryB = obs.y + obs.h;
    if (Math.abs(ndx) < 1e-9) { if (ox < rxA || ox > rxB) return -1; }
    else {
        const a = (rxA - ox) / ndx, b = (rxB - ox) / ndx;
        tMin = Math.max(tMin, Math.min(a, b));
        tMax = Math.min(tMax, Math.max(a, b));
        if (tMin > tMax) return -1;
    }
    if (Math.abs(ndy) < 1e-9) { if (oy < ryA || oy > ryB) return -1; }
    else {
        const a = (ryA - oy) / ndy, b = (ryB - oy) / ndy;
        tMin = Math.max(tMin, Math.min(a, b));
        tMax = Math.min(tMax, Math.max(a, b));
        if (tMin > tMax) return -1;
    }
    return tMin > 0 ? tMin : -1;
}

// ── Build sources: 9 wall mirrors + N obstacle mirrors ─────────────────────
function buildSources() {
    const rx = ROUTER_X * ROOM_W, ry = ROUTER_Y * ROOM_H;
    const R2 = R_WALL * R_WALL;
    const srcs = [
        { x: rx,               y: ry,               amp: 1.0,  obsIdx: -1 },
        { x: -rx,              y: ry,               amp: R_WALL, obsIdx: -1 },
        { x: 2*ROOM_W - rx,    y: ry,               amp: R_WALL, obsIdx: -1 },
        { x: rx,               y: -ry,              amp: R_WALL, obsIdx: -1 },
        { x: rx,               y: 2*ROOM_H - ry,    amp: R_WALL, obsIdx: -1 },
        { x: -rx,              y: -ry,              amp: R2,   obsIdx: -1 },
        { x: 2*ROOM_W - rx,    y: -ry,              amp: R2,   obsIdx: -1 },
        { x: -rx,              y: 2*ROOM_H - ry,    amp: R2,   obsIdx: -1 },
        { x: 2*ROOM_W - rx,    y: 2*ROOM_H - ry,    amp: R2,   obsIdx: -1 },
    ];

    // For each obstacle, add a virtual mirror source reflected across the obstacle face closest to the router
    OBSTACLES.forEach((obs, i) => {
        const cx = obs.x + obs.w / 2, cy = obs.y + obs.h / 2;
        const dx = rx - cx, dy = ry - cy;
        // Which face is closest: horizontal or vertical?
        const nx = Math.abs(dx) / (obs.w / 2), ny = Math.abs(dy) / (obs.h / 2);
        let mirX = rx, mirY = ry;
        if (nx > ny) {
            // reflect across left or right face
            const faceX = dx > 0 ? obs.x : obs.x + obs.w;
            mirX = 2 * faceX - rx;
        } else {
            // reflect across top or bottom face
            const faceY = dy > 0 ? obs.y : obs.y + obs.h;
            mirY = 2 * faceY - ry;
        }
        srcs.push({ x: mirX, y: mirY, amp: obs.R, obsIdx: i });
    });

    return srcs;
}

const SOURCES = buildSources();

// ── Distance cache (static) ────────────────────────────────────────────────
const DIST_CACHE = (() => {
    const cache = new Array(GRID_W * GRID_H);
    for (let gy = 0; gy < GRID_H; gy++) {
        for (let gx = 0; gx < GRID_W; gx++) {
            const px = ((gx + 0.5) / GRID_W) * ROOM_W;
            const py = ((gy + 0.5) / GRID_H) * ROOM_H;
            cache[gy * GRID_W + gx] = SOURCES.map(s => {
                const dx = px - s.x, dy = py - s.y;
                return Math.sqrt(dx * dx + dy * dy);
            });
        }
    }
    return cache;
})();

// ── Shadow cache: obstacle occlusion (static, pre-computed) ───────────────
const SHADOW_CACHE = (() => {
    const cache = new Array(GRID_W * GRID_H);
    for (let gy = 0; gy < GRID_H; gy++) {
        for (let gx = 0; gx < GRID_W; gx++) {
            const px = ((gx + 0.5) / GRID_W) * ROOM_W;
            const py = ((gy + 0.5) / GRID_H) * ROOM_H;
            cache[gy * GRID_W + gx] = SOURCES.map((src, si) => {
                let f = 1.0;
                for (let oi = 0; oi < OBSTACLES.length; oi++) {
                    if (src.obsIdx === oi) continue; // don't self-block
                    if (lineBlockedBy(src.x, src.y, px, py, OBSTACLES[oi])) {
                        f *= (1 - OBSTACLES[oi].atten);
                    }
                }
                return f;
            });
        }
    }
    return cache;
})();

// ── Heatmap ────────────────────────────────────────────────────────────────
function computeHeatmap(tPhase) {
    const map = new Float32Array(GRID_W * GRID_H);
    for (let i = 0; i < GRID_W * GRID_H; i++) {
        const D = DIST_CACHE[i], S = SHADOW_CACHE[i];
        let sig = 0;
        for (let s = 0; s < SOURCES.length; s++) {
            sig += SOURCES[s].amp * S[s] * Math.exp(-D[s] * ATTN) * Math.cos(TWO_PI_L * D[s] - tPhase);
        }
        map[i] = sig;
    }
    return map;
}

// ── Pre-compute bounce ray paths (once) ────────────────────────────────────
// Each entry: { incoming: {x1,y1,x2,y2}, reflected: {x2,y2,x3,y3}, obsIdx }
function buildBounceRays() {
    const rx = ROUTER_X * ROOM_W, ry = ROUTER_Y * ROOM_H;
    const rays = [];

    OBSTACLES.forEach((obs, i) => {
        const cx = obs.x + obs.w / 2, cy = obs.y + obs.h / 2;
        const dx = cx - rx, dy = cy - ry;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const ndx = dx / len, ndy = dy / len;

        // Find entry hit point on obstacle surface
        const tHit = rayHitObstacle(rx, ry, ndx, ndy, obs);
        if (tHit < 0) return;

        const hx = rx + ndx * tHit, hy = ry + ndy * tHit;

        // Determine face normal at hit point
        const eps = 0.05;
        let normX = 0, normY = 0;
        if      (Math.abs(hx - obs.x)            < eps) { normX = -1; }
        else if (Math.abs(hx - (obs.x + obs.w))  < eps) { normX = 1;  }
        else if (Math.abs(hy - obs.y)            < eps) { normY = -1; }
        else                                             { normY = 1;  }

        // Reflected direction
        const dot  = ndx * normX + ndy * normY;
        const refX = ndx - 2 * dot * normX;
        const refY = ndy - 2 * dot * normY;

        // Extend reflected ray 4 m, clip to room
        const maxT  = 4.0;
        let endT = maxT;
        // Clip to room walls
        if (refX < -1e-9) endT = Math.min(endT, (0 - hx) / refX);
        if (refX >  1e-9) endT = Math.min(endT, (ROOM_W - hx) / refX);
        if (refY < -1e-9) endT = Math.min(endT, (0 - hy) / refY);
        if (refY >  1e-9) endT = Math.min(endT, (ROOM_H - hy) / refY);

        const ex = hx + refX * endT, ey = hy + refY * endT;

        rays.push({ x1: rx, y1: ry, x2: hx, y2: hy, x3: ex, y3: ey, obsIdx: i, len1: tHit, len2: endT });
    });
    return rays;
}
const BOUNCE_RAYS = buildBounceRays();

// ── Type colours ───────────────────────────────────────────────────────────
const TYPE_RGB = {
    bird: [56, 189, 248], rabbit: [167, 139, 250], animal: [251, 191, 36],
    adolescent: [251, 146, 60], adult: [248, 113, 113],
};

// ─────────────────────────────────────────────────────────────────────────
const FloorPlanCanvas = ({ isScanning, detectionRef, detectionHistory = [], isDark }) => {
    const canvasRef = useRef(null);
    const animRef   = useRef(null);
    const tRef      = useRef(0);
    const detHistRef = useRef(detectionHistory);
    const isDarkRef  = useRef(isDark);
    const isScanRef  = useRef(isScanning);

    useEffect(() => { detHistRef.current = detectionHistory; }, [detectionHistory]);
    useEffect(() => { isDarkRef.current  = isDark; },           [isDark]);
    useEffect(() => { isScanRef.current  = isScanning; },       [isScanning]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        resize();

        // ── helpers inside draw loop ─────────────────────────────────────
        const toX = (mx, mg, dW) => mg.left + (mx / ROOM_W) * dW;
        const toY = (my, mg, dH) => mg.top  + (my / ROOM_H) * dH;

        const draw = () => {
            const W = canvas.width, H = canvas.height;
            const dark = isDarkRef.current, scan = isScanRef.current;
            if (W === 0 || H === 0) { animRef.current = requestAnimationFrame(draw); return; }

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = dark ? '#070b14' : '#f0f4f8';
            ctx.fillRect(0, 0, W, H);

            const mg = { top: 24, right: 16, bottom: 36, left: 32 };
            const dW = W - mg.left - mg.right;
            const dH = H - mg.top - mg.bottom;

            // ── Idle ──────────────────────────────────────────────────
            if (!scan) {
                ctx.fillStyle = dark ? 'rgba(100,116,139,0.3)' : 'rgba(100,116,139,0.4)';
                ctx.font = 'bold 12px "JetBrains Mono",monospace';
                ctx.textAlign = 'center';
                ctx.fillText('PLANO INACTIVO', W / 2, H / 2 - 8);
                ctx.font = '8px "JetBrains Mono",monospace';
                ctx.fillText('Inicia el escaneo para ver las ondas', W / 2, H / 2 + 8);
                animRef.current = requestAnimationFrame(draw);
                return;
            }

            tRef.current += 0.011;
            const t = tRef.current;

            // ── Heatmap ───────────────────────────────────────────────
            const map = computeHeatmap(t);
            let minV = Infinity, maxV = -Infinity;
            for (let i = 0; i < map.length; i++) { if (map[i] < minV) minV = map[i]; if (map[i] > maxV) maxV = map[i]; }
            const range = maxV - minV || 1;
            const cW = dW / GRID_W, cH = dH / GRID_H;

            for (let gy = 0; gy < GRID_H; gy++) {
                for (let gx = 0; gx < GRID_W; gx++) {
                    const v = (map[gy * GRID_W + gx] - minV) / range;
                    let r, g, b, a;
                    if (dark) {
                        if (v < 0.18) {
                            const k = v / 0.18;
                            r = 7; g = 11; b = Math.floor(20 + k * 30); a = 0.1 + k * 0.25;
                        } else if (v < 0.45) {
                            const k = (v - 0.18) / 0.27;
                            r = 7; g = Math.floor(11 + k * 80); b = Math.floor(50 + k * 100); a = 0.35 + k * 0.35;
                        } else if (v < 0.72) {
                            const k = (v - 0.45) / 0.27;
                            r = Math.floor(0  + k * 14); g = Math.floor(91  + k * 150); b = Math.floor(150 + k * 80); a = 0.70 + k * 0.20;
                        } else {
                            const k = (v - 0.72) / 0.28;
                            r = Math.floor(14  + k * 235); g = Math.floor(241 + k * 14); b = Math.floor(230 + k * 25); a = 0.90 + k * 0.10;
                        }
                    } else {
                        if (v < 0.25) {
                            const k = v / 0.25;
                            r = 226; g = 232; b = 240; a = 0.08 + k * 0.22;
                        } else if (v < 0.55) {
                            const k = (v - 0.25) / 0.30;
                            r = Math.floor(186 - k * 70); g = Math.floor(230 - k * 50); b = 240; a = 0.30 + k * 0.30;
                        } else if (v < 0.80) {
                            const k = (v - 0.55) / 0.25;
                            r = Math.floor(116 - k * 50); g = Math.floor(180 - k * 60); b = Math.floor(240 - k * 80); a = 0.60 + k * 0.25;
                        } else {
                            const k = (v - 0.80) / 0.20;
                            r = Math.floor(66  - k * 30); g = Math.floor(120 - k * 40); b = Math.floor(160 - k * 60); a = 0.85 + k * 0.15;
                        }
                    }
                    ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
                    ctx.fillRect(mg.left + gx * cW, mg.top + gy * cH, Math.ceil(cW) + 1, Math.ceil(cH) + 1);
                }
            }

            // ── Draw obstacles ────────────────────────────────────────
            OBSTACLES.forEach((obs, i) => {
                const ox = toX(obs.x, mg, dW), oy = toY(obs.y, mg, dH);
                const ow = (obs.w / ROOM_W) * dW, oh = (obs.h / ROOM_H) * dH;
                const [fr, fg, fb] = obs.fill;
                const [sr, sg, sb] = obs.stroke;
                const [lr, lg, lb] = obs.lc;

                // Shadow gradient behind obstacle (signal dead zone)
                const cx = obs.x + obs.w / 2, cy = obs.y + obs.h / 2;
                const rx0 = ROUTER_X * ROOM_W, ry0 = ROUTER_Y * ROOM_H;
                const sx = toX(rx0, mg, dW), sy = toY(ry0, mg, dH);
                const shadowDx = (ox + ow / 2) - sx, shadowDy = (oy + oh / 2) - sy;
                const shadowLen = Math.sqrt(shadowDx * shadowDx + shadowDy * shadowDy) || 1;
                const shadowNx = shadowDx / shadowLen, shadowNy = shadowDy / shadowLen;
                const shadowDist = Math.max(ow, oh) * 2.5;
                const sgX2 = ox + ow / 2 + shadowNx * shadowDist;
                const sgY2 = oy + oh / 2 + shadowNy * shadowDist;
                const shadowGrad = ctx.createLinearGradient(ox + ow / 2, oy + oh / 2, sgX2, sgY2);
                const sa = dark ? obs.atten * 0.55 : obs.atten * 0.25;
                shadowGrad.addColorStop(0, `rgba(0,0,0,${sa})`);
                shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = shadowGrad;
                ctx.fillRect(ox, oy, (sgX2 - ox) * 1.5, (sgY2 - oy) * 1.5);

                // Obstacle body
                ctx.fillStyle = dark
                    ? `rgba(${fr},${fg},${fb},0.90)`
                    : `rgba(${Math.min(255, fr + 80)},${Math.min(255, fg + 80)},${Math.min(255, fb + 80)},0.80)`;
                ctx.fillRect(ox, oy, ow, oh);

                // Border
                ctx.strokeStyle = dark
                    ? `rgba(${sr},${sg},${sb},0.9)`
                    : `rgba(${sr},${sg},${sb},0.7)`;
                ctx.lineWidth = 1.5;
                ctx.strokeRect(ox, oy, ow, oh);

                // Label (only if wide enough)
                if (ow > 18 || oh > 18) {
                    ctx.fillStyle = `rgba(${lr},${lg},${lb},0.9)`;
                    ctx.font = `bold ${Math.min(8, Math.max(5, Math.min(ow, oh) * 0.35))}px "JetBrains Mono",monospace`;
                    ctx.textAlign = 'center';
                    ctx.fillText(obs.label, ox + ow / 2, oy + oh / 2 + 3);
                }

                // Attenuation indicator — small dB badge
                const pct = Math.round(obs.atten * 100);
                ctx.fillStyle = dark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)';
                ctx.fillRect(ox, oy - 10, ow, 9);
                ctx.fillStyle = `rgba(${lr},${lg},${lb},0.9)`;
                ctx.font = '5px "JetBrains Mono",monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`-${pct}%`, ox + ow / 2, oy - 3);
            });

            // ── Animated bounce rays ──────────────────────────────────
            BOUNCE_RAYS.forEach((ray, i) => {
                const obs   = OBSTACLES[ray.obsIdx];
                const [lr, lg, lb] = obs.lc;
                const alpha = obs.R * 0.6;

                const x1 = toX(ray.x1, mg, dW), y1 = toY(ray.y1, mg, dH);
                const x2 = toX(ray.x2, mg, dW), y2 = toY(ray.y2, mg, dH);
                const x3 = toX(ray.x3, mg, dW), y3 = toY(ray.y3, mg, dH);

                // Incoming dashed ray
                ctx.strokeStyle = `rgba(${lr},${lg},${lb},${alpha * 0.30})`;
                ctx.lineWidth   = 0.8;
                ctx.setLineDash([3, 5]);
                ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

                // Reflected dashed ray (dimmer)
                ctx.strokeStyle = `rgba(${lr},${lg},${lb},${alpha * 0.18})`;
                ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x3, y3); ctx.stroke();
                ctx.setLineDash([]);

                // Traveling pulse along incoming ray
                const tp = (t * 0.9 + i * 0.25) % 1;
                const px1 = x1 + tp * (x2 - x1), py1 = y1 + tp * (y2 - y1);
                const pa1 = Math.sin(tp * Math.PI) * alpha;
                if (pa1 > 0.02) {
                    const grd = ctx.createRadialGradient(px1, py1, 0, px1, py1, 4);
                    grd.addColorStop(0, `rgba(${lr},${lg},${lb},${pa1})`);
                    grd.addColorStop(1, `rgba(${lr},${lg},${lb},0)`);
                    ctx.fillStyle = grd;
                    ctx.beginPath(); ctx.arc(px1, py1, 4, 0, Math.PI * 2); ctx.fill();
                }

                // Traveling pulse along reflected ray
                const tp2 = (t * 0.9 + i * 0.25 + 0.5) % 1;
                const px2 = x2 + tp2 * (x3 - x2), py2 = y2 + tp2 * (y3 - y2);
                const pa2 = Math.sin(tp2 * Math.PI) * alpha * 0.55;
                if (pa2 > 0.02) {
                    const grd2 = ctx.createRadialGradient(px2, py2, 0, px2, py2, 3);
                    grd2.addColorStop(0, `rgba(${lr},${lg},${lb},${pa2})`);
                    grd2.addColorStop(1, `rgba(${lr},${lg},${lb},0)`);
                    ctx.fillStyle = grd2;
                    ctx.beginPath(); ctx.arc(px2, py2, 3, 0, Math.PI * 2); ctx.fill();
                }

                // Impact flash at obstacle surface
                const flashA = Math.max(0, 1 - Math.abs(tp - 1) * 10) * alpha * 0.7;
                if (flashA > 0.01) {
                    const grdF = ctx.createRadialGradient(x2, y2, 0, x2, y2, 7);
                    grdF.addColorStop(0, `rgba(${lr},${lg},${lb},${flashA})`);
                    grdF.addColorStop(1, `rgba(${lr},${lg},${lb},0)`);
                    ctx.fillStyle = grdF;
                    ctx.beginPath(); ctx.arc(x2, y2, 7, 0, Math.PI * 2); ctx.fill();
                }
            });

            // ── Room outline ──────────────────────────────────────────
            ctx.strokeStyle = dark ? 'rgba(6,182,212,0.6)' : 'rgba(8,145,178,0.6)';
            ctx.lineWidth = 2;
            ctx.strokeRect(mg.left, mg.top, dW, dH);

            // Door (bottom-left)
            const doorW = dW * 0.07;
            ctx.clearRect(mg.left + 1, mg.top + dH - 1, doorW - 1, 2);
            ctx.strokeStyle = dark ? 'rgba(6,182,212,0.9)' : 'rgba(8,145,178,0.9)';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(mg.left, mg.top + dH); ctx.lineTo(mg.left + doorW, mg.top + dH); ctx.stroke();
            ctx.strokeStyle = dark ? 'rgba(6,182,212,0.22)' : 'rgba(8,145,178,0.22)';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.beginPath(); ctx.arc(mg.left, mg.top + dH, doorW, -Math.PI / 2, 0); ctx.stroke();
            ctx.setLineDash([]);

            // Dimension labels
            ctx.fillStyle = dark ? 'rgba(100,116,139,0.65)' : 'rgba(100,116,139,0.8)';
            ctx.font = 'bold 8px "JetBrains Mono",monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${ROOM_W}m`, mg.left + dW / 2, H - 10);
            ctx.save();
            ctx.translate(10, mg.top + dH / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(`${ROOM_H}m`, 0, 0);
            ctx.restore();

            // ── Router ────────────────────────────────────────────────
            const rX = toX(ROUTER_X * ROOM_W, mg, dW);
            const rY = toY(ROUTER_Y * ROOM_H, mg, dH);

            for (let ri = 0; ri < 4; ri++) {
                const phase = (t * 0.65 + ri / 4) % 1;
                const rr = 5 + phase * 36;
                const ra = (1 - phase) * 0.35;
                ctx.strokeStyle = dark ? `rgba(6,182,212,${ra})` : `rgba(8,145,178,${ra})`;
                ctx.lineWidth = 1.2;
                ctx.beginPath(); ctx.arc(rX, rY, rr, 0, Math.PI * 2); ctx.stroke();
            }
            ctx.fillStyle = dark ? '#22d3ee' : '#0891b2';
            ctx.beginPath(); ctx.arc(rX, rY, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(rX, rY, 2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = dark ? 'rgba(6,182,212,0.9)' : 'rgba(8,145,178,0.9)';
            ctx.font = 'bold 7px "JetBrains Mono",monospace';
            ctx.textAlign = 'left';
            ctx.fillText('ROUTER', rX + 8, rY - 4);

            // ── Detection markers ─────────────────────────────────────
            const pulse = 0.5 + 0.5 * Math.sin(t * 3);
            const dets  = detHistRef.current.slice(0, 6);
            dets.forEach((det, i) => {
                if (det.x == null || det.y == null) return;
                const mx = mg.left + det.x * dW, my = mg.top + det.y * dH;
                const [cr, cg, cb] = TYPE_RGB[det.type] || TYPE_RGB.adult;
                const alpha = 1 - i / 7;
                if (i === 0) {
                    ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha * 0.5})`;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.arc(mx, my, 10 + pulse * 5, 0, Math.PI * 2); ctx.stroke();
                }
                ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
                ctx.beginPath(); ctx.arc(mx, my, i === 0 ? 5 : 3, 0, Math.PI * 2); ctx.fill();
                if (i === 0) {
                    ctx.fillStyle = `rgba(${cr},${cg},${cb},0.9)`;
                    ctx.font = 'bold 7px "JetBrains Mono",monospace';
                    ctx.textAlign = 'left';
                    ctx.fillText(det.label, mx + 8, my - 2);
                    ctx.fillStyle = dark ? 'rgba(100,116,139,0.7)' : 'rgba(71,85,105,0.7)';
                    ctx.font = '6px "JetBrains Mono",monospace';
                    ctx.fillText(`${det.distanceM}m del router`, mx + 8, my + 7);
                }
            });

            // ── Live reticle ──────────────────────────────────────────
            const live = detectionRef?.current;
            if (live && live.x != null) {
                const mx = mg.left + live.x * dW, my = mg.top + live.y * dH;
                const [cr, cg, cb] = TYPE_RGB[live.type] || TYPE_RGB.adult;
                const la = live.alpha ?? 1;
                const sz = 9, bOff = 7, bs = 5;
                ctx.strokeStyle = `rgba(${cr},${cg},${cb},${la * 0.85})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(mx - sz, my); ctx.lineTo(mx + sz, my);
                ctx.moveTo(mx, my - sz); ctx.lineTo(mx, my + sz);
                ctx.stroke();
                ctx.strokeStyle = `rgba(${cr},${cg},${cb},${la})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(mx - bOff, my - bOff + bs); ctx.lineTo(mx - bOff, my - bOff); ctx.lineTo(mx - bOff + bs, my - bOff);
                ctx.moveTo(mx + bOff - bs, my - bOff); ctx.lineTo(mx + bOff, my - bOff); ctx.lineTo(mx + bOff, my - bOff + bs);
                ctx.moveTo(mx + bOff, my + bOff - bs); ctx.lineTo(mx + bOff, my + bOff); ctx.lineTo(mx + bOff - bs, my + bOff);
                ctx.moveTo(mx - bOff + bs, my + bOff); ctx.lineTo(mx - bOff, my + bOff); ctx.lineTo(mx - bOff, my + bOff - bs);
                ctx.stroke();
            }

            // ── Scale bar ─────────────────────────────────────────────
            const mPx = dW / ROOM_W, sbLen = mPx * 2;
            const sbX = W - mg.right - sbLen, sbY = H - mg.bottom + 14;
            ctx.strokeStyle = dark ? 'rgba(6,182,212,0.45)' : 'rgba(8,145,178,0.5)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(sbX, sbY); ctx.lineTo(sbX + sbLen, sbY);
            ctx.moveTo(sbX, sbY - 3); ctx.lineTo(sbX, sbY + 3);
            ctx.moveTo(sbX + sbLen, sbY - 3); ctx.lineTo(sbX + sbLen, sbY + 3);
            ctx.stroke();
            ctx.fillStyle = dark ? 'rgba(100,116,139,0.55)' : 'rgba(100,116,139,0.7)';
            ctx.font = '6px "JetBrains Mono",monospace';
            ctx.textAlign = 'center';
            ctx.fillText('2 m', sbX + sbLen / 2, sbY + 9);

            // ── Signal legend (bottom-left) ───────────────────────────
            const legX = mg.left, legY = H - mg.bottom + 10;
            const legW = 60, legH = 5;
            const legGrad = ctx.createLinearGradient(legX, legY, legX + legW, legY);
            if (dark) {
                legGrad.addColorStop(0,   'rgba(7,11,20,0.9)');
                legGrad.addColorStop(0.4, 'rgba(7,100,150,0.9)');
                legGrad.addColorStop(0.75,'rgba(13,223,212,0.9)');
                legGrad.addColorStop(1,   'rgba(255,255,255,0.9)');
            } else {
                legGrad.addColorStop(0,   'rgba(220,232,240,0.9)');
                legGrad.addColorStop(0.5, 'rgba(100,180,240,0.9)');
                legGrad.addColorStop(1,   'rgba(30,80,120,0.9)');
            }
            ctx.fillStyle = legGrad;
            ctx.fillRect(legX, legY, legW, legH);
            ctx.fillStyle = dark ? 'rgba(100,116,139,0.55)' : 'rgba(100,116,139,0.7)';
            ctx.font = '5px "JetBrains Mono",monospace';
            ctx.textAlign = 'left';
            ctx.fillText('Débil', legX, legY + legH + 7);
            ctx.textAlign = 'right';
            ctx.fillText('Fuerte', legX + legW, legY + legH + 7);

            // ── Live tag ──────────────────────────────────────────────
            ctx.fillStyle = dark ? 'rgba(6,182,212,0.55)' : 'rgba(8,145,178,0.65)';
            ctx.font = 'bold 7px "JetBrains Mono",monospace';
            ctx.textAlign = 'right';
            ctx.fillText('PLANO WiFi · EN VIVO', W - mg.right, mg.top - 6);

            animRef.current = requestAnimationFrame(draw);
        };

        animRef.current = requestAnimationFrame(draw);
        return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
    }, []);

    return <canvas ref={canvasRef} className="w-full h-full" style={{ display: 'block' }} />;
};

export default FloorPlanCanvas;
