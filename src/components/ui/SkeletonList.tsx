'use client';

import { motion } from 'framer-motion';

interface SkeletonListProps {
    count?: number;
    className?: string;
}

export default function SkeletonList({ count = 3, className = '' }: SkeletonListProps) {
    return (
        <div className={`space-y-4 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-charcoal/40 border border-white/5 rounded-lg p-4 relative overflow-hidden"
                >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                    {/* Content skeleton */}
                    <div className="space-y-2 relative z-10">
                        <div className="h-3 bg-white/10 rounded w-full animate-pulse" />
                        <div className="h-3 bg-white/10 rounded w-5/6 animate-pulse" />
                        <div className="h-2 bg-white/10 rounded w-1/4 animate-pulse mt-3" />
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
