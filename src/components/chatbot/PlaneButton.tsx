'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { Bot, ArrowRight, Sparkles } from 'lucide-react';

interface PlaneButtonProps {
    onClick: () => void;
    className?: string;
    disabled?: boolean;
}

export default function PlaneButton({ onClick, className, disabled }: PlaneButtonProps) {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [textState, setTextState] = useState<'text' | 'bot'>('text');

    // Toggle text on hover
    useEffect(() => {
        if (!isHovered || disabled) {
            setTextState('text');
            return;
        }
        const interval = setInterval(() => {
            setTextState(prev => prev === 'text' ? 'bot' : 'text');
        }, 1500);
        return () => clearInterval(interval);
    }, [isHovered, disabled]);

    const handleClick = () => {
        if (!buttonRef.current || disabled) return;
        const btn = buttonRef.current;

        // Lock interaction
        btn.classList.add('active');
        onClick(); // Trigger parent logic immediately (or delay if needed by parent)

        // --- Helper to animate CSS Variables ---
        const setVar = (name: string, val: number | string) => btn.style.setProperty(name, String(val));

        // Animation Timeline using Framer Motion's 'animate' for precision interpolation

        // 1. PHASE ONE: Initial Fold (0 - 200ms)
        animate(0, 1, {
            duration: 0.2,
            onUpdate: (progress) => {
                // Left Wing Fold
                setVar('--left-wing-first-x', 0 + (50 - 0) * progress);
                setVar('--left-wing-first-y', 0 + (100 - 0) * progress);
                // Right Wing Fold
                setVar('--right-wing-second-x', 100 + (50 - 100) * progress);
                setVar('--right-wing-second-y', 0 + (100 - 0) * progress);
            },
            onComplete: () => {
                // SNAP: Reset coordinates for Phase 2 geometry
                setVar('--left-wing-first-y', 0);
                setVar('--left-wing-second-x', 40);
                setVar('--left-wing-second-y', 100);
                setVar('--left-wing-third-x', 0);
                setVar('--left-wing-third-y', 100);
                setVar('--left-body-third-x', 40);
                setVar('--right-wing-first-x', 50);
                setVar('--right-wing-first-y', 0);
                setVar('--right-wing-second-x', 60);
                setVar('--right-wing-second-y', 100);
                setVar('--right-wing-third-x', 100);
                setVar('--right-wing-third-y', 100);
                setVar('--right-body-third-x', 60);

                // 2. PHASE TWO: Fold Tips (200ms - 400ms)
                animate(0, 1, {
                    duration: 0.2,
                    onUpdate: (progress) => {
                        setVar('--left-wing-third-x', 0 + (20 - 0) * progress);
                        setVar('--left-wing-third-y', 100 + (90 - 100) * progress);
                        setVar('--left-wing-second-y', 100 + (90 - 100) * progress);
                        setVar('--left-body-third-y', 100 + (90 - 100) * progress);
                        setVar('--right-wing-third-x', 100 + (80 - 100) * progress);
                        setVar('--right-wing-third-y', 100 + (90 - 100) * progress);
                        setVar('--right-body-third-y', 100 + (90 - 100) * progress);
                        setVar('--right-wing-second-y', 100 + (90 - 100) * progress);
                    },
                    onComplete: () => {
                        // 3. PHASE THREE: Rotate & Compact (400ms - 650ms)
                        animate(0, 1, {
                            duration: 0.25,
                            onUpdate: (progress) => {
                                setVar('--rotate', 0 + (50 - 0) * progress);
                                setVar('--left-wing-third-y', 90 + (95 - 90) * progress);
                                setVar('--left-wing-third-x', 20 + (27 - 20) * progress);
                                setVar('--right-body-third-x', 60 + (45 - 60) * progress);
                                setVar('--right-wing-second-x', 60 + (45 - 60) * progress);
                                setVar('--right-wing-third-x', 80 + (60 - 80) * progress);
                                setVar('--right-wing-third-y', 90 + (83 - 90) * progress);
                            },
                            onComplete: () => {
                                // 4. PHASE FOUR: Recoil (650ms - 850ms)
                                animate(0, 1, {
                                    duration: 0.2,
                                    onUpdate: (progress) => {
                                        setVar('--rotate', 50 + (60 - 50) * progress);
                                        setVar('--plane-x', 0 + (-8 - 0) * progress);
                                        setVar('--plane-y', 0 + (40 - 0) * progress);
                                    },
                                    onComplete: () => {
                                        // 5. PHASE FIVE: Launch (850ms - 1225ms)
                                        animate(0, 1, {
                                            duration: 0.38,
                                            ease: "backIn",
                                            onUpdate: (progress) => {
                                                setVar('--rotate', 60 + (40 - 60) * progress);
                                                setVar('--plane-x', -8 + (45 + 8) * progress);
                                                setVar('--plane-y', 40 + (-300 - 40) * progress);
                                                setVar('--plane-opacity', 1 - progress);
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });

        // --- Parallel Visual Changes (Colors, Text, Border) ---
        animate(0, 1, {
            duration: 0.1,
            onUpdate: (p) => {
                setVar('--text-opacity', 1 - p);
                setVar('--border-radius', 7 * (1 - p));
                // Darken wings briefly (simulated)
                if (p > 0.5) {
                    btn.style.setProperty('--left-wing-background', 'var(--primary-dark)');
                    btn.style.setProperty('--right-wing-background', 'var(--primary-dark)');
                }
            },
            onComplete: () => {
                // Restore wing color
                setTimeout(() => {
                    btn.style.setProperty('--left-wing-background', 'var(--primary)');
                    btn.style.setProperty('--right-wing-background', 'var(--primary)');
                }, 140);

                // Show Trails
                setTimeout(() => {
                    animate(0, 1, {
                        duration: 0.2,
                        onUpdate: (p) => {
                            setVar('--trails-stroke', 57 + (171 - 57) * p); // dashoffset
                        }
                    })
                }, 220);

                // Show Success Text
                setTimeout(() => {
                    animate(0, 1, {
                        duration: 0.2,
                        onUpdate: (p) => {
                            setVar('--success-opacity', 0 + p);
                            setVar('--success-x', -12 + (12 * p));
                        }
                    })
                }, 150);
            }
        });
    };

    return (
        <>
            <style>{`
                .paper-plane-button {
                    --primary: #f59e0b;
                    --primary-dark: #d97706;
                    --primary-darkest: #92400e;
                    --shadow: rgba(0, 0, 0, 0.3);
                    --text: #ffffff;
                    --text-opacity: 1;
                    --success: #fff;
                    --success-x: -12;
                    --success-stroke: 14;
                    --success-opacity: 0;
                    --border-radius: 24;
                    --overflow: hidden;
                    --x: 0;
                    --y: 0;
                    --rotate: 0;
                    --plane-x: 0;
                    --plane-y: 0;
                    --plane-opacity: 1;
                    --trails: rgba(255, 255, 255, 0.3);
                    --trails-stroke: 57;
                    
                    /* Wing Coordinates */
                    --left-wing-background: var(--primary);
                    --left-wing-first-x: 0; --left-wing-first-y: 0;
                    --left-wing-second-x: 50; --left-wing-second-y: 0;
                    --left-wing-third-x: 0; --left-wing-third-y: 100;
                    
                    --left-body-background: var(--primary);
                    --left-body-first-x: 51; --left-body-first-y: 0;
                    --left-body-second-x: 51; --left-body-second-y: 100;
                    --left-body-third-x: 0; --left-body-third-y: 100;
                    
                    --right-wing-background: var(--primary);
                    --right-wing-first-x: 49; --right-wing-first-y: 0;
                    --right-wing-second-x: 100; --right-wing-second-y: 0;
                    --right-wing-third-x: 100; --right-wing-third-y: 100;
                    
                    --right-body-background: var(--primary);
                    --right-body-first-x: 49; --right-body-first-y: 0;
                    --right-body-second-x: 49; --right-body-second-y: 100;
                    --right-body-third-x: 100; --right-body-third-y: 100;

                    display: block;
                    cursor: pointer;
                    position: relative;
                    border: 0;
                    padding: 8px 0;
                    min-width: 140px;
                    height: 48px;
                    text-align: center;
                    margin: 0;
                    line-height: 24px;
                    font-family: inherit;
                    font-weight: 600;
                    font-size: 14px;
                    background: none;
                    outline: none;
                    color: var(--text);
                    -webkit-appearance: none;
                    -webkit-tap-highlight-color: transparent;
                }

                .paper-plane-button .plane,
                .paper-plane-button .trails {
                    pointer-events: none;
                    position: absolute;
                }

                .paper-plane-button .plane {
                    left: 0; top: 0; right: 0; bottom: 0;
                    filter: drop-shadow(0 3px 6px var(--shadow));
                    transform: translate(calc(var(--x) * 1px), calc(var(--y) * 1px)) rotate(calc(var(--rotate) * 1deg)) translateZ(0);
                }

                .paper-plane-button .plane .left,
                .paper-plane-button .plane .right {
                    position: absolute;
                    left: 0; top: 0; right: 0; bottom: 0;
                    opacity: var(--plane-opacity);
                    transform: translate(calc(var(--plane-x) * 1px), calc(var(--plane-y) * 1px)) translateZ(0);
                }

                .paper-plane-button .plane .left:before,
                .paper-plane-button .plane .left:after,
                .paper-plane-button .plane .right:before,
                .paper-plane-button .plane .right:after {
                    content: '';
                    position: absolute;
                    left: 0; top: 0; right: 0; bottom: 0;
                    border-radius: calc(var(--border-radius) * 1px);
                    transform: translate(var(--part-x, 0.4%), var(--part-y, 0)) translateZ(0);
                    z-index: var(--z-index, 2);
                    background: var(--background, var(--left-wing-background));
                    clip-path: polygon(
                        calc(var(--first-x) * 1%) calc(var(--first-y) * 1%),
                        calc(var(--second-x) * 1%) calc(var(--second-y) * 1%),
                        calc(var(--third-x) * 1%) calc(var(--third-y) * 1%)
                    );
                }

                .paper-plane-button .plane .left:before {
                    --part-x: 0.4%; --z-index: 2;
                    --background: var(--left-wing-background);
                    --first-x: var(--left-wing-first-x); --first-y: var(--left-wing-first-y);
                    --second-x: var(--left-wing-second-x); --second-y: var(--left-wing-second-y);
                    --third-x: var(--left-wing-third-x); --third-y: var(--left-wing-third-y);
                }

                .paper-plane-button .plane .left:after {
                    --part-x: -1%; --z-index: 1;
                    --background: var(--left-body-background);
                    --first-x: var(--left-body-first-x); --first-y: var(--left-body-first-y);
                    --second-x: var(--left-body-second-x); --second-y: var(--left-body-second-y);
                    --third-x: var(--left-body-third-x); --third-y: var(--left-body-third-y);
                }

                .paper-plane-button .plane .right:before {
                    --part-x: -1%; --z-index: 2;
                    --background: var(--right-wing-background);
                    --first-x: var(--right-wing-first-x); --first-y: var(--right-wing-first-y);
                    --second-x: var(--right-wing-second-x); --second-y: var(--right-wing-second-y);
                    --third-x: var(--right-wing-third-x); --third-y: var(--right-wing-third-y);
                }

                .paper-plane-button .plane .right:after {
                    --part-x: 0; --z-index: 1;
                    --background: var(--right-body-background);
                    --first-x: var(--right-body-first-x); --first-y: var(--right-body-first-y);
                    --second-x: var(--right-body-second-x); --second-y: var(--right-body-second-y);
                    --third-x: var(--right-body-third-x); --third-y: var(--right-body-third-y);
                }

                .paper-plane-button .trails {
                    display: block;
                    width: 33px; height: 64px;
                    top: -4px; left: 16px;
                    fill: none; stroke: var(--trails);
                    stroke-linecap: round; stroke-width: 2;
                    stroke-dasharray: 57px;
                    stroke-dashoffset: calc(var(--trails-stroke) * 1px);
                    transform: rotate(68deg) translateZ(0);
                }

                .paper-plane-button .default {
                    display: block; position: relative;
                    z-index: 4;
                    opacity: var(--text-opacity);
                }

                .paper-plane-button .success {
                    z-index: 0; position: absolute;
                    left: 0; right: 0; top: 12px;
                    transform: translateX(calc(var(--success-x) * 1px)) translateZ(0);
                    opacity: var(--success-opacity);
                    color: var(--success);
                    font-weight: bold;
                    display: flex; justify-content: center; align-items: center; gap: 6px;
                }

                /* Background Gradient for button body if needed, currently using CSS vars for wings */
                .paper-plane-button:before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: calc(var(--border-radius) * 1px);
                    background: linear-gradient(to right, #f59e0b, #ea580c);
                    z-index: 1;
                    opacity: var(--text-opacity);
                }
            `}</style>

            <button
                ref={buttonRef}
                className={`paper-plane-button ${className || ''}`}
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Text Content */}
                <span className="default flex items-center justify-center gap-2 w-full h-full">
                    <AnimatePresence mode="wait">
                        {textState === 'text' ? (
                            <motion.span
                                key="text"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex justify-center items-center gap-2"
                            >
                                Get Started <ArrowRight size={16} />
                            </motion.span>
                        ) : (
                            <motion.div
                                key="bot"
                                initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                            >
                                <Bot size={20} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </span>

                {/* Success State */}
                <span className="success">
                    <Sparkles size={16} /> Launching
                </span>

                {/* SVG Trails */}
                <svg className="trails" viewBox="0 0 33 64">
                    <path d="M26,4 C28,13.3333333 29,22.6666667 29,32 C29,41.3333333 28,50.6666667 26,60"></path>
                    <path d="M6,4 C8,13.3333333 9,22.6666667 9,32 C9,41.3333333 8,50.6666667 6,60"></path>
                </svg>

                {/* The Paper Plane Constructed via Clip Paths */}
                <div className="plane">
                    <div className="left"></div>
                    <div className="right"></div>
                </div>
            </button>
        </>
    );
}
