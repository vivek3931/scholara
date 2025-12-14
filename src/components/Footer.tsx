'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Twitter, Linkedin, Facebook, Github, Heart } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    const footerLinks = [
        {
            title: "Product",
            links: [
                { label: "Features", href: "/#features" },
                { label: "Pricing", href: "/pricing" },
                { label: "Resources", href: "/browse" },
                { label: "Upload", href: "/upload" },
            ]
        },
        {
            title: "Resources",
            links: [
                { label: "Blog", href: "/blog" },
                { label: "Community", href: "/community" },
                { label: "Help Center", href: "/help" },
                { label: "Guidelines", href: "/guidelines" },
            ]
        },
        {
            title: "Company",
            links: [
                { label: "About Us", href: "/about" },
                { label: "Careers", href: "/careers" },
                { label: "Contact", href: "/contact" },
                { label: "Partners", href: "/partners" },
            ]
        },
        {
            title: "Legal",
            links: [
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "Cookie Policy", href: "/cookies" },
                { label: "Security", href: "/security" },
            ]
        }
    ];

    return (
        <footer className="bg-muted/30 border-t border-border pt-16 pb-8">
            <div className="container max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
                    <div className="col-span-2 lg:col-span-2 space-y-4">
                        <Link href="/" className="inline-block">
                            <span className="text-2xl font-bold font-poppins text-foreground">
                                Scholara
                            </span>
                        </Link>
                        <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
                            Empowering students worldwide to share, discover, and excel.
                            The leading platform for academic resource exchange.
                        </p>
                        <div className="flex items-center gap-4 pt-4">
                            <Button variant="ghost" size="icon" className="hover:text-primary hover:bg-primary/10 rounded-full h-8 w-8">
                                <Twitter size={18} />
                            </Button>
                            <Button variant="ghost" size="icon" className="hover:text-primary hover:bg-primary/10 rounded-full h-8 w-8">
                                <Linkedin size={18} />
                            </Button>
                            <Button variant="ghost" size="icon" className="hover:text-primary hover:bg-primary/10 rounded-full h-8 w-8">
                                <Github size={18} />
                            </Button>
                        </div>
                    </div>

                    {footerLinks.map((section, idx) => (
                        <div key={idx} className="space-y-4">
                            <h4 className="font-semibold text-foreground text-sm uppercase tracking-wider">
                                {section.title}
                            </h4>
                            <ul className="space-y-2">
                                {section.links.map((link, linkIdx) => (
                                    <li key={linkIdx}>
                                        <Link
                                            href={link.href}
                                            className="text-muted-foreground hover:text-primary transition-colors text-sm"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="border-t border-border pt-8 mt-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
                    <p>© {currentYear} Scholara Inc. All rights reserved.</p>
                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                        <span>Made with</span>
                        <Heart size={14} className="text-red-500 fill-red-500" />
                        <span>for students.</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
