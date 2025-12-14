import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const reports = await prisma.report.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                reporter: { select: { email: true } },
                resource: { select: { title: true } },
                targetUser: { select: { email: true } }
            },
            take: 50
        });

        return NextResponse.json({ reports });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }
}
