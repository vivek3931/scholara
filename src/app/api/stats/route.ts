import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        const [resourceCount, studentCount, downloads] = await Promise.all([
            prisma.resource.count(),
            prisma.user.count(),
            prisma.resource.aggregate({
                _sum: {
                    downloadsCount: true
                }
            })
        ]);

        const downloadCount = downloads._sum.downloadsCount || 0;

        return NextResponse.json({
            resourceCount,
            studentCount,
            downloadCount
        });
    } catch (error) {
        console.error('Stats API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stats' },
            { status: 500 }
        );
    }
}
