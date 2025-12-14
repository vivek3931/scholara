'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Users, FileText, Settings, LogOut,
    Search, ChevronDown, ChevronUp, Flag, Download, Menu, X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Image from 'next/image';

// --- Sidebar Component ---
const Sidebar = ({ activeTab, setActiveTab, onLogout, isOpen, onClose }: any) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, sub: 'Overview and analytics' },
        { id: 'users', label: 'Users', icon: Users, sub: 'Manage user accounts' },
        { id: 'resources', label: 'Resources', icon: FileText, sub: 'Manage uploaded content' },
        { id: 'settings', label: 'Settings', icon: Settings, sub: 'System configuration' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            <div className={`w-64 bg-card h-screen fixed left-0 top-0 border-r border-border flex flex-col z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Image src="/logo.svg" alt="Scholara" width={100} height={30} className="h-6 w-auto" />
                        <span className="text-xs text-primary font-bold px-2 py-0.5 bg-primary/10 rounded-full">ADMIN</span>
                    </div>
                    <button onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 px-3 space-y-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                onClose();
                            }}
                            className={`w-full text-left p-3 rounded-xl transition-all group relative overflow-hidden ${activeTab === item.id
                                ? 'bg-gradient-to-r from-primary/20 to-transparent text-primary border-l-4 border-primary'
                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                }`}
                        >
                            <div className="flex items-center gap-3 relative z-10">
                                <item.icon size={20} className={activeTab === item.id ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'} />
                                <div>
                                    <p className="font-medium text-sm">{item.label}</p>
                                    <p className="text-[10px] opacity-60">{item.sub}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-border">
                    <button className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors w-full p-2" onClick={() => window.location.href = '/'}>
                        <LayoutDashboard size={18} /> <span className="text-sm">Back to Main Site</span>
                    </button>
                    <button onClick={onLogout} className="flex items-center gap-3 text-destructive hover:text-destructive/80 transition-colors w-full p-2 mt-2">
                        <LogOut size={18} /> <span className="text-sm">Logout</span>
                    </button>
                </div>
            </div>
        </>
    );
};

// --- Dashboard View ---
const DashboardView = ({ stats }: any) => {
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Users', value: stats?.stats?.totalUsers || 0, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Total Resources', value: stats?.stats?.totalResources || 0, icon: FileText, color: 'text-green-500', bg: 'bg-green-500/10' },
                    { label: 'Total Downloads', value: stats?.stats?.totalDownloads || 0, icon: Download, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Flagged Content', value: stats?.stats?.flaggedContent || 0, icon: Flag, color: 'text-destructive', bg: 'bg-destructive/10' },
                ].map((item, i) => (
                    <Card key={i} className="bg-card border-border border">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <div className={`p-3 rounded-lg w-fit mb-3 ${item.bg}`}>
                                    <item.icon size={24} className={item.color} />
                                </div>
                                <h3 className="text-2xl font-bold text-foreground">{item.value}</h3>
                                <p className="text-sm text-muted-foreground">{item.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-card border-border border">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-foreground mb-4">Weekly Activity</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats?.weeklyActivity || []}>
                                    <defs>
                                        <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="name" stroke="#666" />
                                    <YAxis stroke="#666" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: 'none' }} />
                                    <Area type="monotone" dataKey="uploads" stroke="#f59e0b" fillOpacity={1} fill="url(#colorUploads)" />
                                    <Area type="monotone" dataKey="downloads" stroke="#3b82f6" fillOpacity={0.1} fill="#3b82f6" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border border">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-foreground mb-4">Popular Subjects</h3>
                        <div className="h-[300px] w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats?.popularSubjects || []}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="count"
                                    >
                                        {(stats?.popularSubjects || []).map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 space-y-2">
                            {(stats?.popularSubjects || []).slice(0, 4).map((sub: any, i: number) => (
                                <div key={i} className="flex justify-between text-xs">
                                    <span className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        <span className="text-muted-foreground">{sub.name}</span>
                                    </span>
                                    <span className="text-foreground font-bold">{sub.count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-card border-border border">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-foreground mb-4">Top Contributors</h3>
                        <div className="space-y-4">
                            {stats?.topContributors?.map((user: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xs">
                                            {user.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{user.email.split('@')[0]}</p>
                                            <p className="text-xs text-muted-foreground">Contributor</p>
                                        </div>
                                    </div>
                                    <span className="text-primary font-bold text-sm">{user._count.uploads} Resources</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

// --- Users View ---
const UsersView = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [expandedUser, setExpandedUser] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/admin/users').then(res => res.json()).then(data => setUsers(data.users || []));
    }, []);

    const filteredUsers = users.filter(u => u.email.includes(search) || (u.username && u.username.includes(search)));

    const handleAction = async (userId: string, action: string, value: any) => {
        const res = await fetch('/api/admin/users/update', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, action, value })
        });
        if (res.ok) {
            const data = await res.json();
            setUsers(users.map(u => u.id === userId ? { ...u, ...data.user } : u));
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search by username or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-3 text-foreground focus:border-primary outline-none"
                    />
                </div>
                <Button variant="outline" className="border-border text-muted-foreground">All Statuses</Button>
            </div>

            <div className="space-y-4">
                {filteredUsers.map(user => (
                    <div key={user.id} className="bg-card border border-border rounded-xl overflow-hidden">
                        <div
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center text-primary font-bold">
                                    {user.email[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">{user.username || user.email.split('@')[0]}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground uppercase">Role</p>
                                    <p className="text-sm text-foreground capitalize">{user.role.toLowerCase()}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground uppercase">Status</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${user.isBlocked ? 'bg-destructive/20 text-destructive' : 'bg-green-500/20 text-green-500'}`}>
                                        {user.isBlocked ? 'Blocked' : 'Active'}
                                    </span>
                                </div>
                                {expandedUser === user.id ? <ChevronUp size={20} className="text-muted-foreground" /> : <ChevronDown size={20} className="text-muted-foreground" />}
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedUser === user.id && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    className="overflow-hidden bg-muted/20"
                                >
                                    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 border-t border-border">
                                        <div>
                                            <h4 className="text-primary text-sm font-bold mb-4 flex items-center gap-2"><Users size={16} /> User Information</h4>
                                            <div className="space-y-2 text-sm">
                                                <p className="text-muted-foreground">Username: <span className="text-foreground">{user.username || 'N/A'}</span></p>
                                                <p className="text-muted-foreground">Email: <span className="text-foreground">{user.email}</span></p>
                                                <p className="text-muted-foreground">Pro Status: <span className={user.isPro ? 'text-primary' : 'text-muted-foreground'}>{user.isPro ? 'Pro Member' : 'Free Tier'}</span></p>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-green-500 text-sm font-bold mb-4 flex items-center gap-2"><LayoutDashboard size={16} /> Statistics</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-card p-3 rounded-lg border border-border">
                                                    <p className="text-xs text-muted-foreground">Uploads</p>
                                                    <p className="text-xl font-bold text-foreground">{user._count?.uploads || 0}</p>
                                                </div>
                                                <div className="bg-card p-3 rounded-lg border border-border">
                                                    <p className="text-xs text-muted-foreground">Reports</p>
                                                    <p className="text-xl font-bold text-foreground">{user._count?.reports || 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-purple-500 text-sm font-bold mb-4 flex items-center gap-2"><Settings size={16} /> Quick Actions</h4>
                                            <div className="space-y-2">
                                                <Button
                                                    className="w-full justify-start bg-destructive/10 text-destructive hover:bg-destructive/20"
                                                    onClick={() => handleAction(user.id, 'TOGGLE_BLOCK', !user.isBlocked)}
                                                >
                                                    {user.isBlocked ? 'Unblock User' : 'Block / Deactivate User'}
                                                </Button>
                                                <Button
                                                    className="w-full justify-start bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                                                    onClick={() => handleAction(user.id, 'UPDATE_ROLE', user.role === 'ADMIN' ? 'USER' : 'ADMIN')}
                                                >
                                                    {user.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
                                                </Button>
                                                <Button
                                                    className="w-full justify-start bg-primary/10 text-primary hover:bg-primary/20"
                                                    onClick={() => handleAction(user.id, 'TOGGLE_PRO', !user.isPro)}
                                                >
                                                    {user.isPro ? 'Revoke Pro Status' : 'Grant Pro Status'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Resources View ---
const ResourcesView = () => {
    const [resources, setResources] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [expandedRes, setExpandedRes] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/admin/resources').then(res => res.json()).then(data => setResources(data.resources || []));
    }, []);

    const filtered = resources.filter(r => r.title.toLowerCase().includes(search.toLowerCase()) || r.subject.toLowerCase().includes(search.toLowerCase()));

    const handleAction = async (resourceId: string, action: string) => {
        const res = await fetch('/api/admin/resources/update', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resourceId, action })
        });
        if (res.ok) {
            const data = await res.json();
            setResources(resources.map(r => r.id === resourceId ? { ...r, ...data.resource } : r));
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search by title, subject, or uploader..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-3 text-foreground focus:border-primary outline-none"
                    />
                </div>
                <Button variant="outline" className="border-border text-muted-foreground">All Subjects</Button>
                <Button variant="outline" className="border-border text-muted-foreground">All Statuses</Button>
            </div>

            <div className="space-y-4">
                {filtered.map(res => (
                    <div key={res.id} className="bg-card border border-border rounded-xl overflow-hidden">
                        <div
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setExpandedRes(expandedRes === res.id ? null : res.id)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">{res.title}</p>
                                    <p className="text-xs text-muted-foreground">{res.subject}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-10">
                                <div className="text-center w-20">
                                    <p className="text-xs text-muted-foreground uppercase">Downloads</p>
                                    <p className="text-sm text-foreground">{res.downloadsCount || 0}</p>
                                </div>
                                <div className="text-center w-24">
                                    <p className="text-xs text-muted-foreground uppercase">Visibility</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${res.status === 'PUBLIC' ? 'bg-blue-500/20 text-blue-400' : 'bg-destructive/20 text-destructive'}`}>
                                        {res.status}
                                    </span>
                                </div>
                                {expandedRes === res.id ? <ChevronUp size={20} className="text-muted-foreground" /> : <ChevronDown size={20} className="text-muted-foreground" />}
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedRes === res.id && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    className="overflow-hidden bg-muted/20"
                                >
                                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 border-t border-border">
                                        <div>
                                            <h4 className="text-blue-500 text-sm font-bold mb-4 flex items-center gap-2"><FileText size={16} /> Resource Information</h4>
                                            <div className="space-y-2 text-sm">
                                                <p className="text-muted-foreground">Title: <span className="text-foreground">{res.title}</span></p>
                                                <p className="text-muted-foreground">Subject: <span className="text-foreground">{res.subject}</span></p>
                                                <p className="text-muted-foreground">Uploader: <span className="text-foreground">{res.author?.email}</span></p>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-purple-500 text-sm font-bold mb-4 flex items-center gap-2"><Settings size={16} /> Quick Actions</h4>
                                            <div className="flex gap-4">
                                                <Button
                                                    className="flex-1 bg-primary/10 text-primary hover:bg-primary/20"
                                                    onClick={() => handleAction(res.id, res.status === 'public' ? 'MAKE_PRIVATE' : 'MAKE_PUBLIC')}
                                                >
                                                    {res.status === 'PUBLIC' ? 'Make Private' : 'Make Public'}
                                                </Button>
                                                <Button
                                                    className="flex-1 bg-destructive/10 text-destructive hover:bg-destructive/20"
                                                    onClick={() => handleAction(res.id, 'DELETE')}
                                                >
                                                    Delete Resource
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DashboardSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card border border-border p-6 rounded-xl h-32">
                    <div className="h-10 w-10 bg-muted/20 rounded-lg mb-3"></div>
                    <div className="h-8 w-24 bg-muted/20 rounded mb-2"></div>
                    <div className="h-4 w-32 bg-muted/20 rounded"></div>
                </div>
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card border border-border p-6 rounded-xl h-[350px]"></div>
            <div className="bg-card border border-border p-6 rounded-xl h-[350px]"></div>
        </div>
        <div className="bg-card border border-border p-6 rounded-xl h-64"></div>
    </div>
);

// --- Main Page Component ---
export default function AdminPage() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Authenticate & Fetch Initial Stats
        fetch('/api/admin/stats')
            .then(res => {
                if (res.status === 401) throw new Error('Unauthorized');
                return res.json();
            })
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(() => router.push('/'));
    }, []);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    };

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onLogout={handleLogout}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <main className="flex-1 w-full lg:ml-64 p-4 lg:p-8 transition-all duration-300">
                {/* Header */}
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden text-muted-foreground hover:text-foreground p-1"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <h1 className="text-2xl font-bold text-foreground capitalize">{activeTab}</h1>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto">
                    {loading ? (
                        <DashboardSkeleton />
                    ) : (
                        <>
                            {activeTab === 'dashboard' && <DashboardView stats={stats} />}
                            {activeTab === 'users' && <UsersView />}
                            {activeTab === 'resources' && <ResourcesView />}
                            {activeTab === 'settings' && <div className="text-muted-foreground text-center py-20">Settings coming soon...</div>}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
