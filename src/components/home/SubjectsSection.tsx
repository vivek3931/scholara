'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ArrowRight } from 'lucide-react';
import SkeletonCard from '@/components/ui/SkeletonCard';

async function fetchSubjects() {
    const res = await fetch('/api/subjects');
    if (!res.ok) throw new Error('Failed to fetch subjects');
    const data = await res.json();
    return data.subjects || [];
}

export default function SubjectsSection() {
    const { data: subjects = [], isLoading } = useQuery({
        queryKey: ['subjects'],
        queryFn: fetchSubjects,
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    return (
        <section className="py-24 px-4 container mx-auto relative">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10">
                {/* Header - Always visible */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl md:text-4xl font-bold font-poppins text-pearl mb-2">
                            Browse by <span className="text-amber-400">Subject</span>
                        </h2>
                        <p className="text-ash">Find resources for your specific field of study.</p>
                    </div>
                    <Link href="/browse">
                        <Button variant="outline" className="border-white/10 text-ash hover:text-pearl hover:bg-white/5 group">
                            View All Subjects
                            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>

                {/* Subjects Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {isLoading ? (
                        <SkeletonCard count={12} />
                    ) : (
                        subjects.slice(0, 12).map((subject: any, i: number) => (
                            <Link href={`/browse?subject=${subject.value}`} key={i} className="group">
                                <Card className="bg-charcoal/40 border-white/5 hover:border-amber-500/30 hover:bg-charcoal/80 transition-all duration-300 h-full backdrop-blur-sm group-hover:-translate-y-1 group-hover:shadow-lg overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-500/0 group-hover:from-amber-500/5 group-hover:to-orange-500/5 transition-all duration-500" />
                                    <CardContent className="p-6 flex flex-col items-center justify-center text-center h-32 relative z-10">
                                        <span className="font-medium text-sm md:text-base text-ash group-hover:text-pearl transition-colors">
                                            {subject.label}
                                        </span>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
