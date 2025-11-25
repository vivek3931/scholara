'use client';

import { motion } from 'framer-motion';
import { Upload, Search, Award, Zap, Shield, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

const features = [
    {
        icon: Upload,
        title: "Easy Sharing",
        description: "Upload your study materials in seconds. Support for PDF, images, and more.",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20"
    },
    {
        icon: Search,
        title: "Smart Search",
        description: "Find exactly what you need with our advanced search and filtering system.",
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20"
    },
    {
        icon: Award,
        title: "Earn Rewards",
        description: "Get recognized for your contributions and earn coins for premium content.",
        color: "text-orange-400",
        bg: "bg-orange-500/10",
        border: "border-orange-500/20"
    },
    {
        icon: Zap,
        title: "AI Summaries",
        description: "Get instant AI-powered summaries of long documents to save time.",
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20"
    },
    {
        icon: Shield,
        title: "Quality Verified",
        description: "Community-vetted resources ensure you only get the best study materials.",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20"
    },
    {
        icon: Users,
        title: "Community Driven",
        description: "Join a growing community of students helping students succeed.",
        color: "text-pink-400",
        bg: "bg-pink-500/10",
        border: "border-pink-500/20"
    }
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function Features() {
    return (
        <section className="py-24 px-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="container mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold font-poppins"
                    >
                        Why Choose <span className="text-amber-400">Scholara</span>?
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-ash text-lg"
                    >
                        Everything you need to excel in your academic journey, all in one place.
                    </motion.p>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {features.map((feature, idx) => (
                        <motion.div key={idx} variants={item}>
                            <Card className="h-full bg-charcoal/30 border-white/5 hover:bg-charcoal/50 hover:border-white/10 transition-all duration-300 group backdrop-blur-sm">
                                <CardContent className="p-8 space-y-4">
                                    <div className={`w-14 h-14 rounded-2xl ${feature.bg} ${feature.border} border flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                        <feature.icon className={`w-7 h-7 ${feature.color}`} />
                                    </div>
                                    <h3 className="text-xl font-bold text-pearl group-hover:text-white transition-colors">
                                        {feature.title}
                                    </h3>
                                    <p className="text-ash leading-relaxed">
                                        {feature.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
