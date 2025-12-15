'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from '../../messages/en.json';
import hi from '../../messages/hi.json';

type Locale = 'en' | 'hi';
type Messages = typeof en;

interface LanguageContextType {
    language: Locale;
    setLanguage: (lang: Locale) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Locale>('en');
    const [messages, setMessages] = useState<Messages>(en);

    useEffect(() => {
        // Load saved language from local storage if available
        const savedLang = localStorage.getItem('language') as Locale;
        if (savedLang && (savedLang === 'en' || savedLang === 'hi')) {
            setLanguage(savedLang);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('language', language);
        setMessages(language === 'en' ? en : hi);
    }, [language]);

    // Nested key accessor function, e.g. t('Navbar.home')
    const t = (key: string): string => {
        const keys = key.split('.');
        let value: any = messages;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k as keyof typeof value];
            } else {
                return key; // Fallback to key if not found
            }
        }

        return typeof value === 'string' ? value : key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
