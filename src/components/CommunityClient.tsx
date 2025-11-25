'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, Upload, MessageCircle, TrendingUp, Award, Sparkles, Clock, Crown } from 'lucide-react';
import Link from 'next/link';

export default function CommunityClient({ data }: { data: any }) {
    const { recentResources, recentComments, topContributors, stats } = data;

    // Merge and sort activities
    const activities = [
        ...recentResources.map((r: any) => ({
            type: 'upload',
            data: r,
            timestamp: r.createdAt
        })),
        ...recentComments.map((c: any) => ({
            type: 'comment',
            data: c,
            timestamp: c.createdAt
        }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 15);

    const statCards = [
        { icon: Users, label: 'Active Members', value: stats.totalUsers.toLocaleString(), color: 'from-purple-600 to-purple-500' },
        { icon: Upload, label: 'Resources Shared', value: stats.totalResources.toLocaleString(), color: 'from-amber-600 to-amber-500' },
        { icon: MessageCircle, label: 'Comments Posted', value: stats.totalComments.toLocaleString(), color: 'from-cyan-600 to-cyan-500' },
        { icon: TrendingUp, label: 'Total Downloads', value: stats.totalDownloads.toLocaleString(), color: 'from-green-600 to-green-500' }
    ];

    return (
        <div className="container mx-auto py-12 px-4 relative z-10">
            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-amber-500/20 border border-amber-500/30 rounded-full px-4 py-2 mb-4">
                    <Sparkles size={16} className="text-amber-400" />
                    <span className="text-sm text-amber-300">Welcome to the Community</span>
                </div>
                <h1 className="text-5xl font-bold text-pearl mb-4 bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-400">
                    Learn Together, Grow Together
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                    Connect with fellow learners, share knowledge, and celebrate academic excellence
                </p>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="bg-gradient-to-br from-charcoal/80 to-onyx/80 border-white/10 hover:border-white/20 transition-all duration-300 group">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                        <stat.icon size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-pearl">{stat.value}</p>
                                        <p className="text-xs text-gray-400">{stat.label}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Activity Feed - Larger Column */}
                <div className="lg:col-span-2">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="bg-gradient-to-br from-charcoal/80 to-onyx/80 border-white/10">
                            <CardHeader className="border-b border-white/5">
                                <CardTitle className="text-xl text-pearl flex items-center gap-2">
                                    <Clock size={20} className="text-cyan-400" />
                                    Recent Activity
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                                    {activities.map((activity: any, index: number) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="flex gap-4 p-4 rounded-xl bg-gradient-to-r from-white/5 to-white/[0.02] hover:from-white/10 hover:to-white/5 border border-white/5 hover:border-white/10 transition-all duration-300 group"
                                        >
                                            {activity.type === 'upload' ? (
                                                <>
                                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <Upload size={18} className="text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-gray-300">
                                                            <span className="font-bold text-amber-400">
                                                                {activity.data.author?.email.split('@')[0]}
                                                            </span>
                                                            {' '}uploaded a new resource
                                                        </p>
                                                        <Link href={`/resource/${activity.data.id}`}>
                                                            <p className="text-pearl font-semibold hover:text-amber-400 transition-colors line-clamp-1">
                                                                {activity.data.title}
                                                            </p>
                                                        </Link>
                                                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                                            <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                                                                {activity.data.subject}
                                                            </span>
                                                            <span>{new Date(activity.timestamp).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <MessageCircle size={18} className="text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-gray-300">
                                                            <span className="font-bold text-cyan-400">
                                                                {activity.data.user?.email.split('@')[0]}
                                                            </span>
                                                            {' '}commented on
                                                        </p>
                                                        <Link href={`/resource/${activity.data.resource.id}`}>
                                                            <p className="text-pearl font-semibold hover:text-cyan-400 transition-colors line-clamp-1">
                                                                {activity.data.resource.title}
                                                            </p>
                                                        </Link>
                                                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                                                            {activity.data.content}
                                                        </p>
                                                        <span className="text-xs text-gray-500 mt-2 inline-block">
                                                            {new Date(activity.timestamp).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Leaderboard Sidebar */}
                <div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="bg-gradient-to-br from-charcoal/80 to-onyx/80 border-white/10 sticky top-4">
                            <CardHeader className="border-b border-white/5">
                                <CardTitle className="text-xl text-pearl flex items-center gap-2">
                                    <Award size={20} className="text-purple-400" />
                                    Top Contributors
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-3">
                                    {topContributors.map((contributor: any, index: number) => (
                                        <motion.div
                                            key={contributor.id}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 + (index * 0.05) }}
                                            className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${index < 3
                                                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30'
                                                    : 'bg-white/5 border border-white/5 hover:border-white/10'
                                                }`}
                                        >
                                            <div className="relative">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${index === 0
                                                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white'
                                                        : index === 1
                                                            ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800'
                                                            : index === 2
                                                                ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                                                                : 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'
                                                    }`}>
                                                    {index < 3 ? (
                                                        <Crown size={16} />
                                                    ) : (
                                                        contributor.email[0].toUpperCase()
                                                    )}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-charcoal rounded-full flex items-center justify-center text-[10px] font-bold text-gray-400 border border-white/10">
                                                    #{index + 1}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-semibold truncate ${index < 3 ? 'text-amber-400' : 'text-gray-300'
                                                    }`}>
                                                    {contributor.email.split('@')[0]}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span>{contributor._count.uploads} uploads</span>
                                                    <span>•</span>
                                                    <span>{contributor.coins} SC</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
