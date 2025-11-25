'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const router = useRouter();

    const showModal = (message: string) => {
        setModalMessage(message);
        setModalOpen(true);
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (res.ok) {
                setStep('otp');
            } else {
                showModal('Failed to send OTP');
            }
        } catch (error) {
            console.error(error);
            showModal('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });
            if (res.ok) {
                router.push('/');
            } else {
                showModal('Invalid OTP');
            }
        } catch (error) {
            console.error(error);
            showModal('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-onyx p-4">
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Notification">
                <p>{modalMessage}</p>
            </Modal>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="w-[350px] border-amber-500/20 bg-onyx/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-amber-500">Scholara Collective</CardTitle>
                        <CardDescription>Academic Resource Hub</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {step === 'email' ? (
                            <form onSubmit={handleSendOtp} className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium text-white">Email</label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="student@university.edu"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Sending...' : 'Send OTP'}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp} className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="otp" className="text-sm font-medium text-white">Enter OTP</label>
                                    <Input
                                        id="otp"
                                        type="text"
                                        placeholder="123456"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Verifying...' : 'Verify & Login'}
                                </Button>
                                <Button variant="ghost" className="w-full text-xs" onClick={() => setStep('email')}>
                                    Back to Email
                                </Button>
                            </form>
                        )}
                    </CardContent>
                    <CardFooter className="justify-center">
                        <p className="text-xs text-gray-500">
                            By continuing, you agree to our Terms of Service.
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}
