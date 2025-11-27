import { NextRequest, NextResponse } from 'next/server';
import {prisma} from '@/lib/db'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');

        if (!query || query.trim().length === 0) {
            return NextResponse.json({ resources: [] });
        }

        // Search resources by title, description, or subject
        const resources = await prisma.resource.findMany({
            where: {
                OR: [
                    {
                        title: {
                            contains: query,
                            mode: 'insensitive',
                        },
                    },
                    {
                        description: {
                            contains: query,
                            mode: 'insensitive',
                        },
                    },
                    {
                        subject: {
                            contains: query,
                            mode: 'insensitive',
                        },
                    },
                ],
            },
            select: {
                id: true,
                title: true,
                description: true,
                subject: true,
                type: true,
                uploadedAt: true,
                uploader: {
                    select: {
                        email: true,
                    },
                },
            },
            take: 8, // Limit to 8 suggestions
            orderBy: {
                uploadedAt: 'desc',
            },
        });

        return NextResponse.json({ resources });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json(
            { error: 'Failed to search resources' },
            { status: 500 }
        );
    }
}
