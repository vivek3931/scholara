'use client';

import { motion } from 'framer-motion';

interface SkeletonCardProps {
    count?: number;
}

export default function SkeletonCard({ count = 6 }: SkeletonCardProps) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card border border-border rounded-lg p-6 h-32 relative overflow-hidden"
                >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-primary/5 to-transparent" />

                    {/* Content skeleton */}
                    <div className="space-y-3 relative z-10">
                        <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                        <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                    </div>
                </motion.div>
            ))}
        </>
    );
}
