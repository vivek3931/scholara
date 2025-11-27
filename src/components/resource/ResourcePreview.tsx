'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CardContent, CardTitle, Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    ZoomIn,
    ZoomOut,
    Maximize2,
    Minimize2,
    CheckCircle2,
    MousePointerClick,
    Sparkles,
    Copy,
    X,
    Layers,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { updateResourcePageCount } from '@/actions/resource';

// --- Types ---
interface Resource {
    id: string;
    title: string;
    fileUrl: string;
    pageCount?: number | null;
    [key: string]: any;
}

interface ResourcePreviewProps {
    resource: Resource;
    fullscreen: boolean;
    setFullscreen: (v: boolean) => void;
    showModal: (msg: string) => void;
}

// --- Animation Variants ---
const fadeInOut = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
};

const scaleIn = {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
    transition: { duration: 0.2, ease: 'easeOut' }
};

const springTransition = {
    layout: { type: "spring", stiffness: 300, damping: 30 },
    opacity: { duration: 0.2 }
};

// --- Helper: Generate Cloudinary Image URL ---
const getPageImageUrl = (fileUrl: string, pageNumber: number) => {
    // Insert pg_{n} after /upload/ and change extension to .jpg
    // Example: .../upload/v123/file.pdf -> .../upload/pg_1/v123/file.jpg
    try {
        const parts = fileUrl.split('/upload/');
        if (parts.length !== 2) return fileUrl; // Fallback if structure doesn't match

        const baseUrl = parts[0] + '/upload';
        const rest = parts[1];

        // Replace extension with .jpg (case insensitive)
        const imageRest = rest.replace(/\.pdf$/i, '.jpg');

        return `${baseUrl}/pg_${pageNumber}/${imageRest}`;
    } catch (e) {
        return fileUrl;
    }
};

