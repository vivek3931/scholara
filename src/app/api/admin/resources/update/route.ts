import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { resourceId, action } = await req.json();

        if (!resourceId || !action) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        let updateData = {};
        if (action === 'MAKE_PRIVATE') updateData = { status: 'PRIVATE' };
        if (action === 'MAKE_PUBLIC') updateData = { status: 'PUBLIC' };
        if (action === 'DELETE') updateData = { status: 'REMOVED' }; // Soft delete or actual delete?

        // If DELETE is actual delete:
        if (action === 'DELETE_PERMANENT') {
            await prisma.resource.delete({ where: { id: resourceId } });
             return NextResponse.json({ success: true, deleted: true });
        }

        // Soft update
        const updatedResource = await prisma.resource.update({
            where: { id: resourceId },
            data: updateData,
        });

        return NextResponse.json({ resource: updatedResource });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 });
    }
}
