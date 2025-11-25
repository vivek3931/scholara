'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';

export default function CommentsSection({ resourceId }: { resourceId: string }) {
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');

    const fetchComments = useCallback(async () => {
        try {
            const res = await fetch(`/api/comments?resourceId=${resourceId}`);
            if (res.ok) {
                const data = await res.json();
                setComments(data.comments);
            }
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        } finally {
            setLoading(false);
        }
    }, [resourceId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handlePostComment = async () => {
        if (!comment.trim()) return;
        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resourceId, content: comment }),
            });
            if (res.ok) {
                setComment('');
                fetchComments();
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Card className="bg-onyx border-white/10 mt-6">
            <CardHeader>
                <CardTitle className="text-base md:text-lg">
                    Comments {loading ? '' : `(${comments.length})`}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex gap-2">
                    <Input
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="text-sm"
                    />
                    <Button onClick={handlePostComment} size="sm">Post</Button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        [1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse space-y-2 border-b border-white/5 pb-3">
                                <div className="flex justify-between">
                                    <div className="h-4 bg-white/10 rounded w-24"></div>
                                    <div className="h-3 bg-white/10 rounded w-16"></div>
                                </div>
                                <div className="h-3 bg-white/10 rounded w-full"></div>
                                <div className="h-3 bg-white/10 rounded w-2/3"></div>
                            </div>
                        ))
                    ) : (
                        comments.map((c: any, idx: number) => (
                            <motion.div
                                key={c.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.15, delay: idx * 0.02 }}
                                className="border-b border-white/5 pb-3"
                            >
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-amber-500 text-xs md:text-sm">{c.user?.email?.split('@')[0] || 'User'}</span>
                                    <span className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs md:text-sm text-gray-300">{c.content}</p>
                            </motion.div>
                        ))
                    )}
                    {!loading && comments.length === 0 && (
                        <p className="text-gray-500 text-sm text-center py-4">No comments yet. Be the first!</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
