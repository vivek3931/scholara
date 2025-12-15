'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);

    const languages = [
        { code: 'en', label: 'English', flag: '🇬🇧' },
        { code: 'hi', label: 'हिंदी', flag: '🇮🇳' }
    ];

    const changeLanguage = (nextLocale: string) => {
        setLanguage(nextLocale as 'en' | 'hi');
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-muted/50 transition-colors text-sm font-medium"
            >
                <Globe size={18} className="text-muted-foreground" />
                <span className="uppercase">{language}</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-40 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50"
                    >
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => changeLanguage(lang.code)}
                                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors ${language === lang.code ? 'text-primary font-semibold bg-primary/5' : 'text-foreground'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="text-base">{lang.flag}</span>
                                    {lang.label}
                                </span>
                                {language === lang.code && <Check size={14} />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
