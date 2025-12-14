import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
    const session = await getSession();
    if (!session || !session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { resourceId, reason, targetUserId } = await req.json();

        if (!reason) {
            return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
        }

        await prisma.report.create({
            data: {
                reason,
                reporterId: session.userId,
                resourceId: resourceId || undefined,
                targetUserId: targetUserId || undefined
            }
        });

        // Increment user report count if it's a user report
        if (targetUserId) {
            await prisma.user.update({
                where: { id: targetUserId },
                data: { reportCount: { increment: 1 } }
            });
        }

        return NextResponse.json({ success: true, message: 'Report submitted successfully' });

    } catch (error) {
        console.error('Report API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
