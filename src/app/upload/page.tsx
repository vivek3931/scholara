'use client';

import { useState, useEffect, useCallback } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Upload, FileText, BookOpen, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UploadPage() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [subject, setSubject] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [fileName, setFileName] = useState('');
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalType, setModalType] = useState<'success' | 'error' | 'info'>('info');
    const router = useRouter();

    useEffect(() => {
        const loadSubjects = async () => {
            try {
                const res = await fetch('https://vivek3931.github.io/subjects-api/subjects.json');
                const data = await res.json();
                setSubjects(data.subjects || []);
            } catch (err) {
                console.error('Failed to load subjects:', err);
            }
        };

        loadSubjects();
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/me', {
                credentials: 'include',
            });
            setIsLoggedIn(res.ok);
            if (!res.ok) {
                router.push('/login');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            router.push('/login');
        }
    };

    const showModal = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setModalMessage(message);
        setModalType(type);
        setModalOpen(true);
    }, []);

    const handleUploadSuccess = async (result: any) => {
        const url = result.info.secure_url;
        const filename = result.info.original_filename || 'file.pdf';

        setFileUrl(url);
        setFileName(filename);
        setUploading(false);

        showModal(`✓ File "${filename}" uploaded successfully!`, 'success');
    };

    const handleUploadError = (error: any) => {
        console.error('Cloudinary upload error:', error);
        setUploading(false);
        showModal(`Upload failed: ${error.message || 'Unknown error'}`, 'error');
    };

    // Auto-submit when file is uploaded and all fields are filled
    useEffect(() => {
        if (fileUrl && title.trim() && description.trim() && subject && !loading) {
            // Don't auto-submit, wait for user to click Publish
            // This gives them control over the final submission
        }
    }, [fileUrl, title, description, subject, loading]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!title.trim()) {
            showModal('Title is required', 'error');
            return;
        }
        if (!description.trim()) {
            showModal('Description is required', 'error');
            return;
        }
        if (!subject) {
            showModal('Please select a subject', 'error');
            return;
        }
        if (!fileUrl) {
            showModal('Please upload a file', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/resources', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    subject,
                    fileUrl
                }),
                credentials: 'include',
            });

            const data = await res.json();

            if (res.ok) {
                showModal('🎉 Resource published successfully! +50 Coins awarded.', 'success');

                // Reset form
                setTitle('');
                setDescription('');
                setSubject('');
                setFileUrl('');
                setFileName('');

                // Redirect after 2 seconds
                setTimeout(() => router.push('/'), 2000);
            } else {
                showModal(data.error || 'Upload failed', 'error');
            }
        } catch (error) {
            console.error('Network error:', error);
            showModal('Network error. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-onyx via-onyx to-gray-900 text-white flex items-center justify-center">
                <motion.div
                    className="text-center"
                    animate={{ opacity: 1, y: 0 }}
                    initial={{ opacity: 0, y: 10 }}
                >
                    <Loader2 className="w-12 h-12 text-amber-500 mx-auto animate-spin mb-4" />
                    <p className="text-gray-400">Loading...</p>
                </motion.div>
            </div>
        );
    }

    const isFormComplete = title.trim() && description.trim() && subject && fileUrl;

    return (
        <div className="min-h-screen bg-gradient-to-br from-onyx via-onyx to-gray-900 text-white pb-12">
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalType === 'success' ? 'Success' : modalType === 'error' ? 'Error' : 'Info'}
            >
                <div className="flex items-start gap-3">
                    {modalType === 'success' && <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />}
                    {modalType === 'error' && <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
                    <p className="text-sm text-gray-300">{modalMessage}</p>
                </div>
            </Modal>

            <div className="container mx-auto py-12 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-2xl mx-auto"
                >
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <BookOpen className="w-8 h-8 text-amber-500" />
                            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                                Share Knowledge
                            </h1>
                        </div>
                        <p className="text-gray-400">Upload educational resources and earn coins</p>
                    </div>

                    <Card className="border-amber-500/20 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm shadow-2xl">
                        <CardHeader className="border-b border-white/10">
                            <CardTitle className="text-amber-500 flex items-center gap-2">
                                <Upload className="w-5 h-5" />
                                Upload Resource
                            </CardTitle>
                            <p className="text-xs text-gray-500 mt-2">Fill in the details and upload your PDF</p>
                        </CardHeader>

                        <CardContent className="pt-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Title Input */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                                        Title <span className="text-red-400">*</span>
                                    </label>
                                    <Input
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        required
                                        placeholder="e.g., Advanced Calculus Chapter 5"
                                        disabled={loading || uploading}
                                        className="bg-white/5 border-white/20 focus:border-amber-500 focus:ring-amber-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
                                </motion.div>

                                {/* Description Input */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                >
                                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                                        Description <span className="text-red-400">*</span>
                                    </label>
                                    <textarea
                                        className="flex w-full rounded-lg border border-white/20 bg-white/5 backdrop-blur px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-gray-500 disabled:opacity-50 transition-all"
                                        rows={4}
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        required
                                        placeholder="Describe what this resource covers..."
                                        disabled={loading || uploading}
                                        maxLength={500}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{description.length}/500 characters</p>
                                </motion.div>

                                {/* Subject Select */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                                        Subject <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        className="flex w-full rounded-lg border border-white/20 bg-white/5 backdrop-blur px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 transition-all"
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                        required
                                        disabled={loading || uploading}
                                    >
                                        <option value="" className="bg-gray-900">Select a subject</option>
                                        {subjects.map((s, i) => (
                                            <option key={i} value={s.value} className="bg-gray-900">{s.label}</option>
                                        ))}
                                    </select>
                                </motion.div>

                                {/* File Upload */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 }}
                                >
                                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                                        PDF File <span className="text-red-400">*</span>
                                    </label>            </motion.div>

                                <CldUploadWidget
                                    uploadPreset="scholara_preset"
                                    onSuccess={(result) => handleUploadSuccess(result)}
                                    onError={(error) => handleUploadError(error)}
                                    onUploadAdded={() => setUploading(true)}   // NEW alternative for "queues-start"
                                    onQueuesEnd={() => setUploading(false)}    // NEW alternative for "queues-end"
                                    options={{
                                        maxFileSize: 10485760,
                                        maxFiles: 1,
                                        resourceType: "auto",
                                        folder: "scholara/resources",
                                        clientAllowedFormats: ["pdf"],
                                    }}
                                >
                                    {({ open }) => (
                                        <div>
                                            <motion.div
                                                onClick={() => !loading && !uploading && open()}
                                                whileHover={!loading && !uploading ? { scale: 1.01 } : {}}
                                                whileTap={!loading && !uploading ? { scale: 0.99 } : {}}
                                                className={`border-2 border-dashed rounded-lg p-8 md:p-12 text-center cursor-pointer transition-all ${fileUrl
                                                    ? "border-green-500/50 bg-green-500/10 backdrop-blur"
                                                    : "border-amber-500/30 hover:border-amber-500 bg-amber-500/5 hover:bg-amber-500/10"
                                                    } ${uploading ? "opacity-60" : ""}`}
                                            >
                                                {uploading ? (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                                                        <p className="text-sm text-amber-400 font-medium">Uploading...</p>
                                                    </div>
                                                ) : fileUrl ? (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <CheckCircle2 className="w-8 h-8 text-green-400" />
                                                        <p className="text-green-400 font-semibold">File Uploaded</p>
                                                        <p className="text-xs text-green-400/70 truncate max-w-xs">{fileName}</p>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <FileText className="w-8 h-8 text-amber-500" />
                                                        <p className="text-gray-300 font-medium">Click to upload PDF</p>
                                                        <p className="text-xs text-gray-500">Max 10MB • PDF only</p>
                                                    </div>
                                                )}
                                            </motion.div>

                                            {fileUrl && (
                                                <motion.button
                                                    initial={{ opacity: 0, y: -5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    type="button"
                                                    onClick={() => setFileUrl("")}
                                                    className="mt-3 text-xs text-red-400 hover:text-red-300 underline transition-colors"
                                                >
                                                    Remove file
                                                </motion.button>
                                            )}
                                        </div>
                                    )}
                                </CldUploadWidget>


                                {/* Submit Button */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    whileHover={isFormComplete && !loading ? { scale: 1.02 } : {}}
                                    whileTap={isFormComplete && !loading ? { scale: 0.98 } : {}}
                                >
                                    <Button
                                        type="submit"
                                        className={`w-full py-3 font-bold text-base transition-all ${isFormComplete && !loading && !uploading
                                            ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white shadow-lg'
                                            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                            }`}
                                        disabled={!isFormComplete || loading || uploading}
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Publishing...
                                            </span>
                                        ) : (
                                            `Publish Resource (+50 Coins)`
                                        )}
                                    </Button>
                                </motion.div>

                                {/* Form Status */}
                                {!isFormComplete && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-xs text-gray-500 text-center"
                                    >
                                        Complete all fields above to publish
                                    </motion.div>
                                )}
                            </form>
                        </CardContent>
                    </Card>

                    {/* Info Cards */}

                </motion.div>
            </div>
        </div>
    );
}