'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/Card';
import { FileText, Star, ArrowRight, Download, Sparkles, ThumbsUp } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import SkeletonCard from '@/components/ui/SkeletonCard';

interface ResourceRecommendationsProps {
    currentResourceId?: string;
    subject?: string;
}

export default function ResourceRecommendations({ currentResourceId, subject }: ResourceRecommendationsProps) {
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    const getThumbnailUrl = (url: string) => {
    if (!url) return null;
    if (url.includes('cloudinary.com') && url.endsWith('.pdf')) {
        return url.replace('.pdf', '.jpg');
    }
    return null;
};

    // Fetch User Data for Pro status
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user || null);
                }
            } catch (error) {
                console.error('Failed to fetch user:', error);
            }
        };
        fetchUser();
    }, []);

    // Fetch Recommendations
    useEffect(() => {
        if (!subject || !currentResourceId) return;

        const fetchRecommendations = async () => {
            try {
                const res = await fetch(`/api/resources/related?subject=${encodeURIComponent(subject)}&currentId=${currentResourceId}`);
                if (res.ok) {
                    const data = await res.json();
                    setRecommendations(data.related || []);
                }
            } catch (error) {
                console.error('Failed to load recommendations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [subject, currentResourceId]);

    return (
        <div className="bg-muted/10 border border-border rounded-xl p-4 lg:p-6 backdrop-blur-sm">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Related Resources
            </h3>

            <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="min-w-[280px] lg:min-w-0 snap-start">
                            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50">
                                <div className="h-10 w-10 rounded-lg bg-muted animate-pulse shrink-0" />
                                <div className="space-y-2 flex-1 min-w-0">
                                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                                    <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : recommendations.length > 0 ? (
                    recommendations.slice(0, 5).map((rec: any) => (
                        <div key={rec.id} className="min-w-[280px] lg:min-w-0 snap-start">
                            <Link href={`/resource/${rec.id}`} className="block group h-full">
                                <div className="bg-card border border-border rounded-lg hover:border-primary/50 transition-all shadow-sm hover:shadow-md h-full flex overflow-hidden">

                                    {/* LEFT: Thumbnail or File Icon */}
                                    <div className="w-20 shrink-0 bg-muted/30 relative flex items-center justify-center overflow-hidden border-r border-border">
                                        {rec.fileUrl && rec.fileUrl.trim() !== '' ? (
                                            /* Using standard img tag to ensure it works even if domain is not invalid in next.config */
                                            <Image
                                                src={getThumbnailUrl(rec.fileUrl)}
                                                alt={rec.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center w-full h-full bg-primary/10 text-primary">
                                                <FileText size={24} />
                                            </div>
                                        )}
                                    </div>

                                    {/* RIGHT: Content */}
                                    <div className="flex flex-col p-3 flex-1 min-w-0">
                                        {/* Top Row */}
                                        <div className="flex justify-between items-start mb-1 gap-2">
                                            <h4 className="font-semibold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                                {rec.title}
                                            </h4>
                                        </div>

                                        <div className="mb-2">
                                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded truncate max-w-[100px] inline-block">
                                                {rec.subject}
                                            </span>
                                        </div>

                                        {/* Bottom Stats */}
                                        <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <ThumbsUp size={12} /> {rec.likes?.length || 0}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Download size={12} /> {rec.downloads?.length || 0}
                                            </span>
                                            <span className="flex items-center gap-1 ml-auto">
                                                {/* Author */}
                                                <span className="truncate max-w-[60px]">{rec.author?.username || 'User'}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground">No recommendations found.</p>
                )}
            </div>

            {/* Conditionally Show Upgrade Button if NOT Pro */}
            {user && !user.isPro && (
                <div className="mt-4 pt-4 border-t border-border">
                    <Link
                        href="/pricing"
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-transform"
                    >
                        <Sparkles className="fill-white" size={18} />
                        Upgrade Now
                    </Link>
                </div>
            )}
        </div>
    );
}
