import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
    const session = await getSession();
    if (!session || !session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { resourceId, type } = await req.json(); // type: 'like' | 'dislike'
        console.log('Vote API Request:', { userId: session.userId, resourceId, type });

        if (!resourceId || !['like', 'dislike'].includes(type)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const resource = await prisma.resource.findUnique({
            where: { id: resourceId },
            select: { likes: true, dislikes: true }
        });

        if (!resource) {
            return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
        }

        const userId = session.userId;
        let newLikes = resource.likes || [];
        let newDislikes = resource.dislikes || [];
        let action = '';

        if (type === 'like') {
            if (newLikes.includes(userId)) {
                // Remove like
                newLikes = newLikes.filter(id => id !== userId);
                action = 'removed_like';
            } else {
                // Add like, remove dislike if exists
                newLikes.push(userId);
                newDislikes = newDislikes.filter(id => id !== userId);
                action = 'liked';
            }
        } else { // dislike
            if (newDislikes.includes(userId)) {
                // Remove dislike
                newDislikes = newDislikes.filter(id => id !== userId);
                action = 'removed_dislike';
            } else {
                // Add dislike, remove like if exists
                newDislikes.push(userId);
                newLikes = newLikes.filter(id => id !== userId);
                action = 'disliked';
            }
        }

        await prisma.resource.update({
            where: { id: resourceId },
            data: {
                likes: newLikes,
                dislikes: newDislikes
            }
        });

        return NextResponse.json({
            success: true,
            action,
            likesCount: newLikes.length,
            dislikesCount: newDislikes.length,
            userLiked: newLikes.includes(userId),
            userDisliked: newDislikes.includes(userId)
        });

    } catch (error) {
        console.error('Vote API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const session = await getSession();
    const { searchParams } = new URL(req.url);
    const resourceId = searchParams.get('resourceId');

    if (!resourceId) {
        return NextResponse.json({ error: 'Resource ID required' }, { status: 400 });
    }

    try {
        const resource = await prisma.resource.findUnique({
            where: { id: resourceId },
            select: { likes: true, dislikes: true }
        });

        if (!resource) {
            return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
        }

        const userId = session?.userId;

        return NextResponse.json({
            likesCount: resource.likes?.length || 0,
            dislikesCount: resource.dislikes?.length || 0,
            userLiked: userId ? resource.likes?.includes(userId) : false,
            userDisliked: userId ? resource.dislikes?.includes(userId) : false
        });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
