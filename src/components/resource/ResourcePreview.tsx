'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CardContent, CardTitle } from '@/components/ui/Card';
import {
    ZoomIn,
    ZoomOut,
    Maximize2,
    Minimize2,
    CheckCircle2,
    MousePointerClick,
    Cpu,
    Sparkles,
    Copy,
    X,
    Layers,
    ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';

// Animation variants
const fadeInOut = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.25, ease: 'easeInOut' }
};

const slideInRight = {
    initial: { opacity: 0, x: 10 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 10 },
    transition: { duration: 0.2, ease: 'easeOut' }
};

const scaleIn = {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
    transition: { duration: 0.2, ease: 'easeOut' }
};

export default function ResourcePreview({ resource, fullscreen, setFullscreen, showModal }: { resource: any, fullscreen: boolean, setFullscreen: (v: boolean) => void, showModal: (msg: string) => void }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [zoom, setZoom] = useState(100);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedPages, setSelectedPages] = useState<number[]>([]);
    const [summary, setSummary] = useState('');
    const [loadingAi, setLoadingAi] = useState(false);
    const [showArtifact, setShowArtifact] = useState(false);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [expandControls, setExpandControls] = useState(false);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && fullscreen) {
                setFullscreen(false);
            }
        };

        if (fullscreen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [fullscreen, setFullscreen]);

    const togglePageSelection = useCallback(() => {
        if (!selectionMode) return;
        setSelectedPages(prev => {
            if (prev.includes(currentPage)) {
                return prev.filter(p => p !== currentPage);
            } else {
                return [...prev, currentPage];
            }
        });
    }, [selectionMode, currentPage]);

    const handleSummarize = useCallback(async () => {
        if (selectedPages.length === 0) {
            showModal("Please select at least one page.");
            return;
        }

        setLoadingAi(true);
        setShowArtifact(true);
        setSummary('');

        try {
            await new Promise(r => setTimeout(r, 1500));

            const res = await fetch('/api/ai/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resourceId: resource.id, pages: selectedPages }),
            });

            const data = await res.json();
            if (res.ok) {
                setSummary(data.summary);
                setSelectionMode(false);
                setSelectedPages([]);
            } else {
                showModal(data.error || 'Summarization failed');
                setShowArtifact(false);
            }
        } catch (e) {
            console.error(e);
            showModal('Error generating summary');
            setShowArtifact(false);
        } finally {
            setLoadingAi(false);
        }
    }, [selectedPages, resource.id, showModal]);

    const formatSummary = useCallback((text: string) => {
        return text.split('\n\n').filter(p => p.trim());
    }, []);

    const isCurrentPageSelected = useMemo(() => selectedPages.includes(currentPage), [selectedPages, currentPage]);

    const zoomIn = useCallback(() => setZoom(prev => Math.min(250, prev + 25)), []);
    const zoomOut = useCallback(() => setZoom(prev => Math.max(50, prev - 25)), []);

    return (
        <>
            {/* Backdrop Overlay */}
            <AnimatePresence mode="wait">
                {fullscreen && (
                    <motion.div
                        key="backdrop"
                        {...fadeInOut}
                        className="fixed inset-0 bg-black/90 z-40 backdrop-blur-md"
                        onClick={() => setFullscreen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Main Viewer Container */}
            <motion.div
                layout
                layoutId="viewer-container"
                transition={{
                    layout: { duration: 0.35, type: "easeInOut" },
                    opacity: { duration: 0.25 },
                    scale: { duration: 0.25 }
                }}
                className={`
                    flex flex-col overflow-hidden bg-onyx shadow-2xl border border-white/10 will-change-transform
                    ${fullscreen
                        ? 'fixed inset-0 z-50 h-screen w-screen rounded-none'
                        : 'relative min-h-[75vh] rounded-xl'
                    }
                `}
            >

                {/* Header */}
                <motion.div
                    className="bg-black/90 backdrop-blur-md border-b border-white/10 py-3 px-4 shrink-0 z-20"
                    layout="position"
                >
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-amber-500 text-lg flex items-center gap-2 truncate">
                            {resource.title}
                            <AnimatePresence mode="wait">
                                {selectionMode && (
                                    <motion.span
                                        key="selection-badge"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="ml-2 text-[10px] bg-cyan-900/50 border border-cyan-500/50 text-cyan-400 px-2 py-0.5 rounded uppercase tracking-wider"
                                    >
                                        Selection Active
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <button onClick={zoomOut} className="p-2 hover:bg-white/10 rounded text-gray-400 transition-colors duration-150 will-change-auto"><ZoomOut size={16} /></button>
                            <span className="text-xs text-gray-400 w-10 text-center font-mono font-bold">{zoom}%</span>
                            <button onClick={zoomIn} className="p-2 hover:bg-white/10 rounded text-gray-400 transition-colors duration-150 will-change-auto"><ZoomIn size={16} /></button>
                            <div className="w-px h-4 bg-white/10 mx-1"></div>
                            <button onClick={() => setFullscreen(!fullscreen)} className="p-2 hover:bg-white/10 rounded text-gray-400 transition-colors duration-150 will-change-auto">
                                {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* PDF Content Area */}
                <CardContent className="flex-1 p-0 relative bg-zinc-900 overflow-hidden will-change-scroll">

                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800 to-black" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center top', transition: 'transform 0.15s ease-out' }}>

                        {/* PDF Viewer */}
                        <div
                            className="relative shadow-2xl mx-auto"
                            style={{
                                width: '100%',
                                maxWidth: '100vw',
                                aspectRatio: '8.5 / 11'
                            }}
                        >
                                {/* Skeleton Loader */}
                                {!iframeLoaded && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                                            <p className="text-gray-400 text-sm animate-pulse">Loading Document...</p>
                                        </div>
                                    </div>
                                )}

                                {/* Iframe */}
                                <iframe
                                    src={`${resource.fileUrl}#page=${currentPage}&view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                                    className="w-full h-full border-none block custom-scrollbar"
                                    style={{
                                        pointerEvents: selectionMode ? 'none' : 'auto',
                                        willChange: 'transform',
                                        opacity: iframeLoaded ? 1 : 0
                                    }}
                                    onLoad={() => setIframeLoaded(true)}
                                />

                                {/* Selection Overlay */}
                                <AnimatePresence mode="wait">
                                    {selectionMode && !showArtifact && (
                                        <motion.div
                                            key="selection-overlay"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                            onClick={togglePageSelection}
                                            className={`absolute inset-0 z-10 cursor-pointer transition-colors duration-200 flex items-center justify-center
                                                ${isCurrentPageSelected
                                                    ? 'bg-cyan-500/10 backdrop-blur-[1px] border-4 border-cyan-500/50'
                                                    : 'bg-black/20 hover:bg-cyan-400/5'}`}
                                        >
                                            <motion.div
                                                className="transition-all duration-200"
                                                animate={{
                                                    scale: isCurrentPageSelected ? 1 : 0.9,
                                                    opacity: isCurrentPageSelected ? 1 : 0.7
                                                }}
                                            >
                                                {isCurrentPageSelected ? (
                                                    <motion.div
                                                        layoutId="selection-badge"
                                                        className="bg-cyan-600 text-white px-5 py-2.5 rounded-lg shadow-[0_0_25px_rgba(8,145,178,0.5)] flex items-center gap-2"
                                                    >
                                                        <CheckCircle2 size={28} className="text-white fill-cyan-600" />
                                                        <span className="font-bold whitespace-nowrap">Page {currentPage} Selected</span>
                                                    </motion.div>
                                                ) : (
                                                    <div className="bg-black/60 backdrop-blur-md text-cyan-300 border border-cyan-500/30 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm">
                                                        <MousePointerClick size={16} />
                                                        <span className="whitespace-nowrap">Click to Select</span>
                                                    </div>
                                                )}
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Floating Controls - Bottom Right */}
                                <div className="absolute bottom-6 right-6 z-30 flex items-center gap-2">
                                    <AnimatePresence mode="wait">
                                        {!selectionMode ? (
                                            <motion.button
                                                key="sparkles-btn"
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 0.6 }}
                                                whileHover={{ opacity: 1 }}
                                                exit={{ scale: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setExpandControls(!expandControls)}
                                                className="relative w-14 h-14 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 flex items-center justify-center transition-all duration-200 will-change-transform"
                                            >
                                                <Sparkles size={24} />
                                            </motion.button>
                                        ) : (
                                            <motion.div
                                                key="selection-controls"
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                                transition={{ duration: 0.2 }}
                                                className="flex items-center gap-2 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-xl"
                                            >
                                                <div className="text-center min-w-[50px]">
                                                    <p className="text-xs text-gray-400">Selected</p>
                                                    <p className="text-sm text-cyan-400 font-bold">{selectedPages.length}</p>
                                                </div>
                                                <div className="h-6 w-px bg-white/10"></div>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => {
                                                        setSelectionMode(false);
                                                        setSelectedPages([]);
                                                        setExpandControls(false);
                                                    }}
                                                    className="px-3 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-gray-300 text-xs font-medium transition-colors whitespace-nowrap"
                                                >
                                                    Cancel
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: selectedPages.length > 0 ? 1.05 : 1 }}
                                                    whileTap={{ scale: selectedPages.length > 0 ? 0.95 : 1 }}
                                                    onClick={handleSummarize}
                                                    disabled={selectedPages.length === 0}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all whitespace-nowrap
                                                        ${selectedPages.length > 0
                                                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/20'
                                                            : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'}`}
                                                >
                                                    <Sparkles size={14} />
                                                    Process
                                                </motion.button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Expanded Controls Menu */}
                                    <AnimatePresence mode="wait">
                                        {expandControls && !selectionMode && (
                                            <motion.div
                                                key="expanded-menu"
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                                transition={{ duration: 0.2 }}
                                                className="flex items-center gap-2 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-xl"
                                            >
                                                <button
                                                    onClick={() => {
                                                        setSelectionMode(true);
                                                        setExpandControls(false);
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-medium transition-colors whitespace-nowrap"
                                                >
                                                    <Layers size={14} />
                                                    Select Pages
                                                </button>
                                                <div className="h-6 w-px bg-white/10"></div>
                                                <div className="px-2 py-1 text-xs text-gray-400">
                                                    <span>Page: <span className="text-white font-bold">{currentPage}</span></span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        {/* </motion.div> */}
                    </div>

                    {/* AI Artifact Overlay */}
                    <AnimatePresence mode="wait">
                        {showArtifact && (
                            <motion.div
                                key="artifact-backdrop"
                                {...fadeInOut}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center overflow-hidden"
                            >
                                {loadingAi && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="relative z-10 flex flex-col items-center gap-6">
                                            <div className="relative">
                                                <motion.div
                                                    className="flex items-center gap-2"
                                                    animate={{ y: [0, -8, 0] }}
                                                    transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                                                >
                                                    {selectedPages.map((page, idx) => (
                                                        <motion.div
                                                            key={page}
                                                            className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white text-xs font-bold"
                                                            animate={{ scale: [1, 1.1, 1] }}
                                                            transition={{ duration: 0.8, repeat: Infinity, delay: idx * 0.1, ease: 'easeInOut' }}
                                                        >
                                                            {page}
                                                        </motion.div>
                                                    ))}
                                                </motion.div>
                                            </div>
                                            <div className="text-center space-y-2">
                                                <h3 className="text-lg font-bold text-amber-400 tracking-wide">PROCESSING</h3>
                                                <p className="text-amber-300/70 text-sm">Analyzing {selectedPages.length} page{selectedPages.length > 1 ? 's' : ''}...</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!loadingAi && summary && (
                                    <motion.div
                                        key="artifact-content"
                                        {...scaleIn}
                                        transition={{ duration: 0.3, ease: 'easeOut' }}
                                        className="relative z-20 w-[90%] max-w-3xl max-h-[85%]"
                                    >
                                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl blur opacity-20"></div>
                                        <Card className={`relative h-[400px] overflow-y-auto flex flex-col bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden`}>
                                            <CardHeader className="bg-zinc-900/50 border-b border-white/5 py-3 flex flex-row items-center justify-between">
                                                <CardTitle className="text-cyan-400 text-base flex items-center gap-2">
                                                    <Sparkles size={18} className="text-amber-400" />
                                                    AI Summary
                                                </CardTitle>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(summary);
                                                            showModal("Copied to clipboard!");
                                                        }}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <Copy size={14} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setShowArtifact(false)}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <X size={16} />
                                                    </Button>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-black/40">
                                                <div className="space-y-3 text-zinc-300 leading-relaxed font-light text-sm">
                                                    {formatSummary(summary).map((p, i) => (
                                                        <motion.p
                                                            key={i}
                                                            initial={{ opacity: 0, y: 5 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ duration: 0.2, delay: i * 0.05 }}
                                                        >
                                                            {p}
                                                        </motion.p>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </motion.div>
        </>
    );
}