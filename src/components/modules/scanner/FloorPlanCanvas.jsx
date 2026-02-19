import React, { useRef, useEffect } from 'react';

// ── Room & layout ─────────────────────────────────────────────────────────────
const ROOM_W = 10, ROOM_H = 8;
const RX = 0.28, RY = 0.48;         // router position (normalised)
const GRID_W = 80, GRID_H = 64;     // heatmap resolution
const WT  = 0.25;                    // wall thickness (m)
const DW  = 0.90;                    // door width (m)

// ── Obstacles (WiFi signal physics + echo) ────────────────────────────────────
const OBSTACLES = [
    { x:3.80, y:WT,   w:0.22, h:2.82, atten:0.75, label:'Tabique', type:'wall'   },
    { x:7.00, y:0.55, w:0.70, h:1.90, atten:0.55, label:'Armario', type:'wood'   },
    { x:1.35, y:5.40, w:2.30, h:0.95, atten:0.42, label:'Sofá',    type:'soft'   },
    { x:8.40, y:3.65, w:0.55, h:0.72, atten:0.68, label:'Nevera',  type:'metal'  },
    { x:5.00, y:5.90, w:1.85, h:0.55, atten:0.38, label:'Mesa',    type:'wood'   },
];

// ── Ray-AABB ──────────────────────────────────────────────────────────────────
function rayHits(x1,y1,x2,y2,o){
    const dx=x2-x1,dy=y2-y1; let mn=0.0001,mx=1;
    if(Math.abs(dx)<1e-9){if(x1<o.x||x1>o.x+o.w)return false;}
    else{const a=(o.x-x1)/dx,b=(o.x+o.w-x1)/dx;mn=Math.max(mn,Math.min(a,b));mx=Math.min(mx,Math.max(a,b));if(mn>mx)return false;}
    if(Math.abs(dy)<1e-9){if(y1<o.y||y1>o.y+o.h)return false;}
    else{const a=(o.y-y1)/dy,b=(o.y+o.h-y1)/dy;mn=Math.max(mn,Math.min(a,b));mx=Math.min(mx,Math.max(a,b));if(mn>mx)return false;}
    return true;
}

// ── Pre-computed static signal map ────────────────────────────────────────────
const SIGNAL_MAP = (() => {
    const map = new Float32Array(GRID_W*GRID_H);
    const rx=RX*ROOM_W, ry=RY*ROOM_H;
    for(let gy=0;gy<GRID_H;gy++) for(let gx=0;gx<GRID_W;gx++){
        const px=((gx+.5)/GRID_W)*ROOM_W, py=((gy+.5)/GRID_H)*ROOM_H;
        const d=Math.hypot(px-rx,py-ry)||0.01;
        let s=1/Math.pow(Math.max(d,0.2),1.8);
        for(const o of OBSTACLES) if(rayHits(rx,ry,px,py,o)) s*=(1-o.atten*0.85);
        map[gy*GRID_W+gx]=s;
    }
    let mx=0; for(const v of map) if(v>mx) mx=v;
    for(let i=0;i<map.length;i++) map[i]/=mx;
    return map;
})();

// ── Obstacle angles for echo triggers ────────────────────────────────────────
const OBS_ANGLES=OBSTACLES.map(o=>Math.atan2(o.y+o.h/2-RY*ROOM_H,o.x+o.w/2-RX*ROOM_W));

// ── Heatmap colours — subtle tint ─────────────────────────────────────────────
function heatRGBA(v,dark){
    if(dark){
        if(v<0.20) return [0,20,50,  Math.floor(v*80)];
        if(v<0.50){const k=(v-0.20)/0.30;return [0,Math.floor(20+k*100),Math.floor(50+k*140),Math.floor(16+k*120)];}
        if(v<0.80){const k=(v-0.50)/0.30;return [0,Math.floor(120+k*100),Math.floor(190+k*60),Math.floor(136+k*80)];}
        {const k=(v-0.80)/0.20;return [Math.floor(k*80),220,Math.floor(250-k*30),220];}
    }else{
        if(v<0.20) return [180,220,255,Math.floor(v*45)];
        if(v<0.50){const k=(v-0.20)/0.30;return [Math.floor(180-k*60),Math.floor(220-k*40),255,Math.floor(9+k*80)];}
        if(v<0.80){const k=(v-0.50)/0.30;return [Math.floor(120-k*80),Math.floor(180-k*60),Math.floor(255-k*80),Math.floor(89+k*70)];}
        {const k=(v-0.80)/0.20;return [Math.floor(40-k*20),Math.floor(120-k*60),Math.floor(175-k*80),Math.floor(159+k*40)];}
    }
}

// ── Detection type colours ────────────────────────────────────────────────────
const TYPE_RGB={bird:[56,189,248],rabbit:[167,139,250],animal:[251,191,36],adolescent:[251,146,60],adult:[248,113,113]};
const TYPE_ICON={bird:'🐦',rabbit:'🐇',animal:'🐾',adolescent:'🧒',adult:'🧍'};

