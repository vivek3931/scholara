'use client';

import { useState, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import ResourcePreview from './resource/ResourcePreview';
import ResourceInfo from './resource/ResourceInfo';
import CommentsSection from './resource/CommentsSection';

export default function ResourceView({ resource }: { resource: any }) {
    const [fullscreen, setFullscreen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    const showModal = useCallback((message: string) => {
        setModalMessage(message);
        setModalOpen(true);
    }, []);

    return (
        <div className="container bg-gradient-to-br from-onyx via-charcoal to-onyx  mx-auto py-10 px-4 relative">
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Notification">
                <p>{modalMessage}</p>
            </Modal>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2">
                    <ResourcePreview
                        resource={resource}
                        fullscreen={fullscreen}
                        setFullscreen={setFullscreen}
                        showModal={showModal}
                    />

                    <AnimatePresence mode="wait" initial={false}>
                        {!fullscreen && (
                            <motion.div
                                key="comments-section"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <CommentsSection resourceId={resource.id} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Sidebar */}
                <div className="space-y-6 ">
                    <AnimatePresence mode="wait" initial={false}>
                        {!fullscreen && (
                            <motion.div
                                key="sidebar"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ResourceInfo resource={resource} showModal={showModal} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}   