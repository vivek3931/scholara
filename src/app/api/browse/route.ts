import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const subject = searchParams.get('subject');
        const q = searchParams.get('q');

        const where: any = { status: 'PUBLIC' };

        if (subject) {
            where.subject = subject;
        }

        if (q) {
            where.OR = [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } }
            ];
        }

        const resources = await prisma.resource.findMany({
            where,
            include: { author: true },
            orderBy: { createdAt: 'desc' }
        });

        // Serialize dates
        const serializedResources = resources.map(resource => ({
            ...resource,
            createdAt: resource.createdAt.toISOString(),
            updatedAt: resource.updatedAt.toISOString(),
            author: {
                ...resource.author,
                createdAt: resource.author.createdAt.toISOString(),
                updatedAt: resource.author.updatedAt.toISOString(),
                otpExpires: resource.author.otpExpires?.toISOString() || null
            }
        }));

        return NextResponse.json({ resources: serializedResources });
    } catch (error) {
        console.error('Browse API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch resources' },
            { status: 500 }
        );
    }
}
