'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookmarkX, Eye, Download, Calendar, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SavedResourcesClient({ initialResources }: { initialResources: any[] }) {
    const [resources, setResources] = useState(initialResources);
    const [removing, setRemoving] = useState<string | null>(null);

    const handleUnsave = async (resourceId: string) => {
        setRemoving(resourceId);
        try {
            const res = await fetch('/api/resources/save', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resourceId }),
                credentials: 'include',
            });

            if (res.ok) {
                setResources(prev => prev.filter(r => r.id !== resourceId));
            }
        } catch (error) {
            console.error('Failed to unsave:', error);
        } finally {
            setRemoving(null);
        }
    };

    if (resources.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 px-4"
            >
                <div className="text-center max-w-md">
                    <Bookmark size={64} className="mx-auto text-gray-600 mb-6" />
                    <h2 className="text-2xl font-bold text-gray-300 mb-3">No Saved Resources</h2>
                    <p className="text-gray-500 mb-6">
                        You haven't saved any resources yet. Start exploring and bookmark resources you'd like to read later!
                    </p>
                    <Link href="/browse">
                        <Button className="bg-amber-600 hover:bg-amber-700">
                            Browse Resources
                        </Button>
                    </Link>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
                {resources.map((resource, index) => (
                    <motion.div
                        key={resource.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{
                            duration: 0.3,
                            delay: index * 0.05,
                            layout: { duration: 0.3 }
                        }}
                    >
                        <Card className="bg-charcoal border-white/10 hover:border-amber-500/30 transition-all duration-300 h-full flex flex-col group">
                            <CardContent className="p-6 flex flex-col h-full">
                                <div className="flex-1">
                                    <Link href={`/resource/${resource.id}`}>
                                        <h3 className="text-lg font-bold text-pearl mb-2 line-clamp-2 group-hover:text-amber-400 transition-colors">
                                            {resource.title}
                                        </h3>
                                    </Link>

                                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                                        {resource.description}
                                    </p>

                                    <div className="space-y-2 text-xs text-gray-500 mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-amber-500/20 text-amber-400 px-2 py-1 rounded">
                                                {resource.subject}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-1">
                                                <Eye size={12} />
                                                {resource.viewsCount}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Download size={12} />
                                                {resource.downloadsCount}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1 text-gray-600">
                                            <Calendar size={12} />
                                            <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-auto">
                                    <Link href={`/resource/${resource.id}`} className="flex-1">
                                        <Button className="w-full text-xs bg-amber-600 hover:bg-amber-700">
                                            View Resource
                                        </Button>
                                    </Link>

                                    <Button
                                        onClick={() => handleUnsave(resource.id)}
                                        disabled={removing === resource.id}
                                        className="bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 text-red-400 px-3"
                                    >
                                        {removing === resource.id ? (
                                            <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                        ) : (
                                            <BookmarkX size={16} />
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