// ── Component ─────────────────────────────────────────────────────────────────
const FloorPlanCanvas=({isScanning,detectionRef,detectionHistory=[],isDark})=>{
    const canvasRef=useRef(null);
    const animRef=useRef(null);
    const isDarkRef=useRef(isDark);
    const isScanRef=useRef(isScanning);
    const detHistRef=useRef(detectionHistory);

    useEffect(()=>{isDarkRef.current=isDark;},[isDark]);
    useEffect(()=>{isScanRef.current=isScanning;},[isScanning]);
    useEffect(()=>{detHistRef.current=detectionHistory;},[detectionHistory]);

    useEffect(()=>{
        const canvas=canvasRef.current; if(!canvas) return;
        const ctx=canvas.getContext('2d');

        // Offscreen: heatmap
        const hmC=document.createElement('canvas'); hmC.width=GRID_W; hmC.height=GRID_H;
        const hmX=hmC.getContext('2d'); const hmImg=hmX.createImageData(GRID_W,GRID_H);

        // Mutable state
        let t=0, scanAngle=0, prevScan=0;
        const echoes=[], pings=[];
        const obsGlow=OBSTACLES.map(()=>0);

        const resize=()=>{
            canvas.width=canvas.offsetWidth;
            canvas.height=canvas.offsetHeight;
        };
        const ro=new ResizeObserver(resize); ro.observe(canvas); resize();

        // ── Furniture drawing helpers (top-down architectural) ────────────────

        const drawSofa=(ctx,ox,oy,ow,oh,dark)=>{
            const sh=dark?'rgba(0,0,0,0.35)':'rgba(0,0,0,0.12)';
            // drop shadow
            ctx.fillStyle=sh; ctx.fillRect(ox+4,oy+4,ow,oh);
            // seat body
            ctx.fillStyle=dark?'#2e1f5e':'#9b87d8';
            ctx.fillRect(ox,oy,ow,oh);
            // backrest (top strip)
            ctx.fillStyle=dark?'#1e1240':'#7c68c0';
            ctx.fillRect(ox,oy,ow,oh*0.28);
            // armrests
            ctx.fillStyle=dark?'#1e1240':'#7c68c0';
            ctx.fillRect(ox,oy,ow*0.10,oh);
            ctx.fillRect(ox+ow*0.90,oy,ow*0.10,oh);
            // cushion lines
            ctx.strokeStyle=dark?'rgba(170,140,255,0.40)':'rgba(255,255,255,0.55)';
            ctx.lineWidth=1;
            for(let i=1;i<3;i++){
                const lx=ox+ow*0.10+i*(ow*0.80/3);
                ctx.beginPath();ctx.moveTo(lx,oy+oh*0.28);ctx.lineTo(lx,oy+oh);ctx.stroke();
            }
            // outline
            ctx.strokeStyle=dark?'rgba(180,150,255,0.80)':'rgba(80,50,160,0.90)';
            ctx.lineWidth=1.8; ctx.strokeRect(ox,oy,ow,oh);
            // label
            ctx.fillStyle=dark?'rgba(200,170,255,0.95)':'rgba(255,255,255,0.95)';
            ctx.font=`bold ${Math.max(7,Math.min(10,ow*0.10))}px sans-serif`;
            ctx.textAlign='center'; ctx.textBaseline='middle';
            ctx.fillText('SOFÁ',ox+ow/2,oy+oh*0.65);
            ctx.textBaseline='alphabetic';
        };

        const drawWardrobe=(ctx,ox,oy,ow,oh,dark)=>{
            ctx.fillStyle=dark?'rgba(0,0,0,0.30)':'rgba(0,0,0,0.10)';
            ctx.fillRect(ox+4,oy+4,ow,oh);
            // body
            ctx.fillStyle=dark?'#3a2010':'#c4924a';
            ctx.fillRect(ox,oy,ow,oh);
            // two door panels
            const doorH=oh/2;
            ctx.fillStyle=dark?'#2e1808':'#b07d36';
            ctx.fillRect(ox+2,oy+2,ow-4,doorH-4);
            ctx.fillRect(ox+2,oy+doorH+2,ow-4,doorH-4);
            // handle dots
            ctx.fillStyle=dark?'rgba(255,200,100,0.80)':'rgba(100,60,10,0.85)';
            ctx.beginPath();ctx.arc(ox+ow*0.50,oy+doorH*0.60,3,0,Math.PI*2);ctx.fill();
            ctx.beginPath();ctx.arc(ox+ow*0.50,oy+doorH+doorH*0.60,3,0,Math.PI*2);ctx.fill();
            // door divider
            ctx.strokeStyle=dark?'rgba(180,110,40,0.60)':'rgba(130,85,20,0.70)';
            ctx.lineWidth=1.5;
            ctx.beginPath();ctx.moveTo(ox,oy+doorH);ctx.lineTo(ox+ow,oy+doorH);ctx.stroke();
            // outline
            ctx.strokeStyle=dark?'rgba(220,155,70,0.90)':'rgba(120,75,18,0.95)';
            ctx.lineWidth=2; ctx.strokeRect(ox,oy,ow,oh);
            ctx.fillStyle=dark?'rgba(240,175,80,0.95)':'rgba(255,255,255,0.90)';
            ctx.font=`bold ${Math.max(6,Math.min(9,ow*0.32))}px sans-serif`;
            ctx.textAlign='center'; ctx.textBaseline='middle';
            ctx.fillText('ARM.',ox+ow/2,oy+oh/2);
            ctx.textBaseline='alphabetic';
        };

        const drawFridge=(ctx,ox,oy,ow,oh,dark)=>{
            ctx.fillStyle=dark?'rgba(0,0,0,0.30)':'rgba(0,0,0,0.10)';
            ctx.fillRect(ox+3,oy+3,ow,oh);
            // body
            ctx.fillStyle=dark?'#102840':'#a8d8f0';
            ctx.fillRect(ox,oy,ow,oh);
            // freezer section (top 35%)
            ctx.fillStyle=dark?'#0a1e30':'#7ec8e8';
            ctx.fillRect(ox,oy,ow,oh*0.35);
            // divider line
            ctx.strokeStyle=dark?'rgba(80,180,230,0.65)':'rgba(30,120,180,0.75)';
            ctx.lineWidth=1.5;
            ctx.beginPath();ctx.moveTo(ox,oy+oh*0.35);ctx.lineTo(ox+ow,oy+oh*0.35);ctx.stroke();
            // handles
            ctx.strokeStyle=dark?'rgba(100,200,250,0.90)':'rgba(20,100,160,0.90)';
            ctx.lineWidth=2.5; ctx.lineCap='round';
            ctx.beginPath();ctx.moveTo(ox+ow*0.25,oy+oh*0.15);ctx.lineTo(ox+ow*0.75,oy+oh*0.15);ctx.stroke();
            ctx.beginPath();ctx.moveTo(ox+ow*0.25,oy+oh*0.58);ctx.lineTo(ox+ow*0.75,oy+oh*0.58);ctx.stroke();
            ctx.lineCap='butt';
            // outline
            ctx.strokeStyle=dark?'rgba(80,190,240,0.90)':'rgba(20,110,175,0.95)';
            ctx.lineWidth=2; ctx.strokeRect(ox,oy,ow,oh);
            ctx.fillStyle=dark?'rgba(110,210,255,0.95)':'rgba(10,80,140,0.95)';
            ctx.font=`bold ${Math.max(5,Math.min(8,ow*0.30))}px sans-serif`;
            ctx.textAlign='center'; ctx.textBaseline='middle';
            ctx.fillText('NEV.',ox+ow/2,oy+oh*0.68);
            ctx.textBaseline='alphabetic';
        };

        const drawTable=(ctx,ox,oy,ow,oh,dark)=>{
            const cW=ow*0.18,cH=oh*0.6,cGap=oh*0.15;
            const nC=3, spc=ow/(nC+1);
            // chair shadows
            ctx.fillStyle=dark?'rgba(0,0,0,0.25)':'rgba(0,0,0,0.08)';
            for(let i=0;i<nC;i++){
                ctx.fillRect(ox+(i+1)*spc-cW/2+2,oy-cGap-cH+2,cW,cH);
                ctx.fillRect(ox+(i+1)*spc-cW/2+2,oy+oh+cGap+2,cW,cH);
            }
            // chairs top
            ctx.fillStyle=dark?'#2a1808':'#d4a96a';
            ctx.strokeStyle=dark?'rgba(190,130,55,0.85)':'rgba(110,70,15,0.90)';
            ctx.lineWidth=1.2;
            for(let i=0;i<nC;i++){
                const cx=ox+(i+1)*spc-cW/2;
                ctx.fillRect(cx,oy-cGap-cH,cW,cH);
                ctx.strokeRect(cx,oy-cGap-cH,cW,cH);
            }
            // chairs bottom
            for(let i=0;i<nC;i++){
                const cx=ox+(i+1)*spc-cW/2;
                ctx.fillRect(cx,oy+oh+cGap,cW,cH);
                ctx.strokeRect(cx,oy+oh+cGap,cW,cH);
            }
            // table shadow
            ctx.fillStyle=dark?'rgba(0,0,0,0.30)':'rgba(0,0,0,0.10)';
            ctx.fillRect(ox+4,oy+4,ow,oh);
            // table top
            ctx.fillStyle=dark?'#3d2510':'#c4883a';
            ctx.fillRect(ox,oy,ow,oh);
            // wood grain
            ctx.strokeStyle=dark?'rgba(180,120,45,0.28)':'rgba(180,130,50,0.30)';
            ctx.lineWidth=0.8;
            for(let lx=ox+ow*0.18;lx<ox+ow-4;lx+=ow*0.18){
                ctx.beginPath();ctx.moveTo(lx,oy+3);ctx.lineTo(lx,oy+oh-3);ctx.stroke();
            }
            // outline
            ctx.strokeStyle=dark?'rgba(210,145,60,0.90)':'rgba(130,85,15,0.95)';
            ctx.lineWidth=2; ctx.strokeRect(ox,oy,ow,oh);
            ctx.fillStyle=dark?'rgba(230,165,70,0.95)':'rgba(255,255,255,0.92)';
            ctx.font=`bold ${Math.max(6,Math.min(9,ow*0.10))}px sans-serif`;
            ctx.textAlign='center'; ctx.textBaseline='middle';
            ctx.fillText('MESA',ox+ow/2,oy+oh/2);
            ctx.textBaseline='alphabetic';
        };

        // ── MAIN DRAW ─────────────────────────────────────────────────────────
        const draw=()=>{
            const CW=canvas.width, CH=canvas.height;
            const dark=isDarkRef.current, scan=isScanRef.current;
            if(CW===0||CH===0){animRef.current=requestAnimationFrame(draw);return;}

            // Margins
            const mg={l:48,r:24,t:36,b:56};
            const dW=CW-mg.l-mg.r, dH=CH-mg.t-mg.b;

            // Coord helpers
            const X=mx=>mg.l+(mx/ROOM_W)*dW;
            const Y=my=>mg.t+(my/ROOM_H)*dH;
            const W=mw=>(mw/ROOM_W)*dW;
            const H=mh=>(mh/ROOM_H)*dH;

            const rXc=X(RX*ROOM_W), rYc=Y(RY*ROOM_H);

            // ── BACKGROUND ───────────────────────────────────────────────────
            ctx.fillStyle=dark?'#0d1525':'#c8d8e8';
            ctx.fillRect(0,0,CW,CH);

            // ── WALL STRUCTURE ────────────────────────────────────────────────
            // Fill entire room bounding box with wall colour — rooms are cut out of this
            const wallCol  = dark?'#1e2d42':'#4a5568';
            const wallEdge = dark?'rgba(80,120,165,0.40)':'rgba(80,100,130,0.35)';
            const floorCol = dark?'#0d1a2e':'#f7f2e8';
            const floor2   = dark?'#0a1628':'#ede8dc'; // bedroom slightly cooler
            const floor3   = dark?'#0b1a2a':'#eee9dd'; // kitchen

            // Outer wall fill
            ctx.fillStyle=wallCol;
            ctx.fillRect(mg.l,mg.t,dW,dH);

            // Interior floor (full)
            ctx.fillStyle=floorCol;
            ctx.fillRect(X(WT),Y(WT),W(ROOM_W-WT*2),H(ROOM_H-WT*2));

            // Room-tone zones (subtle)
            // Bedroom: right-top
            ctx.fillStyle=floor2;
            ctx.fillRect(X(4.02),Y(WT),W(ROOM_W-4.02-WT),H(3.0-WT));
            // Kitchen: right-bottom
            ctx.fillStyle=floor3;
            ctx.fillRect(X(4.02),Y(3.0),W(ROOM_W-4.02-WT),H(ROOM_H-3.0-WT));

            // Door in bottom wall (gap — fill with bg)
            ctx.fillStyle=dark?'#0d1525':'#c8d8e8';
            ctx.fillRect(X(1.0),Y(ROOM_H-WT),W(DW),H(WT+0.02));

            // Window in right wall: y=0.8–2.3 (gap then glass)
            ctx.fillStyle=dark?'#0d1525':'#c8d8e8';
            ctx.fillRect(X(ROOM_W-WT),Y(0.8),W(WT+0.02),H(1.5));

            // Window in top wall: x=6.0–8.0 (gap then glass)
            ctx.fillStyle=dark?'#0d1525':'#c8d8e8';
            ctx.fillRect(X(6.0),Y(0),W(2.0),H(WT+0.02));

            // ── WINDOWS (glass fill) ──────────────────────────────────────────
            const glassCol=dark?'rgba(80,155,215,0.22)':'rgba(145,200,245,0.55)';
            const glassStk=dark?'rgba(90,168,228,0.75)':'rgba(55,130,200,0.85)';
            // Right window
            ctx.fillStyle=glassCol;
            ctx.fillRect(X(ROOM_W-WT),Y(0.8),W(WT),H(1.5));
            ctx.strokeStyle=glassStk; ctx.lineWidth=1.5;
            ctx.strokeRect(X(ROOM_W-WT),Y(0.8),W(WT),H(1.5));
            // hatching
            ctx.strokeStyle=dark?'rgba(90,168,228,0.35)':'rgba(55,130,200,0.38)';
            ctx.lineWidth=0.7;
            for(let yi=Y(0.8)+5;yi<Y(2.3)-2;yi+=6){
                ctx.beginPath();ctx.moveTo(X(ROOM_W-WT),yi);ctx.lineTo(X(ROOM_W),yi);ctx.stroke();
            }
            // Top window
            ctx.fillStyle=glassCol;
            ctx.fillRect(X(6.0),Y(0),W(2.0),H(WT));
            ctx.strokeStyle=glassStk; ctx.lineWidth=1.5;
            ctx.strokeRect(X(6.0),Y(0),W(2.0),H(WT));
            ctx.strokeStyle=dark?'rgba(90,168,228,0.35)':'rgba(55,130,200,0.38)';
            ctx.lineWidth=0.7;
            for(let xi=X(6.0)+5;xi<X(8.0)-2;xi+=6){
                ctx.beginPath();ctx.moveTo(xi,Y(0));ctx.lineTo(xi,Y(WT));ctx.stroke();
            }

            // ── INTERIOR WALL (tabique) ───────────────────────────────────────
            ctx.fillStyle=wallCol;
            ctx.fillRect(X(3.80),Y(WT),W(0.22),H(2.82));
            // inner edge
            ctx.strokeStyle=wallEdge; ctx.lineWidth=0.8;
            ctx.strokeRect(X(3.80),Y(WT),W(0.22),H(2.82));

            // Door in tabique: y=3.0, swing into right room
            // Door leaf line
            ctx.strokeStyle=dark?'rgba(160,195,230,0.65)':'rgba(70,110,155,0.70)';
            ctx.lineWidth=1.3;
            ctx.beginPath();ctx.moveTo(X(4.02),Y(3.0));ctx.lineTo(X(4.02+DW),Y(3.0));ctx.stroke();
            // Swing arc
            ctx.strokeStyle=dark?'rgba(160,195,230,0.28)':'rgba(70,110,155,0.30)';
            ctx.setLineDash([3,3]); ctx.lineWidth=1;
            ctx.beginPath();ctx.arc(X(4.02),Y(3.0),W(DW),0,Math.PI/2);ctx.stroke();
            ctx.setLineDash([]);

            // External door swing arc
            ctx.strokeStyle=dark?'rgba(160,195,230,0.65)':'rgba(70,110,155,0.70)';
            ctx.lineWidth=1.3;
            ctx.beginPath();ctx.moveTo(X(1.0),Y(ROOM_H-WT));ctx.lineTo(X(1.0+DW),Y(ROOM_H-WT));ctx.stroke();
            ctx.strokeStyle=dark?'rgba(160,195,230,0.28)':'rgba(70,110,155,0.30)';
            ctx.setLineDash([3,3]); ctx.lineWidth=1;
            ctx.beginPath();ctx.arc(X(1.0),Y(ROOM_H-WT),W(DW),-Math.PI/2,0);ctx.stroke();
            ctx.setLineDash([]);

            // Wall inner shadow/edge
            ctx.strokeStyle=wallEdge; ctx.lineWidth=1;
            ctx.strokeRect(X(WT),Y(WT),W(ROOM_W-WT*2),H(ROOM_H-WT*2));

            // ── HEATMAP (subtle WiFi coverage tint) ───────────────────────────
            if(scan){
                for(let i=0;i<GRID_W*GRID_H;i++){
                    const v=SIGNAL_MAP[i];
                    const [r,g,b,a]=heatRGBA(v,dark);
                    hmImg.data[i*4]=r;hmImg.data[i*4+1]=g;hmImg.data[i*4+2]=b;hmImg.data[i*4+3]=a;
                }
                hmX.putImageData(hmImg,0,0);
                // Clip heatmap to room interior only
                ctx.save();
                ctx.beginPath();
                ctx.rect(X(WT),Y(WT),W(ROOM_W-WT*2),H(ROOM_H-WT*2));
                ctx.clip();
                ctx.globalAlpha=0.38;
                ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
                ctx.drawImage(hmC,X(WT),Y(WT),W(ROOM_W-WT*2),H(ROOM_H-WT*2));
                ctx.globalAlpha=1;
                ctx.restore();
            }

            // ── FURNITURE ────────────────────────────────────────────────────
            drawSofa(ctx,X(1.35),Y(5.40),W(2.30),H(0.95),dark);
            drawWardrobe(ctx,X(7.00),Y(0.55),W(0.70),H(1.90),dark);
            drawFridge(ctx,X(8.40),Y(3.65),W(0.55),H(0.72),dark);
            drawTable(ctx,X(5.00),Y(5.90),W(1.85),H(0.55),dark);

            // ── ROOM LABELS ───────────────────────────────────────────────────
            ctx.textBaseline='alphabetic';
            // Living room
            ctx.fillStyle=dark?'rgba(100,140,185,0.45)':'rgba(60,85,120,0.50)';
            ctx.font='bold 11px "JetBrains Mono",monospace'; ctx.textAlign='center';
            ctx.fillText('SALA',X(1.90),Y(0.90));
            ctx.font='8px "JetBrains Mono",monospace';
            ctx.fillStyle=dark?'rgba(80,115,155,0.32)':'rgba(60,85,120,0.35)';
            ctx.fillText(`${(3.80-WT).toFixed(1)}×${(ROOM_H-WT*2).toFixed(1)}m`,X(1.90),Y(1.30));
            // Bedroom
            ctx.fillStyle=dark?'rgba(100,140,185,0.45)':'rgba(60,85,120,0.50)';
            ctx.font='bold 11px "JetBrains Mono",monospace';
            ctx.fillText('DORMITORIO',X(7.00),Y(0.90));
            ctx.font='8px "JetBrains Mono",monospace';
            ctx.fillStyle=dark?'rgba(80,115,155,0.32)':'rgba(60,85,120,0.35)';
            ctx.fillText(`${(ROOM_W-4.02-WT).toFixed(1)}×${(3.0-WT).toFixed(1)}m`,X(7.00),Y(1.30));
            // Kitchen
            ctx.fillStyle=dark?'rgba(100,140,185,0.45)':'rgba(60,85,120,0.50)';
            ctx.font='bold 11px "JetBrains Mono",monospace';
            ctx.fillText('COCINA / COMEDOR',X(6.80),Y(4.00));
            ctx.font='8px "JetBrains Mono",monospace';
            ctx.fillStyle=dark?'rgba(80,115,155,0.32)':'rgba(60,85,120,0.35)';
            ctx.fillText(`${(ROOM_W-4.02-WT).toFixed(1)}×${(ROOM_H-3.0-WT).toFixed(1)}m`,X(6.80),Y(4.38));

            // ── SCANNING EFFECTS ──────────────────────────────────────────────
            if(!scan){
                // Overlay idle message on top of complete floor plan
                ctx.fillStyle=dark?'rgba(13,21,37,0.75)':'rgba(200,220,235,0.75)';
                ctx.fillRect(mg.l+dW/2-110,mg.t+dH/2-22,220,44);
                ctx.strokeStyle=dark?'rgba(0,150,120,0.40)':'rgba(0,80,120,0.40)';
                ctx.lineWidth=1; ctx.strokeRect(mg.l+dW/2-110,mg.t+dH/2-22,220,44);
                ctx.fillStyle=dark?'rgba(0,200,155,0.75)':'rgba(0,80,120,0.75)';
                ctx.font='bold 12px "JetBrains Mono",monospace'; ctx.textAlign='center';
                ctx.fillText('ESCANEO INACTIVO',mg.l+dW/2,mg.t+dH/2-4);
                ctx.font='7px "JetBrains Mono",monospace';
                ctx.fillStyle=dark?'rgba(0,160,125,0.45)':'rgba(0,70,110,0.45)';
                ctx.fillText('Inicia el escaneo para ver cobertura WiFi',mg.l+dW/2,mg.t+dH/2+14);
                drawHUD(ctx,CW,CH,mg,dW,dH,X,Y,W,dark,0,0,false);
                animRef.current=requestAnimationFrame(draw); return;
            }

            // Tick
            t+=0.013; prevScan=scanAngle; scanAngle=(t*0.55)%(2*Math.PI);
            if(prevScan>scanAngle){/* scan count if needed */}

            // Echo triggers
            OBS_ANGLES.forEach((oa,i)=>{
                const wrap=a=>((a%(Math.PI*2))+(Math.PI*2))%(Math.PI*2);
                const cur=wrap(scanAngle),prv=wrap(prevScan),tgt=wrap(oa);
                if(prv<=cur?(tgt>=prv&&tgt<=cur):(tgt>=prv||tgt<=cur)){
                    echoes.push({mx:OBSTACLES[i].x+OBSTACLES[i].w/2,my:OBSTACLES[i].y+OBSTACLES[i].h/2,t0:t});
                    obsGlow[i]=1.0;
                }
            });
            obsGlow.forEach((_,i)=>{obsGlow[i]=Math.max(0,obsGlow[i]-0.022);});

            // Pings
            if(!pings.length||t-pings[pings.length-1].t0>3.5) pings.push({t0:t});
            while(pings.length&&t-pings[0].t0>5) pings.shift();

            // Subtle ping rings from router
            pings.forEach(ping=>{
                const age=t-ping.t0, maxA=4.5;
                if(age>maxA) return;
                for(let pi=0;pi<3;pi++){
                    const ph=age-pi*0.6; if(ph<0) continue;
                    const frac=ph/maxA;
                    const r2=frac*Math.max(dW,dH)*0.65;
                    const a2=(1-frac)*(0.20-pi*0.05); if(a2<0.01) continue;
                    ctx.strokeStyle=dark?`rgba(0,200,160,${a2})`:`rgba(0,100,150,${a2})`;
                    ctx.lineWidth=1.5-pi*0.4;
                    ctx.beginPath();ctx.arc(rXc,rYc,r2,0,Math.PI*2);ctx.stroke();
                }
            });

            // Obstacle glow when scan hits them
            OBSTACLES.forEach((o,i)=>{
                if(obsGlow[i]<0.04) return;
                const gl=obsGlow[i];
                const ox=X(o.x),oy2=Y(o.y),ow=W(o.w),oh=H(o.h);
                const colors={wall:[0,200,160],wood:[220,160,60],soft:[170,120,255],metal:[80,200,240]};
                const [cr,cg,cb]=colors[o.type]||colors.wall;
                for(let gi=3;gi>=1;gi--){
                    ctx.strokeStyle=`rgba(${cr},${cg},${cb},${gl*(0.12-gi*0.025)})`;
                    ctx.lineWidth=gi*3;
                    ctx.strokeRect(ox-gi*1.5,oy2-gi*1.5,ow+gi*3,oh+gi*3);
                }
            });

            // Echo markers (signal bounce from scan)
            for(let ei=echoes.length-1;ei>=0;ei--){
                const e=echoes[ei], age=t-e.t0;
                if(age>2.5){echoes.splice(ei,1);continue;}
                const a2=1-age/2.5;
                const ex=X(e.mx),ey=Y(e.my);
                ctx.strokeStyle=dark?`rgba(0,230,180,${a2*0.65})`:`rgba(0,120,170,${a2*0.65})`;
                ctx.lineWidth=1.5;
                ctx.beginPath();ctx.arc(ex,ey,5+age*18,0,Math.PI*2);ctx.stroke();
            }

            // ── ROUTER SYMBOL ─────────────────────────────────────────────────
            // Animated rings
            for(let ri=0;ri<3;ri++){
                const ph=(t*0.6+ri*0.33)%1;
                ctx.strokeStyle=dark?`rgba(0,220,170,${(1-ph)*0.28})`:`rgba(0,110,155,${(1-ph)*0.28})`;
                ctx.lineWidth=1;
                ctx.beginPath();ctx.arc(rXc,rYc,6+ph*36,0,Math.PI*2);ctx.stroke();
            }
            // Glow
            const dg=ctx.createRadialGradient(rXc,rYc,0,rXc,rYc,14);
            dg.addColorStop(0,dark?'rgba(0,255,180,0.50)':'rgba(0,140,200,0.42)');
            dg.addColorStop(1,'rgba(0,0,0,0)');
            ctx.fillStyle=dg; ctx.beginPath();ctx.arc(rXc,rYc,14,0,Math.PI*2);ctx.fill();
            // Body
            ctx.fillStyle=dark?'#00ffb8':'#006090';
            ctx.beginPath();ctx.arc(rXc,rYc,6,0,Math.PI*2);ctx.fill();
            ctx.fillStyle='#ffffff';
            ctx.beginPath();ctx.arc(rXc,rYc,2.5,0,Math.PI*2);ctx.fill();
            // Label box
            const rLbX=rXc+10, rLbY=rYc-18;
            ctx.fillStyle=dark?'rgba(6,13,25,0.88)':'rgba(240,248,255,0.92)';
            ctx.fillRect(rLbX,rLbY,58,26);
            ctx.strokeStyle=dark?'rgba(0,200,160,0.40)':'rgba(0,100,150,0.40)';
            ctx.lineWidth=0.8; ctx.strokeRect(rLbX,rLbY,58,26);
            ctx.fillStyle=dark?'rgba(0,230,175,0.95)':'rgba(0,90,140,0.95)';
            ctx.font='bold 7.5px "JetBrains Mono",monospace'; ctx.textAlign='left';
            ctx.fillText('ROUTER',rLbX+5,rLbY+10);
            ctx.fillStyle=dark?'rgba(0,180,140,0.58)':'rgba(0,80,120,0.58)';
            ctx.font='5.5px "JetBrains Mono",monospace';
            ctx.fillText(`${(RX*ROOM_W).toFixed(1)},${(RY*ROOM_H).toFixed(1)}m`,rLbX+5,rLbY+20);

            // ── DETECTION MARKERS ────────────────────────────────────────────
            const pulse=0.5+0.5*Math.sin(t*3.0);
            detHistRef.current.slice(0,8).forEach((det,i)=>{
                if(det.x==null) return;
                const dx=mg.l+det.x*dW, dy=mg.t+det.y*dH;
                const [cr,cg,cb]=TYPE_RGB[det.type]||TYPE_RGB.adult;
                const alpha=Math.max(0.12,1-i*0.12);

                if(i===0){
                    // Large pulsing ring
                    ctx.strokeStyle=`rgba(${cr},${cg},${cb},${alpha*(0.50+pulse*0.20)})`;
                    ctx.lineWidth=2; ctx.beginPath();ctx.arc(dx,dy,18+pulse*6,0,Math.PI*2);ctx.stroke();
                    ctx.strokeStyle=`rgba(${cr},${cg},${cb},${alpha*0.20})`;
                    ctx.lineWidth=1; ctx.beginPath();ctx.arc(dx,dy,28+pulse*4,0,Math.PI*2);ctx.stroke();
                    // Filled dot
                    const dg2=ctx.createRadialGradient(dx,dy,0,dx,dy,8);
                    dg2.addColorStop(0,`rgba(${cr},${cg},${cb},0.90)`);
                    dg2.addColorStop(1,`rgba(${cr},${cg},${cb},0)`);
                    ctx.fillStyle=dg2;ctx.beginPath();ctx.arc(dx,dy,8,0,Math.PI*2);ctx.fill();
                }

                // Crosshair
                const arm=i===0?13:7;
                ctx.strokeStyle=`rgba(${cr},${cg},${cb},${alpha*0.85})`; ctx.lineWidth=i===0?1.8:1.2;
                ctx.beginPath();
                ctx.moveTo(dx-arm,dy);ctx.lineTo(dx-4,dy);
                ctx.moveTo(dx+4,dy);ctx.lineTo(dx+arm,dy);
                ctx.moveTo(dx,dy-arm);ctx.lineTo(dx,dy-4);
                ctx.moveTo(dx,dy+4);ctx.lineTo(dx,dy+arm);
                ctx.stroke();

                // Center dot
                ctx.fillStyle=`rgba(${cr},${cg},${cb},${alpha})`;
                ctx.beginPath();ctx.arc(dx,dy,i===0?5:3,0,Math.PI*2);ctx.fill();

                // Info box (only for last 2 detections)
                if(i<2){
                    const boxW=72, boxH=28;
                    const boxX=dx+14, boxY=dy-boxH-2;
                    ctx.fillStyle=dark?'rgba(6,13,25,0.92)':'rgba(240,248,255,0.95)';
                    ctx.fillRect(boxX,boxY,boxW,boxH);
                    ctx.strokeStyle=`rgba(${cr},${cg},${cb},0.55)`;
                    ctx.lineWidth=1; ctx.strokeRect(boxX,boxY,boxW,boxH);
                    // Left accent bar
                    ctx.fillStyle=`rgba(${cr},${cg},${cb},0.85)`;
                    ctx.fillRect(boxX,boxY,3,boxH);
                    // Type icon + label
                    ctx.font='bold 8px sans-serif'; ctx.textAlign='left';
                    ctx.fillStyle=`rgba(${cr},${cg},${cb},0.95)`;
                    ctx.fillText(`${TYPE_ICON[det.type]||'●'} ${det.label}`,boxX+6,boxY+10);
                    ctx.fillStyle=dark?'rgba(130,155,185,0.82)':'rgba(55,80,115,0.80)';
                    ctx.font='6px "JetBrains Mono",monospace';
                    ctx.fillText(`${det.distanceM}m · ${det.confidence}%`,boxX+6,boxY+21);
                }
            });

            // Live active reticle
            const live=detectionRef?.current;
            if(live&&live.x!=null){
                const lx=mg.l+live.x*dW, ly=mg.t+live.y*dH;
                const [cr,cg,cb]=TYPE_RGB[live.type]||TYPE_RGB.adult;
                const la=live.alpha??1;
                const bO=13,bs=8;
                ctx.strokeStyle=`rgba(${cr},${cg},${cb},${la*0.95})`;ctx.lineWidth=2.2;
                ctx.beginPath();
                ctx.moveTo(lx-bO,ly-bO+bs);ctx.lineTo(lx-bO,ly-bO);ctx.lineTo(lx-bO+bs,ly-bO);
                ctx.moveTo(lx+bO-bs,ly-bO);ctx.lineTo(lx+bO,ly-bO);ctx.lineTo(lx+bO,ly-bO+bs);
                ctx.moveTo(lx+bO,ly+bO-bs);ctx.lineTo(lx+bO,ly+bO);ctx.lineTo(lx+bO-bs,ly+bO);
                ctx.moveTo(lx-bO+bs,ly+bO);ctx.lineTo(lx-bO,ly+bO);ctx.lineTo(lx-bO,ly+bO-bs);
                ctx.stroke();
                ctx.fillStyle=`rgba(${cr},${cg},${cb},${la})`;
                ctx.beginPath();ctx.arc(lx,ly,4,0,Math.PI*2);ctx.fill();
            }

            // ── HUD ──────────────────────────────────────────────────────────
            drawHUD(ctx,CW,CH,mg,dW,dH,X,Y,W,dark,t,scanAngle,true);

            animRef.current=requestAnimationFrame(draw);
        };

        function drawHUD(ctx,CW,CH,mg,dW,dH,X,Y,W,dark,t,scanAngle,scanning){
            // Top-left
            ctx.fillStyle=dark?'rgba(0,170,130,0.62)':'rgba(0,80,125,0.72)';
            ctx.font='bold 7px "JetBrains Mono",monospace'; ctx.textAlign='left';
            ctx.fillText(scanning?`⟳ ${Math.round(scanAngle*(180/Math.PI))%360}°  ·  ACTIVO`:'PLANO ARQUITECTÓNICO',mg.l,mg.t-14);
            // Top-right
            ctx.fillStyle=dark?'rgba(0,210,165,0.65)':'rgba(0,90,140,0.70)';
            ctx.font='bold 8px "JetBrains Mono",monospace'; ctx.textAlign='right';
            ctx.fillText('PLANO WiFi · EN VIVO',CW-mg.r,mg.t-14);
            ctx.fillStyle=dark?'rgba(0,160,130,0.38)':'rgba(0,75,115,0.42)';
            ctx.font='5.5px "JetBrains Mono",monospace';
            ctx.fillText(`${ROOM_W}m × ${ROOM_H}m`,CW-mg.r,mg.t-5);
            // Axis labels
            ctx.fillStyle=dark?'rgba(0,170,130,0.50)':'rgba(0,80,120,0.60)';
            ctx.font='bold 8px "JetBrains Mono",monospace'; ctx.textAlign='center';
            ctx.fillText(`${ROOM_W} m`,mg.l+dW/2,CH-14);
            ctx.save();ctx.translate(16,mg.t+dH/2);ctx.rotate(-Math.PI/2);
            ctx.fillText(`${ROOM_H} m`,0,0);ctx.restore();
            // Signal legend (only when scanning)
            if(scanning){
                const lgX=mg.l,lgY=CH-mg.b+14,lgW=86,lgH=6;
                const lg=ctx.createLinearGradient(lgX,lgY,lgX+lgW,lgY);
                if(dark){
                    lg.addColorStop(0,'rgba(0,20,50,1)');lg.addColorStop(0.40,'rgba(0,120,190,1)');
                    lg.addColorStop(1,'rgba(0,220,180,1)');
                }else{
                    lg.addColorStop(0,'rgba(180,220,255,1)');lg.addColorStop(0.45,'rgba(80,160,220,1)');
                    lg.addColorStop(1,'rgba(20,80,160,1)');
                }
                ctx.fillStyle=lg;ctx.fillRect(lgX,lgY,lgW,lgH);
                ctx.strokeStyle=dark?'rgba(0,180,145,0.25)':'rgba(0,80,120,0.25)';
                ctx.lineWidth=0.5;ctx.strokeRect(lgX,lgY,lgW,lgH);
                ctx.fillStyle=dark?'rgba(0,160,125,0.55)':'rgba(0,75,115,0.62)';
                ctx.font='5px "JetBrains Mono",monospace';
                ctx.textAlign='left';ctx.fillText('sin señal',lgX,lgY+lgH+8);
                ctx.textAlign='right';ctx.fillText('cobertura óptima',lgX+lgW,lgY+lgH+8);
            }
            // Scale bar
            const mPx=dW/ROOM_W,sbL=mPx*2;
            const sbX=CW-mg.r-sbL,sbY=CH-mg.b+18;
            ctx.strokeStyle=dark?'rgba(0,180,145,0.50)':'rgba(0,80,120,0.55)';
            ctx.lineWidth=1.5;
            ctx.beginPath();
            ctx.moveTo(sbX,sbY);ctx.lineTo(sbX+sbL,sbY);
            ctx.moveTo(sbX,sbY-3);ctx.lineTo(sbX,sbY+3);
            ctx.moveTo(sbX+sbL,sbY-3);ctx.lineTo(sbX+sbL,sbY+3);
            ctx.stroke();
            ctx.fillStyle=dark?'rgba(0,160,125,0.55)':'rgba(0,75,115,0.62)';
            ctx.font='6px "JetBrains Mono",monospace';ctx.textAlign='center';
            ctx.fillText('2 m',sbX+sbL/2,sbY+11);
            // North arrow
            const nX=mg.l+14,nY=mg.t+14;
            ctx.strokeStyle=dark?'rgba(0,180,145,0.55)':'rgba(0,80,120,0.55)';
            ctx.lineWidth=1.2;
            ctx.beginPath();ctx.moveTo(nX,nY+8);ctx.lineTo(nX,nY-8);ctx.stroke();
            ctx.fillStyle=dark?'rgba(0,180,145,0.65)':'rgba(0,80,120,0.65)';
            ctx.beginPath();ctx.moveTo(nX,nY-8);ctx.lineTo(nX-3,nY-1);ctx.lineTo(nX+3,nY-1);ctx.closePath();ctx.fill();
            ctx.font='bold 7px "JetBrains Mono",monospace';ctx.textAlign='center';
            ctx.fillText('N',nX,nY+18);
        }

        animRef.current=requestAnimationFrame(draw);
        return()=>{ cancelAnimationFrame(animRef.current); ro.disconnect(); };
    },[]);

    return <canvas ref={canvasRef} className="w-full h-full" style={{display:'block'}}/>;
};

export default FloorPlanCanvas;
