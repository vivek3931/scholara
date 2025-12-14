import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import Hero from '@/components/home/Hero';
import dynamic from 'next/dynamic';

const Features = dynamic(() => import('@/components/home/Features'));
const StatsSection = dynamic(() => import('@/components/home/Stats'));
const CTA = dynamic(() => import('@/components/home/CTA'));
const SubjectsSection = dynamic(() => import('@/components/home/SubjectsSection'));

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground font-inter selection:bg-primary/30">
      <Hero />
      <Features />
      <SubjectsSection />
      <StatsSection />
      <CTA />
    </main>
  );
}
