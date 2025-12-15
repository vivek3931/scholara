'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Check, Zap, Crown, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

declare global {
    interface Window {
        Razorpay: any;
    }
}

// Pricing Configuration (You can fetch these from an API if dynamic)
const PRICING_CONFIG = {
    MONTHLY: { amount: 149, label: '/mo', period: 'Monthly' },
    YEARLY: { amount: 1548, label: '/yr', period: 'Yearly' }
};

export default function PricingPage() {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('YEARLY');

    // --- Razorpay Logic ---
    const handleSubscribe = async () => {
        setLoading(true);
        try {
            if (!window.Razorpay) {
                toast.error('Razorpay SDK not loaded. Please verify your internet connection.');
                return;
            }

            // 1. Create Order
            const res = await fetch('/api/subscription/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planType: billingCycle }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);
            if (!data.keyId) throw new Error('Razorpay Key ID is not configured');

            // 2. Initialize Razorpay
            const options = {
                key: data.keyId,
                amount: data.amount,
                currency: data.currency,
                name: "Scholara Pro",
                description: `${billingCycle === 'MONTHLY' ? 'Monthly' : 'Yearly'} Subscription`,
                order_id: data.id,
                handler: async function (response: any) {
                    try {
                        const verifyRes = await fetch('/api/subscription/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...response, planType: billingCycle }),
                        });
                        const verifyData = await verifyRes.json();

                        if (verifyRes.ok) {
                            toast.success('Welcome to Scholara Pro!');
                            window.location.reload();
                        } else {
                            toast.error(verifyData.error || 'Verification failed');
                        }
                    } catch (err) {
                        toast.error('Payment verification failed');
                    }
                },
                prefill: {
                    name: "User Name",
                    email: "user@example.com",
                    contact: ""
                },
                theme: { color: "#F59E0B" }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error: any) {
            console.error('Subscription Error:', error);
            toast.error(error.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col items-center justify-center py-20 px-4">
            <Script
                id="razorpay-checkout-js"
                src="https://checkout.razorpay.com/v1/checkout.js"
                strategy="lazyOnload"
            />

            {/* --- Ambient Background --- */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10" />
                <div className="absolute bottom-0 inset-x-0 h-[400px] bg-gradient-to-t from-background via-background/80 to-transparent z-0" />
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50" />
            </div>

            <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">

                {/* --- Header --- */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-10"
                >
                    <span className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20 shadow-sm">
                        <Crown size={14} /> {t('Pricing.badge')}
                    </span>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-4 tracking-tight">
                        {t('Pricing.title')} <span className="text-primary">{t('Pricing.pro')}</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                        {t('Pricing.subtitle')}
                    </p>
                </motion.div>

                {/* --- The Single Main Card --- */}
                <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full max-w-md"
                >
                    <div className="relative group">
                        {/* Glow Effect behind card */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-amber-600/30 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-75 transition duration-500" />

                        <Card className="relative bg-card/80 backdrop-blur-2xl border-primary/20 p-8 rounded-[1.75rem] shadow-2xl overflow-hidden flex flex-col items-center text-center">

                            {/* Decorative Top Gradient */}
                            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

                            {/* 1. Toggle Switch */}
                            <div className="relative z-10 bg-muted/50 p-1.5 rounded-full flex items-center mb-8 border border-border/50 shadow-inner">
                                <button
                                    onClick={() => setBillingCycle('MONTHLY')}
                                    className={`relative px-6 py-2 rounded-full text-sm font-bold transition-colors z-10 ${billingCycle === 'MONTHLY' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'}`}
                                >
                                    {billingCycle === 'MONTHLY' && (
                                        <motion.div layoutId="cycle-pill" className="absolute inset-0 bg-background rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10" style={{ zIndex: -1 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                                    )}
                                    {t('Pricing.monthly')}
                                </button>
                                <button
                                    onClick={() => setBillingCycle('YEARLY')}
                                    className={`relative px-6 py-2 rounded-full text-sm font-bold transition-colors z-10 ${billingCycle === 'YEARLY' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'}`}
                                >
                                    {billingCycle === 'YEARLY' && (
                                        <motion.div layoutId="cycle-pill" className="absolute inset-0 bg-background rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10" style={{ zIndex: -1 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                                    )}
                                    {t('Pricing.yearly')}
                                </button>

                                {/* Discount Badge */}
                                <div className="absolute -right-[4.5rem] top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-[10px] font-bold text-white bg-green-500 px-2 py-1 rounded-md shadow-sm rotate-6 animate-pulse">
                                    SAVE 20%
                                </div>
                            </div>

                            {/* 2. Animated Price Display */}
                            <div className="mb-8 relative z-10 flex flex-col items-center">
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-3xl font-medium text-muted-foreground self-start mt-2">₹</span>
                                    {/* Using new DigitScroll component */}
                                    <DigitScroll
                                        value={PRICING_CONFIG[billingCycle].amount}
                                        className="text-7xl font-extrabold tracking-tight text-foreground"
                                    />
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-muted-foreground font-medium uppercase tracking-wide text-sm">
                                        Billed {PRICING_CONFIG[billingCycle].period}
                                    </span>
                                    {billingCycle === 'YEARLY' && (
                                        <motion.span
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold border border-primary/20"
                                        >
                                            BEST VALUE
                                        </motion.span>
                                    )}
                                </div>
                            </div>

                            {/* 3. Features List */}
                            <div className="w-full bg-muted/30 rounded-2xl p-6 mb-8 border border-border/50 text-left space-y-4 relative z-10">
                                <FeatureItem text={t('Pricing.unlimitedDownloads')} />
                                <FeatureItem text={t('Pricing.aiChatbot')} />
                                <FeatureItem text={t('Pricing.docSummarization')} />
                                <FeatureItem text={t('Pricing.prioritySupport')} />
                            </div>

                            {/* 4. Action Button */}
                            <Button
                                onClick={handleSubscribe}
                                disabled={loading}
                                className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-primary to-amber-600 hover:from-primary/90 hover:to-amber-600/90 text-white shadow-xl shadow-primary/20 hover:shadow-primary/30 relative overflow-hidden group transition-all"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {loading ? (
                                        <>Processing...</>
                                    ) : (
                                        <>
                                            {t('Pricing.getStarted')} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </span>
                                {/* Shine Animation */}
                                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
                            </Button>

                            <p className="mt-6 text-xs text-muted-foreground flex items-center justify-center gap-1.5 opacity-80">
                                <ShieldCheck size={12} className="text-green-500" />
                                {t('Pricing.securePayment')} • Cancel anytime
                            </p>

                        </Card>
                    </div>
                </motion.div>

                {/* --- FAQ Section --- */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="w-full max-w-3xl mt-24 mb-16"
                >
                    <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        <FAQItem
                            question="What's included in the 14-day free trial?"
                            answer="You get full access to all Pro features including unlimited downloads, AI chatbot usage, and document summarization. No credit card required to start."
                        />
                        <FAQItem
                            question="Can I cancel my subscription anytime?"
                            answer="Yes, you can cancel your subscription at any time from your account settings. You will continue to have access until the end of your billing cycle."
                        />
                        <FAQItem
                            question="Is my payment information secure?"
                            answer="Absolutely. We use Razorpay, a PCI-DSS compliant payment processor, to handle your payments securely. We do not store your card details."
                        />
                        <FAQItem
                            question="Do you offer discounts for students?"
                            answer="Yes! We offer a special discount for verified students. Please contact our support team with your student ID for more information."
                        />
                    </div>
                </motion.div>

                {/* --- Start Your Free Trial CTA --- */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full max-w-4xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-3xl p-12 text-center relative overflow-hidden group"
                >
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -z-10 group-hover:bg-primary/30 transition-colors duration-500" />

                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get started?</h2>
                    <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                        Join thousands of students and researchers enhancing their workflow with Scholara Pro.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
                            onClick={handleSubscribe}
                            disabled={loading}
                            className="h-12 px-8 rounded-xl text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-105"
                        >
                            Start your free trial today
                        </Button>
                        <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                            Talk to sales
                        </Button>
                    </div>

                    <p className="mt-4 text-xs text-muted-foreground">
                        No credit card required • 14-day free trial
                    </p>
                </motion.div>

            </div>
        </div>
    );
}

// --- FAQ Item Component ---
function FAQItem({ question, answer }: { question: string, answer: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-border/50 rounded-xl bg-card/50 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left font-medium hover:bg-muted/50 transition-colors"
                aria-expanded={isOpen}
            >
                <span>{question}</span>
                <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-muted-foreground"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6" /></svg>
                </motion.span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <div className="p-4 pt-0 text-muted-foreground text-sm leading-relaxed border-t border-border/30">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- Sub-Components ---

// Replaced AnimatedNumber with DigitScroll for specific animation requirements
function DigitScroll({ value, className }: { value: number, className: string }) {
    const valueStr = value.toString();
    const [prevValueStr, setPrevValueStr] = useState(valueStr);

    // Determine direction: Is current value greater than previous?
    const isIncrease = parseInt(valueStr) > parseInt(prevValueStr);

    useEffect(() => {
        setPrevValueStr(valueStr);
    }, [valueStr]);

    // Split digits
    const digits: string[] = valueStr.split('');
    const prevDigits: string[] = prevValueStr.split('');

    // Max length to iterate
    const maxLength = Math.max(digits.length, prevDigits.length);

    return (
        // Added tabular-nums for monospaced digits to prevent layout jumping
        <span className={`${className} inline-flex overflow-hidden h-[1em] leading-none tabular-nums`}>
            {Array.from({ length: maxLength }).map((_, i) => {
                const d = digits[i];
                const p = prevDigits[i];

                // Use the char exactly; undefined implies digit disappeared/appeared
                // If identical, render static
                if (d === p) {
                    return <span key={i} className="inline-block">{d}</span>;
                }

                // If changed or new, render animated container
                return (
                    <span key={i} className="inline-grid [grid-template-areas:'layer'] align-top h-[1em]">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {d && (
                                <motion.span
                                    key={d}
                                    layout
                                    // Added blur filter for smoothness
                                    initial={{ y: isIncrease ? '-100%' : '100%', opacity: 0, filter: 'blur(4px)' }}
                                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                                    exit={{ y: isIncrease ? '100%' : '-100%', opacity: 0, filter: 'blur(4px)' }}
                                    // Bouncy spring for "smooth" feel
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    className="[grid-area:layer] flex items-center justify-center inset-0"
                                >
                                    {d}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </span>
                );
            })}
        </span>
    );
}

function FeatureItem({ text, highlight = false }: { text: string, highlight?: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-3"
        >
            <div className={`mt-0.5 rounded-full p-0.5 flex-shrink-0 ${highlight ? 'text-primary bg-primary/10' : 'text-primary/70 bg-primary/5'}`}>
                <Check size={14} strokeWidth={3} />
            </div>
            <span className={`text-sm font-medium ${highlight ? 'text-foreground' : 'text-muted-foreground'}`}>
                {text}
            </span>
            {highlight && <Sparkles size={14} className="text-amber-500 animate-pulse ml-auto" />}
        </motion.div>
    );
}