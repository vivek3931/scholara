'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Twitter, Linkedin, Facebook, Github, Heart } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
    const { t } = useLanguage();
    const currentYear = new Date().getFullYear();

    const footerLinks = [
        {
            title: t('Footer.product'),
            links: [
                { label: t('Footer.features'), href: "/#features" },
                { label: t('Footer.pricing'), href: "/pricing" },
                { label: t('Footer.resources'), href: "/browse" },
                { label: t('Footer.upload'), href: "/upload" },
            ]
        },
        {
            title: t('Footer.resources'), // "Resources" is used for both title section and link label elsewhere, ensuring consistent keys or context if needed.
            links: [
                { label: t('Footer.blog'), href: "/blog" },
                { label: t('Footer.community'), href: "/community" },
                { label: t('Footer.helpCenter'), href: "/help" },
                { label: t('Footer.guidelines'), href: "/guidelines" },
            ]
        },
        {
            title: t('Footer.company'),
            links: [
                { label: t('Footer.aboutUs'), href: "/about" },
                { label: t('Footer.careers'), href: "/careers" },
                { label: t('Footer.contact'), href: "/contact" },
                { label: t('Footer.partners'), href: "/partners" },
            ]
        },
        {
            title: t('Footer.legal'),
            links: [
                { label: t('Footer.privacy'), href: "/privacy" },
                { label: t('Footer.terms'), href: "/terms" },
                { label: t('Footer.cookiePolicy'), href: "/cookies" },
                { label: t('Footer.security'), href: "/security" },
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
                                {t('Navbar.title')}
                            </span>
                        </Link>
                        <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
                            {t('Footer.description')}
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
                    <p>© {currentYear} Scholara Inc. {t('Footer.allRightsReserved')}</p>
                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                        <span>{t('Footer.madeWith')}</span>
                        <Heart size={14} className="text-red-500 fill-red-500" />
                        <span>{t('Footer.forStudents')}</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
