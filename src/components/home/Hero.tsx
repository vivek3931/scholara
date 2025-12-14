'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ArrowRight, Sparkles, CloudUpload, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Hero() {
    const heroRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);
    const raysRef = useRef<HTMLDivElement>(null);
    const particlesRef = useRef<(HTMLDivElement | null)[]>([]);
    const [particles, setParticles] = useState<JSX.Element[]>([]);

    useEffect(() => {
        // Generate particles on mount
        const generatedParticles = Array.from({ length: 50 }, (_, index) => {
            const type = Math.floor(Math.random() * 3);
            const size =
                type === 0
                    ? Math.random() * 2 + 2
                    : type === 1
                        ? Math.random() * 4 + 3
                        : Math.random() * 6 + 4;

            const isRectangle = type === 2 && Math.random() > 0.5;
            const borderRadius = isRectangle ? '10%' : '50%';

            const colors = [
                'rgba(251, 146, 60, 0.8)', // orange-400
                'rgba(245, 158, 11, 0.7)', // amber-400
                'rgba(234, 88, 12, 0.6)', // orange-600
                'rgba(249, 115, 22, 0.7)', // orange-500
                'rgba(253, 186, 116, 0.8)', // orange-300
            ];

            const color = colors[Math.floor(Math.random() * colors.length)];

            return (
                <div
                    key={index}
                    ref={(el) => {
                        particlesRef.current[index] = el;
                    }}
                    className="absolute pointer-events-none"
                    style={{
                        width: `${size}px`,
                        height: `${size}px`,
                        borderRadius: borderRadius,
                        background:
                            type === 1
                                ? `radial-gradient(circle, ${color}, transparent 70%)`
                                : color,
                        boxShadow:
                            type === 2
                                ? `0 0 ${size * 1.5}px ${color}`
                                : `0 0 ${size}px ${color}`,
                        zIndex: 8,
                        opacity: 0,
                    }}
                />
            );
        });

        setParticles(generatedParticles);
    }, []);

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            if (!heroRef.current || !glowRef.current || !raysRef.current) return;

            const rect = heroRef.current.getBoundingClientRect();
            let mouseX = event.clientX - rect.left;
            let mouseY = event.clientY - rect.top;

            const glowSize = Math.min(800, rect.width * 0.8, rect.height * 0.8);

            mouseX = mouseX - glowSize / 2;
            mouseY = mouseY - glowSize / 2;

            if (glowRef.current) {
                glowRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
                glowRef.current.style.transition = 'transform 0.8s ease-out';
            }

            if (raysRef.current) {
                raysRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
                raysRef.current.style.transition = 'transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            }
        };

        const setInitialGlowPosition = () => {
            if (!heroRef.current || !glowRef.current || !raysRef.current) return;

            const rect = heroRef.current.getBoundingClientRect();
            const glowSize = Math.min(800, rect.width * 0.8, rect.height * 0.8);
            const centerX = rect.width / 2 - glowSize / 2;
            const centerY = rect.height / 2 - glowSize / 2;

            glowRef.current.style.transform = `translate(${centerX}px, ${centerY}px)`;
            raysRef.current.style.transform = `translate(${centerX}px, ${centerY}px)`;
        };

        const animateParticle = (
            particle: HTMLDivElement | null,
            config: {
                centerX: number;
                centerY: number;
                angle: number;
                minDistance: number;
                maxDistance: number;
                duration: number;
                size: number;
                opacity: number;
                delay: number;
                containerWidth: number;
                containerHeight: number;
            }
        ) => {
            if (!particle) return;

            const {
                centerX,
                centerY,
                angle,
                minDistance,
                maxDistance,
                duration,
                size,
                opacity,
                delay,
                containerWidth,
                containerHeight,
            } = config;

            const distance = Math.random() * (maxDistance - minDistance) + minDistance;

            let endX = centerX + Math.cos(angle) * distance;
            let endY = centerY + Math.sin(angle) * distance;

            const padding = 50;
            endX = Math.max(padding, Math.min(containerWidth - padding, endX));
            endY = Math.max(padding, Math.min(containerHeight - padding, endY));

            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.opacity = '0';
            particle.style.transform = 'translate(-50%, -50%) scale(0)';

            setTimeout(() => {
                if (particle) {
                    particle.style.transition = `all ${duration}s ease-out`;
                    particle.style.left = endX + 'px';
                    particle.style.top = endY + 'px';
                    particle.style.opacity = String(opacity);
                    particle.style.transform = 'translate(-50%, -50%) scale(1)';

                    setTimeout(() => {
                        if (particle) {
                            particle.style.transition = `all 1s ease-in`;
                            particle.style.opacity = '0';
                            particle.style.transform = 'translate(-50%, -50%) scale(0)';

                            setTimeout(() => {
                                const newAngle = angle + (Math.random() - 0.5) * 0.6;
                                const newDistance =
                                    Math.random() * (maxDistance * 1.2 - minDistance * 0.8) +
                                    minDistance * 0.8;
                                animateParticle(particle, {
                                    centerX,
                                    centerY,
                                    angle: newAngle,
                                    minDistance,
                                    maxDistance: Math.min(
                                        newDistance,
                                        containerWidth * 0.4,
                                        containerHeight * 0.4
                                    ),
                                    duration: duration * (Math.random() * 0.4 + 0.8),
                                    size,
                                    opacity,
                                    delay: 0,
                                    containerWidth,
                                    containerHeight,
                                });
                            }, 1000);
                        }
                    }, duration * 1000);
                }
            }, delay * 1000);
        };

        const createParticleAnimation = () => {
            if (!heroRef.current) return;

            const rect = heroRef.current.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const isMobile = rect.width < 768;
            const activeParticles = isMobile ? 25 : 50;

            particlesRef.current.forEach((particle, index) => {
                if (index >= activeParticles) {
                    if (particle) {
                        particle.style.opacity = '0';
                        particle.style.display = 'none';
                    }
                    return;
                } else {
                    if (particle) {
                        particle.style.display = 'block';
                    }
                }

                const particleType = Math.floor(Math.random() * 3);

                const baseSize = isMobile ? 0.7 : 1;
                const size =
                    particleType === 0
                        ? (Math.random() * 2 + 2) * baseSize
                        : particleType === 1
                            ? (Math.random() * 4 + 3) * baseSize
                            : (Math.random() * 6 + 4) * baseSize;

                const opacity =
                    particleType === 0
                        ? Math.random() * 0.3 + 0.3
                        : particleType === 1
                            ? Math.random() * 0.4 + 0.4
                            : Math.random() * 0.4 + 0.6;

                const baseAngle = (index / activeParticles) * Math.PI * 2;
                const angle = baseAngle + (Math.random() - 0.5);

                const minDistance = isMobile ? 50 : 100;
                const maxDistance = Math.min(rect.width, rect.height) * (isMobile ? 0.35 : 0.6);

                animateParticle(particle, {
                    centerX,
                    centerY,
                    angle,
                    minDistance,
                    maxDistance:
                        maxDistance * (particleType === 0 ? 0.8 : particleType === 1 ? 0.9 : 1),
                    duration:
                        particleType === 0
                            ? Math.random() * 2 + 3
                            : particleType === 1
                                ? Math.random() * 3 + 5
                                : Math.random() * 3 + 7,
                    size,
                    opacity,
                    delay: index * (particleType === 0 ? 0.1 : particleType === 1 ? 0.15 : 0.2),
                    containerWidth: rect.width,
                    containerHeight: rect.height,
                });
            });
        };

        setInitialGlowPosition();

        const initTimeout = setTimeout(() => {
            setInitialGlowPosition();
            createParticleAnimation();
        }, 100);

        const handleResize = () => {
            setInitialGlowPosition();
            createParticleAnimation();
        };

        if (heroRef.current) {
            heroRef.current.addEventListener('mousemove', handleMouseMove);
        }
        window.addEventListener('resize', handleResize);

        return () => {
            clearTimeout(initTimeout);
            if (heroRef.current) {
                heroRef.current.removeEventListener('mousemove', handleMouseMove);
            }
            window.removeEventListener('resize', handleResize);
        };
    }, [particles]);

    return (
        <section
            ref={heroRef}
            className="relative py-20 px-4 text-center min-h-screen flex items-center justify-center overflow-hidden rounded-2xl transition-colors duration-500"
        >
            {/* Enhanced Radial Rays - Outer layer */}
            <div
                ref={raysRef}
                className="absolute z-0 rounded-full pointer-events-none"
                style={{
                    width: 'min(800px, 80vw, 80vh)',
                    height: 'min(800px, 80vw, 80vh)',
                    background: `
                        radial-gradient(circle at center, 
                            rgba(251, 146, 60, 0.15) 0%,
                            rgba(245, 158, 11, 0.12) 20%,
                            rgba(217, 119, 6, 0.08) 40%,
                            rgba(180, 83, 9, 0.05) 60%,
                            rgba(120, 53, 15, 0.02) 80%,
                            transparent 100%
                        )
                    `,
                    filter: 'blur(60px)',
                }}
            />

            {/* Main Glow - Inner layer */}
            <div
                ref={glowRef}
                className="absolute z-1 rounded-full pointer-events-none"
                style={{
                    width: 'min(800px, 80vw, 80vh)',
                    height: 'min(800px, 80vw, 80vh)',
                    background: `
                        radial-gradient(circle at center, 
                            rgba(251, 146, 60, 0.3) 0%,
                            rgba(245, 158, 11, 0.25) 15%,
                            rgba(217, 119, 6, 0.15) 35%,
                            rgba(180, 83, 9, 0.08) 55%,
                            rgba(120, 53, 15, 0.03) 75%,
                            transparent 100%
                        )
                    `,
                    filter: 'blur(120px)',
                }}
            />

            {/* Intense Center Glow */}
            <div
                className="absolute z-2 rounded-full pointer-events-none"
                style={{
                    width: 'min(400px, 40vw, 40vh)',
                    height: 'min(400px, 40vw, 40vh)',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: `
                        radial-gradient(circle at center, 
                            rgba(251, 146, 60, 0.4) 0%,
                            rgba(245, 158, 11, 0.2) 30%,
                            transparent 70%
                        )
                    `,
                    filter: 'blur(80px)',
                }}
            />

            {/* Particles */}
            {particles}

            {/* Content */}
            <div className="relative max-w-4xl mx-auto z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-6"
                >
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium">
                        <Sparkles className="w-4 h-4" />
                        <span>The Future of Academic Sharing</span>
                    </span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-foreground"
                >
                    Unlock Your{' '}
                    <span className="text-primary">
                        Academic Potential
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-base sm:text-lg lg:text-xl mb-8 max-w-2xl mx-auto text-muted-foreground"
                >
                    Seamlessly discover, contribute, and organize a wealth of study materials – from
                    notes to past papers, all in one place, absolutely free!
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg sm:max-w-none mx-auto"
                >
                    <Link href="/upload">
                        <Button className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 font-bold rounded-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 bg-primary text-primary-foreground hover:bg-primary/90 text-sm sm:text-base shadow-lg hover:shadow-xl">
                            <CloudUpload className="w-5 h-5" />
                            <span>Upload Resources</span>
                        </Button>
                    </Link>
                    <Link href="/browse">
                        <Button className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 bg-transparent text-primary border-2 border-primary hover:bg-primary hover:text-primary-foreground text-sm sm:text-base">
                            <Search className="w-5 h-5" />
                            <span>Explore Materials</span>
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}