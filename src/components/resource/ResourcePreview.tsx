'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CardContent, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    ZoomIn,
    ZoomOut,
    Maximize2,
    Minimize2,
    CheckCircle2,
    Sparkles,
    Copy,
    X,
    Layers,
    Loader2,
    RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { updateResourcePageCount } from '@/actions/resource';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

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

// --- Helper: Generate Cloudinary Image URL ---
const getPageImageUrl = (fileUrl: string, pageNumber: number) => {
    try {
        const parts = fileUrl.split('/upload/');
        if (parts.length !== 2) return fileUrl;
        const baseUrl = parts[0] + '/upload';
        const rest = parts[1];
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
            { rootMargin: '800px' }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className="relative mb-4 shadow-2xl transition-transform duration-200 bg-card group/page"
            style={{ minHeight: width * 1.414, width: width }}
        >
            {inView ? (
                <div className="relative w-full h-full">
                    <Image
                        src={src}
                        alt={`Page ${pageNumber}`}
                        width={width}
                        height={width * 1.414}
                        className={`w-full h-auto block select-none ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                        style={{ width: '100%', height: 'auto' }}
                        onLoad={() => setLoaded(true)}
                        draggable={false}
                        priority={pageNumber === 1}
                    />
                    {!loaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background">
                            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
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
                                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-xl flex items-center gap-2"
                                    >
                                        <CheckCircle2 size={20} className="fill-primary text-primary-foreground" />
                                        <span className="font-bold text-sm">Page {pageNumber}</span>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Page Number */}
                    <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur text-foreground text-[10px] px-2 py-1 rounded opacity-0 group-hover/page:opacity-100 transition-opacity pointer-events-none border border-border">
                        {pageNumber}
                    </div>
                </div>
            ) : (
                <div className="w-full h-full bg-background flex items-center justify-center">
                    <span className="text-muted-foreground font-mono text-sm">Page {pageNumber}</span>
                </div>
            )}
        </div>
    );
};

export default function ResourcePreview({ resource, fullscreen, setFullscreen, showModal }: ResourcePreviewProps) {
    const { t } = useLanguage();
    const [pageCount, setPageCount] = useState<number>(resource.pageCount || 0);
    const [isCounting, setIsCounting] = useState(false);
    const [zoom, setZoom] = useState(100);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedPages, setSelectedPages] = useState<number[]>([]);
    const [summary, setSummary] = useState('');
    const [loadingAi, setLoadingAi] = useState(false);
    const [showArtifact, setShowArtifact] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState<number>(800);

    // --- Effects ---
    useEffect(() => {
        if (!resource.pageCount && !isCounting && pageCount === 0) {
            const fetchCount = async () => {
                setIsCounting(true);
                const res = await updateResourcePageCount(resource.id, resource.fileUrl);
                if (res.success && res.pageCount) setPageCount(res.pageCount);
                else setPageCount(1);
                setIsCounting(false);
            };
            fetchCount();
        } else if (resource.pageCount) {
            setPageCount(resource.pageCount);
        }
    }, [resource.id, resource.pageCount, resource.fileUrl]);

    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) setContainerWidth(containerRef.current.clientWidth);
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        const timer = setTimeout(updateWidth, 300);
        return () => {
            window.removeEventListener('resize', updateWidth);
            clearTimeout(timer);
        };
    }, [fullscreen]);

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
            showModal(t('ResourceViewer.selectPageWarning'));
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
                showModal(data.error || t('ResourceViewer.summaryFailed'));
                setShowArtifact(false);
            }
        } catch (e) {
            showModal(t('ResourceViewer.summaryError'));
            setShowArtifact(false);
        } finally {
            setLoadingAi(false);
        }
    }, [selectedPages, resource?.id, showModal]);

    const zoomIn = useCallback(() => setZoom(prev => Math.min(200, prev + 10)), []);
    const zoomOut = useCallback(() => setZoom(prev => Math.max(50, prev - 10)), []);

    if (!resource || !resource.fileUrl) return null;

    return (
        <LayoutGroup>
            <AnimatePresence>
                {fullscreen && (
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-background/95 z-40 backdrop-blur-md"
                        onClick={() => setFullscreen(false)}
                    />
                )}
            </AnimatePresence>

            {fullscreen && <div className="relative h-[85vh] w-full rounded-2xl invisible" aria-hidden="true" />}
            <motion.div
                layout
                layoutId={`viewer-${resource.id}`}
                transition={{ type: "spring", stiffness: 250, damping: 25, mass: 0.5 }}
                className={`flex flex-col overflow-hidden bg-background shadow-2xl border border-border ${fullscreen ? 'fixed inset-0 z-50 w-full h-full' : 'relative h-[85vh] w-full rounded-2xl'}`}
            >
                {/* Toolbar */}
                <div className="bg-background/80 backdrop-blur border-b border-border py-2 px-4 flex flex-wrap gap-y-2 items-center justify-between shrink-0 z-20">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-1 bg-muted/20 rounded-lg p-1 border border-border">
                            <Button variant="ghost" size="sm" onClick={zoomOut} className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"><ZoomOut size={14} /></Button>
                            <span className="text-xs font-mono w-8 sm:w-10 text-center text-muted-foreground">{zoom}%</span>
                            <Button variant="ghost" size="sm" onClick={zoomIn} className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"><ZoomIn size={14} /></Button>
                        </div>
                        <div className="h-4 w-px bg-border hidden sm:block" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{pageCount} {t('ResourceViewer.pages')}</span>
                    </div>

                    <div className="flex items-center gap-2 ml-auto sm:ml-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectionMode(!selectionMode)}
                            className={`h-8 text-xs gap-2 ${selectionMode ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Layers size={14} />
                            <span className="hidden sm:inline">{selectionMode ? t('ResourceViewer.done') : t('ResourceViewer.select')}</span>
                        </Button>

                        {selectionMode && selectedPages.length > 0 && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                <Button
                                    size="sm"
                                    onClick={handleSummarize}
                                    className="h-8 text-xs gap-2 bg-gradient-to-r from-primary to-accent-foreground hover:from-primary/90 hover:to-accent-foreground/90 text-primary-foreground border-0"
                                >
                                    <Sparkles size={14} /> <span className="hidden sm:inline">{t('ResourceViewer.summarize')}</span> ({selectedPages.length})
                                </Button>
                            </motion.div>
                        )}

                        <div className="h-4 w-px bg-border mx-2" />
                        <Button variant="ghost" size="sm" onClick={() => setFullscreen(!fullscreen)} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                            {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <CardContent className="flex-1 p-0 relative overflow-hidden flex flex-col bg-muted/5">
                    <div
                        ref={containerRef}
                        className="flex-1 overflow-auto custom-scrollbar flex justify-center pt-8 pb-20"
                    >
                        <div
                            className="relative flex flex-col items-center gap-4 transition-all duration-200 ease-out origin-top"
                            style={{ width: Math.min(containerWidth - 40, 800) * (zoom / 100) }}
                        >
                            {pageCount > 0 ? (
                                Array.from(new Array(pageCount), (_, i) => (
                                    <LazyPageImage
                                        key={`page_${i + 1}`}
                                        pageNumber={i + 1}
                                        src={getPageImageUrl(resource.fileUrl, i + 1)}
                                        width={Math.min(containerWidth - 40, 800) * (zoom / 100)}
                                        isSelected={selectedPages.includes(i + 1)}
                                        onSelect={() => togglePageSelection(i + 1)}
                                        selectionMode={selectionMode}
                                    />
                                ))
                            ) : (
                                <div className="flex flex-col items-center gap-4 py-20">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                    <p className="text-muted-foreground text-xs animate-pulse">{t('ResourceViewer.loading')}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* AI Summary Overlay */}
                    <AnimatePresence>
                        {showArtifact && (
                            <motion.div
                                key="artifact-backdrop"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="absolute inset-0 z-40 bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
                            >
                                {loadingAi ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                        <p className="text-primary font-medium">{t('ResourceViewer.analyzing')}</p>
                                    </div>
                                ) : (
                                    <motion.div
                                        initial={{ scale: 0.95, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.95, opacity: 0 }}
                                        transition={{ duration: 0.2, ease: 'easeOut' }}
                                        className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden max-h-[80%] flex flex-col"
                                    >
                                        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
                                            <h3 className="text-primary font-bold flex items-center gap-2"><Sparkles size={16} /> {t('ResourceViewer.aiSummary')}</h3>
                                            <Button variant="ghost" size="sm" onClick={() => setShowArtifact(false)}><X size={16} /></Button>
                                        </div>
                                        <div className="p-6 overflow-y-auto text-card-foreground text-sm leading-relaxed whitespace-pre-wrap">
                                            {summary}
                                        </div>
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