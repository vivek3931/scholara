'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, LogOut, Coins, Upload, Compass, Bookmark, Settings, Search, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const [user, setUser] = useState<any>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    // Search State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const router = useRouter();
    const pathname = usePathname();

    // --- Authentication & Data Fetching ---
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/me', { credentials: 'include' });
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
        const handleCoinsUpdate = () => fetchUser();
        window.addEventListener('coinsUpdated', handleCoinsUpdate);
        return () => window.removeEventListener('coinsUpdated', handleCoinsUpdate);
    }, []);

    // --- Event Listeners ---
    
    // Close search when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                if (searchQuery === '') {
                    setIsSearchOpen(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [searchQuery]);

    // Focus input when search opens
    useEffect(() => {
        if (isSearchOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isSearchOpen]);

    // Handle logout
    const handleLogout = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            setUser(null);
            setIsOpen(false);
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }, [router]);

    // Handle Search Submit
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            console.log("Searching for:", searchQuery);
            // router.push(`/browse?q=${searchQuery}`); // Example implementation
            setIsSearchOpen(false);
        }
    };

    const navLinks = [
        { href: '/browse', label: 'Browse', icon: Compass },
        { href: '/saved', label: 'Saved', icon: Bookmark },
    ];

    return (
        <>
            <motion.nav
                className="border-b border-white/10 bg-onyx/80 backdrop-blur-md sticky top-0 z-50 shadow-lg"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4 gap-4 relative">
                    
                    {/* Left Side: Logo & Nav Links */}
                    <div className={`flex items-center gap-6 ${isSearchOpen ? 'hidden md:flex' : 'flex'}`}>
                        {/* Logo */}
                        <Link href="/" className="z-50 flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
                            <Image src="/logo.svg" alt="Scholara" width={120} height={40} className="h-8 w-auto" priority />
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
                    </div>

                    {/* Center/Right: Expanding Search Bar */}
                    <div 
                        className={`flex items-center ${isSearchOpen ? 'flex-1 md:flex-none' : ''} justify-end md:justify-start md:mr-auto`}
                        ref={searchRef}
                    >
                        <motion.form
                            onSubmit={handleSearchSubmit}
                            layout
                            onClick={() => setIsSearchOpen(true)}
                            className={`relative flex items-center overflow-hidden rounded-full border transition-colors ${
                                isSearchOpen 
                                    ? 'border-amber-500/50 bg-black/40 shadow-[0_0_15px_rgba(245,158,11,0.1)] w-full md:w-[300px]' 
                                    : 'border-transparent hover:bg-white/5 w-10 cursor-pointer'
                            }`}
                            initial={false}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            <div className="flex items-center justify-center min-w-[40px] h-10 flex-shrink-0">
                                <Search size={20} className={isSearchOpen ? "text-amber-500" : "text-gray-400"} />
                            </div>
                            
                            <AnimatePresence>
                                {isSearchOpen && (
                                    <motion.input
                                        ref={inputRef}
                                        layout
                                        initial={{ opacity: 0, width: 0, x: 0 }}
                                        animate={{ opacity: 1, width: "100%", x: 0 }}
                                        exit={{ opacity: 0, width: 0, x: 0 }}
                                        transition={{ duration: 0.25, ease: "easeOut" }}
                                        type="text"
                                        placeholder="Search resources..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 h-full flex-1 min-w-0 pr-10"
                                    />
                                )}
                            </AnimatePresence>

                            <AnimatePresence>
                                {isSearchOpen && (
                                    <motion.button
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        transition={{ duration: 0.15, ease: "easeOut" }}
                                        type={searchQuery ? "submit" : "button"}
                                        onClick={(e) => {
                                            if (!searchQuery) {
                                                e.stopPropagation();
                                                setIsSearchOpen(false);
                                            }
                                        }}
                                        className="absolute right-2 p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white flex-shrink-0"
                                    >
                                        {searchQuery ? <ArrowRight size={16} className="text-amber-500"/> : <X size={16} />}
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </motion.form>
                    </div>

                    {/* Right Side: User Actions (Hidden on Mobile if search is open) */}
                    <div className={`hidden md:flex items-center gap-3 flex-shrink-0`}>
                        {isLoading ? (
                            <div className="h-8 w-8 rounded-full bg-gray-700 animate-pulse" />
                        ) : user ? (
                            <>
                                {/* Coins */}
                                <motion.div
                                    className="flex items-center gap-2 bg-gradient-to-r from-amber-900/20 to-amber-800/20 px-3 py-1.5 rounded-full border border-amber-500/30 hover:border-amber-500/50 transition-all cursor-default"
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <Coins size={16} className="text-amber-500" />
                                    <span className="text-amber-500 font-bold text-sm">{user.coins}</span>
                                    <span className="text-xs text-amber-500/70">SC</span>
                                </motion.div>

                                {/* Upload */}
                                <Link href="/upload">
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-onyx">
                                            <Upload size={18} />
                                            <span className="hidden lg:inline">Upload</span>
                                        </Button>
                                    </motion.div>
                                </Link>

                                {/* Profile Dropdown */}
                                <div className="relative">
                                    <motion.button
                                        onClick={(e) => { e.stopPropagation(); setIsProfileOpen(!isProfileOpen); }}
                                        whileHover={{ scale: 1.08 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-onyx font-bold text-sm shadow-lg hover:shadow-amber-500/50"
                                    >
                                        {user.email[0].toUpperCase()}
                                    </motion.button>

                                    <AnimatePresence>
                                        {isProfileOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                className="absolute right-0 top-12 w-56 bg-gradient-to-b from-onyx to-gray-950 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden"
                                            >
                                                <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                                                    <p className="text-sm font-medium text-gray-300 truncate">{user.email}</p>
                                                    <p className="text-xs text-gray-500 mt-1">Account</p>
                                                </div>
                                                <div className="px-4 py-2">
                                                    <Link href="/settings" onClick={() => setIsProfileOpen(false)}>
                                                        <div className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors text-sm">
                                                            <Settings size={16} /> <span>Settings</span>
                                                        </div>
                                                    </Link>
                                                </div>
                                                <div className="border-t border-white/10" />
                                                <div className="px-4 py-2">
                                                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-900/20 hover:bg-red-900/30 border border-red-500/30 text-red-400 rounded-lg text-sm transition-all">
                                                        <LogOut size={16} /> Logout
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </>
                        ) : (
                            <Link href="/login">
                                <Button className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-onyx">Login</Button>
                            </Link>
                        )}
                    </div>

                    {/* Mobile Hamburger (Hidden if search is open on mobile) */}
                    {!isSearchOpen && (
                        <motion.button
                            onClick={() => setIsOpen(!isOpen)}
                            className="md:hidden relative w-10 h-10 flex justify-center items-center z-50 text-amber-500"
                            whileTap={{ scale: 0.95 }}
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </motion.button>
                    )}
                </div>
            </motion.nav>

            {/* Mobile Menu Drawer (Existing Code Logic) */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-40 md:hidden"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ x: 320 }}
                            animate={{ x: 0 }}
                            exit={{ x: 320 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 w-80 bg-gradient-to-b from-onyx to-gray-950 backdrop-blur-xl z-50 md:hidden shadow-2xl"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-white/10">
                                <h2 className="text-lg font-bold text-amber-500">Menu</h2>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg"><X size={20} className="text-gray-400" /></button>
                            </div>
                            <div className="flex flex-col p-4 space-y-2">
                                {navLinks.map((link) => (
                                    <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}>
                                        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${pathname === link.href ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30' : 'text-gray-300 hover:bg-white/5'}`}>
                                            <link.icon size={20} /> <span className="font-medium">{link.label}</span>
                                        </div>
                                    </Link>
                                ))}
                                
                                {/* Mobile User Section */}
                                <div className="border-t border-white/10 my-4 pt-4 space-y-4">
                                    {user ? (
                                        <>
                                            <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-lg border border-white/10">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-onyx font-bold">
                                                    {user.email[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-300">{user.email}</p>
                                                    <p className="text-xs text-amber-500 font-bold">{user.coins} SC</p>
                                                </div>
                                            </div>
                                            <Link href="/upload" onClick={() => setIsOpen(false)}>
                                                <Button className="w-full flex gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-onyx"><Upload size={18} /> Upload Resource</Button>
                                            </Link>
                                            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg"><LogOut size={18} /> Logout</button>
                                        </>
                                    ) : (
                                        <Link href="/login" onClick={() => setIsOpen(false)}>
                                            <Button className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-onyx">Login</Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}