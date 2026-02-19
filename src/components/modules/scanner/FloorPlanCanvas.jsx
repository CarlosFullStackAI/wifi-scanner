import React, { useRef, useEffect } from 'react';

// ── Room & wave constants ──────────────────────────────────────────────────
const ROOM_W   = 10;
const ROOM_H   = 8;
const RX       = 0.30;   // router normalised X
const RY       = 0.50;   // router normalised Y
const LAMBDA   = 0.122;
const ATTN     = 0.14;
const R_WALL   = 0.68;
const TPL      = (2 * Math.PI) / LAMBDA;
const GRID_W   = 80;
const GRID_H   = 62;

// ── Interior obstacles ─────────────────────────────────────────────────────
const OBSTACLES = [
    { x: 4.0, y: 0.0, w: 0.25, h: 3.4, R: 0.58, atten: 0.80, label: 'Tabique',  fill:[20,28,48],  glow:[0,200,160],  echo:[0,230,180]  },
    { x: 7.1, y: 0.4, w: 0.75, h: 1.9, R: 0.42, atten: 0.52, label: 'Armario',  fill:[35,18, 8],  glow:[180,100,30], echo:[255,160,40]  },
    { x: 1.4, y: 5.4, w: 2.30, h: 0.9, R: 0.28, atten: 0.40, label: 'Sofá',     fill:[22,16,48],  glow:[120,80,240], echo:[180,120,255] },
    { x: 8.5, y: 3.6, w: 0.55, h: 0.7, R: 0.65, atten: 0.74, label: 'Nevera',   fill:[10,20,35],  glow:[60,180,220], echo:[80,220,255]  },
    { x: 5.2, y: 6.0, w: 1.80, h: 0.5, R: 0.30, atten: 0.35, label: 'Mesa',     fill:[30,20,10],  glow:[200,140,60], echo:[255,200,80]  },
];

// ── Slab ray-AABB intersection ─────────────────────────────────────────────
function rayHitT(ox, oy, dx, dy, obs) {
    let tMin = 0.001, tMax = Infinity;
    const ax = obs.x, bx = obs.x + obs.w, ay = obs.y, by = obs.y + obs.h;
    if (Math.abs(dx) < 1e-9) { if (ox < ax || ox > bx) return -1; }
    else { const t1=(ax-ox)/dx, t2=(bx-ox)/dx; tMin=Math.max(tMin,Math.min(t1,t2)); tMax=Math.min(tMax,Math.max(t1,t2)); if(tMin>tMax) return -1; }
    if (Math.abs(dy) < 1e-9) { if (oy < ay || oy > by) return -1; }
    else { const t1=(ay-oy)/dy, t2=(by-oy)/dy; tMin=Math.max(tMin,Math.min(t1,t2)); tMax=Math.min(tMax,Math.max(t1,t2)); }
    return tMin <= tMax ? tMin : -1;
}

function lineBlocked(x1,y1,x2,y2,obs) {
    return rayHitT(x1,y1,x2-x1,y2-y1,obs) >= 0 && rayHitT(x1,y1,x2-x1,y2-y1,obs) <= 1;
}

// ── Build wave sources: 9 wall mirrors + 5 obstacle mirrors ───────────────
function buildSources() {
    const rx = RX*ROOM_W, ry = RY*ROOM_H, R2 = R_WALL*R_WALL;
    const s = [
        {x:rx,               y:ry,               amp:1.0,    oi:-1},
        {x:-rx,              y:ry,               amp:R_WALL,  oi:-1},
        {x:2*ROOM_W-rx,      y:ry,               amp:R_WALL,  oi:-1},
        {x:rx,               y:-ry,              amp:R_WALL,  oi:-1},
        {x:rx,               y:2*ROOM_H-ry,      amp:R_WALL,  oi:-1},
        {x:-rx,              y:-ry,              amp:R2,      oi:-1},
        {x:2*ROOM_W-rx,      y:-ry,              amp:R2,      oi:-1},
        {x:-rx,              y:2*ROOM_H-ry,      amp:R2,      oi:-1},
        {x:2*ROOM_W-rx,      y:2*ROOM_H-ry,      amp:R2,      oi:-1},
    ];
    OBSTACLES.forEach((obs,i) => {
        const cx=obs.x+obs.w/2, cy=obs.y+obs.h/2;
        const dx=rx-cx, dy=ry-cy;
        const nx=Math.abs(dx)/(obs.w/2), ny=Math.abs(dy)/(obs.h/2);
        let mx=rx, my=ry;
        if (nx>ny) { const fx=dx>0?obs.x:obs.x+obs.w; mx=2*fx-rx; }
        else       { const fy=dy>0?obs.y:obs.y+obs.h; my=2*fy-ry; }
        s.push({x:mx, y:my, amp:obs.R, oi:i});
    });
    return s;
}
const SOURCES = buildSources();

