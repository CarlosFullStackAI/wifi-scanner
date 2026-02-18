import React, { useRef, useEffect } from 'react';
import { getDynamicColor } from '../../../utils/helpers';

const ScannerCanvas = ({ isScanning, disturbanceCtx, isDark, hardwareList = [], stealthMode }) => {
    const canvasRef = useRef(null);
    const requestRef = useRef();
    const particlesRef = useRef([]);
    const scanLinePos = useRef(0);

    // Inicialización de partículas
    useEffect(() => {
        const initParticles = () => {
            const p = [];
            for (let i = 0; i < 80; i++) {
                p.push({
                    x: Math.random() * 800,
                    y: Math.random() * 500,
                    vx: (Math.random() - 0.5) * 0.2,
                    vy: (Math.random() - 0.5) * 0.2,
                    size: Math.random() > 0.9 ? 3 : 1,
                });
            }
            particlesRef.current = p;
        };
        initParticles();
    }, []);

    // Loop de animación
    const animate = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        const distLevel = disturbanceCtx.current ? disturbanceCtx.current.disturbance : 0;
        const mainColor = getDynamicColor(distLevel, isDark);

        // Configuración de Colores según Tema
        const bgColor = isDark ? '#0f172a' : '#f8fafc';
        const gridColor = isDark ? '#1e293b' : '#e2e8f0';
        const particleBaseColor = isDark ? '#334155' : '#cbd5e1';

        // Fondo
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);

        // Grid
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < width; x += 50) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
        for (let y = 0; y < height; y += 50) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
        ctx.stroke();

        // Barrido
        if (isScanning) {
            scanLinePos.current += 4;
            if (scanLinePos.current > width) scanLinePos.current = 0;
        }

        // Partículas
        particlesRef.current.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = width; if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height; if (p.y > height) p.y = 0;

            if (distLevel > 30) {
                const agitation = distLevel / 15;
                p.x += (Math.random() - 0.5) * agitation;
                p.y += (Math.random() - 0.5) * agitation;
            }

            const distanceToScan = Math.abs(p.x - scanLinePos.current);
            let alpha = isDark ? 0.3 : 0.6;
            let color = particleBaseColor;

            if (isScanning && distanceToScan < 80) {
                alpha = 1 - (distanceToScan / 80);
                color = mainColor;
            }

            ctx.fillStyle = color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        });

        // Haz Scanner
        if (isScanning) {
            const gradient = ctx.createLinearGradient(scanLinePos.current - 60, 0, scanLinePos.current, 0);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, `${mainColor}${isDark ? '44' : '22'}`);

            ctx.fillStyle = gradient;
            ctx.fillRect(scanLinePos.current - 60, 0, 60, height);
            ctx.strokeStyle = mainColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(scanLinePos.current, 0); ctx.lineTo(scanLinePos.current, height);
            ctx.stroke();
        }

        // Osciloscopio
        if (isScanning) {
            ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(248, 250, 252, 0.8)';
            ctx.fillRect(0, height - 80, width, 80);

            ctx.beginPath();
            ctx.moveTo(0, height - 40);
            for (let i = 0; i < width; i += 4) {
                const amp = 10 + distLevel * 0.6;
                const freq = 0.05 + distLevel * 0.001;
                const y = (height - 40) + Math.sin(i * freq - scanLinePos.current * 0.1) * amp * Math.random();
                ctx.lineTo(i, y);
            }
            ctx.strokeStyle = mainColor;
            ctx.lineWidth = 2;
            ctx.shadowColor = mainColor;
            ctx.shadowBlur = isDark ? 10 : 0;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [isScanning, isDark, disturbanceCtx]); // Dependencias de efecto

    return (
        <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-cover" />
    );
};

export default ScannerCanvas;
