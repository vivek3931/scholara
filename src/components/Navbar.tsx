'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { useEffect, useState, useCallback, useRef } from 'react';
import UpgradeButton from '@/components/subscription/UpgradeButton';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, LogOut, Coins, Upload, Compass, Bookmark, Settings, Search, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);

    // Hide Navbar on Admin pages (Moved to bottom)
    // if (pathname?.startsWith('/admin')) return null;

    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Search State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDesktop, setIsDesktop] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 768);
        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Debounced Search
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!searchQuery.trim()) {
                setSuggestions([]);
                return;
            }

            setIsSearching(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data.resources || []);
                }
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 200); // 200ms for snappier response
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const router = useRouter();
    // const pathname = usePathname();

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
        const handleUserLogin = () => fetchUser();

        window.addEventListener('coinsUpdated', handleCoinsUpdate);
        window.addEventListener('userLoggedIn', handleUserLogin);

        return () => {
            window.removeEventListener('coinsUpdated', handleCoinsUpdate);
            window.removeEventListener('userLoggedIn', handleUserLogin);
        };
    }, [pathname]);

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



    // Hide Navbar on Admin pages
    if (pathname?.startsWith('/admin')) return null;

    return (
        <>
            <motion.nav
                className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 shadow-sm"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4 gap-4 relative">

                    {/* Left Side: Logo & Nav Links */}
                    <div className="flex items-center gap-6">
                        {/* Logo - Animate hide on Mobile when search opens */}
                        <AnimatePresence>
                            {(!isSearchOpen || isDesktop) && (
                                <motion.div
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: "auto" }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center gap-2 overflow-hidden"
                                >
                                    <Link href="/" className="z-50 flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
                                        <Image src="/logo.svg" alt="Scholara" width={120} height={40} className="h-8 w-auto" priority />
                                    </Link>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <Link key={link.href} href={link.href}>
                                    <Button
                                        variant={pathname === link.href ? "default" : "ghost"}
                                        className={`flex items-center gap-2 transition-all ${pathname === link.href
                                            ? 'bg-primary/10 text-primary border border-primary/20'
                                            : 'text-muted-foreground hover:text-primary hover:bg-accent'
                                            }`}
                                    >
                                        <link.icon size={18} />
                                        <span>{link.label}</span>
                                    </Button>
                                </Link>
                            ))}
                            {/* Admin Link */}
                            {user?.role === 'ADMIN' && (
                                <Link href="/admin">
                                    <Button
                                        variant={pathname === '/admin' ? "default" : "ghost"}
                                        className={`flex items-center gap-2 transition-all ${pathname === '/admin'
                                            ? 'bg-red-600/20 text-red-500 border border-red-500/30'
                                            : 'text-gray-300 hover:text-red-500 hover:bg-white/5'
                                            }`}
                                    >
                                        <Settings size={18} />
                                        <span>Admin</span>
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Center/Right: Expanding Search Bar */}
                    <motion.div
                        layout
                        className={`flex items-center ${isSearchOpen ? 'flex-1' : ''} justify-end md:justify-start md:mr-auto relative`}
                        ref={searchRef}
                    >
                        <motion.form
                            onSubmit={handleSearchSubmit}
                            layout
                            onClick={() => {
                                if (!isDesktop) setIsSearchOpen(true);
                            }}
                            initial={false}
                            animate={{
                                width: isSearchOpen || isDesktop ? (isDesktop ? 300 : "100%") : 40,
                                backgroundColor: isSearchOpen || isDesktop ? "var(--muted)" : "rgba(0,0,0,0)",
                                borderColor: isSearchOpen || isDesktop ? "var(--primary)" : "rgba(0,0,0,0)",
                            }}
                            className={`relative flex items-center overflow-hidden rounded-full border transition-colors ${isSearchOpen && !isDesktop ? 'absolute right-0 z-50' : ''
                                } ${!isSearchOpen && !isDesktop ? 'border-transparent hover:bg-muted cursor-pointer' : ''}`}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            <div className="flex items-center justify-center min-w-[40px] h-10 flex-shrink-0">
                                <Search size={20} className={(isSearchOpen || isDesktop) ? "text-primary" : "text-muted-foreground"} />
                            </div>

                            <AnimatePresence>
                                {(isSearchOpen || isDesktop) && (
                                    <motion.input
                                        ref={inputRef}
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: "100%" }}
                                        exit={{ opacity: 0, width: 0 }}
                                        transition={{ duration: 0.2 }}
                                        type="text"
                                        placeholder="Search resources..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-transparent border-none outline-none text-sm text-foreground placeholder-muted-foreground h-full flex-1 min-w-0 pr-10"
                                    />
                                )}
                            </AnimatePresence>

                            <AnimatePresence>
                                {(isSearchOpen || isDesktop) && (
                                    <motion.button
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        type={searchQuery ? "submit" : "button"}
                                        onClick={(e) => {
                                            if (!searchQuery) {
                                                e.stopPropagation();
                                                setIsSearchOpen(false);
                                            }
                                        }}
                                        className="absolute right-2 p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground flex-shrink-0"
                                    >
                                        {searchQuery ? <ArrowRight size={16} className="text-primary" /> : <X size={16} className="md:hidden" />}
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </motion.form>

                        {/* Suggestions Dropdown */}
                        <AnimatePresence>
                            {searchQuery && (isSearchOpen || isDesktop) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-12 left-0 right-0 bg-white/95 backdrop-blur-xl border border-border rounded-xl shadow-xl overflow-hidden z-50"
                                >
                                    <div className="p-2">
                                        {isSearching ? (
                                            <div className="px-4 py-3 text-muted-foreground text-sm flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                                                Searching...
                                            </div>
                                        ) : (
                                            <>
                                                {suggestions.length > 0 ? (
                                                    suggestions.map((resource: any) => (
                                                        <div
                                                            key={resource.id}
                                                            onClick={() => {
                                                                router.push(`/resource/${resource.id}`);
                                                                setSearchQuery('');
                                                                setIsSearchOpen(false);
                                                            }}
                                                            className="px-4 py-2 hover:bg-muted rounded-lg cursor-pointer text-muted-foreground hover:text-foreground text-sm group"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Search size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                                                <span className="font-medium truncate">{resource.title}</span>
                                                            </div>
                                                            <div className="ml-6 text-xs text-muted-foreground truncate">{resource.subject} • {new Date(resource.createdAt).toLocaleDateString()}</div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-2 text-muted-foreground text-sm italic">
                                                        No resources found
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Right Side: User Actions (Hidden on Mobile if search is open) */}
                    <div className={`hidden md:flex items-center gap-3 flex-shrink-0`}>
                        {isLoading ? (
                            <div className="h-8 w-8 rounded-full bg-gray-700 animate-pulse" />
                        ) : user ? (
                            <>
                                {/* Coins */}
                                <motion.div
                                    className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-primary/5 px-3 py-1.5 rounded-full border border-primary/30 hover:border-primary/50 transition-all cursor-default"
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <Coins size={16} className="text-primary" />
                                    <span className="text-primary font-bold text-sm">{user.coins}</span>
                                    <span className="text-xs text-primary/70">SC</span>
                                </motion.div>

                                {/* Upgrade Button */}
                                <UpgradeButton isPro={user.isPro} />

                                {/* Upload */}
                                <Link href="/upload">
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button className="flex items-center gap-2 bg-gradient-to-r from-primary/80 to-primary hover:from-primary hover:to-primary/90 text-primary-foreground">
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
                                        className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg hover:shadow-primary/50"
                                    >
                                        {user.email[0].toUpperCase()}
                                    </motion.button>

                                    <AnimatePresence>
                                        {isProfileOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                className="absolute right-0 top-12 w-56 bg-white border border-border rounded-lg shadow-xl z-50 overflow-hidden"
                                            >
                                                <div className="px-4 py-3 border-b border-border bg-muted/20">
                                                    <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">Account</p>
                                                </div>
                                                <div className="px-4 py-2">
                                                    <Link href="/settings" onClick={() => setIsProfileOpen(false)}>
                                                        <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors text-sm">
                                                            <Settings size={16} /> <span>Settings</span>
                                                        </div>
                                                    </Link>
                                                </div>
                                                <div className="border-t border-white/10" />
                                                <div className="px-4 py-2 ">
                                                    <button onClick={handleLogout} className="w-full cursor-pointer hover:text-white hover:bg-red-500 flex items-center justify-center gap-2 px-3 py-2 bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 text-destructive rounded-lg text-sm transition-all">
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
                                <Button className="bg-gradient-to-r from-primary/80 to-primary hover:from-primary hover:to-primary/90 text-primary-foreground">Login</Button>
                            </Link>
                        )}
                    </div>

                    {/* Mobile Hamburger (Hidden if search is open on mobile) */}
                    {!isSearchOpen && (
                        <motion.button
                            onClick={() => setIsOpen(!isOpen)}
                            className="md:hidden relative w-10 h-10 flex justify-center items-center z-50 text-primary"
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
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
                            className="fixed inset-y-0 right-0 w-80 bg-background/95 backdrop-blur-xl z-50 md:hidden shadow-2xl border-l border-border"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-border">
                                <h2 className="text-lg font-bold text-primary">Menu</h2>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-muted rounded-lg transition-colors"><X size={20} className="text-muted-foreground" /></button>
                            </div>

                            {/* Staggered Content */}
                            <motion.div
                                className="flex flex-col p-4 space-y-2"
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    hidden: { opacity: 0 },
                                    visible: {
                                        opacity: 1,
                                        transition: {
                                            staggerChildren: 0.05,
                                            delayChildren: 0.1
                                        }
                                    }
                                }}
                            >
                                {navLinks.map((link) => (
                                    <motion.div key={link.href} variants={{
                                        hidden: { x: 20, opacity: 0 },
                                        visible: { x: 0, opacity: 1 }
                                    }}>
                                        <Link href={link.href} onClick={() => setIsOpen(false)}>
                                            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${pathname === link.href ? 'bg-primary/10 text-primary border border-primary/30' : 'text-muted-foreground hover:bg-muted'}`}>
                                                <link.icon size={20} /> <span className="font-medium">{link.label}</span>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}

                                {/* Mobile User Section */}
                                <motion.div
                                    className="border-t border-border my-4 pt-4 space-y-4"
                                    variants={{
                                        hidden: { opacity: 0 },
                                        visible: { opacity: 1 }
                                    }}
                                >
                                    {user ? (
                                        <>
                                            <motion.div
                                                className="flex items-center gap-3 px-4 py-3 bg-muted/20 rounded-lg border border-border"
                                                variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
                                            >
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold">
                                                    {user.email[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">{user.email}</p>
                                                    <p className="text-xs text-primary font-bold">{user.coins} SC</p>
                                                </div>
                                            </motion.div>

                                            <motion.div variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
                                                <Link href="/upload" onClick={() => setIsOpen(false)}>
                                                    <Button className="w-full flex gap-2 bg-gradient-to-r from-primary/80 to-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 transition-all"><Upload size={18} /> Upload Resource</Button>
                                                </Link>
                                            </motion.div>

                                            <motion.div variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
                                                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"><LogOut size={18} /> Logout</button>
                                            </motion.div>
                                        </>
                                    ) : (
                                        <motion.div variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
                                            <Link href="/login" onClick={() => setIsOpen(false)}>
                                                <Button className="w-full bg-gradient-to-r from-primary/80 to-primary text-primary-foreground shadow-md">Login</Button>
                                            </Link>
                                        </motion.div>
                                    )}
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}