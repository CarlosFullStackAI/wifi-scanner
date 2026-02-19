import React, { useRef, useEffect } from 'react';

// ── Room & grid ───────────────────────────────────────────────────────────────
const ROOM_W = 10, ROOM_H = 8;
const RX = 0.28, RY = 0.48;
const GRID_W = 100, GRID_H = 80;

// ── Obstacles ─────────────────────────────────────────────────────────────────
const OBSTACLES = [
    { x:3.80, y:0.00, w:0.22, h:3.20, atten:0.72, label:'Tabique', rgb:[0,210,165],  echo:[0,255,200]   },
    { x:7.00, y:0.30, w:0.70, h:2.00, atten:0.55, label:'Armario', rgb:[210,140,40], echo:[255,180,60]  },
    { x:1.30, y:5.30, w:2.40, h:1.00, atten:0.42, label:'Sofá',    rgb:[150,80,245], echo:[190,120,255] },
    { x:8.40, y:3.50, w:0.60, h:0.80, atten:0.68, label:'Nevera',  rgb:[60,200,240], echo:[100,230,255] },
    { x:5.00, y:5.80, w:1.90, h:0.60, atten:0.38, label:'Mesa',    rgb:[240,180,60], echo:[255,220,100] },
];

// ── Ray–AABB hit test ─────────────────────────────────────────────────────────
function rayHits(x1,y1,x2,y2,o) {
    const dx=x2-x1,dy=y2-y1;
    let tMin=0.0001,tMax=1;
    if(Math.abs(dx)<1e-9){if(x1<o.x||x1>o.x+o.w)return false;}
    else{const a=(o.x-x1)/dx,b=(o.x+o.w-x1)/dx;tMin=Math.max(tMin,Math.min(a,b));tMax=Math.min(tMax,Math.max(a,b));if(tMin>tMax)return false;}
    if(Math.abs(dy)<1e-9){if(y1<o.y||y1>o.y+o.h)return false;}
    else{const a=(o.y-y1)/dy,b=(o.y+o.h-y1)/dy;tMin=Math.max(tMin,Math.min(a,b));tMax=Math.min(tMax,Math.max(a,b));if(tMin>tMax)return false;}
    return true;
}

// ── Pre-computed smooth signal map ─────────────────────────────────────────────
const SIGNAL_MAP = (() => {
    const map = new Float32Array(GRID_W * GRID_H);
    const rx = RX*ROOM_W, ry = RY*ROOM_H;
    for(let gy=0;gy<GRID_H;gy++) for(let gx=0;gx<GRID_W;gx++){
        const px=((gx+.5)/GRID_W)*ROOM_W, py=((gy+.5)/GRID_H)*ROOM_H;
        const dx=px-rx, dy=py-ry, d=Math.sqrt(dx*dx+dy*dy)||0.01;
        let s=1/Math.pow(Math.max(d,0.22),1.75);
        for(const o of OBSTACLES) if(rayHits(rx,ry,px,py,o)) s*=(1-o.atten*0.88);
        map[gy*GRID_W+gx]=s;
    }
    let mx=0; for(let i=0;i<map.length;i++) if(map[i]>mx) mx=map[i];
    for(let i=0;i<map.length;i++) map[i]/=mx;
    return map;
})();

// ── Obstacle angular positions from router ────────────────────────────────────
const OBS_ANGLES = OBSTACLES.map(o=>{
    const cx=o.x+o.w/2,cy=o.y+o.h/2;
    return Math.atan2(cy-RY*ROOM_H,cx-RX*ROOM_W);
});

// ── Signal → RGBA ─────────────────────────────────────────────────────────────
function sigRGBA(v,dark){
    if(dark){
        if(v<0.08) return [0,6,18,Math.floor(v*35)];
        if(v<0.25){const k=(v-0.08)/0.17;return [0,Math.floor(k*65),Math.floor(18+k*88),Math.floor(25+k*100)];}
        if(v<0.50){const k=(v-0.25)/0.25;return [0,Math.floor(65+k*135),Math.floor(106+k*104),Math.floor(125+k*85)];}
        if(v<0.75){const k=(v-0.50)/0.25;return [Math.floor(k*18),Math.floor(200+k*55),Math.floor(210+k*45),Math.floor(210+k*28)];}
        {const k=(v-0.75)/0.25;return [Math.floor(18+k*220),Math.floor(255),Math.floor(255-k*18),245];}
    } else {
        if(v<0.10) return [218,232,246,Math.floor(v*55)];
        if(v<0.35){const k=(v-0.10)/0.25;return [Math.floor(218-k*78),Math.floor(232-k*58),246,Math.floor(18+k*118)];}
        if(v<0.65){const k=(v-0.35)/0.30;return [Math.floor(140-k*98),Math.floor(174-k*78),Math.floor(246-k*78),Math.floor(136+k*78)];}
        {const k=(v-0.65)/0.35;return [Math.floor(42-k*32),Math.floor(96-k*72),Math.floor(168-k*100),Math.floor(214+k*38)];}
    }
}

