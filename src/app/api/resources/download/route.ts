import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { resourceId } = await req.json();
        const user = await prisma.user.findUnique({ where: { id: session.userId as string } });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check coins if not Pro
        if (!user.isPro && user.coins < 20) {
            return NextResponse.json({ error: 'Insufficient coins' }, { status: 403 });
        }

        // Deduct coins only if not Pro
        if (!user.isPro) {
            await prisma.user.update({
                where: { id: user.id },
                data: { coins: { decrement: 20 } }
            });

            // Log transaction
            await prisma.transaction.create({
                data: {
                    userId: user.id,
                    amount: -20,
                    type: 'DOWNLOAD_COST'
                }
            });
        }

        // Increment download count
        await prisma.resource.update({
            where: { id: resourceId },
            data: { downloadsCount: { increment: 1 } }
        });

        // Record who downloaded
        // We need to connect the user to the resource's downloadedBy list
        // But MongoDB lists in Prisma are tricky with update.
        // We'll just update the scalar list if possible or skip for now as we have the transaction log.
        // Prisma supports `push` for scalar lists.
        await prisma.resource.update({
            where: { id: resourceId },
            data: {
                downloadedByIds: { push: user.id }
            }
        });

        // Also update User's downloads list
        await prisma.user.update({
            where: { id: user.id },
            data: {
                downloadIds: { push: resourceId }
            }
        });

        // Fetch resource to get fileUrl
        const resource = await prisma.resource.findUnique({
            where: { id: resourceId },
            select: { fileUrl: true }
        });

        if (!resource) {
            return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, downloadUrl: resource.fileUrl });
    } catch (error) {
        console.error('Download error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