// --- Lazy Image Component ---
const LazyPageImage = ({ src, pageNumber, width, isSelected, onSelect, selectionMode }: {
    src: string;
    pageNumber: number;
    width: number;
    isSelected: boolean;
    onSelect: () => void;
    selectionMode: boolean;
}) => {
    const [inView, setInView] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '800px' } // Preload well ahead
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className="relative mb-4 shadow-2xl transition-transform duration-200 bg-white"
            style={{
                minHeight: width * 1.414, // A4 Aspect Ratio
                width: width
            }}
        >
            {inView ? (
                <div className="relative group w-full h-full">
                    {/* Image */}
                    <img
                        src={src}
                        alt={`Page ${pageNumber}`}
                        className={`w-full h-auto block select-none ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                        onLoad={() => setLoaded(true)}
                        draggable={false}
                    />

                    {/* Loading Placeholder (while image fetches) */}
                    {!loaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white">
                            <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
                        </div>
                    )}

                    {/* Selection Overlay */}
                    <AnimatePresence>
                        {selectionMode && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={onSelect}
                                className={`absolute inset-0 z-10 cursor-pointer transition-colors duration-200 flex items-center justify-center
                                    ${isSelected
                                        ? 'bg-cyan-500/10 backdrop-blur-[1px] border-4 border-cyan-500/50'
                                        : 'bg-black/5 hover:bg-cyan-400/10'}`}
                            >
                                {isSelected && (
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="bg-cyan-600 text-white px-4 py-2 rounded-lg shadow-xl flex items-center gap-2"
                                    >
                                        <CheckCircle2 size={20} className="fill-cyan-600 text-white" />
                                        <span className="font-bold text-sm">Page {pageNumber}</span>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Page Number Indicator */}
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Page {pageNumber}
                    </div>
                </div>
            ) : (
                // Off-screen Placeholder
                <div className="w-full h-full bg-white flex items-center justify-center">
                    <span className="text-gray-300 font-mono text-sm">Page {pageNumber}</span>
                </div>
            )}
        </div>
    );
};

export default function ResourcePreview({ resource, fullscreen, setFullscreen, showModal }: ResourcePreviewProps) {
    // State
    const [pageCount, setPageCount] = useState<number>(resource.pageCount || 0);
    const [isCounting, setIsCounting] = useState(false);
    const [zoom, setZoom] = useState(100);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedPages, setSelectedPages] = useState<number[]>([]);
    const [summary, setSummary] = useState('');
    const [loadingAi, setLoadingAi] = useState(false);
    const [showArtifact, setShowArtifact] = useState(false);

    const [expandControls, setExpandControls] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState<number>(800);

    // --- Effects ---

    // 1. Auto-fetch page count if missing
    useEffect(() => {
        if (!resource.pageCount && !isCounting && pageCount === 0) {
            const fetchCount = async () => {
                setIsCounting(true);
                const res = await updateResourcePageCount(resource.id, resource.fileUrl);
                if (res.success && res.pageCount) {
                    setPageCount(res.pageCount);
                } else {
                    // Fallback: Show at least 1 page or handle error
                    setPageCount(1);
                }
                setIsCounting(false);
            };
            fetchCount();
        } else if (resource.pageCount) {
            setPageCount(resource.pageCount);
        }
    }, [resource.id, resource.pageCount, resource.fileUrl]);

    // 2. Handle Escape Key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && fullscreen) setFullscreen(false);
        };
        if (fullscreen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [fullscreen, setFullscreen]);

    // 3. Update container width
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.clientWidth);
            }
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        const timer = setTimeout(updateWidth, 300);
        return () => {
            window.removeEventListener('resize', updateWidth);
            clearTimeout(timer);
        };
    }, [fullscreen, expandControls]);

    // --- Handlers ---

    const togglePageSelection = useCallback((pageNumber: number) => {
        if (!selectionMode) return;
        setSelectedPages(prev =>
            prev.includes(pageNumber)
                ? prev.filter(p => p !== pageNumber)
                : [...prev, pageNumber].sort((a, b) => a - b)
        );
    }, [selectionMode]);

    const handleSummarize = useCallback(async () => {
        if (selectedPages.length === 0) {
            showModal("Please select at least one page.");
            return;
        }

        setLoadingAi(true);
        setShowArtifact(true);
        setSummary('');

        try {
            await new Promise(r => setTimeout(r, 1000));
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
    }, [selectedPages, resource?.id, showModal]);

    const zoomIn = useCallback(() => setZoom(prev => Math.min(200, prev + 10)), []);
    const zoomOut = useCallback(() => setZoom(prev => Math.max(50, prev - 10)), []);
    const formatSummary = useCallback((text: string) => text.split('\n\n').filter(p => p.trim()), []);

    // --- Render Guard ---
    if (!resource || !resource.fileUrl) {
        return (
            <div className="w-full h-64 flex items-center justify-center bg-zinc-900 text-gray-500 border border-white/10 rounded-xl">
                Resource not available
            </div>
        );
    }

    return (
        <LayoutGroup>
            {/* Backdrop Overlay */}
            <AnimatePresence>
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
                layoutId={`viewer-${resource.id}`}
                transition={springTransition}
                style={{
                    transform: "translate3d(0,0,0)",
                    backfaceVisibility: "hidden",
                    borderRadius: fullscreen ? 0 : 12
                }}
                className={`
                    flex flex-col overflow-hidden bg-zinc-900 shadow-2xl border border-white/10
                    ${fullscreen
                        ? 'fixed inset-0 z-50 w-full h-full'
                        : 'relative min-h-[75vh] w-full rounded-xl'
                    }
                `}
            >
                {/* Header */}
                <motion.div
                    layout="position"
                    className="bg-zinc-900 border-b border-white/5 py-3 px-4 shrink-0 z-20 relative"
                >
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-amber-500 text-lg flex items-center gap-2 truncate max-w-[40%] sm:max-w-[60%]">
                            <span className="truncate">{resource.title}</span>
                            <AnimatePresence mode="wait">
                                {selectionMode && (
                                    <motion.span
                                        key="selection-badge"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        className="ml-2 text-[10px] bg-cyan-900/50 border border-cyan-500/50 text-cyan-400 px-2 py-0.5 rounded uppercase tracking-wider hidden sm:inline-block"
                                    >
                                        Selection Active
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </CardTitle>

                        <div className="flex items-center gap-1 sm:gap-2">
                            {isCounting && (
                                <div className="flex items-center gap-2 text-xs text-amber-500 animate-pulse mr-2">
                                    <RefreshCw size={14} className="animate-spin" />
                                    <span className="hidden sm:inline">Preparing...</span>
                                </div>
                            )}

                            <button onClick={zoomOut} className="p-2 hover:bg-white/10 rounded text-gray-400 transition-colors hidden sm:block"><ZoomOut size={16} /></button>
                            <span className="text-xs text-gray-400 w-10 text-center font-mono font-bold hidden sm:block">{zoom}%</span>
                            <button onClick={zoomIn} className="p-2 hover:bg-white/10 rounded text-gray-400 transition-colors hidden sm:block"><ZoomIn size={16} /></button>
                            <div className="w-px h-4 bg-white/10 mx-1 hidden sm:block"></div>
                            <button onClick={() => setFullscreen(!fullscreen)} className="p-2 hover:bg-white/10 rounded text-gray-400 transition-colors">
                                {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Content Area */}
                <CardContent className="flex-1 p-0 relative bg-zinc-950 overflow-hidden flex flex-col">

                    {/* Scrollable Container */}
                    <div
                        ref={containerRef}
                        className="flex-1 overflow-auto custom-scrollbar flex justify-center pt-8 pb-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800 to-black"
                    >
                        {/* Pages Wrapper */}
                        <div
                            className="relative transition-transform max-h-[calc(100vh-20rem)] duration-200 ease-out origin-top flex flex-col items-center"
                            style={{
                                width: Math.min(containerWidth - 40, 800) * (zoom / 100),
                            }}
                        >
                            {pageCount > 0 ? (
                                Array.from(new Array(pageCount), (el, index) => (
                                    <LazyPageImage
                                        key={`page_${index + 1}`}
                                        pageNumber={index + 1}
                                        src={getPageImageUrl(resource.fileUrl, index + 1)}
                                        width={Math.min(containerWidth - 40, 800) * (zoom / 100)}
                                        isSelected={selectedPages.includes(index + 1)}
                                        onSelect={() => togglePageSelection(index + 1)}
                                        selectionMode={selectionMode}
                                    />
                                ))
                            ) : (
                                <div className="flex flex-col items-center gap-4 py-20">
                                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                                    <p className="text-gray-400 text-xs animate-pulse">Initializing Viewer...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Floating Controls (Bottom Right) */}
                    <div className="absolute bottom-6 right-6 z-30 flex items-end flex-col gap-2 pointer-events-none">
                        <div className="pointer-events-auto flex items-center gap-2">
                            <AnimatePresence mode="wait">
                                {!selectionMode ? (
                                    <motion.button
                                        key="sparkles-btn"
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setExpandControls(!expandControls)}
                                        className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-500/30 flex items-center justify-center"
                                    >
                                        <Sparkles size={20} />
                                    </motion.button>
                                ) : (
                                    <motion.div
                                        key="selection-controls"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="flex items-center gap-2 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-2 shadow-xl"
                                    >
                                        <div className="px-2 text-center">
                                            <p className="text-[10px] text-gray-400 uppercase">Pages</p>
                                            <p className="text-lg text-cyan-400 font-bold leading-none">{selectedPages.length}</p>
                                        </div>
                                        <div className="h-8 w-px bg-white/10 mx-1"></div>
                                        <button
                                            onClick={() => {
                                                setSelectionMode(false);
                                                setSelectedPages([]);
                                                setExpandControls(false);
                                            }}
                                            className="px-3 py-1.5 rounded bg-zinc-700 hover:bg-zinc-600 text-gray-300 text-xs font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSummarize}
                                            disabled={selectedPages.length === 0}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold text-xs whitespace-nowrap
                                                ${selectedPages.length > 0
                                                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                                                    : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'}`}
                                        >
                                            <Sparkles size={14} /> Process
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Expanded Menu */}
                        <AnimatePresence>
                            {expandControls && !selectionMode && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="pointer-events-auto bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-2 shadow-xl flex items-center gap-2 mt-2"
                                >
                                    <button
                                        onClick={() => {
                                            setSelectionMode(true);
                                            setExpandControls(false);
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10 text-white text-xs font-medium transition-colors"
                                    >
                                        <Layers size={14} /> Select Pages to AI Summarize
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* AI Loading/Result Overlay */}
                    <AnimatePresence>
                        {showArtifact && (
                            <motion.div
                                key="artifact-backdrop"
                                {...fadeInOut}
                                className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                            >
                                {/* Loading State */}
                                {loadingAi && (
                                    <div className="flex flex-col items-center gap-6">
                                        <motion.div
                                            animate={{ y: [0, -10, 0] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                            className="flex gap-2"
                                        >
                                            {selectedPages.slice(0, 3).map((page, i) => (
                                                <div key={page} className="w-8 h-10 bg-amber-500/20 border border-amber-500 rounded flex items-center justify-center text-amber-500 text-xs font-bold">
                                                    {page}
                                                </div>
                                            ))}
                                            {selectedPages.length > 3 && <div className="flex items-end text-gray-500">...</div>}
                                        </motion.div>
                                        <div className="text-center">
                                            <h3 className="text-lg font-bold text-amber-400">Processing</h3>
                                            <p className="text-gray-400 text-sm">Analyzing {selectedPages.length} pages...</p>
                                        </div>
                                    </div>
                                )}

                                {/* Result State */}
                                {!loadingAi && summary && (
                                    <motion.div {...scaleIn} className="w-full max-w-2xl">
                                        <Card className="bg-zinc-950 border-zinc-800 shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
                                            <CardHeader className="bg-zinc-900/50 py-3 flex flex-row items-center justify-between border-b border-white/5">
                                                <CardTitle className="text-cyan-400 text-base flex items-center gap-2">
                                                    <Sparkles size={18} className="text-amber-400" /> AI Summary
                                                </CardTitle>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="sm" onClick={() => {
                                                        navigator.clipboard.writeText(summary);
                                                        showModal("Copied!");
                                                    }}>
                                                        <Copy size={14} />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => setShowArtifact(false)}>
                                                        <X size={16} />
                                                    </Button>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-black/20">
                                                <div className="space-y-4 text-zinc-300 leading-relaxed font-light text-sm">
                                                    {formatSummary(summary).map((p, i) => (
                                                        <motion.p
                                                            key={i}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: i * 0.1 }}
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
        </LayoutGroup>
    );
}