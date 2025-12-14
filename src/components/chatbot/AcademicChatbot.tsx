'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, FileText, Trash2, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Confidence is a number from 0 to 1
interface Message {
    role: 'user' | 'assistant';
    content: string;
    sources?: string[]; // Array of file names or web URLs used
    usedWeb?: boolean;
}

export default function AcademicChatbot() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
                body: JSON.stringify({ message: userMessage })
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

    const handleClearChat = () => {
        setMessages([]);
    };

    // Component to render individual messages
    const MessageBubble = ({ msg }: { msg: Message }) => {
        // Use a more intense dark background for the main chat area
        const isUser = msg.role === 'user';
        const bubbleClasses = isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted border border-border text-foreground';

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`mb-6 flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
                <div className={`max-w-3xl rounded-2xl px-5 py-4 shadow-lg ${bubbleClasses}`}>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {msg.content}
                    </div>

                    {/* Footer/Context Section for Assistant */}
                    {msg.role === 'assistant' && (msg.sources?.length || msg.usedWeb) && (
                        <div className="mt-3 pt-3 border-t border-gray-700/40 text-xs">
                            <div className="flex justify-between items-center text-muted-foreground mb-1">
                                {msg.usedWeb && (
                                    <span className="flex items-center gap-1 text-primary">
                                        <Globe size={12} /> Web
                                    </span>
                                )}
                            </div>

                            {msg.sources && msg.sources.length > 0 && (
                                <div className="text-gray-500">
                                    <span className="font-medium text-gray-400 block mb-1">Sources Used:</span>
                                    <div className="flex flex-wrap gap-2">
                                        {msg.sources.slice(0, 3).map((source, idx) => (
                                            <span key={idx} className="flex items-center gap-1 bg-muted/50 text-primary px-2 py-1 rounded-full text-[10px] border border-border">
                                                <FileText size={10} /> {source.split('/').pop()}
                                            </span>
                                        ))}
                                        {msg.sources.length > 3 && (
                                            <span className="text-muted-foreground text-[10px] px-2 py-1">
                                                +{msg.sources.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        );
    };

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">

            {/* Header */}
            <div className="bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
                <div className="flex items-center justify-between max-w-5xl mx-auto">
                    <div>
                        <h1 className="text-2xl font-extrabold text-primary">
                            🎓 Academic RAG Chatbot
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Powered by **Local AI** & **ChromaDB**
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleClearChat}
                            className="p-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                            title="Clear chat"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 max-w-5xl mx-auto w-full">
                {messages.length === 0 && (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🤖</div>
                        <h2 className="text-2xl font-bold text-primary mb-2">
                            Ask me anything!
                        </h2>
                        <p className="text-muted-foreground">
                            I learn from the documents you upload to the site.
                        </p>
                    </div>
                )}

                <AnimatePresence>
                    {messages.map((msg, i) => (
                        <MessageBubble key={i} msg={msg} />
                    ))}
                </AnimatePresence>

                {/* Loading Indicator */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start mb-6"
                    >
                        <div className="bg-muted border border-border rounded-2xl px-5 py-4 shadow-lg">
                            <Loader2 className="animate-spin text-primary" size={20} />
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-background/80 backdrop-blur-md border-t border-border px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center gap-3">
                    {/* Message Input */}
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask a question about your documents..."
                        disabled={isLoading}
                        className="flex-1 bg-muted border border-input rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50 text-foreground placeholder:text-muted-foreground"
                    />

                    {/* Send Button */}
                    <button
                        onClick={handleSendMessage}
                        disabled={!input.trim() || isLoading}
                        className="p-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/30"
                        title="Send message"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}