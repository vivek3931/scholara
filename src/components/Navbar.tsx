'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, LogOut, Coins, Upload, Home, Users, Compass, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const [user, setUser] = useState<any>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // Fetch user data on mount and update on coin change event
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/me', {
                    credentials: 'include',
                });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user || null);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Failed to fetch user:', error);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();

        // Listen for coin updates
        const handleCoinsUpdate = () => fetchUser();
        window.addEventListener('coinsUpdated', handleCoinsUpdate);

        return () => {
            window.removeEventListener('coinsUpdated', handleCoinsUpdate);
        };
    }, []);

    // Handle logout
    const handleLogout = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
            setUser(null);
            setIsOpen(false);
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }, [router]);

    // Toggle menu and lock scroll
    const toggleMenu = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    // Lock body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Close menu when route changes
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    const navLinks = [
        { href: '/', label: 'Home', icon: Home },
        { href: '/browse', label: 'Browse', icon: Compass },
        { href: '/saved', label: 'Saved', icon: Bookmark },
        { href: '/community', label: 'Community', icon: Users },
    ];

    return (
        <>
            {/* Main Navbar */}
            <motion.nav
                className="border-b border-white/10 bg-onyx/80 backdrop-blur-md sticky top-0 z-50 shadow-lg"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    {/* Logo */}
                    <Link href="/" className="z-50 flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <Image
                            src="/logo.svg"
                            alt="Scholara"
                            width={120}
                            height={40}
                            className="h-8 w-auto"
                            priority
                        />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link key={link.href} href={link.href}>
                                <Button
                                    variant={pathname === link.href ? "default" : "ghost"}
                                    className={`flex items-center gap-2 transition-all ${pathname === link.href
                                            ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                                            : 'text-gray-300 hover:text-amber-400 hover:bg-white/5'
                                        }`}
                                >
                                    <link.icon size={18} />
                                    <span>{link.label}</span>
                                </Button>
                            </Link>
                        ))}
                    </div>

                    {/* Right Section - Desktop */}
                    <div className="hidden md:flex items-center gap-3">
                        {isLoading ? (
                            <div className="h-8 w-8 rounded-full bg-gray-700 animate-pulse" />
                        ) : user ? (
                            <>
                                {/* Coins Display */}
                                <motion.div
                                    className="flex items-center gap-2 bg-gradient-to-r from-amber-900/20 to-amber-800/20 px-3 py-1.5 rounded-full border border-amber-500/30 hover:border-amber-500/50 transition-all"
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <Coins size={16} className="text-amber-500" />
                                    <span className="text-amber-500 font-bold text-sm">{user.coins}</span>
                                    <span className="text-xs text-amber-500/70">SC</span>
                                </motion.div>

                                {/* Upload Button */}
                                <Link href="/upload">
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600">
                                            <Upload size={18} />
                                            <span>Upload</span>
                                        </Button>
                                    </motion.div>
                                </Link>

                                {/* User Avatar & Profile Dropdown */}
                                <div className="relative">
                                    <motion.button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsProfileOpen(!isProfileOpen);
                                        }}
                                        whileHover={{ scale: 1.08 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-onyx font-bold text-sm shadow-lg hover:shadow-amber-500/50 transition-shadow"
                                        title={user.email}
                                    >
                                        {user.email[0].toUpperCase()}
                                    </motion.button>

                                    {/* Dropdown Menu */}
                                    <AnimatePresence>
                                        {isProfileOpen && (
                                            <motion.div
                                                key="profile-dropdown"
                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                transition={{ duration: 0.15 }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="absolute right-0 top-12 w-56 bg-gradient-to-b from-onyx to-gray-950 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden"
                                            >
                                                {/* User Info */}
                                                <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                                                    <p className="text-sm font-medium text-gray-300">{user.email}</p>
                                                    <p className="text-xs text-gray-500 mt-1">Account</p>
                                                </div>

                                                {/* Coins Display */}
                                                <div className="px-4 py-3 border-b border-white/10">
                                                    <div className="flex items-center gap-2 bg-gradient-to-r from-amber-900/20 to-amber-800/20 px-3 py-2 rounded-lg border border-amber-500/30">
                                                        <Coins size={16} className="text-amber-500" />
                                                        <div>
                                                            <p className="text-xs text-gray-400">Balance</p>
                                                            <p className="text-sm font-bold text-amber-500">{user.coins} SC</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Upload Button */}
                                                <div className="px-4 py-2">
                                                    <Link href="/upload" onClick={() => setIsProfileOpen(false)}>
                                                        <Button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-sm">
                                                            <Upload size={16} />
                                                            Upload
                                                        </Button>
                                                    </Link>
                                                </div>

                                                {/* Divider */}
                                                <div className="border-t border-white/10" />

                                                {/* Logout Button */}
                                                <div className="px-4 py-2">
                                                    <button
                                                        onClick={() => {
                                                            handleLogout();
                                                            setIsProfileOpen(false);
                                                        }}
                                                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-900/20 hover:bg-red-900/30 border border-red-500/30 text-red-400 hover:text-red-300 rounded-lg transition-all font-medium text-sm"
                                                    >
                                                        <LogOut size={16} />
                                                        Logout
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </>
                        ) : (
                            <Link href="/login">
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600">
                                        Login
                                    </Button>
                                </motion.div>
                            </Link>
                        )}
                    </div>

                    {/* Mobile Hamburger Button */}
                    <motion.button
                        onClick={toggleMenu}
                        className="md:hidden relative w-10 h-10 flex flex-col justify-center items-center focus:outline-none z-50"
                        aria-label="Toggle menu"
                        whileTap={{ scale: 0.95 }}
                    >
                        <AnimatePresence mode="wait">
                            {isOpen ? (
                                <motion.div
                                    key="close"
                                    initial={{ rotate: -90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: 90, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <X size={24} className="text-amber-500" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="menu"
                                    initial={{ rotate: 90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: -90, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Menu size={24} className="text-amber-500" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </div>
            </motion.nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Mobile Menu Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="drawer"
                        initial={{ x: 320, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 320, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="fixed inset-y-0 right-0 w-80 bg-gradient-to-b from-onyx to-gray-950 backdrop-blur-xl z-50 md:hidden shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h2 className="text-lg font-bold text-amber-500">Menu</h2>
                            <motion.button
                                onClick={() => setIsOpen(false)}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-gray-400" />
                            </motion.button>
                        </div>

                        {/* Content */}
                        <div className="flex flex-col h-[calc(100%-60px)]">
                            {/* Navigation Links */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {navLinks.map((link, index) => (
                                    <motion.div
                                        key={link.href}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Link href={link.href} onClick={() => setIsOpen(false)}>
                                            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${pathname === link.href
                                                    ? 'bg-amber-600/20 border border-amber-500/30 text-amber-400'
                                                    : 'text-gray-300 hover:text-amber-400 hover:bg-white/5'
                                                }`}>
                                                <link.icon size={20} />
                                                <span className="font-medium">{link.label}</span>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Divider */}
                            <div className="border-t border-white/10" />

                            {/* User Section */}
                            <div className="p-4 space-y-3">
                                {isLoading ? (
                                    <div className="h-12 bg-gray-700 rounded-lg animate-pulse" />
                                ) : user ? (
                                    <>
                                        {/* Coins Display */}
                                        <motion.div
                                            className="flex items-center gap-2 bg-gradient-to-r from-amber-900/20 to-amber-800/20 px-4 py-2.5 rounded-lg border border-amber-500/30"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            <Coins size={18} className="text-amber-500" />
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-400">Balance</p>
                                                <p className="text-lg font-bold text-amber-500">{user.coins} SC</p>
                                            </div>
                                        </motion.div>

                                        {/* User Info */}
                                        <motion.div
                                            className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-lg border border-white/10"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.15 }}
                                        >
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-onyx font-bold">
                                                {user.email[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-300 truncate">{user.email}</p>
                                                <p className="text-xs text-gray-500">Account</p>
                                            </div>
                                        </motion.div>

                                        {/* Upload Button */}
                                        <Link href="/upload" onClick={() => setIsOpen(false)}>
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="w-full"
                                            >
                                                <Button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600">
                                                    <Upload size={18} />
                                                    <span>Upload Resource</span>
                                                </Button>
                                            </motion.div>
                                        </Link>

                                        {/* Logout Button */}
                                        <motion.button
                                            onClick={handleLogout}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.25 }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-900/20 hover:bg-red-900/30 border border-red-500/30 text-red-400 hover:text-red-300 rounded-lg transition-all font-medium"
                                        >
                                            <LogOut size={18} />
                                            <span>Logout</span>
                                        </motion.button>
                                    </>
                                ) : (
                                    <Link href="/login" onClick={() => setIsOpen(false)}>
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full"
                                        >
                                            <Button className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600">
                                                Login
                                            </Button>
                                        </motion.div>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}