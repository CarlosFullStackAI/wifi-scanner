import React, { useRef, useEffect } from 'react';

const ROOM_W = 10, ROOM_H = 8;
const RX = 0.28, RY = 0.48;
const GRID_W = 100, GRID_H = 80;
const WT = 0.18;       // wall thickness (m)
const DOOR_W = 0.90;   // door width (m)

const OBSTACLES = [
    { x:3.80, y:WT,   w:0.22, h:2.82, atten:0.75, label:'Tabique', rgb:[100,160,180], echo:[150,210,240] },
    { x:7.00, y:0.50, w:0.68, h:1.95, atten:0.55, label:'Armario', rgb:[180,120,55],  echo:[220,160,85]  },
    { x:1.35, y:5.40, w:2.30, h:0.95, atten:0.42, label:'Sofá',    rgb:[120,80,210],  echo:[170,130,255] },
    { x:8.40, y:3.60, w:0.55, h:0.72, atten:0.68, label:'Nevera',  rgb:[80,180,220],  echo:[120,220,255] },
    { x:5.00, y:5.90, w:1.85, h:0.55, atten:0.38, label:'Mesa',    rgb:[200,150,75],  echo:[240,190,110] },
];

function rayHits(x1,y1,x2,y2,o){
    const dx=x2-x1,dy=y2-y1;
    let mn=0.0001,mx=1;
    if(Math.abs(dx)<1e-9){if(x1<o.x||x1>o.x+o.w)return false;}
    else{const a=(o.x-x1)/dx,b=(o.x+o.w-x1)/dx;mn=Math.max(mn,Math.min(a,b));mx=Math.min(mx,Math.max(a,b));if(mn>mx)return false;}
    if(Math.abs(dy)<1e-9){if(y1<o.y||y1>o.y+o.h)return false;}
    else{const a=(o.y-y1)/dy,b=(o.y+o.h-y1)/dy;mn=Math.max(mn,Math.min(a,b));mx=Math.min(mx,Math.max(a,b));if(mn>mx)return false;}
    return true;
}

const SIGNAL_MAP = (() => {
    const map = new Float32Array(GRID_W*GRID_H);
    const rx=RX*ROOM_W, ry=RY*ROOM_H;
    for(let gy=0;gy<GRID_H;gy++) for(let gx=0;gx<GRID_W;gx++){
        const px=((gx+.5)/GRID_W)*ROOM_W, py=((gy+.5)/GRID_H)*ROOM_H;
        const d=Math.sqrt((px-rx)**2+(py-ry)**2)||0.01;
        let s=1/Math.pow(Math.max(d,0.22),1.75);
        for(const o of OBSTACLES) if(rayHits(rx,ry,px,py,o)) s*=(1-o.atten*0.88);
        map[gy*GRID_W+gx]=s;
    }
    let mx=0; for(const v of map) if(v>mx) mx=v;
    for(let i=0;i<map.length;i++) map[i]/=mx;
    return map;
})();

const OBS_ANGLES = OBSTACLES.map(o=>Math.atan2(o.y+o.h/2-RY*ROOM_H, o.x+o.w/2-RX*ROOM_W));

function sigRGBA(v,dark){
    if(dark){
        if(v<0.08) return [0,6,18,Math.floor(v*30)];
        if(v<0.25){const k=(v-0.08)/0.17;return [0,Math.floor(k*58),Math.floor(14+k*82),Math.floor(20+k*92)];}
        if(v<0.50){const k=(v-0.25)/0.25;return [0,Math.floor(58+k*132),Math.floor(96+k*106),Math.floor(112+k*90)];}
        if(v<0.75){const k=(v-0.50)/0.25;return [Math.floor(k*14),Math.floor(190+k*60),Math.floor(202+k*52),Math.floor(202+k*32)];}
        {const k=(v-0.75)/0.25;return [Math.floor(14+k*230),255,Math.floor(254-k*22),248];}
    }else{
        if(v<0.10) return [212,228,244,Math.floor(v*50)];
        if(v<0.35){const k=(v-0.10)/0.25;return [Math.floor(212-k*72),Math.floor(228-k*52),244,Math.floor(14+k*112)];}
        if(v<0.65){const k=(v-0.35)/0.30;return [Math.floor(140-k*92),Math.floor(176-k*72),Math.floor(244-k*72),Math.floor(126+k*82)];}
        {const k=(v-0.65)/0.35;return [Math.floor(48-k*34),Math.floor(104-k*74),Math.floor(172-k*104),Math.floor(208+k*42)];}
    }
}

const TYPE_RGB={bird:[56,189,248],rabbit:[167,139,250],animal:[251,191,36],adolescent:[251,146,60],adult:[248,113,113]};

