import { prisma } from '@/lib/db';
import CommunityClient from '@/components/CommunityClient';

export const metadata = {
    title: 'Community - Scholara',
    description: 'Join the Scholara community and connect with fellow learners'
};

async function getCommunityData() {
    // Get recent activities (uploads and comments)
    const recentResources = await prisma.resource.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
            author: {
                select: {
                    email: true,
                    coins: true
                }
            }
        }
    });

    const recentComments = await prisma.comment.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: {
                    email: true,
                    coins: true
                }
            },
            resource: {
                select: {
                    id: true,
                    title: true
                }
            }
        }
    });

    // Get top contributors by upload count
    const topContributors = await prisma.user.findMany({
        take: 10,
        orderBy: [
            { uploads: { _count: 'desc' } }
        ],
        select: {
            id: true,
            email: true,
            coins: true,
            _count: {
                select: {
                    uploads: true,
                    comments: true
                }
            }
        }
    });

    // Get community stats
    const totalUsers = await prisma.user.count();
    const totalResources = await prisma.resource.count();
    const totalComments = await prisma.comment.count();
    const totalDownloads = await prisma.resource.aggregate({
        _sum: {
            downloadsCount: true
        }
    });

    // Serialize dates
    const serializedResources = recentResources.map(r => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString()
    }));

    const serializedComments = recentComments.map(c => ({
        ...c,
        createdAt: c.createdAt.toISOString()
    }));

    return {
        recentResources: serializedResources,
        recentComments: serializedComments,
        topContributors,
        stats: {
            totalUsers,
            totalResources,
            totalComments,
            totalDownloads: totalDownloads._sum.downloadsCount || 0
        }
    };
}

export default async function CommunityPage() {
    const data = await getCommunityData();

    return (
        <div className="min-h-screen bg-gradient-to-b from-onyx via-midnight to-onyx">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-subtle-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-subtle-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <CommunityClient data={data} />
        </div>
    );
}