// ── Static caches (computed once at module load) ───────────────────────────
const DIST_CACHE = (() => {
    const c = new Array(GRID_W*GRID_H);
    for (let gy=0; gy<GRID_H; gy++) for (let gx=0; gx<GRID_W; gx++) {
        const px=((gx+.5)/GRID_W)*ROOM_W, py=((gy+.5)/GRID_H)*ROOM_H;
        c[gy*GRID_W+gx]=SOURCES.map(s=>{const dx=px-s.x,dy=py-s.y;return Math.sqrt(dx*dx+dy*dy);});
    }
    return c;
})();

const SHADOW_CACHE = (() => {
    const c = new Array(GRID_W*GRID_H);
    for (let gy=0; gy<GRID_H; gy++) for (let gx=0; gx<GRID_W; gx++) {
        const px=((gx+.5)/GRID_W)*ROOM_W, py=((gy+.5)/GRID_H)*ROOM_H;
        c[gy*GRID_W+gx]=SOURCES.map((src,si)=>{
            let f=1;
            for (let oi=0;oi<OBSTACLES.length;oi++) {
                if (src.oi===oi) continue;
                if (lineBlocked(src.x,src.y,px,py,OBSTACLES[oi])) f*=(1-OBSTACLES[oi].atten);
            }
            return f;
        });
    }
    return c;
})();

// ── Per-cell heatmap ───────────────────────────────────────────────────────
function computeHeatmap(tPhase) {
    const map = new Float32Array(GRID_W*GRID_H);
    for (let i=0; i<GRID_W*GRID_H; i++) {
        const D=DIST_CACHE[i], S=SHADOW_CACHE[i]; let sig=0;
        for (let s=0;s<SOURCES.length;s++) sig+=SOURCES[s].amp*S[s]*Math.exp(-D[s]*ATTN)*Math.cos(TPL*D[s]-tPhase);
        map[i]=sig;
    }
    return map;
}

// ── Bounce ray geometry (pre-computed) ────────────────────────────────────
const BOUNCE_RAYS = (() => {
    const rx=RX*ROOM_W, ry=RY*ROOM_H, rays=[];
    OBSTACLES.forEach((obs,i)=>{
        const cx=obs.x+obs.w/2, cy=obs.y+obs.h/2;
        const dx=cx-rx, dy=cy-ry, len=Math.sqrt(dx*dx+dy*dy)||1;
        const nx=dx/len, ny=dy/len;
        const t=rayHitT(rx,ry,nx,ny,obs); if(t<0) return;
        const hx=rx+nx*t, hy=ry+ny*t;
        const eps=0.04;
        let normX=0, normY=0;
        if      (Math.abs(hx-obs.x)<eps)           normX=-1;
        else if (Math.abs(hx-(obs.x+obs.w))<eps)   normX=1;
        else if (Math.abs(hy-obs.y)<eps)            normY=-1;
        else                                         normY=1;
        const dot=nx*normX+ny*normY;
        const rx2=nx-2*dot*normX, ry2=ny-2*dot*normY;
        let eT=5;
        if(rx2<-1e-9) eT=Math.min(eT,(0-hx)/rx2);
        if(rx2>1e-9)  eT=Math.min(eT,(ROOM_W-hx)/rx2);
        if(ry2<-1e-9) eT=Math.min(eT,(0-hy)/ry2);
        if(ry2>1e-9)  eT=Math.min(eT,(ROOM_H-hy)/ry2);
        rays.push({x1:rx,y1:ry,x2:hx,y2:hy,x3:hx+rx2*eT,y3:hy+ry2*eT,obsAngle:Math.atan2(cy-ry,cx-rx),i});
    });
    return rays;
})();

// ── Type colours ───────────────────────────────────────────────────────────
const TYPE_RGB={bird:[56,189,248],rabbit:[167,139,250],animal:[251,191,36],adolescent:[251,146,60],adult:[248,113,113]};

// ── Map signal value [0-1] to RGBA ────────────────────────────────────────
function sigColor(v, dark) {
    if (dark) {
        if (v<0.10) return [0,   2,   8,   Math.floor((0.05+v*0.4)*255)];
        if (v<0.28) { const k=(v-0.10)/0.18; return [0, Math.floor(k*40),   Math.floor(8+k*60),  Math.floor((0.1+k*0.35)*255)]; }
        if (v<0.50) { const k=(v-0.28)/0.22; return [0, Math.floor(40+k*120),Math.floor(68+k*110),Math.floor((0.45+k*0.25)*255)]; }
        if (v<0.72) { const k=(v-0.50)/0.22; return [Math.floor(k*20),Math.floor(160+k*95),Math.floor(178+k*60),Math.floor((0.70+k*0.20)*255)]; }
        { const k=(v-0.72)/0.28; return [Math.floor(20+k*235),Math.floor(255-k*10),Math.floor(238-k*20),Math.floor((0.90+k*0.10)*255)]; }
    } else {
        if (v<0.15) return [230,240,248,Math.floor((0.05+v*0.5)*255)];
        if (v<0.40) { const k=(v-0.15)/0.25; return [Math.floor(230-k*60),Math.floor(240-k*50),248,Math.floor((0.15+k*0.35)*255)]; }
        if (v<0.68) { const k=(v-0.40)/0.28; return [Math.floor(170-k*100),Math.floor(190-k*80),Math.floor(248-k*100),Math.floor((0.50+k*0.30)*255)]; }
        { const k=(v-0.68)/0.32; return [Math.floor(70-k*50),Math.floor(110-k*80),Math.floor(148-k*100),Math.floor((0.80+k*0.20)*255)]; }
    }
}

