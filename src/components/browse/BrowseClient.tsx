'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import ResourceCard from '@/components/resource/ResourceCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';

interface BrowseClientProps {
    isLoggedIn: boolean;
}

async function fetchResources(subject?: string | null, q?: string | null) {
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    if (q) params.set('q', q);

    const res = await fetch(`/api/browse?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch resources');
    return res.json();
}

export default function BrowseClient({ isLoggedIn }: BrowseClientProps) {
    const searchParams = useSearchParams();
    const subject = searchParams.get('subject');
    const q = searchParams.get('q');

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['browse', subject, q],
        queryFn: () => fetchResources(subject, q),
    });

    const resources = data?.resources || [];

    const sliderRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (sliderRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // 10px buffer
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [resources]);

    const scroll = (direction: 'left' | 'right') => {
        if (sliderRef.current) {
            const scrollAmount = direction === 'left' ? -300 : 300;
            sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    // User State for Pro Check
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        if (isLoggedIn) {
            fetch('/api/auth/me')
                .then(res => res.json())
                .then(data => setUser(data.user))
                .catch(err => console.error('Failed to fetch user', err));
        }
    }, [isLoggedIn]);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-7xl mx-auto py-10 px-4">
                {/* ... (Header code remains) ... */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-1">
                            {subject ? `${subject} Resources` : 'All Resources'}
                        </h1>
                        <p className="text-muted-foreground">Discover and learn from our community collection</p>
                    </div>
                    <form className="flex gap-2 w-full md:w-auto">
                        <Input
                            name="q"
                            placeholder="Search..."
                            defaultValue={q || ''}
                            className="w-full md:w-64"
                        />
                        {subject && <input type="hidden" name="subject" value={subject} />}
                        <Button type="submit">Search</Button>
                    </form>
                </div>

                {/* Error State */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 mb-6"
                    >
                        {/* ... (Error code) ... */}
                        <div className="flex items-center gap-3 mb-4">
                            <AlertCircle className="text-destructive" size={24} />
                            <h3 className="text-destructive font-semibold text-lg">Failed to load resources</h3>
                        </div>
                        <p className="text-muted-foreground mb-4">
                            {error instanceof Error ? error.message : 'An unexpected error occurred'}
                        </p>
                        <Button
                            onClick={() => refetch()}
                            variant="outline"
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                            <RefreshCw size={16} className="mr-2" />
                            Retry
                        </Button>
                    </motion.div>
                )}

                {/* Content Slider */}
                <div className="relative group">
                    {/* Loading State - Keep Grid for Skeleton */}
                    {isLoading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                            <SkeletonCard count={5} />
                        </div>
                    )}

                    {!isLoading && !error && resources.length > 0 && (
                        <>
                            {/* Slider Container */}
                            <div
                                ref={sliderRef}
                                onScroll={checkScroll}
                                className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory scrollbar-hide scroll-smooth px-2"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {resources.map((resource: any) => (
                                    <div
                                        key={resource.id}
                                        className="snap-start flex-shrink-0 w-[42vw] md:w-[45vw] lg:w-[200px]" // Fixed widths for slider effect
                                    >
                                        <ResourceCard
                                            resource={resource}
                                            isLoggedIn={isLoggedIn}
                                            isPro={user?.isPro || false}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Navigation Buttons */}
                            {canScrollLeft && (
                                <div className="absolute top-1/2 -left-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                                    <Button
                                        onClick={() => scroll('left')}
                                        variant="outline"
                                        className="rounded-full w-12 h-12 p-0 bg-background/80 backdrop-blur-md border-border text-foreground hover:bg-muted"
                                    >
                                        <ArrowRight className="rotate-180" size={24} />
                                    </Button>
                                </div>
                            )}

                            {canScrollRight && (
                                <div className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                                    <Button
                                        onClick={() => scroll('right')}
                                        variant="outline"
                                        className="rounded-full w-12 h-12 p-0 bg-background/80 backdrop-blur-md border-border text-foreground hover:bg-muted"
                                    >
                                        <ArrowRight size={24} />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Empty State */}
                    {!isLoading && !error && resources.length === 0 && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-muted-foreground text-center py-20"
                        >
                            No resources found.
                        </motion.p>
                    )}
                </div>
            </div>
        </div>
    );
}