// ── Detection type colours ────────────────────────────────────────────────────
const TYPE_RGB={bird:[56,189,248],rabbit:[167,139,250],animal:[251,191,36],adolescent:[251,146,60],adult:[248,113,113]};

// ── Rounded rect path ─────────────────────────────────────────────────────────
function rRect(c,x,y,w,h,r){
    c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.arcTo(x+w,y,x+w,y+r,r);
    c.lineTo(x+w,y+h-r);c.arcTo(x+w,y+h,x+w-r,y+h,r);
    c.lineTo(x+r,y+h);c.arcTo(x,y+h,x,y+h-r,r);
    c.lineTo(x,y+r);c.arcTo(x,y,x+r,y,r);c.closePath();
}

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

        // Offscreen: heatmap source
        const hmC=document.createElement('canvas'); hmC.width=GRID_W; hmC.height=GRID_H;
        const hmX=hmC.getContext('2d');
        const hmImg=hmX.createImageData(GRID_W,GRID_H);

        // Offscreen: phosphor persistence
        let pC=document.createElement('canvas'), pX=pC.getContext('2d');

        // Mutable animation state
        let t=0, scanAngle=0, prevScan=0, scanCount=0;
        const echoes=[], pings=[];
        const obsGlow=OBSTACLES.map(()=>0);

        const resize=()=>{
            canvas.width=canvas.offsetWidth; canvas.height=canvas.offsetHeight;
            pC.width=canvas.width; pC.height=canvas.height;
            pX=pC.getContext('2d');
            pX.fillStyle=isDarkRef.current?'#000c18':'#d4e4f0';
            pX.fillRect(0,0,canvas.width,canvas.height);
        };
        const ro=new ResizeObserver(resize); ro.observe(canvas); resize();

        // Coord mappers
        const toX=(mx,mg,dW)=>mg.l+(mx/ROOM_W)*dW;
        const toY=(my,mg,dH)=>mg.t+(my/ROOM_H)*dH;

        // Scan arm wall-clip endpoint
        const sweepEnd=(a,mg,dW,dH)=>{
            const rx0=RX*ROOM_W,ry0=RY*ROOM_H,dx=Math.cos(a),dy=Math.sin(a);
            let mT=40;
            if(dx<-1e-9)mT=Math.min(mT,(0-rx0)/dx); if(dx>1e-9)mT=Math.min(mT,(ROOM_W-rx0)/dx);
            if(dy<-1e-9)mT=Math.min(mT,(0-ry0)/dy); if(dy>1e-9)mT=Math.min(mT,(ROOM_H-ry0)/dy);
            return{x:toX(rx0+dx*mT,mg,dW),y:toY(ry0+dy*mT,mg,dH)};
        };

        // ── MAIN DRAW LOOP ────────────────────────────────────────────────────
        const draw=()=>{
            const W=canvas.width,H=canvas.height;
            const dark=isDarkRef.current,scan=isScanRef.current;
            if(W===0||H===0){animRef.current=requestAnimationFrame(draw);return;}

            ctx.fillStyle=dark?'#000c18':'#d4e4f0';
            ctx.fillRect(0,0,W,H);

            const mg={l:44,r:22,t:32,b:52};
            const dW=W-mg.l-mg.r, dH=H-mg.t-mg.b;
            const rXc=toX(RX*ROOM_W,mg,dW), rYc=toY(RY*ROOM_H,mg,dH);

            // ── Grid lines ────────────────────────────────────────────────────
            ctx.strokeStyle=dark?'rgba(0,200,160,0.05)':'rgba(0,80,120,0.07)';
            ctx.lineWidth=1;
            for(let i=0;i<=10;i++){const x=mg.l+i*dW/10;ctx.beginPath();ctx.moveTo(x,mg.t);ctx.lineTo(x,mg.t+dH);ctx.stroke();}
            for(let i=0;i<=8;i++){const y=mg.t+i*dH/8;ctx.beginPath();ctx.moveTo(mg.l,y);ctx.lineTo(mg.l+dW,y);ctx.stroke();}

            // ── IDLE ──────────────────────────────────────────────────────────
            if(!scan){
                ctx.strokeStyle=dark?'rgba(0,200,160,0.35)':'rgba(0,80,130,0.40)';
                ctx.lineWidth=2; ctx.strokeRect(mg.l,mg.t,dW,dH);
                // Decorative rings
                for(let ri=1;ri<=5;ri++){
                    const r=ri*Math.min(dW,dH)*0.10;
                    ctx.strokeStyle=dark?`rgba(0,200,160,${0.07-ri*0.01})`:`rgba(0,80,130,${0.09-ri*0.015})`;
                    ctx.lineWidth=1; ctx.beginPath(); ctx.arc(W/2,H/2,r,0,Math.PI*2); ctx.stroke();
                }
                ctx.strokeStyle=dark?'rgba(0,200,160,0.18)':'rgba(0,80,130,0.20)';
                ctx.lineWidth=0.8;
                ctx.beginPath();ctx.moveTo(W/2,mg.t);ctx.lineTo(W/2,mg.t+dH);ctx.stroke();
                ctx.beginPath();ctx.moveTo(mg.l,H/2);ctx.lineTo(mg.l+dW,H/2);ctx.stroke();
                ctx.fillStyle=dark?'rgba(0,220,170,0.60)':'rgba(0,80,130,0.60)';
                ctx.font='bold 13px "JetBrains Mono",monospace'; ctx.textAlign='center';
                ctx.fillText('SONAR INACTIVO',W/2,H/2-10);
                ctx.font='7px "JetBrains Mono",monospace';
                ctx.fillStyle=dark?'rgba(0,180,140,0.35)':'rgba(0,80,130,0.35)';
                ctx.fillText('Inicia el escaneo para activar el sonar de señal',W/2,H/2+10);
                animRef.current=requestAnimationFrame(draw); return;
            }

            // ── TICK ──────────────────────────────────────────────────────────
            t+=0.012; prevScan=scanAngle; scanAngle=(t*0.70)%(2*Math.PI);
            if(prevScan>scanAngle) scanCount++;

            // ── ECHO TRIGGERS ─────────────────────────────────────────────────
            OBS_ANGLES.forEach((oa,i)=>{
                const w=(a)=>((a%(Math.PI*2))+(Math.PI*2))%(Math.PI*2);
                const cur=w(scanAngle),prv=w(prevScan),tgt=w(oa);
                const crossed=prv<=cur?(tgt>=prv&&tgt<=cur):(tgt>=prv||tgt<=cur);
                if(crossed){
                    const o=OBSTACLES[i];
                    echoes.push({mx:o.x+o.w/2,my:o.y+o.h/2,t0:t,rgb:o.echo});
                    obsGlow[i]=1.0;
                }
            });
            obsGlow.forEach((_,i)=>{obsGlow[i]=Math.max(0,obsGlow[i]-0.025);});

            // ── PINGS ─────────────────────────────────────────────────────────
            if(pings.length===0||t-pings[pings.length-1].t0>3.5) pings.push({t0:t});
            while(pings.length>0&&t-pings[0].t0>5.5) pings.shift();

            // ── HEATMAP ───────────────────────────────────────────────────────
            for(let i=0;i<GRID_W*GRID_H;i++){
                const v=SIGNAL_MAP[i];
                const [r,g,b,a]=sigRGBA(v,dark);
                hmImg.data[i*4]=r; hmImg.data[i*4+1]=g; hmImg.data[i*4+2]=b; hmImg.data[i*4+3]=a;
            }
            hmX.putImageData(hmImg,0,0);
            ctx.globalAlpha=0.60;
            ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
            ctx.drawImage(hmC,mg.l,mg.t,dW,dH);
            ctx.globalAlpha=1;

            // ── OBSTACLE SHADOW ZONES ─────────────────────────────────────────
            OBSTACLES.forEach(o=>{
                const cx=o.x+o.w/2,cy=o.y+o.h/2;
                const rx0=RX*ROOM_W,ry0=RY*ROOM_H;
                const sdx=cx-rx0,sdy=cy-ry0,len=Math.sqrt(sdx*sdx+sdy*sdy)||1;
                const nx=sdx/len,ny=sdy/len;
                const ext=Math.max(dW,dH)*0.70;
                const ox2=toX(o.x,mg,dW),oy2=toY(o.y,mg,dH);
                const ow2=(o.w/ROOM_W)*dW,oh2=(o.h/ROOM_H)*dH;
                const grd=ctx.createLinearGradient(ox2+ow2/2,oy2+oh2/2,
                    ox2+ow2/2+nx*ext,oy2+oh2/2+ny*ext);
                const sa=dark?o.atten*0.80:o.atten*0.28;
                grd.addColorStop(0,`rgba(0,0,0,${sa})`);
                grd.addColorStop(1,'rgba(0,0,0,0)');
                ctx.fillStyle=grd;
                ctx.fillRect(ox2-4,oy2-4,ow2+8+Math.abs(nx)*ext,oh2+8+Math.abs(ny)*ext);
            });

            // ── PHOSPHOR PERSISTENCE ──────────────────────────────────────────
            pX.fillStyle=dark?'rgba(0,12,24,0.10)':'rgba(212,228,240,0.13)';
            pX.fillRect(0,0,W,H);

            // Wedge trailing glow
            pX.fillStyle=dark?'rgba(0,255,180,0.065)':'rgba(0,110,160,0.055)';
            pX.beginPath(); pX.moveTo(rXc,rYc);
            pX.arc(rXc,rYc,Math.max(dW,dH)*1.3,scanAngle-0.18,scanAngle);
            pX.closePath(); pX.fill();

            // Leading bright line
            const sE=sweepEnd(scanAngle,mg,dW,dH);
            const sGrd=pX.createLinearGradient(rXc,rYc,sE.x,sE.y);
            sGrd.addColorStop(0,   dark?'rgba(0,255,180,0)':'rgba(0,130,180,0)');
            sGrd.addColorStop(0.45,dark?'rgba(0,255,180,0.12)':'rgba(0,130,180,0.08)');
            sGrd.addColorStop(1,   dark?'rgba(0,255,180,0.92)':'rgba(0,130,180,0.85)');
            pX.strokeStyle=sGrd; pX.lineWidth=2.8;
            pX.beginPath(); pX.moveTo(rXc,rYc); pX.lineTo(sE.x,sE.y); pX.stroke();
            // Soft glow duplicate
            const sGrd2=pX.createLinearGradient(rXc,rYc,sE.x,sE.y);
            sGrd2.addColorStop(0,dark?'rgba(0,255,180,0)':'rgba(0,130,180,0)');
            sGrd2.addColorStop(1,dark?'rgba(0,255,180,0.22)':'rgba(0,130,180,0.18)');
            pX.strokeStyle=sGrd2; pX.lineWidth=7;
            pX.beginPath(); pX.moveTo(rXc,rYc); pX.lineTo(sE.x,sE.y); pX.stroke();

            ctx.drawImage(pC,0,0);

            // ── SONAR PINGS ───────────────────────────────────────────────────
            pings.forEach(ping=>{
                const age=t-ping.t0,maxA=5;
                if(age>maxA) return;
                for(let pi=0;pi<4;pi++){
                    const ph=age-pi*0.55; if(ph<0) continue;
                    const frac=ph/maxA;
                    const r2=frac*Math.max(dW,dH)*0.75;
                    const a2=(1-frac)*(0.28-pi*0.06);
                    if(a2<0.01) continue;
                    ctx.strokeStyle=dark?`rgba(0,255,180,${a2})`:`rgba(0,110,160,${a2})`;
                    ctx.lineWidth=2-pi*0.4;
                    ctx.beginPath(); ctx.arc(rXc,rYc,r2,0,Math.PI*2); ctx.stroke();
                }
            });

            // ── OBSTACLES ────────────────────────────────────────────────────
            OBSTACLES.forEach((o,i)=>{
                const ox=toX(o.x,mg,dW),oy=toY(o.y,mg,dH);
                const ow=(o.w/ROOM_W)*dW,oh=(o.h/ROOM_H)*dH;
                const [gr,gg,gb]=o.rgb;
                const gl=obsGlow[i];

                // Hit glow rings
                if(gl>0.02){
                    for(let gi=5;gi>=1;gi--){
                        const ga=gl*(0.11-gi*0.015);
                        if(ga<=0) continue;
                        ctx.strokeStyle=`rgba(${gr},${gg},${gb},${ga})`;
                        ctx.lineWidth=gi*2.5;
                        ctx.strokeRect(ox-gi,oy-gi,ow+gi*2,oh+gi*2);
                    }
                }

                // Permanent ambient glow
                ctx.shadowColor=`rgba(${gr},${gg},${gb},${0.35+gl*0.35})`;
                ctx.shadowBlur=10+gl*8;

                // Body
                ctx.fillStyle=dark
                    ?`rgba(${Math.floor(gr*0.07)},${Math.floor(gg*0.07)},${Math.floor(gb*0.11)},0.97)`
                    :`rgba(${Math.min(255,gr+90)},${Math.min(255,gg+85)},${Math.min(255,gb+80)},0.84)`;
                rRect(ctx,ox,oy,ow,oh,3); ctx.fill();
                ctx.shadowBlur=0; ctx.shadowColor='transparent';

                // Border
                ctx.strokeStyle=`rgba(${gr},${gg},${gb},${0.65+gl*0.30})`;
                ctx.lineWidth=1.5; rRect(ctx,ox,oy,ow,oh,3); ctx.stroke();

                // Hatching texture
                ctx.save(); rRect(ctx,ox+1,oy+1,ow-2,oh-2,2); ctx.clip();
                ctx.strokeStyle=`rgba(${gr},${gg},${gb},0.09)`; ctx.lineWidth=0.5;
                for(let li=-oh;li<ow+oh;li+=7){
                    ctx.beginPath(); ctx.moveTo(ox+li,oy); ctx.lineTo(ox+li+oh,oy+oh); ctx.stroke();
                }
                ctx.restore();

                // Label
                const minS=Math.min(ow,oh);
                if(minS>13){
                    ctx.fillStyle=`rgba(${gr},${gg},${gb},0.95)`;
                    ctx.font=`bold ${Math.min(9,Math.max(6,minS*0.25))}px "JetBrains Mono",monospace`;
                    ctx.textAlign='center'; ctx.textBaseline='middle';
                    ctx.fillText(o.label,ox+ow/2,oy+oh/2);
                    ctx.textBaseline='alphabetic';
                }

                // Attenuation badge above
                const pct=Math.round(o.atten*100);
                const bW=Math.max(ow-2,24),bH=12;
                const bX=ox+(ow-bW)/2,bY=oy-bH-2;
                ctx.fillStyle=dark?'rgba(0,8,18,0.92)':'rgba(208,226,242,0.93)';
                rRect(ctx,bX,bY,bW,bH,3); ctx.fill();
                ctx.strokeStyle=`rgba(${gr},${gg},${gb},0.45)`;
                ctx.lineWidth=0.7; rRect(ctx,bX,bY,bW,bH,3); ctx.stroke();
                ctx.fillStyle=`rgba(${gr},${gg},${gb},0.92)`;
                ctx.font='5.5px "JetBrains Mono",monospace'; ctx.textAlign='center';
                ctx.fillText(`-${pct}% señal`,ox+ow/2,bY+8.5);
            });

            // ── ECHO MARKERS ──────────────────────────────────────────────────
            for(let ei=echoes.length-1;ei>=0;ei--){
                const e=echoes[ei],age=t-e.t0;
                if(age>3.2){echoes.splice(ei,1);continue;}
                const a2=Math.max(0,1-age/3.2);
                const ex=toX(e.mx,mg,dW),ey=toY(e.my,mg,dH);
                const [cr,cg,cb]=e.rgb;
                for(let ri=0;ri<2;ri++){
                    const rr=5+age*(20+ri*12),ra=a2*(ri===0?0.72:0.38);
                    ctx.strokeStyle=`rgba(${cr},${cg},${cb},${ra})`;
                    ctx.lineWidth=ri===0?2:1;
                    ctx.beginPath(); ctx.arc(ex,ey,rr,0,Math.PI*2); ctx.stroke();
                }
                const cG=ctx.createRadialGradient(ex,ey,0,ex,ey,9+age*2);
                cG.addColorStop(0,`rgba(${cr},${cg},${cb},${a2*0.95})`);
                cG.addColorStop(1,`rgba(${cr},${cg},${cb},0)`);
                ctx.fillStyle=cG; ctx.beginPath(); ctx.arc(ex,ey,9+age*2,0,Math.PI*2); ctx.fill();
            }

            // ── ROOM BORDER ───────────────────────────────────────────────────
            ctx.shadowColor=dark?'rgba(0,210,165,0.45)':'rgba(0,90,150,0.35)';
            ctx.shadowBlur=14;
            ctx.strokeStyle=dark?'rgba(0,215,168,0.78)':'rgba(0,90,150,0.68)';
            ctx.lineWidth=2; ctx.strokeRect(mg.l,mg.t,dW,dH);
            ctx.shadowBlur=0; ctx.shadowColor='transparent';

            // Corner brackets
            const cmL=12;
            [[mg.l,mg.t,1,1],[mg.l+dW,mg.t,-1,1],[mg.l,mg.t+dH,1,-1],[mg.l+dW,mg.t+dH,-1,-1]].forEach(([cx2,cy2,sx,sy])=>{
                ctx.strokeStyle=dark?'rgba(0,255,185,0.82)':'rgba(0,110,165,0.72)';
                ctx.lineWidth=2.2;
                ctx.beginPath();
                ctx.moveTo(cx2,cy2+sy*cmL); ctx.lineTo(cx2,cy2); ctx.lineTo(cx2+sx*cmL,cy2);
                ctx.stroke();
            });

            // Door arc bottom-left
            const doorW=dW*0.08;
            ctx.clearRect(mg.l+1,mg.t+dH-1,doorW,2);
            ctx.strokeStyle=dark?'rgba(0,255,185,0.92)':'rgba(0,110,165,0.92)';
            ctx.lineWidth=1.5;
            ctx.beginPath(); ctx.moveTo(mg.l,mg.t+dH); ctx.lineTo(mg.l+doorW,mg.t+dH); ctx.stroke();
            ctx.strokeStyle=dark?'rgba(0,255,185,0.28)':'rgba(0,110,165,0.28)';
            ctx.setLineDash([2,2]); ctx.lineWidth=1;
            ctx.beginPath(); ctx.arc(mg.l,mg.t+dH,doorW,-Math.PI/2,0); ctx.stroke();
            ctx.setLineDash([]);

            // ── ROUTER ────────────────────────────────────────────────────────
            for(let ri=0;ri<4;ri++){
                const phase=(t*0.65+ri*0.25)%1;
                const rr2=5+phase*42,ra=(1-phase)*0.32;
                ctx.strokeStyle=dark?`rgba(0,255,180,${ra})`:`rgba(0,110,160,${ra})`;
                ctx.lineWidth=1.3;
                ctx.beginPath(); ctx.arc(rXc,rYc,rr2,0,Math.PI*2); ctx.stroke();
            }
            const dGrd=ctx.createRadialGradient(rXc,rYc,0,rXc,rYc,12);
            dGrd.addColorStop(0,dark?'rgba(0,255,180,0.55)':'rgba(0,140,200,0.45)');
            dGrd.addColorStop(1,'rgba(0,0,0,0)');
            ctx.fillStyle=dGrd; ctx.beginPath(); ctx.arc(rXc,rYc,12,0,Math.PI*2); ctx.fill();
            ctx.fillStyle=dark?'#00ffb8':'#005e80';
            ctx.beginPath(); ctx.arc(rXc,rYc,5.5,0,Math.PI*2); ctx.fill();
            ctx.fillStyle='rgba(255,255,255,0.95)';
            ctx.beginPath(); ctx.arc(rXc,rYc,2.2,0,Math.PI*2); ctx.fill();
            ctx.fillStyle=dark?'rgba(0,255,180,0.88)':'rgba(0,100,150,0.88)';
            ctx.font='bold 7px "JetBrains Mono",monospace'; ctx.textAlign='left';
            ctx.fillText('ROUTER',rXc+9,rYc-4);
            ctx.fillStyle=dark?'rgba(0,200,150,0.50)':'rgba(0,90,130,0.50)';
            ctx.font='5.5px "JetBrains Mono",monospace';
            ctx.fillText(`${(RX*ROOM_W).toFixed(1)},${(RY*ROOM_H).toFixed(1)}m`,rXc+9,rYc+5);

            // ── DETECTION MARKERS ─────────────────────────────────────────────
            const pulse=0.5+0.5*Math.sin(t*3.2);
            detHistRef.current.slice(0,7).forEach((det,i)=>{
                if(det.x==null) return;
                const dx2=mg.l+det.x*dW,dy2=mg.t+det.y*dH;
                const [cr,cg,cb]=TYPE_RGB[det.type]||TYPE_RGB.adult;
                const alpha=Math.max(0.1,1-i*0.13);
                if(i===0){
                    for(let ri=0;ri<3;ri++){
                        const rPhase=(pulse+ri*0.33)%1;
                        ctx.strokeStyle=`rgba(${cr},${cg},${cb},${alpha*(0.42-ri*0.12)})`;
                        ctx.lineWidth=1.5-ri*0.4;
                        ctx.beginPath(); ctx.arc(dx2,dy2,12+rPhase*14+ri*6,0,Math.PI*2); ctx.stroke();
                    }
                }
                const arm=i===0?10:6;
                ctx.strokeStyle=`rgba(${cr},${cg},${cb},${alpha*0.78})`; ctx.lineWidth=1.2;
                ctx.beginPath();
                ctx.moveTo(dx2-arm,dy2); ctx.lineTo(dx2-3,dy2);
                ctx.moveTo(dx2+3,dy2);   ctx.lineTo(dx2+arm,dy2);
                ctx.moveTo(dx2,dy2-arm); ctx.lineTo(dx2,dy2-3);
                ctx.moveTo(dx2,dy2+3);   ctx.lineTo(dx2,dy2+arm);
                ctx.stroke();
                ctx.fillStyle=`rgba(${cr},${cg},${cb},${alpha})`;
                ctx.beginPath(); ctx.arc(dx2,dy2,i===0?4:2.5,0,Math.PI*2); ctx.fill();
                if(i===0){
                    const lbX=dx2+12,lbY=dy2-17,lbW=65,lbH=26;
                    ctx.fillStyle=dark?'rgba(0,8,20,0.90)':'rgba(208,226,242,0.93)';
                    rRect(ctx,lbX,lbY,lbW,lbH,4); ctx.fill();
                    ctx.strokeStyle=`rgba(${cr},${cg},${cb},0.55)`;
                    ctx.lineWidth=0.8; rRect(ctx,lbX,lbY,lbW,lbH,4); ctx.stroke();
                    ctx.fillStyle=`rgba(${cr},${cg},${cb},0.95)`;
                    ctx.font='bold 7.5px "JetBrains Mono",monospace'; ctx.textAlign='left';
                    ctx.fillText(det.label,lbX+5,lbY+10);
                    ctx.fillStyle=dark?'rgba(120,140,160,0.82)':'rgba(50,80,110,0.78)';
                    ctx.font='5.5px "JetBrains Mono",monospace';
                    ctx.fillText(`${det.distanceM}m · ${det.confidence}%`,lbX+5,lbY+20);
                }
            });

            // Live reticle
            const live=detectionRef?.current;
            if(live&&live.x!=null){
                const lx=mg.l+live.x*dW,ly=mg.t+live.y*dH;
                const [cr,cg,cb]=TYPE_RGB[live.type]||TYPE_RGB.adult;
                const la=live.alpha??1;
                const bO=12,bs=7;
                ctx.strokeStyle=`rgba(${cr},${cg},${cb},${la*0.95})`; ctx.lineWidth=2.2;
                ctx.beginPath();
                ctx.moveTo(lx-bO,ly-bO+bs);ctx.lineTo(lx-bO,ly-bO);ctx.lineTo(lx-bO+bs,ly-bO);
                ctx.moveTo(lx+bO-bs,ly-bO);ctx.lineTo(lx+bO,ly-bO);ctx.lineTo(lx+bO,ly-bO+bs);
                ctx.moveTo(lx+bO,ly+bO-bs);ctx.lineTo(lx+bO,ly+bO);ctx.lineTo(lx+bO-bs,ly+bO);
                ctx.moveTo(lx-bO+bs,ly+bO);ctx.lineTo(lx-bO,ly+bO);ctx.lineTo(lx-bO,ly+bO-bs);
                ctx.stroke();
                ctx.fillStyle=`rgba(${cr},${cg},${cb},${la*0.92})`;
                ctx.beginPath(); ctx.arc(lx,ly,3.5,0,Math.PI*2); ctx.fill();
            }

            // ── CRT SCANLINES ─────────────────────────────────────────────────
            ctx.fillStyle=dark?'rgba(0,0,0,0.08)':'rgba(0,0,0,0.035)';
            for(let sy=mg.t;sy<mg.t+dH;sy+=2){ ctx.fillRect(mg.l,sy,dW,1); }

            // ── VIGNETTE ─────────────────────────────────────────────────────
            const vig=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.28,W/2,H/2,Math.max(W,H)*0.74);
            vig.addColorStop(0,'rgba(0,0,0,0)');
            vig.addColorStop(1,dark?'rgba(0,0,0,0.58)':'rgba(0,20,40,0.16)');
            ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);

            // ── HUD ───────────────────────────────────────────────────────────
            const deg=Math.round(scanAngle*(180/Math.PI))%360;
            // Top-left
            ctx.fillStyle=dark?'rgba(0,180,140,0.58)':'rgba(0,90,130,0.68)';
            ctx.font='bold 7px "JetBrains Mono",monospace'; ctx.textAlign='left';
            ctx.fillText(`⟳ ${String(deg).padStart(3,'0')}°  SCAN #${scanCount}`,mg.l,mg.t-12);
            // Top-right
            ctx.fillStyle=dark?'rgba(0,255,180,0.58)':'rgba(0,110,165,0.68)';
            ctx.font='bold 7.5px "JetBrains Mono",monospace'; ctx.textAlign='right';
            ctx.fillText('SONAR WiFi · EN VIVO',W-mg.r,mg.t-12);
            ctx.fillStyle=dark?'rgba(0,180,140,0.35)':'rgba(0,80,110,0.40)';
            ctx.font='5.5px "JetBrains Mono",monospace';
            ctx.fillText(`${ROOM_W}m × ${ROOM_H}m`,W-mg.r,mg.t-3);

            // Room axis labels
            ctx.fillStyle=dark?'rgba(0,180,140,0.52)':'rgba(0,90,130,0.62)';
            ctx.font='bold 8px "JetBrains Mono",monospace'; ctx.textAlign='center';
            ctx.fillText(`${ROOM_W} m`,mg.l+dW/2,H-14);
            ctx.save(); ctx.translate(15,mg.t+dH/2); ctx.rotate(-Math.PI/2);
            ctx.fillText(`${ROOM_H} m`,0,0); ctx.restore();

            // Signal legend
            const lgX=mg.l,lgY=H-mg.b+14,lgW=82,lgH=6;
            const lg=ctx.createLinearGradient(lgX,lgY,lgX+lgW,lgY);
            if(dark){
                lg.addColorStop(0,'rgba(0,6,18,1)'); lg.addColorStop(0.28,'rgba(0,75,95,1)');
                lg.addColorStop(0.58,'rgba(0,195,155,1)'); lg.addColorStop(1,'rgba(218,255,242,1)');
            } else {
                lg.addColorStop(0,'rgba(208,226,242,1)'); lg.addColorStop(0.45,'rgba(95,170,218,1)');
                lg.addColorStop(1,'rgba(18,72,128,1)');
            }
            ctx.fillStyle=lg; ctx.fillRect(lgX,lgY,lgW,lgH);
            ctx.strokeStyle=dark?'rgba(0,200,160,0.22)':'rgba(0,90,130,0.22)';
            ctx.lineWidth=0.5; ctx.strokeRect(lgX,lgY,lgW,lgH);
            ctx.fillStyle=dark?'rgba(0,180,140,0.52)':'rgba(0,90,130,0.58)';
            ctx.font='5px "JetBrains Mono",monospace';
            ctx.textAlign='left';  ctx.fillText('sin señal',lgX,lgY+lgH+8);
            ctx.textAlign='right'; ctx.fillText('óptimo',lgX+lgW,lgY+lgH+8);

            // Scale bar
            const mPx=dW/ROOM_W,sbL=mPx*2;
            const sbX=W-mg.r-sbL,sbY=H-mg.b+18;
            ctx.strokeStyle=dark?'rgba(0,200,160,0.48)':'rgba(0,100,150,0.52)';
            ctx.lineWidth=1.5;
            ctx.beginPath();
            ctx.moveTo(sbX,sbY);ctx.lineTo(sbX+sbL,sbY);
            ctx.moveTo(sbX,sbY-3);ctx.lineTo(sbX,sbY+3);
            ctx.moveTo(sbX+sbL,sbY-3);ctx.lineTo(sbX+sbL,sbY+3);
            ctx.stroke();
            ctx.fillStyle=dark?'rgba(0,180,140,0.52)':'rgba(0,90,130,0.58)';
            ctx.font='6px "JetBrains Mono",monospace'; ctx.textAlign='center';
            ctx.fillText('2 m',sbX+sbL/2,sbY+11);

            // Zone quality badges
            const zones=[{l:'A',nx:0.22,ny:0.25},{l:'B',nx:0.78,ny:0.25},{l:'C',nx:0.22,ny:0.75},{l:'D',nx:0.78,ny:0.75}];
            zones.forEach(z=>{
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
                ctx.fillRect(zx-20,zy-9,40,18);
                ctx.strokeStyle=`rgba(${col[0]},${col[1]},${col[2]},0.22)`;
                ctx.lineWidth=0.7; ctx.strokeRect(zx-20,zy-9,40,18);
                ctx.fillStyle=`rgba(${col[0]},${col[1]},${col[2]},0.68)`;
                ctx.font='bold 6px "JetBrains Mono",monospace'; ctx.textAlign='center';
                ctx.fillText(`${z.l}: ${pct}%`,zx,zy+2.5);
            });

            animRef.current=requestAnimationFrame(draw);
        };

        animRef.current=requestAnimationFrame(draw);
        return ()=>{ cancelAnimationFrame(animRef.current); ro.disconnect(); };
    },[]);

    return <canvas ref={canvasRef} className="w-full h-full" style={{display:'block'}}/>;
};

export default FloorPlanCanvas;
