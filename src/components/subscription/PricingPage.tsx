'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Check, Zap, Crown, Sparkles, Star } from 'lucide-react';
import { toast } from 'sonner';
import Script from 'next/script';
import { motion } from 'framer-motion';

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function PricingPage() {
    const [loading, setLoading] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('YEARLY');

    const handleSubscribe = async (planType: 'MONTHLY' | 'YEARLY') => {
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
                body: JSON.stringify({ planType }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            if (!data.keyId) {
                throw new Error('Razorpay Key ID is not configured');
            }

            // 2. Initialize Razorpay
            const options = {
                key: data.keyId,
                amount: data.amount,
                currency: data.currency,
                name: "Scholara Pro",
                description: `${planType === 'MONTHLY' ? 'Monthly' : 'Yearly'} Subscription`,
                order_id: data.id,
                handler: async function (response: any) {
                    try {
                        const verifyRes = await fetch('/api/subscription/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...response, planType }),
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
        <div className="min-h-screen bg-background text-foreground py-20 px-4 relative overflow-hidden">
            <Script
                id="razorpay-checkout-js"
                src="https://checkout.razorpay.com/v1/checkout.js"
                strategy="lazyOnload"
            />

            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10" />

            <div className="max-w-6xl mx-auto text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 border border-primary/20">
                        Unlock Your Potential
                    </span>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-6 leading-tight">
                        Upgrade to <span className="text-primary">Scholara Pro</span>
                    </h1>
                    <p className="text-muted-foreground text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
                        Experience the ultimate academic advantage with unlimited access to premium AI tools, downloads, and exclusive content.
                    </p>
                </motion.div>

                {/* Plan Layout */}
                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
                    {/* Monthly Plan */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        whileHover={{ y: -5 }}
                    >
                        <Card className="p-8 bg-card backdrop-blur-xl border border-border hover:border-primary/50 transition-all duration-300 relative group overflow-hidden h-full flex flex-col items-center">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Zap className="w-32 h-32 -rotate-12" />
                            </div>

                            <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                                <Zap className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>

                            <h3 className="text-2xl font-bold mb-2">Monthly</h3>
                            <div className="flex items-baseline justify-center gap-1 mb-2">
                                <span className="text-4xl font-bold text-foreground">₹149</span>
                                <span className="text-muted-foreground">/mo</span>
                            </div>
                            <p className="text-muted-foreground text-sm mb-8 h-6">Flexible monthly billing</p>

                            <ul className="space-y-4 mb-8 text-left w-full pl-4">
                                <FeatureItem text="Unlimited Downloads" />
                                <FeatureItem text="AI Chatbot Access" />
                                <FeatureItem text="Document Summarization" />
                                <FeatureItem text="Priority Support" />
                            </ul>

                            <Button
                                onClick={() => handleSubscribe('MONTHLY')}
                                disabled={loading}
                                variant="outline"
                                className="w-full bg-muted/30 hover:bg-muted text-foreground border-border hover:border-primary/30 h-12 rounded-xl"
                            >
                                {loading ? 'Processing...' : 'Choose Monthly'}
                            </Button>
                        </Card>
                    </motion.div>

                    {/* Yearly Plan - Best Value */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        whileHover={{ y: -5 }}
                        className="relative"
                    >
                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-3xl blur-xl opacity-20 animate-pulse" />

                        <Card className="p-8 bg-card backdrop-blur-xl border border-primary/30 hover:border-primary/50 transition-all duration-300 relative group overflow-hidden h-full flex flex-col items-center shadow-2xl shadow-primary/20">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-accent" />
                            <div className="absolute top-4 right-4 bg-gradient-to-r from-primary to-accent text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                                <Star size={10} fill="currentColor" /> BEST VALUE
                            </div>

                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Crown className="w-32 h-32 -rotate-12 text-primary" />
                            </div>

                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-primary/20">
                                <Crown className="w-6 h-6 text-primary" />
                            </div>

                            <h3 className="text-2xl font-bold mb-2 text-foreground">Yearly</h3>
                            <div className="flex items-baseline justify-center gap-1 mb-2">
                                <span className="text-5xl font-bold text-primary">₹1548</span>
                                <span className="text-muted-foreground">/yr</span>
                            </div>
                            <p className="text-primary text-sm mb-8 font-medium flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full">
                                <Sparkles size={12} /> Just ₹129/month - Save 13%
                            </p>

                            <ul className="space-y-4 mb-8 text-left w-full pl-4">
                                <FeatureItem text="Everything in Monthly" highlight />
                                <FeatureItem text="2 Months Free" highlight />
                                <FeatureItem text="Early Access to New Features" highlight />
                                <FeatureItem text="Premium Badge" highlight />
                            </ul>

                            <Button
                                onClick={() => handleSubscribe('YEARLY')}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-bold h-12 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                            >
                                {loading ? 'Processing...' : 'Go Pro Yearly'}
                            </Button>
                        </Card>
                    </motion.div>
                </div>

                <div className="mt-16 text-muted-foreground text-sm">
                    <p>Secure payment via Razorpay. Cancel anytime.</p>
                </div>
            </div>
        </div>
    );
}

function FeatureItem({ text, highlight = false }: { text: string, highlight?: boolean }) {
    return (
        <li className="flex items-center gap-3">
            <div className={`rounded-full p-1 flex-shrink-0 ${highlight ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <Check size={12} strokeWidth={3} />
            </div>
            <span className={highlight ? 'text-foreground font-medium' : 'text-muted-foreground'}>{text}</span>
        </li>
    );
}
