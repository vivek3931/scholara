import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q') || '';
        const status = searchParams.get('status');

        const whereClause: any = {};
        if (query) {
            whereClause.OR = [
                { title: { contains: query, mode: 'insensitive' } },
                { subject: { contains: query, mode: 'insensitive' } },
                { author: { email: { contains: query, mode: 'insensitive' } } }
            ];
        }
        if (status && status !== 'All Statuses') {
            whereClause.status = status; // PUBLIC, PRIVATE, REMOVED
        }

        const resources = await prisma.resource.findMany({
            where: whereClause,
            include: {
                author: { select: { email: true, username: true } },
                _count: { select: { reports: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return NextResponse.json({ resources });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
    }
}
