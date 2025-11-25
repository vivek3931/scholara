import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Download, Eye, User, Calendar } from 'lucide-react';

export default async function BrowsePage({ searchParams }: { searchParams: Promise<{ subject?: string, q?: string }> }) {
    const { subject, q } = await searchParams;

    const where: any = { status: 'PUBLIC' };
    if (subject) where.subject = subject;
    if (q) {
        where.OR = [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } }
        ];
    }

    const resources = await prisma.resource.findMany({
        where,
        include: { author: true },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="min-h-screen bg-onyx text-white">
            <div className="container mx-auto py-10 px-4">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-3xl font-bold text-amber-500">
                        {subject ? `${subject} Resources` : 'All Resources'}
                    </h1>
                    <form className="flex gap-2 w-full md:w-auto">
                        <Input name="q" placeholder="Search..." defaultValue={q} className="w-full md:w-64" />
                        {subject && <input type="hidden" name="subject" value={subject} />}
                        <Button type="submit">Search</Button>
                    </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                    {resources.map(resource => (
                        <Link href={`/resource/${resource.id}`} key={resource.id}>
                            <Card className="hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300 h-full cursor-pointer border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur group overflow-hidden">
                                {/* Top Badge */}
                                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-600 to-amber-500 px-4 py-2 text-xs font-semibold text-white rounded-bl-lg">
                                    {resource.subject}
                                </div>

                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xl line-clamp-2 text-amber-400 group-hover:text-amber-300 transition-colors">
                                        {resource.title}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-3 text-gray-400 text-sm mt-2">
                                        {resource.description}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="py-3 px-6">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 group-hover:text-gray-300 transition-colors">
                                        <User className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate">by {resource.author.email.split('@')[0]}</span>
                                    </div>
                                </CardContent>

                                <CardFooter className="border-t border-white/5 pt-4 flex items-center justify-between">
                                    {/* Stats */}
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-amber-400 transition-colors">
                                            <Download className="w-4 h-4" />
                                            <span className="text-xs font-medium">{resource.downloadsCount}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-amber-400 transition-colors">
                                            <Eye className="w-4 h-4" />
                                            <span className="text-xs font-medium">{resource.viewsCount}</span>
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                                        <Calendar className="w-4 h-4 flex-shrink-0" />
                                        <span>{new Date(resource.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                </CardFooter>
                            </Card>
                        </Link>
                    ))}
                    {resources.length === 0 && (
                        <p className="text-gray-400 col-span-full text-center py-20">No resources found.</p>
                    )}
                </div>
            </div>
        </div>
    );
}