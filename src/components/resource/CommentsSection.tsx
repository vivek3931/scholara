'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import SkeletonComment from '@/components/ui/SkeletonComment';

async function fetchComments(resourceId: string) {
    const res = await fetch(`/api/comments?resourceId=${resourceId}`);
    if (!res.ok) throw new Error('Failed to fetch comments');
    const data = await res.json();
    return data.comments || [];
}

async function postComment(resourceId: string, content: string) {
    const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId, content }),
    });
    if (!res.ok) throw new Error('Failed to post comment');
    return res.json();
}

export default function CommentsSection({ resourceId }: { resourceId: string }) {
    const [comment, setComment] = useState('');
    const queryClient = useQueryClient();

    const { data: comments = [], isLoading } = useQuery({
        queryKey: ['comments', resourceId],
        queryFn: () => fetchComments(resourceId),
        staleTime: 1000 * 30, // 30 seconds
    });

    const mutation = useMutation({
        mutationFn: (content: string) => postComment(resourceId, content),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', resourceId] });
            setComment('');
        },
    });

    const handlePostComment = () => {
        if (!comment.trim()) return;
        mutation.mutate(comment);
    };

    return (
        <Card className="bg-card mt-6 border-border">
            <CardHeader>
                <CardTitle className="text-base md:text-lg">
                    Comments {!isLoading && `(${comments.length})`}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex gap-2">
                    <Input
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="text-sm"
                        onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                    />
                    <Button
                        onClick={handlePostComment}
                        size="sm"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? 'Posting...' : 'Post'}
                    </Button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {isLoading && <SkeletonComment count={3} />}

                    {!isLoading && comments.map((c: any, idx: number) => (
                        <motion.div
                            key={c.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.15, delay: idx * 0.02 }}
                            className="border-b border-border pb-3"
                        >
                            <div className="flex justify-between mb-1">
                                <span className="font-bold text-primary text-xs md:text-sm">{c.user?.email?.split('@')[0] || 'User'}</span>
                                <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs md:text-sm text-card-foreground">{c.content}</p>
                        </motion.div>
                    ))}

                    {!isLoading && comments.length === 0 && (
                        <p className="text-gray-500 text-sm text-center py-4">No comments yet. Be the first!</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
