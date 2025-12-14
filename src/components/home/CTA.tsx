'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CTA() {
    return (
        <section className="py-24 px-4 relative overflow-hidden">
            <div className="container mx-auto max-w-5xl relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-600/20 blur-3xl rounded-full opacity-50" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative bg-card border border-border rounded-3xl p-12 md:p-20 text-center overflow-hidden shadow-2xl"
                >
                    {/* Decorative Grid */}
                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />

                    <div className="relative z-10 space-y-8">
                        <h2 className="text-4xl md:text-5xl font-bold font-poppins text-foreground">
                            Ready to Excel in Your Studies?
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Join thousands of students who are already sharing resources and achieving better grades with Scholara.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            <Link href="/login">
                                <Button className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8 py-6 text-lg rounded-xl shadow-lg transition-all duration-300">
                                    Get Started Now
                                </Button>
                            </Link>
                            <Link href="/browse">
                                <Button variant="outline" className="w-full sm:w-auto border-border text-foreground hover:bg-accent px-8 py-6 text-lg rounded-xl">
                                    Browse Resources
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
