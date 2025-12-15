'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Download as DownloadIcon, Bookmark, BookmarkCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useLanguage } from '@/context/LanguageContext';

export default function ResourceInfo({ resource, showModal }: { resource: any, showModal: (msg: string) => void }) {
    const { t } = useLanguage();
    const [downloading, setDownloading] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [saved, setSaved] = useState(false);
    const [savingLoading, setSavingLoading] = useState(false);

    // Check if resource is already saved
    useEffect(() => {
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

        window.addEventListener('userLoggedIn', checkSavedStatus);
        return () => window.removeEventListener('userLoggedIn', checkSavedStatus);
    }, [resource.id]);

    const handleSaveToggle = useCallback(async () => {
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
                showModal(data.message);
            } else {
                const data = await res.json();
                showModal(data.error || t('ResourceCard.saveFailed'));
            }
        } catch (error) {
            console.error('Save error:', error);
            showModal(t('ResourceCard.saveFailed'));
        } finally {
            setSavingLoading(false);
        }
    }, [saved, resource.id, showModal, t]);

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
                showModal(t('ResourceCard.downloadStartedCoins'));
                window.dispatchEvent(new Event('coinsUpdated'));
            } else {
                const data = await res.json();
                showModal(data.error || t('ResourceCard.downloadFailed'));
            }
        } catch (error) {
            console.error('Download error:', error);
            showModal(t('ResourceCard.downloadFailed'));
        } finally {
            setDownloading(false);
        }
    }, [resource.id, resource.fileUrl, showModal, t]);

    return (
        <>
            <Modal
                isOpen={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                title={t('ResourceCard.confirmDownloadTitle')}
            >
                <p className="text-gray-300 mb-4">{t('ResourceCard.confirmDownloadMessage')}</p>
                <div className="flex gap-3 justify-end">
                    <Button
                        onClick={() => setConfirmModalOpen(false)}
                        className="bg-gray-600 hover:bg-gray-700"
                    >
                        {t('Common.cancel')}
                    </Button>
                    <Button
                        onClick={handleDownloadConfirm}
                        className="bg-amber-600 hover:bg-amber-700"
                    >
                        {t('Common.confirm')}
                    </Button>
                </div>
            </Modal>

            <Card className="bg-card sticky top-4 border-border">
                <CardHeader>
                    <CardTitle className="text-primary text-base md:text-lg">{t('ResourceInfo.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div>
                        <p className="text-muted-foreground text-xs">{t('ResourceInfo.subject')}</p>
                        <p className="text-foreground font-semibold text-sm">{resource.subject}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs">{t('ResourceInfo.description')}</p>
                        <p className="text-muted-foreground/90 text-xs line-clamp-2">{resource.description}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs">{t('ResourceInfo.author')}</p>
                        <p className="text-foreground text-sm">{resource.author?.email?.split('@')[0] || t('ResourceCard.unknown')}</p>
                    </div>

                    {/* Save Button */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button
                            onClick={handleSaveToggle}
                            className={`w-full text-sm ${saved
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-gray-700 hover:bg-gray-600'
                                }`}
                            disabled={savingLoading}
                        >
                            {savingLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            ) : saved ? (
                                <BookmarkCheck size={16} className="mr-2" />
                            ) : (
                                <Bookmark size={16} className="mr-2" />
                            )}
                            {savingLoading ? t('ResourceInfo.processing') : saved ? t('ResourceInfo.saved') : t('ResourceInfo.save')}
                        </Button>
                    </motion.div>

                    {/* Download Button */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button
                            onClick={() => setConfirmModalOpen(true)}
                            className="w-full mt-2 text-sm"
                            disabled={downloading}
                        >
                            <DownloadIcon size={16} className="mr-2" />
                            {downloading ? t('ResourceInfo.processing') : t('ResourceInfo.download')}
                        </Button>
                    </motion.div>


                </CardContent>
            </Card>
        </>
    );
}
