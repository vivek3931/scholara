'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Download, Eye, User, Calendar, Lock, Bookmark, BookmarkCheck } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface ResourceCardProps {
    resource: {
        id: string;
        title: string;
        description: string;
        fileUrl: string;
        subject: string;
        downloadsCount: number;
        viewsCount: number;
        createdAt: Date | string;
        author: {
            email: string;
        };
    };
    isLoggedIn: boolean;
    isPro: boolean;
}

const getThumbnailUrl = (url: string) => {
    if (!url) return null;
    if (url.includes('cloudinary.com') && url.endsWith('.pdf')) {
        return url.replace('.pdf', '.jpg');
    }
    return null;
};

export default function ResourceCard({ resource, isLoggedIn, isPro }: ResourceCardProps) {
    const router = useRouter();
    const [showLoginModal, setShowLoginModal] = useState(false);

    // Logic states
    const [saved, setSaved] = useState(false);
    const [savingLoading, setSavingLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [confirmDownloadOpen, setConfirmDownloadOpen] = useState(false);

    // Check if resource is already saved
    useEffect(() => {
        if (!isLoggedIn) return;
        const checkSavedStatus = async () => {
            try {
                const res = await fetch(`/api/resources/save?resourceId=${resource.id}`, {
                    credentials: 'include'
                });
                if (res.ok) {
                    const data = await res.json();
                    setSaved(data.saved);
                }
            } catch (error) {
                console.error('Failed to check saved status:', error);
            }
        };
        checkSavedStatus();
    }, [resource.id, isLoggedIn]);

    const handleSaveToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isLoggedIn) {
            setShowLoginModal(true);
            return;
        }

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
                setModalMessage(data.message);
                setModalOpen(true);
            } else {
                setModalMessage('Failed to save resource');
                setModalOpen(true);
            }
        } catch (error) {
            setModalMessage('Failed to save resource');
            setModalOpen(true);
        } finally {
            setSavingLoading(false);
        }
    };

    const handleDownloadClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isLoggedIn) {
            setShowLoginModal(true);
            return;
        }

        if (isPro) {
            // Bypass confirmation if Pro
            handleDownloadConfirm();
        } else {
            setConfirmDownloadOpen(true);
        }
    };

    const handleDownloadConfirm = async () => {
        setConfirmDownloadOpen(false);
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
                setModalMessage(isPro ? 'Download started!' : 'Download started! Coins deducted.');
                setModalOpen(true);
                window.dispatchEvent(new Event('coinsUpdated'));
            } else {
                const data = await res.json();
                setModalMessage(data.error || 'Download failed');
                setModalOpen(true);
            }
        } catch (error) {
            setModalMessage('Download failed');
            setModalOpen(true);
        } finally {
            setDownloading(false);
        }
    };

    const handleClick = () => {
        if (isLoggedIn) {
            router.push(`/resource/${resource.id}`);
        } else {
            setShowLoginModal(true);
        }
    };

    return (
        <>
            <div onClick={handleClick} className="h-full">
                <Card className="hover:border-primary transition-all duration-300 h-full cursor-pointer border-border bg-card backdrop-blur group overflow-hidden flex flex-col relative text-left">
                    {/* Top Badge */}
                    <div className="absolute top-0 right-0 z-10 bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground rounded-bl-lg shadow-lg">
                        {resource.subject}
                    </div>

                    {/* Thumbnail */}
                    <div className="relative h-48 w-full bg-muted overflow-hidden shrink-0">
                        {getThumbnailUrl(resource.fileUrl) ? (
                            <Image
                                src={getThumbnailUrl(resource.fileUrl)!}
                                alt={resource.title}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground bg-muted/50">
                                <div className="text-center">
                                    <span className="text-4xl font-bold opacity-20 block">PDF</span>
                                </div>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

                        {/* Lock Icon if not logged in */}
                        {!isLoggedIn && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <Lock className="w-12 h-12 text-foreground/80 drop-shadow-lg" />
                            </div>
                        )}
                    </div>

                    <CardHeader className="pb-2 relative z-10 -mt-6">
                        <CardTitle className="text-xl line-clamp-2 text-primary group-hover:text-primary/90 transition-colors drop-shadow-md">
                            {resource.title}
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="py-3 px-6 flex-grow">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                            <User className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">by {resource.author.email.split('@')[0]}</span>
                        </div>
                    </CardContent>

                    <CardFooter className="border-t border-border pt-4 flex items-center justify-between mt-auto">
                        {/* Stats */}
                        <div className="flex gap-4">
                            <button
                                onClick={handleDownloadClick}
                                disabled={downloading}
                                className="flex items-center gap-1.5 text-muted-foreground group-hover:text-primary transition-colors hover:text-primary/80 disabled:opacity-50"
                            >
                                <Download className="w-4 h-4" />
                                <span className="text-xs font-medium">{resource.downloadsCount}</span>
                            </button>
                            <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-primary transition-colors">
                                <Eye className="w-4 h-4" />
                                <span className="text-xs font-medium">{resource.viewsCount}</span>
                            </div>
                        </div>

                        {/* Save Option */}
                        <button
                            onClick={handleSaveToggle}
                            disabled={savingLoading}
                            className={`transition-colors ${saved ? 'text-green-500 hover:text-green-400' : 'text-muted-foreground hover:text-primary'}`}
                        >
                            {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                        </button>
                    </CardFooter>
                </Card>
            </div>

            <Modal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                title="Login Required"
            >
                <div className="flex flex-col gap-4">
                    <p>You need to be logged in to view this resource.</p>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setShowLoginModal(false)}>
                            Cancel
                        </Button>
                        <Link href="/login">
                            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                Login Now
                            </Button>
                        </Link>
                    </div>
                </div>
            </Modal>

            {/* General Feedback Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Notification"
            >
                <div className="flex flex-col gap-4">
                    <p>{modalMessage}</p>
                    <div className="flex justify-end gap-2">
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setModalOpen(false)}>
                            Close
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Download Confirmation Modal */}
            <Modal
                isOpen={confirmDownloadOpen}
                onClose={() => setConfirmDownloadOpen(false)}
                title="Confirm Download"
            >
                <p className="text-muted-foreground mb-4">Download this resource for 20 coins?</p>
                <div className="flex gap-3 justify-end">
                    <Button
                        onClick={() => setConfirmDownloadOpen(false)}
                        className="bg-muted hover:bg-muted/80 text-foreground"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDownloadConfirm}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        Confirm
                    </Button>
                </div>
            </Modal>
        </>
    );
}
