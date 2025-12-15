import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface InteractiveAvatarProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

export default function InteractiveAvatar({ size = 'md', className = '' }: InteractiveAvatarProps) {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isBlinking, setIsBlinking] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Size mappings
    const dimensions = {
        sm: { w: 40, h: 40, eye: 3, pupil: 1.5 }, // Header
        md: { w: 60, h: 50, eye: 6, pupil: 2.5 }, // Standard
        lg: { w: 90, h: 75, eye: 9, pupil: 3.5 }, // Intro
        xl: { w: 120, h: 100, eye: 12, pupil: 5 } // Huge
    };

    const dim = dimensions[size];

    // Handle mouse movement for eye tracking
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Calculate relative position (-1 to 1) for eye movement
            // We want the eyes to follow the cursor on the screen
            const { innerWidth, innerHeight } = window;
            const x = (e.clientX - innerWidth / 2) / (innerWidth / 2);
            const y = (e.clientY - innerHeight / 2) / (innerHeight / 2);
            setMousePosition({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Random blinking
    useEffect(() => {
        const blinkInterval = setInterval(() => {
            if (Math.random() > 0.7) { // 30% chance to blink
                setIsBlinking(true);
                setTimeout(() => setIsBlinking(false), 150);
            }
        }, 3000);

        return () => clearInterval(blinkInterval);
    }, []);

    // Eye movement limits (in pixels)
    const eyeLimitX = dim.eye * 1.5;
    const eyeLimitY = dim.eye;

    return (
        <motion.div
            className={`relative flex flex-col items-center justify-center ${className}`}
            style={{ width: dim.w, height: dim.h }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{
                scale: 1,
                opacity: 1,
                y: isHovered ? -5 : 0 // Float up on hover
            }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
            {/* Robot Head Shape */}
            <div
                className="absolute inset-0 bg-gradient-to-br from-primary to-amber-500 rounded-2xl shadow-lg border border-white/20"
                style={{
                    borderRadius: `${dim.w * 0.3}px`
                }}
            >
                {/* Antenna */}
                <div className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[10%] h-[20%] bg-primary rounded-full -z-10 flex flex-col items-center justify-end pb-1">
                    <motion.div
                        className="w-[150%] h-[60%] bg-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.6)]"
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </div>
            </div>

            {/* Face Container */}
            <div className="relative w-full h-full flex flex-col items-center justify-center pt-[10%]">

                {/* Eyes Row */}
                <div className="flex justify-center gap-[15%] w-full mb-[10%]">
                    {/* Left Eye */}
                    <div
                        className="bg-white rounded-full relative overflow-hidden shadow-inner"
                        style={{ width: dim.eye * 2.5, height: dim.eye * 3.5 }}
                    >
                        <motion.div
                            className="bg-background absolute inset-0 origin-top z-10"
                            animate={{ scaleY: isBlinking ? 1 : 0 }}
                            transition={{ duration: 0.1 }}
                        />
                        <motion.div
                            className="bg-black rounded-full absolute"
                            style={{ width: dim.pupil * 2, height: dim.pupil * 2, top: '25%', left: '25%' }}
                            animate={{
                                x: mousePosition.x * 5, // Clamp movement
                                y: mousePosition.y * 3
                            }}
                        />
                    </div>

                    {/* Right Eye */}
                    <div
                        className="bg-white rounded-full relative overflow-hidden shadow-inner"
                        style={{ width: dim.eye * 2.5, height: dim.eye * 3.5 }}
                    >
                        <motion.div
                            className="bg-background absolute inset-0 origin-top z-10"
                            animate={{ scaleY: isBlinking ? 1 : 0 }}
                            transition={{ duration: 0.1 }}
                        />
                        <motion.div
                            className="bg-black rounded-full absolute"
                            style={{ width: dim.pupil * 2, height: dim.pupil * 2, top: '25%', left: '25%' }}
                            animate={{
                                x: mousePosition.x * 5,
                                y: mousePosition.y * 3
                            }}
                        />
                    </div>
                </div>

                {/* Mouth */}
                <motion.div
                    className="bg-white/90 rounded-full"
                    style={{ width: '20%', height: '4%' }}
                    animate={{
                        width: isHovered ? '30%' : '20%',
                        height: isHovered ? '10%' : '4%',
                        borderRadius: isHovered ? '20px' : '10px' // Smile shape
                    }}
                />
            </div>

            {/* Gloss Highlight */}
            <div className="absolute top-[5%] right-[10%] w-[15%] h-[15%] bg-white/20 rounded-full blur-[1px]" />

        </motion.div>
    );
}