// ─────────────────────────────────────────────────────────────────────────
const FloorPlanCanvas = ({ isScanning, detectionRef, detectionHistory=[], isDark }) => {
    const canvasRef  = useRef(null);
    const animRef    = useRef(null);
    const tRef       = useRef(0);
    const detHistRef = useRef(detectionHistory);
    const isDarkRef  = useRef(isDark);
    const isScanRef  = useRef(isScanning);

    useEffect(()=>{ detHistRef.current=detectionHistory; },[detectionHistory]);
    useEffect(()=>{ isDarkRef.current=isDark; },           [isDark]);
    useEffect(()=>{ isScanRef.current=isScanning; },       [isScanning]);

    useEffect(()=>{
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // ── Off-screen canvases (created once) ───────────────────────
        const hmCanvas = document.createElement('canvas');
        hmCanvas.width=GRID_W; hmCanvas.height=GRID_H;
        const hmCtx = hmCanvas.getContext('2d');
        const hmImgData = hmCtx.createImageData(GRID_W, GRID_H);

        let pCanvas = document.createElement('canvas');
        let pCtx    = pCanvas.getContext('2d');

        // ── Local mutable state ───────────────────────────────────────
        let scanAngle = 0, prevScan = 0;
        const echoes  = []; // {x,y,t0,color}
        const pings   = []; // {t0} expanding sonar pings

        const resize = () => {
            canvas.width  = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            pCanvas.width  = canvas.width;
            pCanvas.height = canvas.height;
            pCtx = pCanvas.getContext('2d');
            // Fresh persistence canvas on resize
            pCtx.fillStyle = '#000408';
            pCtx.fillRect(0, 0, canvas.width, canvas.height);
        };
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        resize();

        // ── Coordinate helpers ────────────────────────────────────────
        const toX = (mx,mg,dW) => mg.left + (mx/ROOM_W)*dW;
        const toY = (my,mg,dH) => mg.top  + (my/ROOM_H)*dH;

        // Ray-wall clip: returns canvas endpoint of scan line
        const scanEndCanvas = (angle, mg, dW, dH) => {
            const rx=RX*ROOM_W, ry=RY*ROOM_H;
            const dx=Math.cos(angle), dy=Math.sin(angle);
            let maxT=30;
            if(dx<-1e-9) maxT=Math.min(maxT,(0-rx)/dx);
            if(dx>1e-9)  maxT=Math.min(maxT,(ROOM_W-rx)/dx);
            if(dy<-1e-9) maxT=Math.min(maxT,(0-ry)/dy);
            if(dy>1e-9)  maxT=Math.min(maxT,(ROOM_H-ry)/dy);
            return {x:toX(rx+dx*maxT,mg,dW), y:toY(ry+dy*maxT,mg,dH)};
        };

        // ── Main draw loop ─────────────────────────────────────────────
        const draw = () => {
            const W=canvas.width, H=canvas.height;
            const dark=isDarkRef.current, scan=isScanRef.current;
            if (W===0||H===0){ animRef.current=requestAnimationFrame(draw); return; }

            // Background
            ctx.fillStyle = dark ? '#000810' : '#dde8f0';
            ctx.fillRect(0,0,W,H);

            const mg={top:28,right:18,bottom:40,left:36};
            const dW=W-mg.left-mg.right, dH=H-mg.top-mg.bottom;

            // ── Idle screen ───────────────────────────────────────────
            if (!scan) {
                // Grid lines only
                ctx.strokeStyle = dark ? 'rgba(0,200,160,0.04)' : 'rgba(0,100,120,0.07)';
                ctx.lineWidth=1;
                for(let i=0;i<=8;i++){ const x=mg.left+i*dW/8; ctx.beginPath();ctx.moveTo(x,mg.top);ctx.lineTo(x,mg.top+dH);ctx.stroke(); }
                for(let i=0;i<=6;i++){ const y=mg.top+i*dH/6;   ctx.beginPath();ctx.moveTo(mg.left,y);ctx.lineTo(mg.left+dW,y);ctx.stroke(); }
                ctx.strokeStyle = dark ? 'rgba(0,200,160,0.35)' : 'rgba(0,100,120,0.4)';
                ctx.lineWidth=2; ctx.strokeRect(mg.left,mg.top,dW,dH);
                ctx.fillStyle = dark ? 'rgba(0,200,160,0.25)' : 'rgba(0,100,120,0.3)';
                ctx.font='bold 13px "JetBrains Mono",monospace'; ctx.textAlign='center';
                ctx.fillText('SONAR INACTIVO',W/2,H/2-10);
                ctx.font='8px "JetBrains Mono",monospace';
                ctx.fillText('Inicia el escaneo para activar el sonar',W/2,H/2+8);
                animRef.current=requestAnimationFrame(draw); return;
            }

            tRef.current += 0.011;
            const t = tRef.current;

            // ── Update scan angle ─────────────────────────────────────
            prevScan  = scanAngle;
            scanAngle = (t * 0.85) % (2*Math.PI);

            // ── Trigger echoes when scan arm crosses obstacle ─────────
            BOUNCE_RAYS.forEach(ray => {
                const da  = ((scanAngle - ray.obsAngle + Math.PI*3) % (Math.PI*2)) - Math.PI;
                const dap = ((prevScan  - ray.obsAngle + Math.PI*3) % (Math.PI*2)) - Math.PI;
                if (da >= 0 && dap < 0) {
                    echoes.push({ x:ray.x2, y:ray.y2, t0:t, color:OBSTACLES[ray.i].echo });
                }
            });

            // ── Emit sonar ping every ~3 s ────────────────────────────
            if (pings.length===0 || t - pings[pings.length-1].t0 > 3.2) pings.push({t0:t});
            while (pings.length>0 && t-pings[0].t0 > 5) pings.shift();

            // ── Heatmap → ImageData → scaled onto canvas ──────────────
            const map=computeHeatmap(t);
            let mn=Infinity, mx2=-Infinity;
            for(let i=0;i<map.length;i++){if(map[i]<mn)mn=map[i];if(map[i]>mx2)mx2=map[i];}
            const rng=mx2-mn||1;

            for(let i=0;i<GRID_W*GRID_H;i++){
                const v=(map[i]-mn)/rng;
                const [r,g,b,a]=sigColor(v,dark);
                hmImgData.data[i*4]=r; hmImgData.data[i*4+1]=g;
                hmImgData.data[i*4+2]=b; hmImgData.data[i*4+3]=a;
            }
            hmCtx.putImageData(hmImgData,0,0);
            ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
            ctx.drawImage(hmCanvas, mg.left, mg.top, dW, dH);

            // ── Dead-zone shadows behind obstacles ────────────────────
            OBSTACLES.forEach(obs=>{
                const rx0=RX*ROOM_W, ry0=RY*ROOM_H;
                const cx=obs.x+obs.w/2, cy=obs.y+obs.h/2;
                const ox=toX(obs.x,mg,dW), oy=toY(obs.y,mg,dH);
                const ow=(obs.w/ROOM_W)*dW, oh=(obs.h/ROOM_H)*dH;
                const dx=(cx-rx0), dy=(cy-ry0), len=Math.sqrt(dx*dx+dy*dy)||1;
                const nx=dx/len, ny=dy/len;
                const ext = Math.max(dW,dH)*0.6;
                const g2=ctx.createLinearGradient(ox+ow/2,oy+oh/2,ox+ow/2+nx*(ext/ROOM_W*dW*1.2),oy+oh/2+ny*(ext/ROOM_H*dH*1.2));
                const sa = dark ? obs.atten*0.82 : obs.atten*0.35;
                g2.addColorStop(0, `rgba(0,0,0,${sa})`);
                g2.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle=g2;
                ctx.fillRect(ox-2,oy-2,ow+4+(nx*ext),oh+4+(ny*ext));
            });

            // ── Persistence canvas: radar trail ───────────────────────
            // Decay previous frame
            pCtx.fillStyle = dark ? 'rgba(0,4,12,0.13)' : 'rgba(220,235,245,0.16)';
            pCtx.fillRect(0,0,W,H);

            // Draw scan wedge trail onto persistence
            const rXc=toX(RX*ROOM_W,mg,dW), rYc=toY(RY*ROOM_H,mg,dH);
            const sEnd=scanEndCanvas(scanAngle,mg,dW,dH);
            const wedge=0.04;
            pCtx.fillStyle = dark ? 'rgba(0,255,180,0.10)' : 'rgba(0,100,140,0.08)';
            pCtx.beginPath(); pCtx.moveTo(rXc,rYc);
            pCtx.arc(rXc,rYc,Math.max(dW,dH)*1.2,scanAngle-wedge,scanAngle);
            pCtx.closePath(); pCtx.fill();

            // Leading scan line (bright)
            const sGrad=pCtx.createLinearGradient(rXc,rYc,sEnd.x,sEnd.y);
            sGrad.addColorStop(0,   dark?'rgba(0,255,180,0)':'rgba(0,120,160,0)');
            sGrad.addColorStop(0.55,dark?'rgba(0,255,180,0.18)':'rgba(0,120,160,0.12)');
            sGrad.addColorStop(1,   dark?'rgba(0,255,180,0.80)':'rgba(0,120,160,0.65)');
            pCtx.strokeStyle=sGrad; pCtx.lineWidth=2;
            pCtx.beginPath(); pCtx.moveTo(rXc,rYc); pCtx.lineTo(sEnd.x,sEnd.y); pCtx.stroke();

            // Composite persistence onto main
            ctx.drawImage(pCanvas,0,0);

            // ── Sonar pings (expanding rings) ─────────────────────────
            pings.forEach(ping=>{
                const age=t-ping.t0;
                const maxAge=4.5;
                if (age>maxAge) return;
                for (let pi=0;pi<3;pi++){
                    const ph=age-pi*0.6; if(ph<0) return;
                    const frac=ph/maxAge;
                    const r=frac*(Math.max(dW,dH)*0.7);
                    const a=(1-frac)*0.22*(1-pi*0.3);
                    if(a<0.01) return;
                    ctx.strokeStyle=dark?`rgba(0,255,180,${a})`:`rgba(0,120,160,${a})`;
                    ctx.lineWidth=1.5-pi*0.4;
                    ctx.beginPath(); ctx.arc(rXc,rYc,r,0,Math.PI*2); ctx.stroke();
                }
            });

            // ── Obstacle rendering ────────────────────────────────────
            OBSTACLES.forEach((obs,i)=>{
                const ox=toX(obs.x,mg,dW), oy=toY(obs.y,mg,dH);
                const ow=(obs.w/ROOM_W)*dW, oh=(obs.h/ROOM_H)*dH;
                const [gr,gg,gb]=obs.glow;

                // Glow aura (multi-stroke)
                for (let gl=5;gl>=0;gl--){
                    const ga=gl===0?0.80:0.08-gl*0.01;
                    const gw=gl===0?1.5:1+gl*0.7;
                    ctx.strokeStyle=`rgba(${gr},${gg},${gb},${ga})`;
                    ctx.lineWidth=gw;
                    ctx.strokeRect(ox-gl*0.5,oy-gl*0.5,ow+gl,oh+gl);
                }

                // Dark body
                const [fr,fg,fb]=obs.fill;
                ctx.fillStyle=dark?`rgba(${fr},${fg},${fb},0.93)`:`rgba(${Math.min(255,fr+100)},${Math.min(255,fg+100)},${Math.min(255,fb+100)},0.80)`;
                ctx.fillRect(ox,oy,ow,oh);

                // Hatching lines (material texture)
                ctx.strokeStyle=`rgba(${gr},${gg},${gb},0.08)`;
                ctx.lineWidth=0.5;
                const step=6;
                ctx.save(); ctx.beginPath(); ctx.rect(ox,oy,ow,oh); ctx.clip();
                for(let li=-oh;li<ow+oh;li+=step){
                    ctx.beginPath(); ctx.moveTo(ox+li,oy); ctx.lineTo(ox+li+oh,oy+oh); ctx.stroke();
                }
                ctx.restore();

                // Label
                const minSide=Math.min(ow,oh);
                if(minSide>12){
                    ctx.fillStyle=`rgba(${gr},${gg},${gb},0.95)`;
                    ctx.font=`bold ${Math.min(9,Math.max(6,minSide*0.28))}px "JetBrains Mono",monospace`;
                    ctx.textAlign='center';
                    ctx.fillText(obs.label, ox+ow/2, oy+oh/2+3);
                }

                // Attenuation badge (top)
                const pct=Math.round(obs.atten*100);
                const badgeW=Math.max(ow,24);
                ctx.fillStyle=dark?'rgba(0,0,8,0.80)':'rgba(220,235,245,0.90)';
                ctx.fillRect(ox+(ow-badgeW)/2, oy-11, badgeW, 10);
                ctx.fillStyle=`rgba(${gr},${gg},${gb},0.9)`;
                ctx.font='5.5px "JetBrains Mono",monospace'; ctx.textAlign='center';
                ctx.fillText(`-${pct}% señal`, ox+ow/2, oy-3.5);
            });

            // ── Animated bounce rays ──────────────────────────────────
            BOUNCE_RAYS.forEach((ray,i)=>{
                const obs=OBSTACLES[ray.i];
                const [gr,gg,gb]=obs.glow;
                const x1c=toX(ray.x1,mg,dW),y1c=toY(ray.y1,mg,dH);
                const x2c=toX(ray.x2,mg,dW),y2c=toY(ray.y2,mg,dH);
                const x3c=toX(ray.x3,mg,dW),y3c=toY(ray.y3,mg,dH);
                const a=obs.R*0.45;

                // Incoming path
                ctx.strokeStyle=`rgba(${gr},${gg},${gb},${a*0.28})`; ctx.lineWidth=0.7;
                ctx.setLineDash([4,5]);
                ctx.beginPath(); ctx.moveTo(x1c,y1c); ctx.lineTo(x2c,y2c); ctx.stroke();
                // Reflected path
                ctx.strokeStyle=`rgba(${gr},${gg},${gb},${a*0.16})`;
                ctx.beginPath(); ctx.moveTo(x2c,y2c); ctx.lineTo(x3c,y3c); ctx.stroke();
                ctx.setLineDash([]);

                // Traveling pulse — incoming
                const tp1=(t*0.85+i*0.22)%1;
                const px1=x1c+tp1*(x2c-x1c), py1=y1c+tp1*(y2c-y1c);
                const pa1=Math.sin(tp1*Math.PI)*a*0.9;
                if(pa1>0.02){
                    const g=ctx.createRadialGradient(px1,py1,0,px1,py1,5);
                    g.addColorStop(0,`rgba(${gr},${gg},${gb},${pa1})`);
                    g.addColorStop(1,`rgba(${gr},${gg},${gb},0)`);
                    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(px1,py1,5,0,Math.PI*2); ctx.fill();
                }

                // Traveling pulse — reflected
                const tp2=(t*0.85+i*0.22+0.5)%1;
                const px2=x2c+tp2*(x3c-x2c), py2=y2c+tp2*(y3c-y2c);
                const pa2=Math.sin(tp2*Math.PI)*a*0.55;
                if(pa2>0.02){
                    const g2=ctx.createRadialGradient(px2,py2,0,px2,py2,4);
                    g2.addColorStop(0,`rgba(${gr},${gg},${gb},${pa2})`);
                    g2.addColorStop(1,`rgba(${gr},${gg},${gb},0)`);
                    ctx.fillStyle=g2; ctx.beginPath(); ctx.arc(px2,py2,4,0,Math.PI*2); ctx.fill();
                }
            });

            // ── Echo markers (amber flash when sweep hits obstacle) ────
            for (let e=echoes.length-1; e>=0; e--) {
                const echo=echoes[e];
                const age=t-echo.t0;
                if(age>3.0){ echoes.splice(e,1); continue; }
                const a=Math.max(0,1-age/3.0);
                const mx2=toX(echo.x,mg,dW), my2=toY(echo.y,mg,dH);
                const [cr,cg,cb]=echo.color;

                // Expanding ring
                const rr=4+age*20;
                ctx.strokeStyle=`rgba(${cr},${cg},${cb},${a*0.65})`;
                ctx.lineWidth=1.5;
                ctx.beginPath(); ctx.arc(mx2,my2,rr,0,Math.PI*2); ctx.stroke();

                // Inner ring
                const rr2=2+age*8;
                ctx.strokeStyle=`rgba(${cr},${cg},${cb},${a*0.35})`;
                ctx.lineWidth=1;
                ctx.beginPath(); ctx.arc(mx2,my2,rr2,0,Math.PI*2); ctx.stroke();

                // Center glow
                const cGrad=ctx.createRadialGradient(mx2,my2,0,mx2,my2,6+age*3);
                cGrad.addColorStop(0,`rgba(${cr},${cg},${cb},${a*0.95})`);
                cGrad.addColorStop(1,`rgba(${cr},${cg},${cb},0)`);
                ctx.fillStyle=cGrad; ctx.beginPath(); ctx.arc(mx2,my2,6+age*3,0,Math.PI*2); ctx.fill();
            }

            // ── Room outline (bright border) ──────────────────────────
            ctx.strokeStyle=dark?'rgba(0,200,160,0.60)':'rgba(0,100,140,0.55)';
            ctx.lineWidth=2;
            ctx.strokeRect(mg.left,mg.top,dW,dH);

            // Corner markers
            const cm=6;
            [[mg.left,mg.top],[mg.left+dW,mg.top],[mg.left,mg.top+dH],[mg.left+dW,mg.top+dH]].forEach(([cx,cy])=>{
                ctx.strokeStyle=dark?'rgba(0,255,180,0.7)':'rgba(0,120,160,0.6)';
                ctx.lineWidth=1.5;
                ctx.beginPath();
                ctx.moveTo(cx+(cx<W/2?0:-cm),cy); ctx.lineTo(cx+(cx<W/2?cm:-cm)+( cx<W/2?cm:0),cy);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx,cy+(cy<H/2?0:-cm)); ctx.lineTo(cx,cy+(cy<H/2?cm:0)+(cy<H/2?cm:-cm));
                ctx.stroke();
            });

            // Door arc
            const doorW=dW*0.07;
            ctx.clearRect(mg.left+1,mg.top+dH-1,doorW-1,2);
            ctx.strokeStyle=dark?'rgba(0,255,180,0.9)':'rgba(0,120,160,0.9)';
            ctx.lineWidth=1.5;
            ctx.beginPath(); ctx.moveTo(mg.left,mg.top+dH); ctx.lineTo(mg.left+doorW,mg.top+dH); ctx.stroke();
            ctx.strokeStyle=dark?'rgba(0,255,180,0.2)':'rgba(0,120,160,0.2)';
            ctx.setLineDash([2,2]); ctx.lineWidth=1;
            ctx.beginPath(); ctx.arc(mg.left,mg.top+dH,doorW,-Math.PI/2,0); ctx.stroke();
            ctx.setLineDash([]);

            // ── Router ────────────────────────────────────────────────
            for(let ri=0;ri<4;ri++){
                const phase=(t*0.7+ri/4)%1;
                const rr2=5+phase*38, ra=(1-phase)*0.3;
                ctx.strokeStyle=dark?`rgba(0,255,180,${ra})`:`rgba(0,120,160,${ra})`;
                ctx.lineWidth=1.2;
                ctx.beginPath(); ctx.arc(rXc,rYc,rr2,0,Math.PI*2); ctx.stroke();
            }
            // Dot glow
            const dg=ctx.createRadialGradient(rXc,rYc,0,rXc,rYc,8);
            dg.addColorStop(0,dark?'rgba(0,255,180,0.5)':'rgba(0,160,200,0.4)');
            dg.addColorStop(1,'rgba(0,0,0,0)');
            ctx.fillStyle=dg; ctx.beginPath(); ctx.arc(rXc,rYc,8,0,Math.PI*2); ctx.fill();
            ctx.fillStyle=dark?'#00ffb4':'#006080';
            ctx.beginPath(); ctx.arc(rXc,rYc,5,0,Math.PI*2); ctx.fill();
            ctx.fillStyle='#ffffff';
            ctx.beginPath(); ctx.arc(rXc,rYc,2,0,Math.PI*2); ctx.fill();
            ctx.fillStyle=dark?'rgba(0,255,180,0.9)':'rgba(0,100,140,0.9)';
            ctx.font='bold 7px "JetBrains Mono",monospace'; ctx.textAlign='left';
            ctx.fillText('ROUTER',rXc+9,rYc-5);

            // ── Detection markers ─────────────────────────────────────
            const pulse=0.5+0.5*Math.sin(t*3);
            detHistRef.current.slice(0,6).forEach((det,i)=>{
                if(det.x==null) return;
                const mx3=mg.left+det.x*dW, my3=mg.top+det.y*dH;
                const [cr,cg,cb]=TYPE_RGB[det.type]||TYPE_RGB.adult;
                const alpha=1-i/7;
                if(i===0){
                    ctx.strokeStyle=`rgba(${cr},${cg},${cb},${alpha*0.45})`;
                    ctx.lineWidth=1.5;
                    ctx.beginPath(); ctx.arc(mx3,my3,12+pulse*6,0,Math.PI*2); ctx.stroke();
                    ctx.strokeStyle=`rgba(${cr},${cg},${cb},${alpha*0.2})`;
                    ctx.beginPath(); ctx.arc(mx3,my3,20+pulse*4,0,Math.PI*2); ctx.stroke();
                }
                // Cross reticle
                ctx.strokeStyle=`rgba(${cr},${cg},${cb},${alpha*0.7})`; ctx.lineWidth=1;
                ctx.beginPath(); ctx.moveTo(mx3-8,my3); ctx.lineTo(mx3+8,my3);
                ctx.moveTo(mx3,my3-8); ctx.lineTo(mx3,my3+8); ctx.stroke();
                ctx.fillStyle=`rgba(${cr},${cg},${cb},${alpha})`;
                ctx.beginPath(); ctx.arc(mx3,my3,i===0?4:2.5,0,Math.PI*2); ctx.fill();
                if(i===0){
                    ctx.fillStyle=`rgba(${cr},${cg},${cb},0.9)`;
                    ctx.font='bold 7px "JetBrains Mono",monospace'; ctx.textAlign='left';
                    ctx.fillText(det.label,mx3+10,my3-2);
                    ctx.fillStyle=dark?'rgba(100,116,139,0.7)':'rgba(71,85,105,0.7)';
                    ctx.font='6px "JetBrains Mono",monospace';
                    ctx.fillText(`${det.distanceM}m del router`,mx3+10,my3+7);
                }
            });

            // ── Live reticle ──────────────────────────────────────────
            const live=detectionRef?.current;
            if(live&&live.x!=null){
                const mx3=mg.left+live.x*dW, my3=mg.top+live.y*dH;
                const [cr,cg,cb]=TYPE_RGB[live.type]||TYPE_RGB.adult;
                const la=live.alpha??1;
                const sz=10, bO=8, bs=6;
                ctx.strokeStyle=`rgba(${cr},${cg},${cb},${la*0.85})`; ctx.lineWidth=1.2;
                ctx.beginPath(); ctx.moveTo(mx3-sz,my3); ctx.lineTo(mx3+sz,my3);
                ctx.moveTo(mx3,my3-sz); ctx.lineTo(mx3,my3+sz); ctx.stroke();
                ctx.strokeStyle=`rgba(${cr},${cg},${cb},${la})`; ctx.lineWidth=2;
                ctx.beginPath();
                ctx.moveTo(mx3-bO,my3-bO+bs);ctx.lineTo(mx3-bO,my3-bO);ctx.lineTo(mx3-bO+bs,my3-bO);
                ctx.moveTo(mx3+bO-bs,my3-bO);ctx.lineTo(mx3+bO,my3-bO);ctx.lineTo(mx3+bO,my3-bO+bs);
                ctx.moveTo(mx3+bO,my3+bO-bs);ctx.lineTo(mx3+bO,my3+bO);ctx.lineTo(mx3+bO-bs,my3+bO);
                ctx.moveTo(mx3-bO+bs,my3+bO);ctx.lineTo(mx3-bO,my3+bO);ctx.lineTo(mx3-bO,my3+bO-bs);
                ctx.stroke();
            }

            // ── Dimensions + labels ───────────────────────────────────
            ctx.fillStyle=dark?'rgba(0,180,140,0.55)':'rgba(0,90,120,0.65)';
            ctx.font='bold 8px "JetBrains Mono",monospace'; ctx.textAlign='center';
            ctx.fillText(`${ROOM_W} m`,mg.left+dW/2,H-14);
            ctx.save(); ctx.translate(12,mg.top+dH/2); ctx.rotate(-Math.PI/2);
            ctx.fillText(`${ROOM_H} m`,0,0); ctx.restore();

            // ── Scale bar ─────────────────────────────────────────────
            const mPx=dW/ROOM_W, sbL=mPx*2;
            const sbX=W-mg.right-sbL, sbY=H-mg.bottom+16;
            ctx.strokeStyle=dark?'rgba(0,200,160,0.45)':'rgba(0,100,140,0.5)';
            ctx.lineWidth=1.5;
            ctx.beginPath();
            ctx.moveTo(sbX,sbY);ctx.lineTo(sbX+sbL,sbY);
            ctx.moveTo(sbX,sbY-3);ctx.lineTo(sbX,sbY+3);
            ctx.moveTo(sbX+sbL,sbY-3);ctx.lineTo(sbX+sbL,sbY+3);
            ctx.stroke();
            ctx.fillStyle=dark?'rgba(0,180,140,0.55)':'rgba(0,90,120,0.6)';
            ctx.font='6px "JetBrains Mono",monospace'; ctx.textAlign='center';
            ctx.fillText('2 m',sbX+sbL/2,sbY+10);

            // ── Signal gradient legend ────────────────────────────────
            const lgX=mg.left, lgY=H-mg.bottom+10, lgW=70, lgH=5;
            const lg=ctx.createLinearGradient(lgX,lgY,lgX+lgW,lgY);
            if(dark){
                lg.addColorStop(0,'rgba(0,2,8,1)');
                lg.addColorStop(0.35,'rgba(0,60,90,1)');
                lg.addColorStop(0.65,'rgba(0,200,180,1)');
                lg.addColorStop(1,'rgba(240,255,255,1)');
            } else {
                lg.addColorStop(0,'rgba(210,230,240,1)');
                lg.addColorStop(0.5,'rgba(100,180,220,1)');
                lg.addColorStop(1,'rgba(20,80,120,1)');
            }
            ctx.fillStyle=lg; ctx.fillRect(lgX,lgY,lgW,lgH);
            ctx.strokeStyle=dark?'rgba(0,200,160,0.3)':'rgba(0,100,140,0.3)';
            ctx.lineWidth=0.5; ctx.strokeRect(lgX,lgY,lgW,lgH);
            ctx.fillStyle=dark?'rgba(0,180,140,0.5)':'rgba(0,90,120,0.6)';
            ctx.font='5px "JetBrains Mono",monospace';
            ctx.textAlign='left';  ctx.fillText('sin señal',lgX,lgY+lgH+8);
            ctx.textAlign='right'; ctx.fillText('fuerte',lgX+lgW,lgY+lgH+8);

            // ── Live tag ──────────────────────────────────────────────
            ctx.fillStyle=dark?'rgba(0,255,180,0.50)':'rgba(0,120,160,0.60)';
            ctx.font='bold 7px "JetBrains Mono",monospace'; ctx.textAlign='right';
            ctx.fillText('SONAR WiFi · EN VIVO',W-mg.right,mg.top-8);

            // ── Scan angle indicator (mini) ───────────────────────────
            ctx.fillStyle=dark?'rgba(0,180,140,0.4)':'rgba(0,90,120,0.4)';
            ctx.font='6px "JetBrains Mono",monospace'; ctx.textAlign='left';
            ctx.fillText(`⟳ ${Math.round((scanAngle*(180/Math.PI)))%360}°`,mg.left,mg.top-8);

            animRef.current=requestAnimationFrame(draw);
        };

        animRef.current=requestAnimationFrame(draw);
        return ()=>{ cancelAnimationFrame(animRef.current); ro.disconnect(); };
    },[]);

    return <canvas ref={canvasRef} className="w-full h-full" style={{display:'block'}}/>;
};

export default FloorPlanCanvas;
