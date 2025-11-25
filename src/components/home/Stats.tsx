'use client';

import { motion, useInView, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

function Counter({ value, suffix = "" }: { value: number, suffix?: string }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-100px" });
    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current) => Math.round(current).toLocaleString() + suffix);

    useEffect(() => {
        if (inView) {
            spring.set(value);
        }
    }, [inView, value, spring]);

    return <motion.span ref={ref}>{display}</motion.span>;
}

export default function Stats({ resourceCount = 0, studentCount = 0, downloadCount = 0 }: { resourceCount?: number, studentCount?: number, downloadCount?: number }) {
    return (
        <section className="py-20 bg-midnight/50 border-y border-white/5 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-3 gap-12 text-center relative z-10">
                    <div className="space-y-2">
                        <h3 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-warm-sunset drop-shadow-sm">
                            <Counter value={resourceCount} suffix="+" />
                        </h3>
                        <p className="text-ash font-medium tracking-wide uppercase text-sm">Resources Uploaded</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-warm-sunset drop-shadow-sm">
                            <Counter value={studentCount} suffix="+" />
                        </h3>
                        <p className="text-ash font-medium tracking-wide uppercase text-sm">Active Students</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-warm-sunset drop-shadow-sm">
                            <Counter value={downloadCount} suffix="+" />
                        </h3>
                        <p className="text-ash font-medium tracking-wide uppercase text-sm">Total Downloads</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
