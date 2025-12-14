'use client';

import { useQuery } from '@tanstack/react-query';
import { motion, useInView, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';
import SkeletonStats from '@/components/ui/SkeletonStats';

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

async function fetchStats() {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
}

export default function StatsSection() {
    const { data, isLoading } = useQuery({
        queryKey: ['stats'],
        queryFn: fetchStats,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });

    const resourceCount = data?.resourceCount || 0;
    const studentCount = data?.studentCount || 0;
    const downloadCount = data?.downloadCount || 0;

    return (
        <section className="py-20 bg-muted/30 border-y border-border relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="container mx-auto px-4">
                {isLoading ? (
                    <SkeletonStats />
                ) : (
                    <div className="grid md:grid-cols-3 gap-12 text-center relative z-10">
                        <div className="space-y-2">
                            <h3 className="text-5xl md:text-6xl font-bold text-primary drop-shadow-sm">
                                <Counter value={resourceCount} suffix="+" />
                            </h3>
                            <p className="text-muted-foreground font-medium tracking-wide uppercase text-sm">Resources Uploaded</p>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-5xl md:text-6xl font-bold text-primary drop-shadow-sm">
                                <Counter value={studentCount} suffix="+" />
                            </h3>
                            <p className="text-muted-foreground font-medium tracking-wide uppercase text-sm">Active Students</p>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-5xl md:text-6xl font-bold text-primary drop-shadow-sm">
                                <Counter value={downloadCount} suffix="+" />
                            </h3>
                            <p className="text-muted-foreground font-medium tracking-wide uppercase text-sm">Total Downloads</p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
