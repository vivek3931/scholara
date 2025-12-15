'use client';

import { useState, useCallback, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import ResourcePreview from './resource/ResourcePreview';
import ResourceActions from './resource/ResourceActions';
import ResourceRecommendations from './resource/ResourceRecommendations';
import CommentsSection from './resource/CommentsSection';
import MobileResourceActions from './resource/MobileResourceActions';
import { Button } from '@/components/ui/Button'; // Added
import { X, Sparkles } from 'lucide-react'; // Added
import { useLanguage } from '@/context/LanguageContext';

const EmbeddedChatbot = dynamic(() => import('./chatbot/EmbeddedChatbot'), {
    loading: () => <div className="h-full w-full bg-muted/10 animate-pulse rounded-xl" />
});
const ProUpgradeModal = dynamic(() => import('./subscription/ProUpgradeModal'));

export default function ResourceView({ resource }: { resource: any }) {
    const { t } = useLanguage();
    const [fullscreen, setFullscreen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [showChatbot, setShowChatbot] = useState(false);

    // User State for Gating
    const [user, setUser] = useState<any>(null);
    const [showProModal, setShowProModal] = useState(false);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => setUser(data.user))
            .catch(err => console.error('Failed to fetch user', err));
    }, []);

    const showModal = useCallback((message: string) => {
        setModalMessage(message);
        setModalOpen(true);
    }, []);

    const handleChatToggle = () => {
        if (!user) {
            showModal(t('ResourceView.verifySession'));
            return;
        }

        if (user.isPro) {
            setShowChatbot(true);
        } else {
            setShowProModal(true);
        }
    };

    const scrollToComments = () => {
        const element = document.getElementById('comments-section');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden pb-20 lg:pb-0">
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Notification">
                <p>{modalMessage}</p>
            </Modal>

            <ProUpgradeModal
                isOpen={showProModal}
                onClose={() => setShowProModal(false)}
            />

            <main className="container mx-auto px-4 py-4 lg:py-8">
                {/* Mobile Header Info (Visible only on mobile) */}
                <div className="lg:hidden mb-6 space-y-2">
                    <h1 className="text-2xl font-bold leading-tight">{resource.title}</h1>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="bg-muted px-2 py-1 rounded-md">{resource.subject}</span>
                        <span className="bg-muted px-2 py-1 rounded-md">{new Date(resource.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">

                    {/* LEFT COLUMN: Actions & Info OR Chatbot - Desktop Only */}
                    <div className="hidden lg:block lg:col-span-3 space-y-8 order-2 lg:order-1 relative h-[600px] lg:h-auto">
                        <AnimatePresence mode="wait">
                            {!showChatbot && (
                                <motion.div
                                    key="actions"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="absolute inset-0 lg:relative"
                                >
                                    <ResourceActions
                                        resource={resource}
                                        showModal={showModal}
                                        onChatToggle={handleChatToggle}
                                    />
                                </motion.div>
                            )}

                            {showChatbot && (
                                <motion.div
                                    key="chatbot"
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="absolute inset-0 lg:relative h-full"
                                >
                                    <EmbeddedChatbot
                                        onClose={() => setShowChatbot(false)}
                                        resourceUrl={resource.fileUrl}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* CENTER COLUMN: Preview Only */}
                    <div className="order-1 lg:order-2 lg:col-span-6 transition-all duration-300">
                        <ResourcePreview
                            resource={resource}
                            fullscreen={fullscreen}
                            setFullscreen={setFullscreen}
                            showModal={showModal}
                        />
                    </div>

                    {/* RIGHT COLUMN: Recommendations */}
                    <div className="lg:col-span-3 space-y-6 order-3">
                        <ResourceRecommendations
                            currentResourceId={resource.id}
                            subject={resource.subject}
                        />
                    </div>
                </div>

                {/* Comments Section */}
                <div id="comments-section" className="w-full mt-8">
                    <CommentsSection resourceId={resource.id} />
                </div>
            </main>

            {/* Mobile Chatbot Overlay */}
            <AnimatePresence>
                {showChatbot && (
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                        className="fixed inset-0 z-[60] bg-background lg:hidden flex flex-col"
                    >
                        <EmbeddedChatbot
                            onClose={() => setShowChatbot(false)}
                            resourceUrl={resource.fileUrl}
                            className="h-full w-full rounded-none border-0"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Actions Bottom Bar */}
            <MobileResourceActions
                resource={resource}
                showModal={showModal}
                onChatToggle={handleChatToggle}
                onCommentsClick={scrollToComments}
            />
        </div>
    );
}