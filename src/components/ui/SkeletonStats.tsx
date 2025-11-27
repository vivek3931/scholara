'use client';

import { motion } from 'framer-motion';

export default function SkeletonStats() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-charcoal/40 border border-white/5 rounded-xl p-6 text-center relative overflow-hidden"
                >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                    {/* Content skeleton */}
                    <div className="space-y-3 relative z-10">
                        <div className="h-8 bg-white/10 rounded w-24 mx-auto animate-pulse" />
                        <div className="h-3 bg-white/10 rounded w-20 mx-auto animate-pulse" />
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
