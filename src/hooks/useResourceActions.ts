'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface UseResourceActionsProps {
    resource: any;
    showModal: (msg: string) => void;
    user?: any;
}

export function useResourceActions({ resource, showModal, user }: UseResourceActionsProps) {
    const [saved, setSaved] = useState(false);
    const [likes, setLikes] = useState(0);
    const [dislikes, setDislikes] = useState(0);
    const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
    const [loadingVote, setLoadingVote] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [savingLoading, setSavingLoading] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    // Report Modal State
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [submittingReport, setSubmittingReport] = useState(false);

    useEffect(() => {
        // Check saved status
        const checkSaved = async () => {
            try {
                const res = await fetch(`/api/resources/save?resourceId=${resource.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setSaved(data.saved);
                }
            } catch (e) { console.error(e); }
        };

        // Check vote status
        const checkVote = async () => {
            try {
                const res = await fetch(`/api/resources/vote?resourceId=${resource.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setLikes(data.likesCount);
                    setDislikes(data.dislikesCount);
                    if (data.userLiked) setUserVote('like');
                    else if (data.userDisliked) setUserVote('dislike');
                }
            } catch (e) { console.error(e); }
        };

        checkSaved();
        checkVote();
    }, [resource.id]);

    const handleVote = async (type: 'like' | 'dislike') => {
        if (loadingVote) return;
        setLoadingVote(true);

        // Optimistic update
        const previousVote = userVote;
        const previousLikes = likes;
        const previousDislikes = dislikes;

        let newVote = userVote === type ? null : type;
        let newLikes = likes;
        let newDislikes = dislikes;

        if (userVote === type) {
            if (type === 'like') newLikes--;
            else newDislikes--;
        } else {
            if (type === 'like') {
                newLikes++;
                if (userVote === 'dislike') newDislikes--;
            } else {
                newDislikes++;
                if (userVote === 'like') newLikes--;
            }
        }

        setUserVote(newVote);
        setLikes(newLikes);
        setDislikes(newDislikes);

        try {
            const res = await fetch('/api/resources/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resourceId: resource.id, type })
            });

            if (!res.ok) throw new Error('Vote failed');

            const data = await res.json();
            setLikes(data.likesCount);
            setDislikes(data.dislikesCount);
            if (data.userLiked) setUserVote('like');
            else if (data.userDisliked) setUserVote('dislike');
            else setUserVote(null);

        } catch (error) {
            setUserVote(previousVote);
            setLikes(previousLikes);
            setDislikes(previousDislikes);
            toast.error('Failed to update vote');
        } finally {
            setLoadingVote(false);
        }
    };

    const handleSave = useCallback(async () => {
        setSavingLoading(true);
        try {
            const method = saved ? 'DELETE' : 'POST';
            const res = await fetch('/api/resources/save', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resourceId: resource.id }),
                credentials: 'include',
            });

            if (res.ok) {
                const data = await res.json();
                setSaved(data.saved);
                toast.success(data.saved ? 'Resource saved' : 'Resource removed from saved');
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to save resource');
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to save resource');
        } finally {
            setSavingLoading(false);
        }
    }, [saved, resource.id]);

    const handleDownloadConfirm = useCallback(async () => {
        setConfirmModalOpen(false);
        setDownloading(true);
        try {
            const res = await fetch('/api/resources/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resourceId: resource.id }),
                credentials: 'include',
            });

            if (res.ok) {
                window.open(resource.fileUrl, '_blank');
                showModal(user?.isPro ? 'Download started!' : 'Download started! Coins deducted.');
                window.dispatchEvent(new Event('coinsUpdated'));
            } else {
                const data = await res.json();
                showModal(data.error || 'Download failed');
            }
        } catch (error) {
            console.error('Download error:', error);
            showModal('Download failed');
        } finally {
            setDownloading(false);
        }
    }, [resource.id, resource.fileUrl, showModal, user?.isPro]);

    const handleDownloadClick = useCallback(() => {
        if (user?.isPro) {
            handleDownloadConfirm();
        } else {
            setConfirmModalOpen(true);
        }
    }, [user?.isPro, handleDownloadConfirm]);

    const handleReportSubmit = async () => {
        if (!reportReason.trim()) return;
        setSubmittingReport(true);

        try {
            const res = await fetch('/api/resources/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resourceId: resource.id,
                    reason: reportReason,
                    targetUserId: resource.authorId
                })
            });

            if (res.ok) {
                setReportModalOpen(false);
                setReportReason('');
                showModal('Report submitted successfully. We will review it shortly.');
            } else {
                toast.error('Failed to submit report.');
            }
        } catch (error) {
            toast.error('Error submitting report.');
        } finally {
            setSubmittingReport(false);
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
    };

    return {
        // State
        saved,
        likes,
        dislikes,
        userVote,
        loadingVote,
        downloading,
        savingLoading,
        confirmModalOpen,
        reportModalOpen,
        reportReason,
        submittingReport,
        
        // Setters
        setConfirmModalOpen,
        setReportModalOpen,
        setReportReason,

        // Handlers
        handleVote,
        handleSave,
        handleDownloadConfirm,
        handleDownloadClick,
        handleReportSubmit,
        handleShare
    };
}
