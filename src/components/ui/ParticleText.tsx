'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

interface Particle {
    x: number;
    y: number;
    originX: number;
    originY: number;
    color: string;
    size: number;
    vx: number;
    vy: number;
    ease: number;
    friction: number;
    dx: number;
    dy: number;
    distance: number;
    force: number;
    angle: number;
}

const ParticleText = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        let particles: Particle[] = [];
        let animationFrameId: number;
        let mouse = { x: 0, y: 0, radius: 60 };

        const colors = ['#fbbf24', '#f59e0b', '#d97706']; // amber-400, amber-500, amber-600

        const init = () => {
            const dpr = window.devicePixelRatio || 1;
            const containerWidth = canvas.parentElement?.offsetWidth || window.innerWidth;
            const containerHeight = 200; // Fixed height for text area

            canvas.width = containerWidth * dpr;
            canvas.height = containerHeight * dpr;
            canvas.style.width = `${containerWidth}px`;
            canvas.style.height = `${containerHeight}px`;

            ctx.scale(dpr, dpr);

            // Draw Text
            ctx.fillStyle = 'white';
            const fontSize = isMobile ? 40 : 80;
            ctx.font = `900 ${fontSize}px "Inter", sans-serif`; // Bold font
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const text = "Scholara AI";
            ctx.fillText(text, containerWidth / 2, containerHeight / 2);

            // Sample Pixels
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            particles = [];
            const step = isMobile ? 3 : 4; // Skip pixels for performance

            for (let y = 0; y < canvas.height; y += step) {
                for (let x = 0; x < canvas.width; x += step) {
                    const index = (y * canvas.width + x) * 4;
                    const alpha = data[index + 3];

                    if (alpha > 128) { // If pixel is visible
                        const posX = x / dpr;
                        const posY = y / dpr;

                        particles.push({
                            x: Math.random() * containerWidth, // Random start X
                            y: Math.random() * containerHeight, // Random start Y
                            originX: posX,
                            originY: posY,
                            color: colors[Math.floor(Math.random() * colors.length)],
                            size: isMobile ? 1.5 : 2,
                            vx: 0,
                            vy: 0,
                            ease: 0.08, // Speed of return
                            friction: 0.9, // Dampening
                            dx: 0,
                            dy: 0,
                            distance: 0,
                            force: 0,
                            angle: 0
                        });
                    }
                }
            }

            // Clear text after sampling
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));

            particles.forEach(p => {
                // Mouse Interaction
                p.dx = mouse.x - p.x;
                p.dy = mouse.y - p.y;
                p.distance = p.dx * p.dx + p.dy * p.dy;

                // Repel if close to mouse
                if (p.distance < mouse.radius * mouse.radius) {
                    p.angle = Math.atan2(p.dy, p.dx);
                    p.vx = -Math.cos(p.angle) * 2;
                    p.vy = -Math.sin(p.angle) * 2;
                }

                // Return to origin logic
                const dxOrigin = p.originX - p.x;
                const dyOrigin = p.originY - p.y;

                // Spring physics
                p.vx += dxOrigin * p.ease;
                p.vy += dyOrigin * p.ease;
                p.vx *= p.friction;
                p.vy *= p.friction;

                p.x += p.vx;
                p.y += p.vy;

                // Draw Particle
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        init();
        animate();

        const handleMouseMove = (e: MouseEvent) => {
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };

        const handleResize = () => {
            init();
        };

        canvas.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            canvas.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
        };
    }, [isMobile]);

    return (
        <div className="relative w-full flex items-center justify-center py-4">
            {/* Fallback for SEO / Screen Readers */}
            <h1 className="sr-only">Scholara AI</h1>
            <canvas ref={canvasRef} className="cursor-crosshair" />
        </div>
    );
};

export default ParticleText;
