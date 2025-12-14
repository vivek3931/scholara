'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
    Download,
    Bookmark,
    Share2,
    ThumbsUp,
    ThumbsDown,
    Flag,
    Sparkles,
    FileText,
    Calendar,
    User,
    Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useResourceActions } from '@/hooks/useResourceActions';

interface ResourceActionsProps {
    resource: any;
    showModal: (msg: string) => void;
    onChatToggle: () => void;
}

export default function ResourceActions({ resource, showModal, onChatToggle }: ResourceActionsProps) {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => setUser(data.user || null))
            .catch(err => console.error(err));
    }, []);

    const {
        saved,
        likes,
        dislikes,
        userVote,
        downloading,
        savingLoading,
        confirmModalOpen,
        reportModalOpen,
        reportReason,
        submittingReport,
        setConfirmModalOpen,
        setReportModalOpen,
        setReportReason,
        handleVote,
        handleSave,
        handleDownloadConfirm,
        handleDownloadClick,
        handleReportSubmit,
        handleShare
    } = useResourceActions({ resource, showModal, user });

    return (
        <div className="space-y-6">
            {/* Confirmation Modal */}
            {confirmModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-sm bg-card border border-border rounded-xl overflow-hidden shadow-2xl p-6"
                    >
                        <h3 className="text-lg font-bold text-foreground mb-4">Confirm Download</h3>
                        <p className="text-muted-foreground mb-6">Download this resource for 20 coins?</p>
                        <div className="flex gap-3 justify-end">
                            <Button
                                onClick={() => setConfirmModalOpen(false)}
                                className="bg-muted hover:bg-muted/80 text-foreground"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDownloadConfirm}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                Confirm
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Report Modal */}
            {reportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md bg-card border border-border rounded-xl overflow-hidden shadow-2xl"
                    >
                        <div className="p-4 border-b border-border flex justify-between items-center">
                            <h3 className="font-bold text-foreground">Report Resource</h3>
                            <button onClick={() => setReportModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <Check size={20} className="rotate-45" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <p className="text-sm text-muted-foreground">Please describe why you are reporting this resource.</p>
                            <textarea
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                className="w-full h-32 bg-input border border-input rounded-lg p-3 text-foreground text-sm focus:outline-none focus:border-primary resize-none placeholder:text-muted-foreground"
                                placeholder="Reason for reporting..."
                            />
                        </div>
                        <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setReportModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleReportSubmit} disabled={!reportReason.trim() || submittingReport} className="bg-red-500 hover:bg-red-600 text-white">
                                {submittingReport ? 'Submitting...' : 'Submit Report'}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Metadata Card */}
            <Card className="bg-muted/10 border-border backdrop-blur-sm overflow-hidden">
                <CardContent className="p-5 space-y-4">
                    <div>
                        <h1 className="text-xl font-bold text-foreground leading-tight mb-2">{resource.title}</h1>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                                <User size={12} /> {resource.author?.username || 'Unknown'}
                            </span>
                            <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                                <Calendar size={12} /> {new Date(resource.createdAt).toLocaleDateString('en-GB')}
                            </span>
                            <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                                <FileText size={12} /> {resource.pageCount || '?'} Pages
                            </span>
                        </div>
                    </div>

                    <div className="h-px bg-border" />

                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVote('like')}
                                className={`h-8 px-2 gap-1.5 ${userVote === 'like' ? 'text-green-500 bg-green-500/10' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <ThumbsUp size={16} className={userVote === 'like' ? 'fill-current' : ''} />
                                <span className="text-xs font-mono">{likes}</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVote('dislike')}
                                className={`h-8 px-2 gap-1.5 ${userVote === 'dislike' ? 'text-red-500 bg-red-500/10' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <ThumbsDown size={16} className={userVote === 'dislike' ? 'fill-current' : ''} />
                                <span className="text-xs font-mono">{dislikes}</span>
                            </Button>
                        </div>

                        <Button variant="ghost" size="sm" onClick={() => setReportModalOpen(true)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                            <Flag size={14} />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Primary Actions Grid */}
            <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleDownloadClick} disabled={downloading} className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-xl font-bold">
                    <Download size={18} className="mr-2" />
                    {downloading ? 'Downloading...' : 'Download'}
                </Button>
                <Button onClick={handleSave} variant="outline" className={`h-12 rounded-xl border-border hover:bg-muted ${saved ? 'text-primary border-primary/30' : 'text-foreground'}`}>
                    <Bookmark size={18} className={`mr-2 ${saved ? 'fill-current' : ''}`} />
                    {saved ? 'Saved' : 'Save'}
                </Button>
            </div>

            {/* AI Assistant Teaser */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative w-full overflow-hidden rounded-full p-[1px] shadow-2xl shadow-primary/20 group cursor-pointer"
                onClick={onChatToggle}
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-[-1000%] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,var(--primary)_50%,transparent_100%)]"
                />
                <div className="relative z-10 flex w-full items-center justify-center gap-3 rounded-full bg-background/90 px-6 py-4 text-sm font-medium text-foreground backdrop-blur-3xl transition-all duration-300 group-hover:bg-background/50">
                    <Sparkles className="w-4 h-4 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                    <span className="text-primary transition-all duration-300 group-hover:text-primary/80">
                        Ask AI about this document
                    </span>
                </div>
            </motion.div>

            {/* Secondary Actions */}
            <div className="flex justify-center pt-2">
                <Button variant="ghost" size="sm" onClick={handleShare} className="text-muted-foreground hover:text-foreground gap-2">
                    <Share2 size={14} /> Share Resource
                </Button>
            </div>
        </div>
    );
}
