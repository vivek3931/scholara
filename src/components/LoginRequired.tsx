'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export default function LoginRequired() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(true);

    const handleClose = () => {
        setIsOpen(false);
        router.push('/browse');
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Access Denied">
            <div className="flex flex-col gap-4">
                <p className="text-muted-foreground">You must be logged in to view this resource.</p>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={handleClose}>Cancel</Button>
                    <Button
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => router.push('/login')}
                    >
                        Login
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
