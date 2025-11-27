import { prisma } from '@/lib/db';
import ResourceView from '@/components/ResourceView';
import { getSession } from '@/lib/auth';
import LoginRequired from '@/components/LoginRequired';

export default async function ResourcePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session) {
        return <LoginRequired />;
    }

    const { id } = await params;
    const resource = await prisma.resource.findUnique({
        where: { id },
        include: {
            author: true
        }
    });

    if (!resource) return <div className="text-white">Resource not found</div>;

    // Serialize dates for client component
    const serializedResource = {
        ...resource,
        createdAt: resource.createdAt.toISOString(),
        updatedAt: resource.updatedAt.toISOString(),
        author: {
            ...resource.author,
            createdAt: resource.author.createdAt.toISOString(),
            updatedAt: resource.author.updatedAt.toISOString(),
            otpExpires: resource.author.otpExpires?.toISOString() || null
        }
    };

    return (
        <div className="min-h-screen bg-onyx text-white">
            <ResourceView resource={serializedResource} />
        </div>
    );
}
