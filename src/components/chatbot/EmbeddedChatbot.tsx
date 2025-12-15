'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, Globe, FileText, RefreshCw, ArrowRight, Bot, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ScholaraLoader from './ScholaraLoader';
import InitialStateAnimation from './InitialStateAnimation';
import { useLanguage } from '@/context/LanguageContext';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface WikipediaResult {
    title: string;
    extract: string;
    url: string;
    thumbnail?: string;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    sources?: any[]; // Allow objects or strings
    usedWeb?: boolean;
    relatedUrl?: string;
    webResult?: WikipediaResult; // ⭐ ADD THIS
}

export default function EmbeddedChatbot({ onClose, resourceUrl, className }: { onClose: () => void, resourceUrl?: string, className?: string }) {
    const { t } = useLanguage();
    const [hasStarted, setHasStarted] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    console.log(messages);

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTo({
                top: messagesContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const res = await fetch('/api/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    resourceUrl // Pass the specific resource context
                })
            });

            const data = await res.json();

            if (res.ok) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.answer,
                    sources: data.sources,
                    usedWeb: data.usedWeb,
                    relatedUrl: data.relatedUrl,
                    webResult: data.webResult // ⭐ ADD THIS
                }]);
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `❌ ${t('Chatbot.error')}: ${data.error || 'Failed to get answer.'}`
                }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `❌ ${t('Chatbot.connectionError')}`
            }]);
        }

        setIsLoading(false);
    };

    const [isTransitioning, setIsTransitioning] = useState(false);

    const handleTransitionStart = () => {
        setIsTransitioning(true);
    };

    const handleTransitionComplete = () => {
        // Delay showing the chat interface for smooth transition
        setTimeout(() => {
            setHasStarted(true);
            setIsTransitioning(false);
        }, 500);
    };

    // --- INTRO SCREEN ---
    if (!hasStarted) {
        return (
            <div className={`flex flex-col relative overflow-hidden bg-background/95 backdrop-blur-xl border border-border shadow-2xl rounded-3xl ${className || 'h-[600px] w-full max-w-md'}`}>
                {/* Background Ambient Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-accent/20 rounded-full blur-[80px] pointer-events-none" />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 hover:bg-muted/50 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                >
                    <X size={20} />
                </button>

                {/* Main Animation Container */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
                    <InitialStateAnimation
                        onStart={handleTransitionStart}
                        onTransitionComplete={handleTransitionComplete}
                    />
                </div>
            </div>
        );
    }

    // --- CHAT INTERFACE ---
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`flex flex-col bg-background/80 backdrop-blur-xl border border-border/50 rounded-3xl overflow-hidden shadow-2xl relative ${className || 'h-[600px] w-full max-w-md'}`}
        >
            {/* Header */}
            <div className="px-6 py-4 border-b border-border/50 bg-background/50 backdrop-blur-md flex items-center justify-between z-10 sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                            <Bot size={20} className="text-primary-foreground" />
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground text-sm">{t('Chatbot.title')}</h3>
                        <p className="text-[10px] text-muted-foreground font-medium">{t('Chatbot.status')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setMessages([])}
                        className="p-2 hover:bg-muted/80 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                        title="Clear Chat"
                    >
                        <RefreshCw size={18} />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-destructive/10 rounded-full transition-colors text-muted-foreground hover:text-destructive"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar scroll-smooth">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-50 select-none">
                        <Sparkles size={48} className="text-muted-foreground/30 mb-4" />
                        <p className="text-sm text-muted-foreground font-medium">{t('Chatbot.emptyState')}</p>
                    </div>
                )}

                <AnimatePresence mode="popLayout">
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] relative group`}>
                                <div
                                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                                        : 'bg-card border border-border text-card-foreground rounded-bl-sm'
                                        }`}
                                >
                                    <div className="prose prose-invert prose-sm max-w-none dark:prose-invert">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                table: ({ node, ...props }) => <div className="overflow-x-auto my-2 border border-border rounded-lg"><table {...props} className="min-w-full divide-y divide-border" /></div>,
                                                thead: ({ node, ...props }) => <thead {...props} className="bg-muted/30" />,
                                                th: ({ node, ...props }) => <th {...props} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider opacity-70" />,
                                                td: ({ node, ...props }) => <td {...props} className="px-3 py-2 whitespace-pre-wrap text-sm border-t border-border" />,
                                                ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-4 space-y-1 my-1" />,
                                                ol: ({ node, ...props }) => <ol {...props} className="list-decimal pl-4 space-y-1 my-1" />,
                                                p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0" />,
                                                code: ({ node, ...props }) => <code {...props} className="bg-black/20 rounded px-1 py-0.5 font-mono text-xs" />,
                                                pre: ({ node, ...props }) => <pre {...props} className="bg-black/40 rounded-lg p-3 overflow-x-auto my-2 border border-border/50 text-xs" />,
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>

                                {msg.role === 'assistant' && (msg.sources?.length || msg.usedWeb || msg.relatedUrl || msg.webResult) && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-3 flex flex-col gap-2 pl-1"
                                    >
                                        {/* ⭐ WIKIPEDIA WEB RESULT */}
                                        {msg.webResult && (
                                            <div className="mb-2 bg-card/50 border border-border/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group/wiki">
                                                <div className="bg-muted/30 px-3 py-1.5 border-b border-border/50 flex items-center gap-2">
                                                    <Globe size={12} className="text-blue-500" />
                                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Wikipedia Result</span>
                                                </div>

                                                <div className="p-3 flex gap-3">
                                                    {msg.webResult.thumbnail && (
                                                        <img
                                                            src={msg.webResult.thumbnail}
                                                            alt={msg.webResult.title}
                                                            className="w-14 h-14 object-cover rounded-lg shrink-0 bg-muted border border-border/50"
                                                        />
                                                    )}
                                                    <div className="flex flex-col gap-0.5 min-w-0">
                                                        <h4 className="text-xs font-bold text-foreground truncate">{msg.webResult.title}</h4>
                                                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                                            {msg.webResult.extract}
                                                        </p>
                                                        <a
                                                            href={msg.webResult.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[10px] text-primary hover:underline mt-1 flex items-center gap-1 font-medium w-fit"
                                                        >
                                                            Read more on Wikipedia <ExternalLink size={9} />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* ⭐ DISPLAY URL IF AVAILABLE */}
                                        {msg.relatedUrl && (
                                            <a
                                                href={msg.relatedUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-2 rounded-lg flex items-start gap-2 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all group/link w-full"
                                            >
                                                <ExternalLink size={12} className="mt-0.5 shrink-0" />
                                                <span className="font-medium group-hover/link:underline break-all text-left leading-tight">
                                                    {msg.relatedUrl}
                                                </span>
                                            </a>
                                        )}

                                        {/* Web badge and sources */}
                                        <div className="flex flex-wrap gap-2">
                                            {msg.usedWeb && (
                                                <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full flex items-center gap-1 border border-blue-500/20">
                                                    <Globe size={10} /> Web
                                                </span>
                                            )}
                                            {msg.sources?.slice(0, 2).map((s, idx) => {
                                                const sourceName = typeof s === 'string'
                                                    ? s.split('/').pop()
                                                    : (s.title || s.source || 'Source');

                                                return (
                                                    <span key={idx} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1 border border-border truncate max-w-[120px]" title={sourceName}>
                                                        <FileText size={10} /> {sourceName}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Loading State - Scholara Custom Loader */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start pl-2"
                    >
                        <div className="flex items-center gap-3">
                            <ScholaraLoader />
                            <span className="text-xs font-medium bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent animate-pulse">
                                {t('Chatbot.thinking')}
                            </span>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Input Area - Floating */}
            <div className="p-4 pt-2">
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-2xl opacity-20 group-hover:opacity-30 transition duration-500 blur"></div>
                    <div className="relative flex items-center bg-background rounded-2xl border border-border shadow-lg">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder={t('Chatbot.placeholder')}
                            disabled={isLoading}
                            className="w-full bg-transparent border-none px-4 py-3.5 text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/70"
                        />
                        <div className="pr-2 flex items-center">
                            <button
                                onClick={handleSendMessage}
                                disabled={!input.trim() || isLoading}
                                className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                            >
                                {isLoading ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
                <p className="text-[10px] text-center text-muted-foreground/50 mt-2 font-medium">{t('Chatbot.disclaimer')}</p>
            </div>
        </motion.div>
    );
}