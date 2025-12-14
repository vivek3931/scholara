import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const subject = searchParams.get('subject');
        const currentId = searchParams.get('currentId');

        if (!subject || !currentId) {
            return NextResponse.json({ error: 'Subject and currentId are required' }, { status: 400 });
        }

        // Fetch related resources: same subject, excluding current one
        const related = await prisma.resource.findMany({
            where: {
                subject: subject,
                id: { not: currentId },
                status: 'PUBLIC'
            },
            take: 5,
            orderBy: {
                downloadsCount: 'desc' // Show popular ones first
            },
            select: {
                id: true,
                title: true,
                fileUrl: true, // Needed for file type check (extension)
                previewUrl: true,

                author: {
                    select: { username: true }
                },
                viewsCount: true, // Use views as a proxy for rating/popularity for now
                downloadsCount: true
            }
        });

        // If not enough related resources, fetch some popular ones from other subjects
        if (related.length < 5) {
            const more = await prisma.resource.findMany({
                where: {
                    id: { notIn: [currentId, ...related.map(r => r.id)] },
                    status: 'PUBLIC'
                },
                take: 5 - related.length,
                orderBy: {
                    viewsCount: 'desc'
                },
                select: {
                    id: true,
                    title: true,
                    fileUrl: true,
                    previewUrl: true,
                    author: {
                        select: { username: true }
                    },
                    viewsCount: true,
                    downloadsCount: true
                }
            });
            related.push(...more);
        }

        console.log('Related Resources Found:', related.length, related.map(r => ({ id: r.id, hasPreview: !!r.previewUrl })));
        return NextResponse.json({ related });
    } catch (error) {
        console.error('Related resources API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch related resources' },
            { status: 500 }
        );
    }
}
