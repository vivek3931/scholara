'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/context/LanguageContext';

export default function LoginRequired() {
    const { t } = useLanguage();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(true);

    const handleClose = () => {
        setIsOpen(false);
        router.push('/browse');
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={t('ResourceCard.loginRequired')}>
            <div className="flex flex-col gap-4">
                <p className="text-muted-foreground">{t('ResourceCard.loginMessage')}</p>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={handleClose}>{t('Common.cancel')}</Button>
                    <Button
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => router.push('/login')}
                    >
                        {t('Navbar.login')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
