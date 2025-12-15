'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PlaneButton from './PlaneButton';

interface Particle {
    x: number;
    y: number;
    originX: number;
    originY: number;
    finalX: number;
    finalY: number;
    size: number;
    finalSize: number;
    color: string;
}

interface InitialStateAnimationProps {
    onStart?: () => void;
    onTransitionComplete?: () => void;
}

export default function InitialStateAnimation({ onStart, onTransitionComplete }: InitialStateAnimationProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [introComplete, setIntroComplete] = useState(false);
    const [showSubtitle, setShowSubtitle] = useState(false);
    const [typedText, setTypedText] = useState('');
    const [showButton, setShowButton] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const particlesRef = useRef<Particle[]>([]);
    const animationRef = useRef<number>(0);

    const COLORS = ['#fbbf24', '#f59e0b', '#d97706', '#fcd34d', '#fef3c7'];
    const FULL_SUBTITLE = 'Powered by Scholara Intelligence';

    // Handle plane takeoff complete
    const handlePlaneTakeoff = () => {
        setIsTransitioning(true);
        // Plane needs ~1.3s to fly. Trigger flash after that.
        setTimeout(() => {
            onStart?.();
            onTransitionComplete?.();
        }, 1400);
    };

    // Main particle animation
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const TEXT = 'SCHOLARA AI';
        const INITIAL_FONT_SIZE = 32;
        const FINAL_FONT_SIZE = 16;
        const GAP = 1; // High sharpness

        const CHAOS_FRAMES = 90;
        const FORM_FRAMES = 70;
        const HOLD_FRAMES = 30;
        const SHRINK_FRAMES = 50;

        let stage: 'CHAOS' | 'FORMING' | 'HOLD' | 'SHRINKING' | 'DONE' = 'CHAOS';
        let frame = 0;

        const init = () => {
            const container = canvas.parentElement;
            const width = container?.clientWidth || 350;
            const height = 90;

            canvas.width = width;
            canvas.height = height;

            if (width === 0) return;

            const centerY = height / 2;
            const finalY = height * 0.35;
            const sizeRatio = FINAL_FONT_SIZE / INITIAL_FONT_SIZE;

            ctx.fillStyle = 'white';
            ctx.font = `900 ${INITIAL_FONT_SIZE}px Inter, system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(TEXT, width / 2, centerY);

            const imageData = ctx.getImageData(0, 0, width, height);
            const pixels = imageData.data;
            const particles: Particle[] = [];

            for (let y = 0; y < height; y += GAP) {
                for (let x = 0; x < width; x += GAP) {
                    const i = (y * width + x) * 4;
                    if (pixels[i + 3] > 128) {
                        const offsetX = x - width / 2;
                        const offsetY = y - centerY;
                        const finalX = width / 2 + offsetX * sizeRatio;
                        const finalYPos = finalY + offsetY * sizeRatio;

                        particles.push({
                            x: Math.random() * width,
                            y: Math.random() * height,
                            originX: x,
                            originY: y,
                            finalX: finalX,
                            finalY: finalYPos,
                            size: 1.5,
                            finalSize: 1,
                            color: COLORS[Math.floor(Math.random() * COLORS.length)]
                        });
                    }
                }
            }

            ctx.clearRect(0, 0, width, height);
            particlesRef.current = particles;
        };

        const animate = () => {
            if (!canvas || !ctx) return;
            if (stage === 'DONE') return;

            frame++;
            const { width, height } = canvas;
            const centerX = width / 2;
            const centerY = height / 2;

            if (stage === 'CHAOS' && frame > CHAOS_FRAMES) {
                stage = 'FORMING';
                frame = 0;
            } else if (stage === 'FORMING' && frame > FORM_FRAMES) {
                stage = 'HOLD';
                frame = 0;
            } else if (stage === 'HOLD' && frame > HOLD_FRAMES) {
                stage = 'SHRINKING';
                frame = 0;
            } else if (stage === 'SHRINKING' && frame > SHRINK_FRAMES) {
                stage = 'DONE';
                setIntroComplete(true);
                setShowSubtitle(true);

                let charIndex = 0;
                const typeInterval = setInterval(() => {
                    if (charIndex <= FULL_SUBTITLE.length) {
                        setTypedText(FULL_SUBTITLE.substring(0, charIndex));
                        charIndex++;
                    } else {
                        clearInterval(typeInterval);
                        setTimeout(() => setShowButton(true), 300);
                    }
                }, 30);
                return;
            }

            ctx.clearRect(0, 0, width, height);

            particlesRef.current.forEach(p => {
                let targetSize = p.size;

                if (stage === 'CHAOS') {
                    const angle = Math.atan2(p.y - centerY, p.x - centerX);
                    p.x += Math.cos(angle + Math.PI / 2) * 1.5 + (Math.random() - 0.5) * 2;
                    p.y += Math.sin(angle + Math.PI / 2) * 1.5 + (Math.random() - 0.5) * 2;
                    if (p.x < 0) p.x = width;
                    else if (p.x > width) p.x = 0;
                    if (p.y < 0) p.y = height;
                    else if (p.y > height) p.y = 0;

                } else if (stage === 'FORMING') {
                    p.x += (p.originX - p.x) * 0.15;
                    p.y += (p.originY - p.y) * 0.15;

                } else if (stage === 'HOLD') {
                    p.x = p.originX;
                    p.y = p.originY;

                } else if (stage === 'SHRINKING') {
                    const progress = Math.min(frame / SHRINK_FRAMES, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);

                    p.x = p.originX + (p.finalX - p.originX) * eased;
                    p.y = p.originY + (p.finalY - p.originY) * eased;
                    targetSize = p.size + (p.finalSize - p.size) * eased;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, stage === 'SHRINKING' ? targetSize : p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        const handleResize = () => { if (stage !== 'DONE') init(); };
        window.addEventListener('resize', handleResize);
        init();
        animate();

        return () => {
            cancelAnimationFrame(animationRef.current);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div className="w-full flex flex-col items-center justify-center gap-3 min-h-[260px] relative">

            {/* Flash Screen - Triggers after plane leaves */}
            <AnimatePresence>
                {isTransitioning && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 1] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, delay: 1.1 }} // Flash near end
                        className="absolute inset-[-500px] bg-white z-[60]"
                    />
                )}
            </AnimatePresence>

            {/* Content (Text/Canvas) - Fades out */}
            <motion.div
                animate={{ opacity: isTransitioning ? 0 : 1 }}
                transition={{ duration: 0.5 }}
                className="w-full flex flex-col items-center gap-3"
            >
                <canvas ref={canvasRef} className="w-full h-[90px]" />

                <div className="h-5 flex items-center justify-center">
                    <AnimatePresence>
                        {showSubtitle && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[9px] font-semibold text-amber-500/90 uppercase tracking-[0.12em] flex items-center gap-1.5"
                            >
                                <Sparkles size={9} className="text-amber-400" />
                                <span>{typedText}</span>
                                {typedText.length < FULL_SUBTITLE.length && (
                                    <motion.span
                                        animate={{ opacity: [1, 0] }}
                                        transition={{ duration: 0.35, repeat: Infinity }}
                                        className="inline-block w-[1.5px] h-2.5 bg-amber-500"
                                    />
                                )}
                                <Sparkles size={9} className="text-amber-400" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Plane Button - KEPT OUTSIDE THE FADING CONTAINER so it remains visible */}
            <div className="h-12 flex items-center justify-center mt-2 z-50">
                <AnimatePresence>
                    {showButton && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <PlaneButton onClick={handlePlaneTakeoff} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
