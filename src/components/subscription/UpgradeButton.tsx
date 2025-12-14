'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Crown } from 'lucide-react';

export default function UpgradeButton({ isPro }: { isPro: boolean }) {
    if (isPro) {
        return (
            <div className="flex items-center gap-1 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                <Crown size={14} className="text-amber-500" />
                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Pro</span>
            </div>
        );
    }

    return (
        <Link href="/pricing">
            <Button
                variant="outline"
                size="sm"
                className="hidden md:flex border-amber-500/50 text-amber-500 hover:bg-amber-500 hover:text-black gap-2"
            >
                <Crown size={16} />
                Upgrade
            </Button>
        </Link>
    );
}
