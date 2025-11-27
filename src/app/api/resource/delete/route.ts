import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { resourceId } = await req.json();

        if (!resourceId) {
            return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 });
        }

        const resource = await prisma.resource.findUnique({
            where: { id: resourceId },
        });

        if (!resource) {
            return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
        }

        if (resource.authorId !== session.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Delete related data first (cascading delete)
        // 1. Delete all comments for this resource
        await prisma.comment.deleteMany({
            where: { resourceId },
        });

        // 2. Delete all reports for this resource
        await prisma.report.deleteMany({
            where: { resourceId },
        });

        // 3. Now delete the resource
        await prisma.resource.delete({
            where: { id: resourceId },
        });

        return NextResponse.json({ message: 'Resource deleted successfully' });
    } catch (error) {
        console.error('Resource deletion error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
