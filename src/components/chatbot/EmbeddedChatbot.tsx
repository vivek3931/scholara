'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, Globe, FileText, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    sources?: any[]; // Allow objects or strings
    usedWeb?: boolean;
}

export default function EmbeddedChatbot({ onClose, resourceUrl, className }: { onClose: () => void, resourceUrl?: string, className?: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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

            if (data.answer) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.answer,
                    sources: data.sources,
                    usedWeb: data.usedWeb
                }]);
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `❌ Error: ${data.error || 'Failed to get answer.'}`
                }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '❌ Connection error. Please check if the server is running.'
            }]);
        }

        setIsLoading(false);
    };

    return (
        <div className={`flex flex-col bg-background border border-border rounded-2xl overflow-hidden shadow-2xl relative ${className || 'h-[calc(100vh-110px)]'}`}>

            {/* Header */}
            <div className="p-4 border-b border-border bg-muted/50 backdrop-blur flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                        <Sparkles size={16} className="text-primary-foreground" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground text-sm">Scholara AI</h3>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Online
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Messages Area */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-card scroll-smooth">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                        <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4 border border-border">
                            <Sparkles size={32} className="text-primary/50" />
                        </div>
                        <h4 className="text-foreground font-medium mb-2">How can I help?</h4>
                        <p className="text-xs text-muted-foreground max-w-[200px]">
                            Ask me to summarize this document, explain key concepts, or find related topics.
                        </p>
                    </div>
                )}

                <AnimatePresence mode="popLayout">
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-lg ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-amber-600 to-orange-600 text-white rounded-tr-none'
                                    : 'bg-zinc-900 border border-white/10 text-gray-200 rounded-tl-none'
                                    }`}
                            >
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            table: ({ node, ...props }) => <div className="overflow-x-auto my-2 border border-border rounded-lg"><table {...props} className="min-w-full divide-y divide-border" /></div>,
                                            thead: ({ node, ...props }) => <thead {...props} className="bg-muted/10" />,
                                            th: ({ node, ...props }) => <th {...props} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider" />,
                                            td: ({ node, ...props }) => <td {...props} className="px-3 py-2 whitespace-pre-wrap text-sm text-foreground border-t border-border" />,
                                            ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-4 space-y-1" />,
                                            ol: ({ node, ...props }) => <ol {...props} className="list-decimal pl-4 space-y-1" />,
                                            li: ({ node, ...props }) => <li {...props} className="text-foreground" />,
                                            p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0" />,
                                            code: ({ node, ...props }) => <code {...props} className="bg-black/30 rounded px-1 py-0.5 text-primary-foreground font-mono text-xs" />,
                                            pre: ({ node, ...props }) => <pre {...props} className="bg-black/50 rounded-lg p-3 overflow-x-auto my-2 border border-border" />,
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>

                                {msg.role === 'assistant' && (msg.sources?.length || msg.usedWeb) && (
                                    <div className="mt-3 pt-2 border-t border-border flex flex-wrap gap-2">
                                        {msg.usedWeb && (
                                            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full flex items-center gap-1 border border-blue-500/20">
                                                <Globe size={10} /> Web
                                            </span>
                                        )}
                                        {msg.sources?.slice(0, 2).map((s, idx) => {
                                            // Handle both string and object sources
                                            const sourceName = typeof s === 'string'
                                                ? s.split('/').pop()
                                                : (s.title || s.source || 'Source');

                                            return (
                                                <span key={idx} className="text-[10px] bg-muted/50 text-muted-foreground px-2 py-1 rounded-full flex items-center gap-1 border border-border truncate max-w-[100px]" title={sourceName}>
                                                    <FileText size={10} /> {sourceName}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Loading State - Gemini Style */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                    >
                        <div className="bg-muted border border-border rounded-2xl rounded-tl-none p-4 shadow-lg">
                            <div className="flex gap-1.5">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], backgroundColor: ["#fbbf24", "#f59e0b", "#fbbf24"] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                                    className="w-2 h-2 rounded-full bg-amber-400"
                                />
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], backgroundColor: ["#fbbf24", "#f59e0b", "#fbbf24"] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                                    className="w-2 h-2 rounded-full bg-amber-400"
                                />
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], backgroundColor: ["#fbbf24", "#f59e0b", "#fbbf24"] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                                    className="w-2 h-2 rounded-full bg-amber-400"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-background/80 backdrop-blur border-t border-border">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask something..."
                        disabled={isLoading}
                        className="w-full bg-input border border-input rounded-xl pl-4 pr-12 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground transition-colors"
                    >
                        {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
