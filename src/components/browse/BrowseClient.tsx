'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import ResourceCard from '@/components/resource/ResourceCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-onyx via-charcoal to-onyx text-white">
            <div className="container mx-auto py-10 px-4">
                {/* Header - Always visible */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-3xl font-bold text-amber-500">
                        {subject ? `${subject} Resources` : 'All Resources'}
                    </h1>
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
                        className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-6"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <AlertCircle className="text-red-500" size={24} />
                            <h3 className="text-red-400 font-semibold text-lg">Failed to load resources</h3>
                        </div>
                        <p className="text-gray-300 mb-4">
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

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                    {/* Loading State */}
                    {isLoading && <SkeletonCard count={12} />}

                    {/* Loaded State */}
                    {!isLoading && !error && resources.map((resource: any) => (
                        <ResourceCard
                            key={resource.id}
                            resource={resource}
                            isLoggedIn={isLoggedIn}
                        />
                    ))}

                    {/* Empty State */}
                    {!isLoading && !error && resources.length === 0 && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-gray-400 col-span-full text-center py-20"
                        >
                            No resources found.
                        </motion.p>
                    )}
                </div>
            </div>
        </div>
    );
}
