'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Download, Eye, User, Calendar, Lock } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface ResourceCardProps {
    resource: {
        id: string;
        title: string;
        description: string;
        fileUrl: string;
        subject: string;
        downloadsCount: number;
        viewsCount: number;
        createdAt: Date | string;
        author: {
            email: string;
        };
    };
    isLoggedIn: boolean;
}

const getThumbnailUrl = (url: string) => {
    if (!url) return null;
    if (url.includes('cloudinary.com') && url.endsWith('.pdf')) {
        return url.replace('.pdf', '.jpg');
    }
    return null;
};

export default function ResourceCard({ resource, isLoggedIn }: ResourceCardProps) {
    const router = useRouter();
    const [showLoginModal, setShowLoginModal] = useState(false);

    const handleClick = () => {
        if (isLoggedIn) {
            router.push(`/resource/${resource.id}`);
        } else {
            setShowLoginModal(true);
        }
    };

    return (
        <>
            <div onClick={handleClick} className="h-full">
                <Card className="hover:border-amber-500 transition-all duration-300 h-full cursor-pointer border-white/10 bg-onyx/60 backdrop-blur group overflow-hidden flex flex-col relative">
                    {/* Top Badge */}
                    <div className="absolute top-0 right-0 z-10 bg-gradient-to-l from-amber-600 to-amber-500 px-4 py-2 text-xs font-semibold text-white rounded-bl-lg shadow-lg">
                        {resource.subject}
                    </div>

                    {/* Thumbnail */}
                    <div className="relative h-48 w-full bg-onyx/40 overflow-hidden shrink-0">
                        {getThumbnailUrl(resource.fileUrl) ? (
                            <Image
                                src={getThumbnailUrl(resource.fileUrl)!}
                                alt={resource.title}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-600 bg-onyx/20">
                                <div className="text-center">
                                    <span className="text-4xl font-bold opacity-20 block">PDF</span>
                                </div>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-onyx via-transparent to-transparent" />

                        {/* Lock Icon if not logged in */}
                        {!isLoggedIn && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <Lock className="w-12 h-12 text-white/80 drop-shadow-lg" />
                            </div>
                        )}
                    </div>

                    <CardHeader className="pb-2 relative z-10 -mt-6">
                        <CardTitle className="text-xl line-clamp-2 text-amber-400 group-hover:text-amber-300 transition-colors drop-shadow-md">
                            {resource.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-3 text-gray-400 text-sm mt-2">
                            {resource.description}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="py-3 px-6 flex-grow">
                        <div className="flex items-center gap-2 text-xs text-gray-500 group-hover:text-gray-300 transition-colors">
                            <User className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">by {resource.author.email.split('@')[0]}</span>
                        </div>
                    </CardContent>

                    <CardFooter className="border-t border-white/5 pt-4 flex items-center justify-between mt-auto">
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
            </div>

            <Modal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                title="Login Required"
            >
                <div className="flex flex-col gap-4">
                    <p>You need to be logged in to view this resource.</p>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setShowLoginModal(false)}>
                            Cancel
                        </Button>
                        <Link href="/login">
                            <Button className="bg-amber-500 hover:bg-amber-600 text-black">
                                Login Now
                            </Button>
                        </Link>
                    </div>
                </div>
            </Modal>
        </>
    );
}
