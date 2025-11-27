import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import StatsSection from '@/components/home/Stats';
import CTA from '@/components/home/CTA';
import SubjectsSection from '@/components/home/SubjectsSection';

export default function Home() {
  return (
    <main className="min-h-screen bg-onyx text-pearl font-inter selection:bg-amber-500/30">
      <Hero />
      <Features />
      <SubjectsSection />
      <StatsSection />
      <CTA />
    </main>
  );
}
