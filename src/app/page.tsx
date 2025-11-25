import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import Link from 'next/link';
import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import Stats from '@/components/home/Stats';
import CTA from '@/components/home/CTA';
import { ArrowRight } from 'lucide-react';

import { prisma } from '@/lib/db';

async function getSubjects() {
  try {
    const res = await fetch('https://vivek3931.github.io/subjects-api/subjects.json', { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.subjects || [];
  } catch (e) {
    return [];
  }
}

export default async function Home() {
  const subjects = await getSubjects();

  const resourceCount = await prisma.resource.count();
  const studentCount = await prisma.user.count();
  const downloads = await prisma.resource.aggregate({
    _sum: {
      downloadsCount: true
    }
  });
  const downloadCount = downloads._sum.downloadsCount || 0;

  return (
    <main className="min-h-screen bg-onyx text-pearl font-inter selection:bg-amber-500/30">

      <Hero />

      <Features />

      {/* Subjects Grid */}
      <section className="py-24 px-4 container mx-auto relative">
        {/* Background Glow for this section */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10">
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

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {subjects.slice(0, 12).map((subject: any, i: number) => (
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
            ))}
          </div>
        </div>
      </section>

      <Stats resourceCount={resourceCount} studentCount={studentCount} downloadCount={downloadCount} />

      <CTA />
    </main>
  );
}
