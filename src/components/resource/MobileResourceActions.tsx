'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import {
    Download,
    Bookmark,
    Share2,
    ThumbsUp,
    ThumbsDown,
    Flag,
    MoreHorizontal,
    MessageSquare,
    X,
    Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResourceActions } from '@/hooks/useResourceActions';
import { Drawer } from 'vaul'; // Assuming vaul is installed or we implement a custom one. Let's use custom motion for now if vaul isn't there.

// Using custom Framer Motion Drawer for dependency safety
const SwipeableDrawer = ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-2xl z-50 p-6 pb-10 shadow-3xl"
                        drag="y"
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 100) onClose();
                        }}
                    >
                        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

interface MobileResourceActionsProps {
    resource: any;
    showModal: (msg: string) => void;
    onChatToggle: () => void;
    onCommentsClick: () => void;
}

export default function MobileResourceActions({ resource, showModal, onChatToggle, onCommentsClick }: MobileResourceActionsProps) {
    const [user, setUser] = useState<any>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

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
        reportModalOpen,
        reportReason,
        submittingReport,
        setReportModalOpen,
        setReportReason,
        handleVote,
        handleSave,
        handleDownloadClick,
        handleReportSubmit,
        handleShare
    } = useResourceActions({ resource, showModal, user });

    // Close drawer when report modal opens or other full-screen actions
    useEffect(() => {
        if (reportModalOpen) setDrawerOpen(false);
    }, [reportModalOpen]);

    return (
        <>
            {/* Fixed Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/85 backdrop-blur-xl border-t border-border p-3 px-4 z-40 flex items-center justify-between pb-safe md:hidden">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleVote('like')} className={userVote === 'like' ? 'text-green-500 bg-green-500/10' : 'text-muted-foreground'}>
                        <ThumbsUp size={20} className={userVote === 'like' ? 'fill-current' : ''} />
                    </Button>
                    <span className="text-sm font-medium w-6 text-center">{likes - dislikes}</span>
                    <Button variant="ghost" size="icon" onClick={() => handleVote('dislike')} className={userVote === 'dislike' ? 'text-red-500 bg-red-500/10' : 'text-muted-foreground'}>
                        <ThumbsDown size={20} className={userVote === 'dislike' ? 'fill-current' : ''} />
                    </Button>
                </div>

                <div className="flex items-center gap-3">
                    <Button onClick={handleDownloadClick} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-6 shadow-lg shadow-primary/20">
                        {downloading ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                        ) : (
                            <>
                                <Download size={16} className="mr-2" />
                                Download
                            </>
                        )}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(true)}>
                        <MoreHorizontal size={24} />
                    </Button>
                </div>
            </div>

            {/* Expandable Menu Drawer */}
            <SwipeableDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <button onClick={handleSave} className="flex flex-col items-center gap-2 p-2 rounded-xl active:bg-muted/50 transition-colors">
                        <div className={`p-3 rounded-full ${saved ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground'}`}>
                            <Bookmark size={24} className={saved ? 'fill-current' : ''} />
                        </div>
                        <span className="text-xs font-medium">{saved ? 'Saved' : 'Save'}</span>
                    </button>

                    <button onClick={onChatToggle} className="flex flex-col items-center gap-2 p-2 rounded-xl active:bg-muted/50 transition-colors">
                        <div className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
                            <Sparkles size={24} />
                        </div>
                        <span className="text-xs font-medium">Ask AI</span>
                    </button>

                    <button onClick={() => { onCommentsClick(); setDrawerOpen(false); }} className="flex flex-col items-center gap-2 p-2 rounded-xl active:bg-muted/50 transition-colors">
                        <div className="p-3 rounded-full bg-muted text-foreground">
                            <MessageSquare size={24} />
                        </div>
                        <span className="text-xs font-medium">Comments</span>
                    </button>

                    <button onClick={handleShare} className="flex flex-col items-center gap-2 p-2 rounded-xl active:bg-muted/50 transition-colors">
                        <div className="p-3 rounded-full bg-muted text-foreground">
                            <Share2 size={24} />
                        </div>
                        <span className="text-xs font-medium">Share</span>
                    </button>
                </div>

                <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20" onClick={() => setReportModalOpen(true)}>
                        <Flag size={16} className="mr-3" /> Report Issue
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={() => setDrawerOpen(false)}>
                        Cancel
                    </Button>
                </div>
            </SwipeableDrawer>

            {/* Reusing Report Modal Logic (Copied cleanly or could be extracted to separate component, for now inline to be safe) */}
            {reportModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md bg-card border border-border rounded-xl overflow-hidden shadow-2xl"
                    >
                        <div className="p-4 border-b border-border flex justify-between items-center">
                            <h3 className="font-bold text-foreground">Report Resource</h3>
                            <button onClick={() => setReportModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X size={20} />
                            </button>
                        </div>
                        {/* Body same as ResourceActions */}
                        <div className="p-4 space-y-4">
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
        </>
    );
}
