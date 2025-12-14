import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SavedResourcesClient from '@/components/SavedResourcesClient';

export const metadata = {
    title: 'Saved Resources - Scholara',
    description: 'View your saved resources'
};

async function getSavedResources() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        redirect('/login');
    }

    const payload = await verifyToken(token);
    if (!payload?.userId) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
            savedResources: {
                include: {
                    author: {
                        select: {
                            email: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }
        }
    });

    if (!user) {
        redirect('/login');
    }

    // Serialize dates
    const savedResources = user.savedResources.map(resource => ({
        ...resource,
        createdAt: resource.createdAt.toISOString(),
        updatedAt: resource.updatedAt.toISOString()
    }));

    return savedResources;
}

export default async function SavedPage() {
    const savedResources = await getSavedResources();

    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-7xl mx-auto py-12 px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Saved Resources</h1>
                    <p className="text-muted-foreground">Access your bookmarked study materials</p>
                </div>

                <SavedResourcesClient initialResources={savedResources} />
            </div>
        </div>
    );
}