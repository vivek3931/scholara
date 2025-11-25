import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// POST - Save a resource
export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload?.userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await req.json();
        const { resourceId } = body;

        if (!resourceId) {
            return NextResponse.json({ error: 'Resource ID required' }, { status: 400 });
        }

        // Check if resource exists
        const resource = await prisma.resource.findUnique({
            where: { id: resourceId }
        });

        if (!resource) {
            return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
        }

        // Get current user to check if already saved
        const user = await prisma.user.findUnique({
            where: { id: payload.userId }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if already saved
        if (user.savedResourceIds.includes(resourceId)) {
            return NextResponse.json({
                success: true,
                saved: true,
                message: 'Resource already saved'
            });
        }

        // Add to saved resources
        await prisma.user.update({
            where: { id: payload.userId },
            data: {
                savedResourceIds: {
                    push: resourceId
                }
            }
        });

        return NextResponse.json({
            success: true,
            saved: true,
            message: 'Resource saved successfully'
        });

    } catch (error) {
        console.error('Save resource error:', error);
        return NextResponse.json({ error: 'Failed to save resource' }, { status: 500 });
    }
}

// DELETE - Unsave a resource
export async function DELETE(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload?.userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await req.json();
        const { resourceId } = body;

        if (!resourceId) {
            return NextResponse.json({ error: 'Resource ID required' }, { status: 400 });
        }

        // Get current user
        const user = await prisma.user.findUnique({
            where: { id: payload.userId }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if resource is in saved list
        if (!user.savedResourceIds.includes(resourceId)) {
            return NextResponse.json({
                success: false,
                error: 'Resource not found in saved'
            }, { status: 404 });
        }

        // Remove from saved resources
        await prisma.user.update({
            where: { id: payload.userId },
            data: {
                savedResourceIds: {
                    set: user.savedResourceIds.filter(id => id !== resourceId)
                }
            }
        });

        return NextResponse.json({
            success: true,
            saved: false,
            message: 'Resource removed from saved'
        });

    } catch (error) {
        console.error('Unsave resource error:', error);
        return NextResponse.json({ error: 'Failed to unsave resource' }, { status: 500 });
    }
}

// GET - Check if resource is saved
export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ saved: false });
        }

        const payload = await verifyToken(token);
        if (!payload?.userId) {
            return NextResponse.json({ saved: false });
        }

        const { searchParams } = new URL(req.url);
        const resourceId = searchParams.get('resourceId');

        if (!resourceId) {
            return NextResponse.json({ error: 'Resource ID required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId }
        });

        const saved = user?.savedResourceIds.includes(resourceId) || false;

        return NextResponse.json({ saved });

    } catch (error) {
        console.error('Check saved status error:', error);
        return NextResponse.json({ saved: false });
    }
}