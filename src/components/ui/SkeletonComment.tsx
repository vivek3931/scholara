'use client';

import { motion } from 'framer-motion';

interface SkeletonCommentProps {
    count?: number;
}

export default function SkeletonComment({ count = 3 }: SkeletonCommentProps) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-zinc-900/50 border border-white/10 rounded-lg p-4 relative overflow-hidden"
                >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                    {/* Content skeleton */}
                    <div className="space-y-3 relative z-10">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white/10 rounded-full animate-pulse" />
                            <div className="h-3 bg-white/10 rounded w-24 animate-pulse" />
                        </div>
                        <div className="h-3 bg-white/10 rounded w-full animate-pulse" />
                        <div className="h-3 bg-white/10 rounded w-4/5 animate-pulse" />
                    </div>
                </motion.div>
            ))}
        </>
    );
}
