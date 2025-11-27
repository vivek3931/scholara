'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Download as DownloadIcon, Bookmark, BookmarkCheck, Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';

export default function ResourceInfo({ resource, showModal }: { resource: any, showModal: (msg: string) => void }) {
    const [downloading, setDownloading] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [saved, setSaved] = useState(false);
    const [savingLoading, setSavingLoading] = useState(false);

    // Translation states
    const [translating, setTranslating] = useState(false);
    const [showTranslateOptions, setShowTranslateOptions] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [translatedPdfUrl, setTranslatedPdfUrl] = useState('');
    const [translationProgress, setTranslationProgress] = useState('');

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
                showModal(data.error || 'Failed to save resource');
            }
        } catch (error) {
            console.error('Save error:', error);
            showModal('Failed to save resource');
        } finally {
            setSavingLoading(false);
        }
    }, [saved, resource.id, showModal]);

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
                showModal('Download started! Coins deducted.');
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
    }, [resource.id, resource.fileUrl, showModal]);

    // Translation handler
    const handleTranslate = useCallback(async () => {
        if (!selectedLanguage) {
            showModal('Please select a language');
            return;
        }

        setTranslating(true);
        setTranslationProgress('Extracting text...');
        setTranslatedPdfUrl('');

        try {
            await new Promise(r => setTimeout(r, 500));
            setTranslationProgress('Translating to selected language...');

            const res = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileUrl: resource.fileUrl,
                    targetLanguage: selectedLanguage,
                }),
                credentials: 'include',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Translation failed');
            }

            setTranslationProgress('Rebuilding PDF...');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);

            setTranslatedPdfUrl(url);
            // Notify parent component about the new PDF URL
            if (resource.onPdfUrlChange) {
                resource.onPdfUrlChange(url);
            }

            showModal(`PDF translated successfully! The preview has been updated.`);
            setShowTranslateOptions(false);

        } catch (error: any) {
            console.error('Translation error:', error);
            showModal(error.message || 'Translation failed. Please try again.');
        } finally {
            setTranslating(false);
            setTranslationProgress('');
        }
    }, [selectedLanguage, resource.fileUrl, showModal, resource]);

    // Download translated PDF
    const handleDownloadTranslated = useCallback(() => {
        if (!translatedPdfUrl) return;

        const link = document.createElement('a');
        link.href = translatedPdfUrl;
        link.download = `${resource.title}_translated.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showModal('Translated PDF downloaded!');
    }, [translatedPdfUrl, resource.title, showModal]);

    return (
        <>
            <Modal
                isOpen={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                title="Confirm Download"
            >
                <p className="text-gray-300 mb-4">Download this resource for 20 coins?</p>
                <div className="flex gap-3 justify-end">
                    <Button
                        onClick={() => setConfirmModalOpen(false)}
                        className="bg-gray-600 hover:bg-gray-700"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDownloadConfirm}
                        className="bg-amber-600 hover:bg-amber-700"
                    >
                        Confirm
                    </Button>
                </div>
            </Modal>

            <Card className="bg-onyx/60 sticky top-4">
                <CardHeader>
                    <CardTitle className="text-amber-500 text-base md:text-lg">Resource Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div>
                        <p className="text-gray-400 text-xs">Subject</p>
                        <p className="text-white font-semibold text-sm">{resource.subject}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs">Description</p>
                        <p className="text-gray-300 text-xs line-clamp-2">{resource.description}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs">Author</p>
                        <p className="text-white text-sm">{resource.author?.email?.split('@')[0] || 'Unknown'}</p>
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
                            {savingLoading ? 'Processing...' : saved ? 'Saved' : 'Save for Later'}
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
                            {downloading ? 'Processing...' : 'Download (20 Coins)'}
                        </Button>
                    </motion.div>

                    {/* Translation Section */}
                    <div className="pt-4 border-t border-white/10">
                        <p className="text-gray-400 text-xs mb-3">Translate PDF</p>

                        {!showTranslateOptions && !translatedPdfUrl && (
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Button
                                    onClick={() => setShowTranslateOptions(true)}
                                    className="w-full bg-gradient-to-r text-blue-600 from-orange-600 via-white to-green-600 hover:from-orange-700 hover:to-orange-700 text-sm"
                                >
                                    <Languages size={16} className="mr-2" />
                                    Translate to Indian Language
                                </Button>
                            </motion.div>
                        )}

                        <AnimatePresence mode="wait">
                            {showTranslateOptions && !translatedPdfUrl && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-3"
                                >
                                    <select
                                        value={selectedLanguage}
                                        onChange={(e) => setSelectedLanguage(e.target.value)}
                                        className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                                        disabled={translating}
                                    >
                                        <option value="">Select Language</option>
                                        <option value="hindi">हिंदी (Hindi)</option>
                                        <option value="bengali">বাংলা (Bengali)</option>
                                        <option value="tamil">தமிழ் (Tamil)</option>
                                        <option value="telugu">తెలుగు (Telugu)</option>
                                        <option value="marathi">मराठी (Marathi)</option>
                                        <option value="gujarati">ગુજરાતી (Gujarati)</option>
                                        <option value="kannada">ಕನ್ನಡ (Kannada)</option>
                                        <option value="malayalam">മലയാളം (Malayalam)</option>
                                        <option value="punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
                                        <option value="odia">ଓଡ଼ିଆ (Odia)</option>
                                        <option value="assamese">অসমীয়া (Assamese)</option>
                                        <option value="urdu">اردو (Urdu)</option>
                                        <option value="kashmiri">کٲشُر (Kashmiri)</option>
                                        <option value="konkani">कोंकणी (Konkani)</option>
                                        <option value="maithili">मैथिली (Maithili)</option>
                                        <option value="nepali">नेपाली (Nepali)</option>
                                        <option value="sanskrit">संस्कृतम् (Sanskrit)</option>
                                        <option value="sindhi">سنڌي (Sindhi)</option>
                                        <option value="santali">ᱥᱟᱱᱛᱟᱲᱤ (Santali)</option>
                                        <option value="dogri">डोगरी (Dogri)</option>
                                        <option value="manipuri">ꯃꯩꯇꯩꯂꯣꯟ (Manipuri)</option>
                                        <option value="bodo">बड़ो (Bodo)</option>
                                    </select>

                                    {translating && (
                                        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
                                                <p className="text-purple-300 text-xs font-medium">{translationProgress}</p>
                                            </div>
                                            <div className="w-full bg-purple-900/30 rounded-full h-1.5 overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                                                    initial={{ width: '0%' }}
                                                    animate={{ width: '100%' }}
                                                    transition={{ duration: 2, ease: 'easeInOut' }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => {
                                                setShowTranslateOptions(false);
                                                setSelectedLanguage('');
                                            }}
                                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-xs"
                                            disabled={translating}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleTranslate}
                                            className="flex-1 bg-gradient-to-r text-white from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-xs"
                                            disabled={translating || !selectedLanguage}
                                        >
                                            {translating ? 'Translating...' : 'Translate'}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {translatedPdfUrl && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="space-y-2"
                                >
                                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                                        <p className="text-green-300 text-xs font-medium mb-1">✓ Translation Complete!</p>
                                        <p className="text-gray-400 text-xs">Your translated PDF is ready to download.</p>
                                    </div>

                                    <Button
                                        onClick={handleDownloadTranslated}
                                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-sm"
                                    >
                                        <DownloadIcon size={16} className="mr-2" />
                                        Download Translated PDF
                                    </Button>

                                    <Button
                                        onClick={() => {
                                            setTranslatedPdfUrl('');
                                            setSelectedLanguage('');
                                            setShowTranslateOptions(false);
                                        }}
                                        className="w-full bg-gray-700 hover:bg-gray-600 text-xs"
                                    >
                                        Translate to Another Language
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