// ─────────────────────────────────────────────────────────────────────────────
const FloorPlanCanvas = ({ isScanning, detectionRef, detectionHistory=[], isDark }) => {
    const canvasRef  = useRef(null);
    const animRef    = useRef(null);
    const isDarkRef  = useRef(isDark);
    const isScanRef  = useRef(isScanning);
    const detHistRef = useRef(detectionHistory);

    useEffect(()=>{ isDarkRef.current=isDark; },          [isDark]);
    useEffect(()=>{ isScanRef.current=isScanning; },      [isScanning]);
    useEffect(()=>{ detHistRef.current=detectionHistory; },[detectionHistory]);

    useEffect(()=>{
        const canvas=canvasRef.current; if(!canvas) return;
        const ctx=canvas.getContext('2d');

        const hmC=document.createElement('canvas'); hmC.width=GRID_W; hmC.height=GRID_H;
        const hmX=hmC.getContext('2d'); const hmImg=hmX.createImageData(GRID_W,GRID_H);
        let pC=document.createElement('canvas'), pX=pC.getContext('2d');

        let t=0, scanAngle=0, prevScan=0, scanCount=0;
        const echoes=[], pings=[], obsGlow=OBSTACLES.map(()=>0);

        const resize=()=>{
            canvas.width=canvas.offsetWidth; canvas.height=canvas.offsetHeight;
            pC.width=canvas.width; pC.height=canvas.height;
            pX=pC.getContext('2d');
            pX.fillStyle=isDarkRef.current?'#060d18':'#dce8f2';
            pX.fillRect(0,0,canvas.width,canvas.height);
        };
        const ro=new ResizeObserver(resize); ro.observe(canvas); resize();

        // ── Drawing functions (defined once, X/Y/W/H passed per-frame) ────────

        const drawFloor=(X,Y,W,H,dark)=>{
            // Interior floor
            ctx.fillStyle=dark?'#07101f':'#edf4fa';
            ctx.fillRect(X(WT),Y(WT),W(ROOM_W-WT*2),H(ROOM_H-WT*2));
            // Subtle tile grid
            ctx.strokeStyle=dark?'rgba(20,45,75,0.55)':'rgba(150,175,205,0.30)';
            ctx.lineWidth=0.5;
            for(let i=1;i<10;i++){ctx.beginPath();ctx.moveTo(X(i),Y(WT));ctx.lineTo(X(i),Y(ROOM_H-WT));ctx.stroke();}
            for(let i=1;i<8;i++){ctx.beginPath();ctx.moveTo(X(WT),Y(i));ctx.lineTo(X(ROOM_W-WT),Y(i));ctx.stroke();}
        };

        const drawExternalWalls=(X,Y,W,H,dark)=>{
            ctx.fillStyle=dark?'#1a2535':'#5a6a82';
            // Top wall: gap at x=5.5–7.5 (window)
            ctx.fillRect(X(0),Y(0),W(5.5),H(WT));
            ctx.fillRect(X(7.5),Y(0),W(2.5),H(WT));
            // Bottom wall: gap at x=1.0–1.9 (door)
            ctx.fillRect(X(0),Y(ROOM_H-WT),W(1.0),H(WT));
            ctx.fillRect(X(1.0+DOOR_W),Y(ROOM_H-WT),W(ROOM_W-1.0-DOOR_W),H(WT));
            // Left wall (full)
            ctx.fillRect(X(0),Y(0),W(WT),H(ROOM_H));
            // Right wall: gap at y=0.8–2.4 (window)
            ctx.fillRect(X(ROOM_W-WT),Y(0),W(WT),H(0.8));
            ctx.fillRect(X(ROOM_W-WT),Y(2.4),W(WT),H(ROOM_H-2.4));
            // Wall inner edge highlight
            ctx.strokeStyle=dark?'rgba(80,110,150,0.30)':'rgba(170,190,215,0.45)';
            ctx.lineWidth=0.7;
            ctx.strokeRect(X(WT),Y(WT),W(ROOM_W-WT*2),H(ROOM_H-WT*2));
        };

        const drawWindows=(X,Y,W,H,dark)=>{
            const wGlass=dark?'rgba(80,160,220,0.12)':'rgba(100,180,240,0.22)';
            const wLine=dark?'rgba(90,170,230,0.50)':'rgba(60,140,210,0.65)';
            const wStroke=dark?'rgba(90,170,230,0.80)':'rgba(50,130,200,0.85)';

            // Right wall window (y=0.8–2.4)
            const wx=X(ROOM_W-WT),wy=Y(0.8),ww=W(WT),wh=H(1.6);
            ctx.fillStyle=wGlass; ctx.fillRect(wx,wy,ww,wh);
            ctx.strokeStyle=wLine; ctx.lineWidth=0.6;
            for(let yi=wy+4;yi<wy+wh;yi+=5){ctx.beginPath();ctx.moveTo(wx,yi);ctx.lineTo(wx+ww,yi);ctx.stroke();}
            ctx.strokeStyle=wStroke; ctx.lineWidth=1.2; ctx.strokeRect(wx,wy,ww,wh);

            // Top wall window (x=5.5–7.5)
            const wx2=X(5.5),wy2=Y(0),ww2=W(2.0),wh2=H(WT);
            ctx.fillStyle=wGlass; ctx.fillRect(wx2,wy2,ww2,wh2);
            ctx.strokeStyle=wLine; ctx.lineWidth=0.6;
            for(let xi=wx2+4;xi<wx2+ww2;xi+=5){ctx.beginPath();ctx.moveTo(xi,wy2);ctx.lineTo(xi,wy2+wh2);ctx.stroke();}
            ctx.strokeStyle=wStroke; ctx.lineWidth=1.2; ctx.strokeRect(wx2,wy2,ww2,wh2);

            // Window labels
            ctx.fillStyle=dark?'rgba(90,170,230,0.55)':'rgba(40,120,190,0.60)';
            ctx.font='5px "JetBrains Mono",monospace'; ctx.textAlign='center';
            ctx.fillText('VNT',X(ROOM_W-WT/2),Y(1.6));
            ctx.fillText('VENTANA',X(6.5),Y(WT/2)+1);
        };

        const drawInternalWall=(X,Y,W,H,dark)=>{
            // Tabique wall segment (y=WT to y=3.0)
            ctx.fillStyle=dark?'#1a2535':'#5a6a82';
            ctx.fillRect(X(3.80),Y(WT),W(0.22),H(2.82));
            // Inner edge highlight
            ctx.strokeStyle=dark?'rgba(80,110,150,0.30)':'rgba(170,190,215,0.45)';
            ctx.lineWidth=0.7;
            ctx.strokeRect(X(3.80),Y(WT),W(0.22),H(2.82));

            // Door frame lines at opening
            ctx.strokeStyle=dark?'rgba(180,210,240,0.65)':'rgba(80,120,160,0.70)';
            ctx.lineWidth=1.0;
            ctx.beginPath();
            ctx.moveTo(X(3.80),Y(3.0)); ctx.lineTo(X(4.02),Y(3.0));
            ctx.stroke();

            // Door swing arc (swings right into right room)
            ctx.strokeStyle=dark?'rgba(180,210,240,0.30)':'rgba(80,120,160,0.32)';
            ctx.setLineDash([3,3]); ctx.lineWidth=0.9;
            ctx.beginPath();
            ctx.arc(X(4.02),Y(3.0),W(DOOR_W),Math.PI/2,Math.PI);
            ctx.stroke(); ctx.setLineDash([]);

            // Door leaf line
            ctx.strokeStyle=dark?'rgba(180,210,240,0.55)':'rgba(80,120,160,0.60)';
            ctx.lineWidth=1.1;
            ctx.beginPath();
            ctx.moveTo(X(4.02),Y(3.0)); ctx.lineTo(X(4.02),Y(3.0+DOOR_W));
            ctx.stroke();
        };

        const drawExternalDoor=(X,Y,W,H,dark)=>{
            // Door at bottom wall x=1.0–1.9, swings inward (upward in room)
            ctx.strokeStyle=dark?'rgba(180,210,240,0.30)':'rgba(80,120,160,0.32)';
            ctx.setLineDash([3,3]); ctx.lineWidth=0.9;
            ctx.beginPath();
            ctx.arc(X(1.0),Y(ROOM_H-WT),W(DOOR_W),-Math.PI/2,0);
            ctx.stroke(); ctx.setLineDash([]);
            ctx.strokeStyle=dark?'rgba(180,210,240,0.55)':'rgba(80,120,160,0.60)';
            ctx.lineWidth=1.1;
            ctx.beginPath();
            ctx.moveTo(X(1.0),Y(ROOM_H-WT)); ctx.lineTo(X(1.0+DOOR_W),Y(ROOM_H-WT));
            ctx.stroke();
            // "D" label
            ctx.fillStyle=dark?'rgba(180,210,240,0.45)':'rgba(80,120,160,0.55)';
            ctx.font='5px "JetBrains Mono",monospace'; ctx.textAlign='center';
            ctx.fillText('PUERTA',X(1.45),Y(ROOM_H-WT)-3);
        };

        const drawSofa=(X,Y,W,H,dark)=>{
            const ox=X(1.35),oy=Y(5.40),ow=W(2.30),oh=H(0.95);
            const bH=H(0.24), aW=W(0.20);

            // Shadow
            ctx.fillStyle=dark?'rgba(0,0,0,0.30)':'rgba(0,0,0,0.10)';
            ctx.fillRect(ox+3,oy+3,ow,oh);

            // Backrest (top strip)
            ctx.fillStyle=dark?'rgba(55,32,108,0.95)':'rgba(108,72,188,0.85)';
            ctx.fillRect(ox,oy,ow,bH);
            // Left armrest
            ctx.fillRect(ox,oy,aW,oh);
            // Right armrest
            ctx.fillRect(ox+ow-aW,oy,aW,oh);
            // Seat
            ctx.fillStyle=dark?'rgba(72,44,138,0.90)':'rgba(130,90,210,0.78)';
            ctx.fillRect(ox+aW,oy+bH,ow-aW*2,oh-bH);
            // Cushion dividers
            ctx.strokeStyle=dark?'rgba(140,95,245,0.35)':'rgba(90,50,170,0.30)';
            ctx.lineWidth=0.8;
            const cd=3, cStep=(ow-aW*2)/cd;
            for(let i=1;i<cd;i++){
                const lx=ox+aW+i*cStep;
                ctx.beginPath();ctx.moveTo(lx,oy+bH);ctx.lineTo(lx,oy+oh);ctx.stroke();
            }
            // Outline
            ctx.strokeStyle=dark?'rgba(155,100,255,0.72)':'rgba(95,52,175,0.80)';
            ctx.lineWidth=1.3; ctx.strokeRect(ox,oy,ow,oh);
            // Label
            ctx.fillStyle=dark?'rgba(175,130,255,0.90)':'rgba(80,42,158,0.92)';
            ctx.font=`bold ${Math.max(6,Math.min(9,W(0.48)))}px "JetBrains Mono",monospace`;
            ctx.textAlign='center'; ctx.textBaseline='middle';
            ctx.fillText('SOFÁ',ox+ow/2,oy+oh*0.62);
            ctx.textBaseline='alphabetic';
        };

        const drawWardrobe=(X,Y,W,H,dark)=>{
            const ox=X(7.00),oy=Y(0.50),ow=W(0.68),oh=H(1.95);

            ctx.fillStyle=dark?'rgba(0,0,0,0.25)':'rgba(0,0,0,0.08)';
            ctx.fillRect(ox+3,oy+3,ow,oh);

            ctx.fillStyle=dark?'rgba(110,72,22,0.92)':'rgba(175,125,62,0.78)';
            ctx.fillRect(ox,oy,ow,oh);

            // X diagonals (wardrobe symbol)
            ctx.strokeStyle=dark?'rgba(210,155,75,0.50)':'rgba(140,90,30,0.55)';
            ctx.lineWidth=1.0;
            ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(ox+ow,oy+oh);ctx.stroke();
            ctx.beginPath();ctx.moveTo(ox+ow,oy);ctx.lineTo(ox,oy+oh);ctx.stroke();

            // Center hinge line
            ctx.strokeStyle=dark?'rgba(210,155,75,0.28)':'rgba(140,90,30,0.30)';
            ctx.setLineDash([2,2]); ctx.lineWidth=0.7;
            ctx.beginPath();ctx.moveTo(ox,oy+oh/2);ctx.lineTo(ox+ow,oy+oh/2);ctx.stroke();
            ctx.setLineDash([]);

            // Door knobs
            ctx.fillStyle=dark?'rgba(230,175,90,0.75)':'rgba(160,110,45,0.80)';
            ctx.beginPath();ctx.arc(ox+ow*0.80,oy+oh*0.28,2.2,0,Math.PI*2);ctx.fill();
            ctx.beginPath();ctx.arc(ox+ow*0.80,oy+oh*0.72,2.2,0,Math.PI*2);ctx.fill();

            ctx.strokeStyle=dark?'rgba(225,162,78,0.78)':'rgba(148,98,38,0.85)';
            ctx.lineWidth=1.3; ctx.strokeRect(ox,oy,ow,oh);

            ctx.fillStyle=dark?'rgba(225,162,78,0.90)':'rgba(140,92,34,0.92)';
            ctx.font=`bold ${Math.max(5,Math.min(8,W(0.42)))}px "JetBrains Mono",monospace`;
            ctx.textAlign='center'; ctx.textBaseline='middle';
            ctx.fillText('ARM.',ox+ow/2,oy+oh/2);
            ctx.textBaseline='alphabetic';
        };

        const drawFridge=(X,Y,W,H,dark)=>{
            const ox=X(8.40),oy=Y(3.60),ow=W(0.55),oh=H(0.72);

            ctx.fillStyle=dark?'rgba(0,0,0,0.25)':'rgba(0,0,0,0.08)';
            ctx.fillRect(ox+3,oy+3,ow,oh);

            // Body
            ctx.fillStyle=dark?'rgba(32,105,148,0.92)':'rgba(72,165,218,0.75)';
            ctx.fillRect(ox,oy,ow,oh);
            // Freezer top section
            ctx.fillStyle=dark?'rgba(22,78,118,0.95)':'rgba(52,138,195,0.80)';
            ctx.fillRect(ox,oy,ow,oh*0.35);
            // Divider
            ctx.strokeStyle=dark?'rgba(80,185,235,0.55)':'rgba(40,132,192,0.65)';
            ctx.lineWidth=0.9;
            ctx.beginPath();ctx.moveTo(ox,oy+oh*0.35);ctx.lineTo(ox+ow,oy+oh*0.35);ctx.stroke();
            // Handles
            ctx.strokeStyle=dark?'rgba(90,195,245,0.80)':'rgba(38,128,188,0.85)';
            ctx.lineWidth=2.0; ctx.lineCap='round';
            ctx.beginPath();ctx.moveTo(ox+ow-5,oy+oh*0.12);ctx.lineTo(ox+ow-5,oy+oh*0.27);ctx.stroke();
            ctx.beginPath();ctx.moveTo(ox+ow-5,oy+oh*0.48);ctx.lineTo(ox+ow-5,oy+oh*0.82);ctx.stroke();
            ctx.lineCap='butt';
            // Outline
            ctx.strokeStyle=dark?'rgba(80,195,240,0.80)':'rgba(38,130,195,0.85)';
            ctx.lineWidth=1.3; ctx.strokeRect(ox,oy,ow,oh);

            ctx.fillStyle=dark?'rgba(105,208,252,0.90)':'rgba(28,112,172,0.92)';
            ctx.font=`bold ${Math.max(5,Math.min(7,W(0.40)))}px "JetBrains Mono",monospace`;
            ctx.textAlign='center'; ctx.textBaseline='middle';
            ctx.fillText('NEV.',ox+ow/2,oy+oh*0.62);
            ctx.textBaseline='alphabetic';
        };

        const drawTable=(X,Y,W,H,dark)=>{
            const ox=X(5.00),oy=Y(5.90),ow=W(1.85),oh=H(0.55);
            const cW=W(0.28),cH=H(0.22),gap=3;
            const nC=3, cStep=ow/(nC+1);

            ctx.fillStyle=dark?'rgba(0,0,0,0.22)':'rgba(0,0,0,0.07)';
            ctx.fillRect(ox+3,oy+3,ow,oh);

            // Chairs above table
            ctx.fillStyle=dark?'rgba(150,100,35,0.72)':'rgba(205,158,72,0.62)';
            for(let i=0;i<nC;i++){
                const cx=ox+(i+1)*cStep-cW/2;
                ctx.fillRect(cx,oy-gap-cH,cW,cH);
            }
            // Chairs below table
            for(let i=0;i<nC;i++){
                const cx=ox+(i+1)*cStep-cW/2;
                ctx.fillRect(cx,oy+oh+gap,cW,cH);
            }
            // Table top
            ctx.fillStyle=dark?'rgba(155,105,38,0.92)':'rgba(205,158,72,0.80)';
            ctx.fillRect(ox,oy,ow,oh);
            // Wood grain lines
            ctx.strokeStyle=dark?'rgba(185,135,58,0.22)':'rgba(165,120,45,0.25)';
            ctx.lineWidth=0.5;
            for(let lx=ox+W(0.3);lx<ox+ow-2;lx+=W(0.35)){
                ctx.beginPath();ctx.moveTo(lx,oy+2);ctx.lineTo(lx,oy+oh-2);ctx.stroke();
            }
            // Outlines
            ctx.strokeStyle=dark?'rgba(218,162,75,0.80)':'rgba(155,110,38,0.85)';
            ctx.lineWidth=1.3;
            ctx.strokeRect(ox,oy,ow,oh);
            for(let i=0;i<nC;i++){
                ctx.strokeRect(ox+(i+1)*cStep-cW/2,oy-gap-cH,cW,cH);
                ctx.strokeRect(ox+(i+1)*cStep-cW/2,oy+oh+gap,cW,cH);
            }

            ctx.fillStyle=dark?'rgba(218,165,75,0.90)':'rgba(148,104,35,0.92)';
            ctx.font=`bold ${Math.max(5,Math.min(7,W(0.38)))}px "JetBrains Mono",monospace`;
            ctx.textAlign='center'; ctx.textBaseline='middle';
            ctx.fillText('MESA',ox+ow/2,oy+oh/2);
            ctx.textBaseline='alphabetic';
        };

        const drawRoomLabels=(X,Y,dark)=>{
            ctx.font='bold 7.5px "JetBrains Mono",monospace'; ctx.textAlign='center';
            ctx.fillStyle=dark?'rgba(50,80,115,0.55)':'rgba(110,140,175,0.60)';
            ctx.fillText('SALA',X(1.90),Y(1.50));
            ctx.fillText('DORMITORIO',X(7.00),Y(1.55));
            ctx.fillText('COMEDOR',X(6.50),Y(5.10));
        };

        const sweepEnd=(a,X,Y)=>{
            const rx0=RX*ROOM_W,ry0=RY*ROOM_H,dx=Math.cos(a),dy=Math.sin(a);
            let mT=40;
            if(dx<-1e-9)mT=Math.min(mT,(0-rx0)/dx); if(dx>1e-9)mT=Math.min(mT,(ROOM_W-rx0)/dx);
            if(dy<-1e-9)mT=Math.min(mT,(0-ry0)/dy); if(dy>1e-9)mT=Math.min(mT,(ROOM_H-ry0)/dy);
            return{x:X(rx0+dx*mT),y:Y(ry0+dy*mT)};
        };

        // ── MAIN DRAW LOOP ────────────────────────────────────────────────────
        const draw=()=>{
            const CW=canvas.width,CH=canvas.height;
            const dark=isDarkRef.current,scan=isScanRef.current;
            if(CW===0||CH===0){animRef.current=requestAnimationFrame(draw);return;}

            ctx.fillStyle=dark?'#060d18':'#d8eaf4';
            ctx.fillRect(0,0,CW,CH);

            const mg={l:44,r:22,t:32,b:52};
            const dW=CW-mg.l-mg.r, dH=CH-mg.t-mg.b;
            const X=(mx)=>mg.l+(mx/ROOM_W)*dW;
            const Y=(my)=>mg.t+(my/ROOM_H)*dH;
            const W=(mw)=>(mw/ROOM_W)*dW;
            const H=(mh)=>(mh/ROOM_H)*dH;
            const rXc=X(RX*ROOM_W), rYc=Y(RY*ROOM_H);

            // ── FLOOR ────────────────────────────────────────────────────────
            drawFloor(X,Y,W,H,dark);

            // ── IDLE STATE ───────────────────────────────────────────────────
            if(!scan){
                // Draw full floor plan structure even when idle
                if(scan===false){
                    drawExternalWalls(X,Y,W,H,dark);
                    drawWindows(X,Y,W,H,dark);
                    drawInternalWall(X,Y,W,H,dark);
                    drawExternalDoor(X,Y,W,H,dark);
                    drawSofa(X,Y,W,H,dark);
                    drawWardrobe(X,Y,W,H,dark);
                    drawFridge(X,Y,W,H,dark);
                    drawTable(X,Y,W,H,dark);
                    drawRoomLabels(X,Y,dark);
                }
                // Overlay message
                const cx=CW/2, cy=CH/2;
                ctx.fillStyle=dark?'rgba(6,13,24,0.72)':'rgba(220,234,244,0.80)';
                ctx.fillRect(cx-100,cy-22,200,42);
                ctx.strokeStyle=dark?'rgba(0,180,140,0.35)':'rgba(0,90,130,0.35)';
                ctx.lineWidth=1; ctx.strokeRect(cx-100,cy-22,200,42);
                ctx.fillStyle=dark?'rgba(0,210,160,0.70)':'rgba(0,90,130,0.70)';
                ctx.font='bold 11px "JetBrains Mono",monospace'; ctx.textAlign='center';
                ctx.fillText('SONAR INACTIVO',cx,cy-4);
                ctx.font='6.5px "JetBrains Mono",monospace';
                ctx.fillStyle=dark?'rgba(0,170,130,0.45)':'rgba(0,80,120,0.45)';
                ctx.fillText('Inicia el escaneo para activar',cx,cy+12);
                animRef.current=requestAnimationFrame(draw); return;
            }

            // ── TICK ─────────────────────────────────────────────────────────
            t+=0.012; prevScan=scanAngle; scanAngle=(t*0.70)%(2*Math.PI);
            if(prevScan>scanAngle) scanCount++;

            // Echo triggers
            OBS_ANGLES.forEach((oa,i)=>{
                const wrap=a=>((a%(Math.PI*2))+(Math.PI*2))%(Math.PI*2);
                const cur=wrap(scanAngle),prv=wrap(prevScan),tgt=wrap(oa);
                if(prv<=cur?(tgt>=prv&&tgt<=cur):(tgt>=prv||tgt<=cur)){
                    const o=OBSTACLES[i];
                    echoes.push({mx:o.x+o.w/2,my:o.y+o.h/2,t0:t,rgb:o.echo});
                    obsGlow[i]=1.0;
                }
            });
            obsGlow.forEach((_,i)=>{obsGlow[i]=Math.max(0,obsGlow[i]-0.025);});

            // Pings
            if(!pings.length||t-pings[pings.length-1].t0>3.5) pings.push({t0:t});
            while(pings.length&&t-pings[0].t0>5.5) pings.shift();

            // ── SIGNAL HEATMAP ───────────────────────────────────────────────
            for(let i=0;i<GRID_W*GRID_H;i++){
                const v=SIGNAL_MAP[i];
                const [r,g,b,a]=sigRGBA(v,dark);
                hmImg.data[i*4]=r;hmImg.data[i*4+1]=g;hmImg.data[i*4+2]=b;hmImg.data[i*4+3]=a;
            }
            hmX.putImageData(hmImg,0,0);
            ctx.globalAlpha=0.52;
            ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
            ctx.drawImage(hmC,mg.l,mg.t,dW,dH);
            ctx.globalAlpha=1;

            // ── WALLS & FURNITURE (drawn on top of heatmap) ──────────────────
            drawExternalWalls(X,Y,W,H,dark);
            drawWindows(X,Y,W,H,dark);
            drawInternalWall(X,Y,W,H,dark);
            drawExternalDoor(X,Y,W,H,dark);
            drawSofa(X,Y,W,H,dark);
            drawWardrobe(X,Y,W,H,dark);
            drawFridge(X,Y,W,H,dark);
            drawTable(X,Y,W,H,dark);
            drawRoomLabels(X,Y,dark);

            // ── OBSTACLE ECHO GLOW ───────────────────────────────────────────
            OBSTACLES.forEach((o,i)=>{
                if(obsGlow[i]<0.04) return;
                const [er,eg,eb]=o.echo;
                const gl=obsGlow[i];
                const ox2=X(o.x),oy2=Y(o.y),ow2=W(o.w),oh2=H(o.h);
                for(let gi=4;gi>=1;gi--){
                    ctx.strokeStyle=`rgba(${er},${eg},${eb},${gl*(0.10-gi*0.018)})`;
                    ctx.lineWidth=gi*2.5;
                    ctx.strokeRect(ox2-gi,oy2-gi,ow2+gi*2,oh2+gi*2);
                }
            });

            // ── PHOSPHOR PERSISTENCE ─────────────────────────────────────────
            pX.fillStyle=dark?'rgba(6,13,24,0.10)':'rgba(216,234,244,0.13)';
            pX.fillRect(0,0,CW,CH);

            pX.fillStyle=dark?'rgba(0,255,180,0.055)':'rgba(0,110,160,0.048)';
            pX.beginPath(); pX.moveTo(rXc,rYc);
            pX.arc(rXc,rYc,Math.max(dW,dH)*1.3,scanAngle-0.18,scanAngle);
            pX.closePath(); pX.fill();

            const sE=sweepEnd(scanAngle,X,Y);
            const sg=pX.createLinearGradient(rXc,rYc,sE.x,sE.y);
            sg.addColorStop(0,dark?'rgba(0,255,180,0)':'rgba(0,130,180,0)');
            sg.addColorStop(0.4,dark?'rgba(0,255,180,0.10)':'rgba(0,130,180,0.07)');
            sg.addColorStop(1,dark?'rgba(0,255,180,0.90)':'rgba(0,130,180,0.82)');
            pX.strokeStyle=sg; pX.lineWidth=2.5;
            pX.beginPath();pX.moveTo(rXc,rYc);pX.lineTo(sE.x,sE.y);pX.stroke();
            const sg2=pX.createLinearGradient(rXc,rYc,sE.x,sE.y);
            sg2.addColorStop(0,dark?'rgba(0,255,180,0)':'rgba(0,130,180,0)');
            sg2.addColorStop(1,dark?'rgba(0,255,180,0.18)':'rgba(0,130,180,0.14)');
            pX.strokeStyle=sg2; pX.lineWidth=8;
            pX.beginPath();pX.moveTo(rXc,rYc);pX.lineTo(sE.x,sE.y);pX.stroke();
            ctx.drawImage(pC,0,0);

            // ── SONAR PINGS ──────────────────────────────────────────────────
            pings.forEach(ping=>{
                const age=t-ping.t0;
                if(age>5) return;
                for(let pi=0;pi<4;pi++){
                    const ph=age-pi*0.55; if(ph<0) continue;
                    const frac=ph/5, r2=frac*Math.max(dW,dH)*0.72;
                    const a2=(1-frac)*(0.28-pi*0.06); if(a2<0.01) continue;
                    ctx.strokeStyle=dark?`rgba(0,255,180,${a2})`:`rgba(0,110,160,${a2})`;
                    ctx.lineWidth=2-pi*0.4;
                    ctx.beginPath();ctx.arc(rXc,rYc,r2,0,Math.PI*2);ctx.stroke();
                }
            });

            // ── ECHO MARKERS ─────────────────────────────────────────────────
            for(let ei=echoes.length-1;ei>=0;ei--){
                const e=echoes[ei],age=t-e.t0;
                if(age>3.2){echoes.splice(ei,1);continue;}
                const a2=Math.max(0,1-age/3.2);
                const ex2=X(e.mx),ey2=Y(e.my);
                const [cr,cg,cb]=e.rgb;
                for(let ri=0;ri<2;ri++){
                    ctx.strokeStyle=`rgba(${cr},${cg},${cb},${a2*(ri===0?0.75:0.38)})`;
                    ctx.lineWidth=ri===0?2:1;
                    ctx.beginPath();ctx.arc(ex2,ey2,5+age*(20+ri*12),0,Math.PI*2);ctx.stroke();
                }
                const cG=ctx.createRadialGradient(ex2,ey2,0,ex2,ey2,9+age*2);
                cG.addColorStop(0,`rgba(${cr},${cg},${cb},${a2*0.95})`);
                cG.addColorStop(1,`rgba(${cr},${cg},${cb},0)`);
                ctx.fillStyle=cG;ctx.beginPath();ctx.arc(ex2,ey2,9+age*2,0,Math.PI*2);ctx.fill();
            }

            // ── ROUTER ───────────────────────────────────────────────────────
            for(let ri=0;ri<4;ri++){
                const ph=(t*0.65+ri*0.25)%1;
                const ra=(1-ph)*0.30;
                ctx.strokeStyle=dark?`rgba(0,255,180,${ra})`:`rgba(0,110,160,${ra})`;
                ctx.lineWidth=1.2;
                ctx.beginPath();ctx.arc(rXc,rYc,5+ph*42,0,Math.PI*2);ctx.stroke();
            }
            const dGrd=ctx.createRadialGradient(rXc,rYc,0,rXc,rYc,12);
            dGrd.addColorStop(0,dark?'rgba(0,255,180,0.55)':'rgba(0,140,200,0.45)');
            dGrd.addColorStop(1,'rgba(0,0,0,0)');
            ctx.fillStyle=dGrd;ctx.beginPath();ctx.arc(rXc,rYc,12,0,Math.PI*2);ctx.fill();
            ctx.fillStyle=dark?'#00ffb8':'#005e80';
            ctx.beginPath();ctx.arc(rXc,rYc,5.5,0,Math.PI*2);ctx.fill();
            ctx.fillStyle='rgba(255,255,255,0.95)';
            ctx.beginPath();ctx.arc(rXc,rYc,2.2,0,Math.PI*2);ctx.fill();
            ctx.fillStyle=dark?'rgba(0,255,180,0.88)':'rgba(0,100,150,0.88)';
            ctx.font='bold 7px "JetBrains Mono",monospace';ctx.textAlign='left';
            ctx.fillText('ROUTER',rXc+9,rYc-4);
            ctx.fillStyle=dark?'rgba(0,200,150,0.50)':'rgba(0,90,130,0.50)';
            ctx.font='5.5px "JetBrains Mono",monospace';
            ctx.fillText(`${(RX*ROOM_W).toFixed(1)},${(RY*ROOM_H).toFixed(1)}m`,rXc+9,rYc+5);

            // ── DETECTION MARKERS ────────────────────────────────────────────
            const pulse=0.5+0.5*Math.sin(t*3.2);
            detHistRef.current.slice(0,7).forEach((det,i)=>{
                if(det.x==null) return;
                const dx3=mg.l+det.x*dW, dy3=mg.t+det.y*dH;
                const [cr,cg,cb]=TYPE_RGB[det.type]||TYPE_RGB.adult;
                const alpha=Math.max(0.1,1-i*0.13);
                if(i===0){
                    for(let ri=0;ri<3;ri++){
                        const rPh=(pulse+ri*0.33)%1;
                        ctx.strokeStyle=`rgba(${cr},${cg},${cb},${alpha*(0.42-ri*0.12)})`;
                        ctx.lineWidth=1.5-ri*0.4;
                        ctx.beginPath();ctx.arc(dx3,dy3,12+rPh*14+ri*6,0,Math.PI*2);ctx.stroke();
                    }
                }
                const arm=i===0?10:6;
                ctx.strokeStyle=`rgba(${cr},${cg},${cb},${alpha*0.78})`;ctx.lineWidth=1.2;
                ctx.beginPath();
                ctx.moveTo(dx3-arm,dy3);ctx.lineTo(dx3-3,dy3);
                ctx.moveTo(dx3+3,dy3);ctx.lineTo(dx3+arm,dy3);
                ctx.moveTo(dx3,dy3-arm);ctx.lineTo(dx3,dy3-3);
                ctx.moveTo(dx3,dy3+3);ctx.lineTo(dx3,dy3+arm);
                ctx.stroke();
                ctx.fillStyle=`rgba(${cr},${cg},${cb},${alpha})`;
                ctx.beginPath();ctx.arc(dx3,dy3,i===0?4:2.5,0,Math.PI*2);ctx.fill();
                if(i===0){
                    const lbX=dx3+12,lbY=dy3-18,lbW=66,lbH=26;
                    ctx.fillStyle=dark?'rgba(0,8,20,0.90)':'rgba(208,228,244,0.93)';
                    ctx.fillRect(lbX,lbY,lbW,lbH);
                    ctx.strokeStyle=`rgba(${cr},${cg},${cb},0.52)`;
                    ctx.lineWidth=0.8;ctx.strokeRect(lbX,lbY,lbW,lbH);
                    ctx.fillStyle=`rgba(${cr},${cg},${cb},0.95)`;
                    ctx.font='bold 7.5px "JetBrains Mono",monospace';ctx.textAlign='left';
                    ctx.fillText(det.label,lbX+5,lbY+10);
                    ctx.fillStyle=dark?'rgba(120,140,160,0.82)':'rgba(50,80,110,0.78)';
                    ctx.font='5.5px "JetBrains Mono",monospace';
                    ctx.fillText(`${det.distanceM}m · ${det.confidence}%`,lbX+5,lbY+20);
                }
            });

            // Live reticle
            const live=detectionRef?.current;
            if(live&&live.x!=null){
                const lx=mg.l+live.x*dW, ly=mg.t+live.y*dH;
                const [cr,cg,cb]=TYPE_RGB[live.type]||TYPE_RGB.adult;
                const la=live.alpha??1;
                const bO=12,bs=7;
                ctx.strokeStyle=`rgba(${cr},${cg},${cb},${la*0.95})`;ctx.lineWidth=2.2;
                ctx.beginPath();
                ctx.moveTo(lx-bO,ly-bO+bs);ctx.lineTo(lx-bO,ly-bO);ctx.lineTo(lx-bO+bs,ly-bO);
                ctx.moveTo(lx+bO-bs,ly-bO);ctx.lineTo(lx+bO,ly-bO);ctx.lineTo(lx+bO,ly-bO+bs);
                ctx.moveTo(lx+bO,ly+bO-bs);ctx.lineTo(lx+bO,ly+bO);ctx.lineTo(lx+bO-bs,ly+bO);
                ctx.moveTo(lx-bO+bs,ly+bO);ctx.lineTo(lx-bO,ly+bO);ctx.lineTo(lx-bO,ly+bO-bs);
                ctx.stroke();
                ctx.fillStyle=`rgba(${cr},${cg},${cb},${la*0.92})`;
                ctx.beginPath();ctx.arc(lx,ly,3.5,0,Math.PI*2);ctx.fill();
            }

            // ── CRT SCANLINES ────────────────────────────────────────────────
            ctx.fillStyle=dark?'rgba(0,0,0,0.07)':'rgba(0,0,0,0.028)';
            for(let sy=mg.t;sy<mg.t+dH;sy+=2) ctx.fillRect(mg.l,sy,dW,1);

            // ── VIGNETTE ─────────────────────────────────────────────────────
            const vig=ctx.createRadialGradient(CW/2,CH/2,Math.min(CW,CH)*0.25,CW/2,CH/2,Math.max(CW,CH)*0.72);
            vig.addColorStop(0,'rgba(0,0,0,0)');
            vig.addColorStop(1,dark?'rgba(0,0,0,0.55)':'rgba(0,20,40,0.14)');
            ctx.fillStyle=vig;ctx.fillRect(0,0,CW,CH);

            // ── HUD ──────────────────────────────────────────────────────────
            const deg=Math.round(scanAngle*(180/Math.PI))%360;
            ctx.fillStyle=dark?'rgba(0,180,140,0.58)':'rgba(0,90,130,0.68)';
            ctx.font='bold 7px "JetBrains Mono",monospace';ctx.textAlign='left';
            ctx.fillText(`⟳ ${String(deg).padStart(3,'0')}°  SCAN #${scanCount}`,mg.l,mg.t-12);
            ctx.fillStyle=dark?'rgba(0,255,180,0.58)':'rgba(0,110,165,0.68)';
            ctx.font='bold 7.5px "JetBrains Mono",monospace';ctx.textAlign='right';
            ctx.fillText('PLANO SONAR · EN VIVO',CW-mg.r,mg.t-12);
            ctx.fillStyle=dark?'rgba(0,180,140,0.35)':'rgba(0,80,110,0.40)';
            ctx.font='5.5px "JetBrains Mono",monospace';
            ctx.fillText(`${ROOM_W}m × ${ROOM_H}m`,CW-mg.r,mg.t-3);

            // Axis labels
            ctx.fillStyle=dark?'rgba(0,180,140,0.52)':'rgba(0,90,130,0.62)';
            ctx.font='bold 8px "JetBrains Mono",monospace';ctx.textAlign='center';
            ctx.fillText(`${ROOM_W} m`,mg.l+dW/2,CH-14);
            ctx.save();ctx.translate(15,mg.t+dH/2);ctx.rotate(-Math.PI/2);
            ctx.fillText(`${ROOM_H} m`,0,0);ctx.restore();

            // Signal legend
            const lgX=mg.l,lgY=CH-mg.b+14,lgW=82,lgH=6;
            const lg=ctx.createLinearGradient(lgX,lgY,lgX+lgW,lgY);
            if(dark){
                lg.addColorStop(0,'rgba(0,6,18,1)');lg.addColorStop(0.28,'rgba(0,72,92,1)');
                lg.addColorStop(0.58,'rgba(0,192,152,1)');lg.addColorStop(1,'rgba(215,255,240,1)');
            }else{
                lg.addColorStop(0,'rgba(205,224,240,1)');lg.addColorStop(0.45,'rgba(90,168,218,1)');
                lg.addColorStop(1,'rgba(16,70,128,1)');
            }
            ctx.fillStyle=lg;ctx.fillRect(lgX,lgY,lgW,lgH);
            ctx.strokeStyle=dark?'rgba(0,200,160,0.22)':'rgba(0,90,130,0.22)';
            ctx.lineWidth=0.5;ctx.strokeRect(lgX,lgY,lgW,lgH);
            ctx.fillStyle=dark?'rgba(0,180,140,0.52)':'rgba(0,90,130,0.58)';
            ctx.font='5px "JetBrains Mono",monospace';
            ctx.textAlign='left';ctx.fillText('sin señal',lgX,lgY+lgH+8);
            ctx.textAlign='right';ctx.fillText('óptimo',lgX+lgW,lgY+lgH+8);

            // Scale bar
            const mPx=dW/ROOM_W,sbL=mPx*2;
            const sbX=CW-mg.r-sbL,sbY=CH-mg.b+18;
            ctx.strokeStyle=dark?'rgba(0,200,160,0.48)':'rgba(0,100,150,0.52)';
            ctx.lineWidth=1.5;
            ctx.beginPath();
            ctx.moveTo(sbX,sbY);ctx.lineTo(sbX+sbL,sbY);
            ctx.moveTo(sbX,sbY-3);ctx.lineTo(sbX,sbY+3);
            ctx.moveTo(sbX+sbL,sbY-3);ctx.lineTo(sbX+sbL,sbY+3);
            ctx.stroke();
            ctx.fillStyle=dark?'rgba(0,180,140,0.52)':'rgba(0,90,130,0.58)';
            ctx.font='6px "JetBrains Mono",monospace';ctx.textAlign='center';
            ctx.fillText('2 m',sbX+sbL/2,sbY+11);

            // Zone signal badges
            [{l:'A',nx:0.18,ny:0.22},{l:'B',nx:0.72,ny:0.20},{l:'C',nx:0.20,ny:0.72},{l:'D',nx:0.68,ny:0.72}].forEach(z=>{
                const gxi=Math.floor(z.nx*GRID_W),gyi=Math.floor(z.ny*GRID_H);
                let sum=0,cnt=0;
                for(let dy2=-5;dy2<=5;dy2++) for(let dx2=-5;dx2<=5;dx2++){
                    const idx=(gyi+dy2)*GRID_W+(gxi+dx2);
                    if(idx>=0&&idx<SIGNAL_MAP.length){sum+=SIGNAL_MAP[idx];cnt++;}
                }
                const pct=Math.round((sum/cnt)*100);
                const zx=mg.l+z.nx*dW,zy=mg.t+z.ny*dH;
                const col=pct>60?[0,200,160]:pct>30?[240,180,60]:[240,80,80];
                ctx.fillStyle=dark?`rgba(${col[0]},${col[1]},${col[2]},0.10)`:`rgba(${col[0]},${col[1]},${col[2]},0.07)`;
                ctx.fillRect(zx-22,zy-10,44,20);
                ctx.strokeStyle=`rgba(${col[0]},${col[1]},${col[2]},0.22)`;
                ctx.lineWidth=0.7;ctx.strokeRect(zx-22,zy-10,44,20);
                ctx.fillStyle=`rgba(${col[0]},${col[1]},${col[2]},0.70)`;
                ctx.font='bold 6px "JetBrains Mono",monospace';ctx.textAlign='center';
                ctx.fillText(`${z.l}: ${pct}%`,zx,zy+2.5);
            });

            animRef.current=requestAnimationFrame(draw);
        };

        animRef.current=requestAnimationFrame(draw);
        return()=>{ cancelAnimationFrame(animRef.current); ro.disconnect(); };
    },[]);

    return <canvas ref={canvasRef} className="w-full h-full" style={{display:'block'}}/>;
};

export default FloorPlanCanvas;
