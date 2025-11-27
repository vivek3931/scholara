import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resources = await prisma.resource.findMany({
            where: { authorId: session.userId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ resources });
    } catch (error) {
        console.error('Fetch user resources error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
