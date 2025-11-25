'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Navbar from '@/components/Navbar';
import io from 'socket.io-client';
import { Modal } from '@/components/ui/Modal';

let socket: any;

export default function AdminPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const router = useRouter();

    const showModal = (message: string) => {
        setModalMessage(message);
        setModalOpen(true);
    };

    useEffect(() => {
        // Check auth and role
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (!data.user || data.user.role !== 'ADMIN') {
                    // For demo purposes, if no admin exists, maybe allow access or redirect.
                    // I'll redirect to home.
                    router.push('/');
                } else {
                    setLoading(false);
                    initSocket();
                }
            })
            .catch(() => router.push('/'));

        return () => {
            if (socket) socket.disconnect();
        };
    }, []);

    const initSocket = () => {
        socket = io();
        socket.emit('join_admin');
        socket.on('new_report', (report: any) => {
            setReports(prev => [report, ...prev]);
            showModal(`New Report: ${report.reason}`);
        });
    };

    if (loading) return <div className="text-white p-10">Loading Admin...</div>;

    return (
        <div className="min-h-screen bg-onyx text-white">
            <Navbar />
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Admin Notification">
                <p>{modalMessage}</p>
            </Modal>
            <div className="container mx-auto py-10 px-4">
                <h1 className="text-3xl font-bold text-amber-500 mb-8">Admin Dashboard</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="bg-onyx border-red-500/20">
                        <CardHeader>
                            <CardTitle className="text-red-500">Recent Reports (Real-time)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {reports.length === 0 ? (
                                <p className="text-gray-500">No new reports.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {reports.map((r, i) => (
                                        <li key={i} className="bg-red-900/20 p-2 rounded border border-red-500/20">
                                            {r.reason} (Resource: {r.resourceId})
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-onyx border-amber-500/20">
                        <CardHeader>
                            <CardTitle className="text-amber-500">User Management</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-400">User list would appear here.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
