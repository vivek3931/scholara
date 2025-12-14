import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId, action, value } = await req.json();

        if (!userId || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let updateData = {};

        switch (action) {
            case 'TOGGLE_BLOCK':
                updateData = { isBlocked: value };
                break;
            case 'UPDATE_ROLE':
                // Prevent an admin from demoting themselves if they are the only one, but for now simple check
                updateData = { role: value }; // 'ADMIN' or 'USER'
                break;
            case 'TOGGLE_PRO':
                updateData = { isPro: value };
                break;
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: { id: true, email: true, role: true, isBlocked: true, isPro: true }
        });

        return NextResponse.json({ user: updatedUser });

    } catch (error) {
        console.error('Admin user update error:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}
