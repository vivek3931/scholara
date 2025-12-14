'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Trash2, User, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';

interface Resource {
    id: string;
    title: string;
    description: string;
    createdAt: string;
    viewsCount: number;
    downloadsCount: number;
}

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // Modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);

    const router = useRouter();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [userRes, resourcesRes] = await Promise.all([
                fetch('/api/auth/me'),
                fetch('/api/user/resources')
            ]);

            if (userRes.ok) {
                const userData = await userRes.json();
                setUser(userData.user);
                setUsername(userData.user.username || '');
            } else {
                router.push('/login');
            }

            if (resourcesRes.ok) {
                const resourcesData = await resourcesRes.json();
                setResources(resourcesData.resources);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (password && password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        try {
            const res = await fetch('/api/user/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    password: password || undefined,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Profile updated successfully' });
                setPassword('');
                setConfirmPassword('');
                if (data.user) setUser({ ...user, username: data.user.username });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred' });
        }
    };

    const confirmDelete = (resourceId: string) => {
        setResourceToDelete(resourceId);
        setDeleteModalOpen(true);
    };

    const handleDeleteResource = async () => {
        if (!resourceToDelete) return;

        setIsDeleting(resourceToDelete);
        setDeleteModalOpen(false); // Close modal immediately

        try {
            const res = await fetch('/api/resource/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resourceId: resourceToDelete }),
            });

            if (res.ok) {
                setResources(resources.filter(r => r.id !== resourceToDelete));
                setMessage({ type: 'success', text: 'Resource deleted successfully' });
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Failed to delete resource' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred' });
        } finally {
            setIsDeleting(null);
            setResourceToDelete(null);
        }
    };

    return (
        <div className="min-h-screen bg-background pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative">
            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Resource"
            >
                <div className="space-y-4">
                    <p className="text-muted-foreground">
                        Are you sure you want to delete this resource? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteModalOpen(false)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeleteResource}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground border-none"
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>

            <div className="max-w-7xl mx-auto space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
                    <p className="text-muted-foreground">Manage your profile and resources</p>
                </motion.div>

                {message && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/30' : 'bg-destructive/10 text-destructive border border-destructive/30'
                            }`}
                    >
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        {message.text}
                    </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Profile Settings */}
                    <motion.div
                        className="md:col-span-1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="bg-card border-border sticky top-24 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-primary flex items-center gap-2">
                                    <User size={20} />
                                    Profile
                                </CardTitle>
                                <CardDescription>Update your account information</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="h-3 bg-muted rounded w-12 animate-pulse" />
                                            <div className="h-10 bg-muted rounded animate-pulse" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-3 bg-muted rounded w-16 animate-pulse" />
                                            <div className="h-10 bg-muted rounded animate-pulse" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-3 bg-muted rounded w-24 animate-pulse" />
                                            <div className="h-10 bg-muted rounded animate-pulse" />
                                        </div>
                                        <div className="h-10 bg-primary/20 rounded animate-pulse" />
                                    </div>
                                ) : (
                                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">Email</label>
                                            <Input value={user?.email} disabled className="bg-muted text-muted-foreground border-border" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">Username</label>
                                            <Input
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                placeholder="Set a username"
                                                className="bg-background border-input focus:border-primary/50 text-foreground"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">New Password</label>
                                            <Input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Leave blank to keep current"
                                                className="bg-background border-input focus:border-primary/50 text-foreground"
                                            />
                                        </div>
                                        {password && (
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-foreground">Confirm Password</label>
                                                <Input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="Confirm new password"
                                                    className="bg-background border-input focus:border-primary/50 text-foreground"
                                                />
                                            </div>
                                        )}
                                        <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground">
                                            Save Changes
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* My Resources */}
                    <motion.div
                        className="md:col-span-2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="bg-card border-border backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-primary flex items-center gap-2">
                                    <FileText size={20} />
                                    My Resources
                                </CardTitle>
                                <CardDescription>Manage your uploaded resources</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border relative overflow-hidden">
                                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                                                <div className="flex-1 space-y-2 relative z-10">
                                                    <div className="h-4 bg-muted/20 rounded w-3/4 animate-pulse" />
                                                    <div className="h-3 bg-muted/20 rounded w-1/2 animate-pulse" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : resources.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <p>You haven't uploaded any resources yet.</p>
                                        <Button
                                            variant="link"
                                            className="text-primary mt-2"
                                            onClick={() => router.push('/upload')}
                                        >
                                            Upload your first resource
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <AnimatePresence>
                                            {resources.map((resource) => (
                                                <motion.div
                                                    key={resource.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border hover:border-primary/30 transition-colors group"
                                                >
                                                    <div className="flex-1 min-w-0 mr-4">
                                                        <h3 className="font-medium text-foreground truncate">{resource.title}</h3>
                                                        <p className="text-sm text-muted-foreground truncate">{resource.description}</p>
                                                        <div className="flex gap-4 mt-1 text-xs text-muted-foreground/80">
                                                            <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                                                            <span>{resource.viewsCount} views</span>
                                                            <span>{resource.downloadsCount} downloads</span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => confirmDelete(resource.id)}
                                                        disabled={isDeleting === resource.id}
                                                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        {isDeleting === resource.id ? (
                                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                                                        ) : (
                                                            <Trash2 size={18} />
                                                        )}
                                                    </Button>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
