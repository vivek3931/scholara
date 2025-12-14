'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { X, Check, Sparkles, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProUpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProUpgradeModal({ isOpen, onClose }: ProUpgradeModalProps) {
    const router = useRouter();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative w-full max-w-lg bg-card border border-primary/30 rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Header with Gradient */}
                    <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10 p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="p-8 text-center relative z-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20 rotate-3">
                            <Crown size={32} className="text-primary-foreground" />
                        </div>

                        <h2 className="text-2xl font-bold text-foreground mb-2">Unlock Pro Features</h2>
                        <p className="text-muted-foreground mb-8">
                            Upgrade to Scholara Pro to access the AI Chatbot, Summarization, and unlimited downloads.
                        </p>

                        <div className="space-y-4 mb-8 text-left bg-muted/50 p-6 rounded-xl border border-border">
                            <FeatureRow text="Unlimited AI Chatbot queries" />
                            <FeatureRow text="Instant Document Summaries" />
                            <FeatureRow text="Unlimited Resources Downloads" />
                            <FeatureRow text="Zero Coin Deduction" />
                        </div>

                        <div className="flex gap-4">
                            <Button
                                variant="ghost"
                                className="flex-1 text-muted-foreground hover:text-foreground"
                                onClick={onClose}
                            >
                                Maybe Later
                            </Button>
                            <Button
                                className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-bold shadow-lg shadow-primary/20"
                                onClick={() => router.push('/pricing')}
                            >
                                Upgrade Now <Sparkles size={16} className="ml-2" />
                            </Button>
                        </div>

                        <p className="text-xs text-muted-foreground mt-4">
                            Starting from just ₹129/month
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

function FeatureRow({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Check size={14} strokeWidth={3} />
            </div>
            <span className="text-foreground text-sm font-medium">{text}</span>
        </div>
    );
}
