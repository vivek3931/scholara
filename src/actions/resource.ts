'use server';

import { prisma } from '@/lib/db';
import { calculateFileHashes } from '@/lib/hash';

export async function updateResourcePageCount(resourceId: string, fileUrl: string) {
    try {
        console.log(`Updating page count for resource ${resourceId}...`);
        const { pageCount } = await calculateFileHashes(fileUrl);

        if (pageCount) {
            await prisma.resource.update({
                where: { id: resourceId },
                data: { pageCount }
            });
            console.log(`Updated resource ${resourceId} with ${pageCount} pages.`);
            return { success: true, pageCount };
        }
        return { success: false, error: 'Could not determine page count' };
    } catch (error) {
        console.error('Error updating page count:', error);
        return { success: false, error: 'Failed to update page count' };
    }
}
