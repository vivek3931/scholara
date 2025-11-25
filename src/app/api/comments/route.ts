import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const resourceId = searchParams.get('resourceId');

    if (!resourceId) {
        return NextResponse.json({ error: 'Resource ID required' }, { status: 400 });
    }

    try {
        const comments = await prisma.comment.findMany({
            where: { resourceId },
            include: { user: true },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ comments });
    } catch (error) {
        console.error('Fetch comments error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { resourceId, content } = await req.json();

        const comment = await prisma.comment.create({
            data: {
                content,
                resourceId,
                userId: session.userId as string
            },
            include: { user: true }
        });

        return NextResponse.json({ comment });
    } catch (error) {
        console.error('Comment error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
