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
                    recommendations.slice(0, 4).map((rec: any) => (
                        <div key={rec.id} className="min-w-[280px] lg:min-w-0 snap-start">
                            <Link href={`/resource/${rec.id}`} className="block group">
                                <div className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-all shadow-sm hover:shadow-md h-full flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                                            <FileText size={20} />
                                        </div>
                                        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded truncate max-w-[120px]">
                                            {rec.subject}
                                        </div>
                                    </div>
                                    <h4 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                                        {rec.title}
                                    </h4>
                                    <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><ThumbsUp size={12} /> {rec.likes?.length || 0}</span>
                                        <span className="flex items-center gap-1"><Download size={12} /> {rec.downloads?.length || 0}</span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground">No recommendations found.</p>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
                <Link
                    href="https://scholara.app/pricing"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-transform"
                >
                    <Sparkles className="fill-white" size={18} />
                    Upgrade Now
                </Link>
            </div>
        </div>
    );
}
