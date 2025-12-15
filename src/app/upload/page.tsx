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
import { useLanguage } from '@/context/LanguageContext';

export default function UploadPage() {
    const { t } = useLanguage();
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
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
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
        } finally {
            setIsCheckingAuth(false);
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
                showModal(t('Upload.success'), 'success');

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

    if (!isLoggedIn && !isCheckingAuth) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <motion.div
                    className="text-center"
                    animate={{ opacity: 1, y: 0 }}
                    initial={{ opacity: 0, y: 10 }}
                >
                    <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin mb-4" />
                    <p className="text-muted-foreground">Loading...</p>
                </motion.div>
            </div>
        );
    }

    const isFormComplete = title.trim() && description.trim() && subject && fileUrl;

    return (
        <div className="min-h-screen bg-background text-foreground pb-12">
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalType === 'success' ? 'Success' : modalType === 'error' ? 'Error' : 'Info'}
            >
                <div className="flex items-start gap-3">
                    {modalType === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />}
                    {modalType === 'error' && <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />}
                    <p className="text-sm text-foreground">{modalMessage}</p>
                </div>
            </Modal>

            <div className="container max-w-7xl mx-auto py-12 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-2xl mx-auto"
                >
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <h1 className="text-3xl md:text-4xl font-bold text-black">
                                {t('Upload.title')}
                            </h1>
                        </div>
                        <p className="text-muted-foreground">{t('Upload.subtitle')}</p>
                    </div>

                    <Card className="border-border bg-card shadow-2xl">
                        <CardHeader className="border-b border-border">
                            <CardTitle className="text-primary flex items-center gap-2">
                                <Upload className="w-5 h-5" />
                                {t('Upload.cardTitle')}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-2">{t('Upload.cardDesc')}</p>
                        </CardHeader>

                        <CardContent className="pt-8">
                            {isCheckingAuth ? (
                                <div className="space-y-6">
                                    {/* Title Skeleton */}
                                    <div className="space-y-2">
                                        <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                                        <div className="h-10 bg-muted rounded animate-pulse" />
                                    </div>

                                    {/* Description Skeleton */}
                                    <div className="space-y-2">
                                        <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                                        <div className="h-32 bg-muted rounded animate-pulse" />
                                    </div>

                                    {/* Subject Skeleton */}
                                    <div className="space-y-2">
                                        <div className="h-4 bg-muted rounded w-16 animate-pulse" />
                                        <div className="h-10 bg-muted rounded animate-pulse" />
                                    </div>

                                    {/* Upload Area Skeleton */}
                                    <div className="h-48 bg-muted/20 rounded-lg border-2 border-dashed border-border animate-pulse" />

                                    {/* Button Skeleton */}
                                    <div className="h-12 bg-primary/20 rounded animate-pulse" />
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Title Input */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        <label className="block text-sm font-semibold mb-2 text-foreground">
                                            {t('Upload.inputTitle')} <span className="text-destructive">*</span>
                                        </label>
                                        <Input
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                            required
                                            placeholder="e.g., Advanced Calculus Chapter 5"
                                            disabled={loading || uploading}
                                            className="bg-background border-input focus:border-primary focus:ring-primary"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">{title.length}/100 characters</p>
                                    </motion.div>

                                    {/* Description Input */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15 }}
                                    >
                                        <label className="block text-sm font-semibold mb-2 text-foreground">
                                            {t('Upload.inputDesc')} <span className="text-destructive">*</span>
                                        </label>
                                        <textarea
                                            className="flex w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground disabled:opacity-50 transition-all shadow-sm"
                                            rows={4}
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            required
                                            placeholder="Describe what this resource covers..."
                                            disabled={loading || uploading}
                                            maxLength={500}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">{description.length}/500 characters</p>
                                    </motion.div>

                                    {/* Subject Select */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <label className="block text-sm font-semibold mb-2 text-foreground">
                                            {t('Upload.inputSubject')} <span className="text-destructive">*</span>
                                        </label>
                                        <select
                                            className="flex w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 transition-all shadow-sm"
                                            value={subject}
                                            onChange={e => setSubject(e.target.value)}
                                            required
                                            disabled={loading || uploading}
                                        >
                                            <option value="" className="bg-background">Select a subject</option>
                                            {subjects.map((s, i) => (
                                                <option key={i} value={s.value} className="bg-background">{s.label}</option>
                                            ))}
                                        </select>
                                    </motion.div>

                                    {/* File Upload */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.25 }}
                                    >
                                        <label className="block text-sm font-semibold mb-2 text-foreground">
                                            {t('Upload.inputFile')} <span className="text-destructive">*</span>
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
                                                        : "border-primary/20 hover:border-primary/50 bg-muted/30 hover:bg-muted/50"
                                                        } ${uploading ? "opacity-60" : ""}`}
                                                >
                                                    {uploading ? (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                                            <p className="text-sm text-primary font-medium">Uploading...</p>
                                                        </div>
                                                    ) : fileUrl ? (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                                                            <p className="text-green-500 font-semibold">File Uploaded</p>
                                                            <p className="text-xs text-green-500/70 truncate max-w-xs">{fileName}</p>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <FileText className="w-8 h-8 text-primary" />
                                                            <p className="text-foreground font-medium">{t('Upload.clickToUpload')}</p>
                                                            <p className="text-xs text-muted-foreground">Max 10MB • PDF only</p>
                                                        </div>
                                                    )}
                                                </motion.div>

                                                {fileUrl && (
                                                    <motion.button
                                                        initial={{ opacity: 0, y: -5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        type="button"
                                                        onClick={() => setFileUrl("")}
                                                        className="mt-3 text-xs text-destructive hover:text-destructive/80 underline transition-colors"
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
                                                ? 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg'
                                                : 'bg-muted text-muted-foreground cursor-not-allowed'
                                                }`}
                                            disabled={!isFormComplete || loading || uploading}
                                        >
                                            {loading ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    {t('Upload.publishing')}
                                                </span>
                                            ) : (
                                                t('Upload.publish')
                                            )}
                                        </Button>
                                    </motion.div>

                                    {/* Form Status */}
                                    {!isFormComplete && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-xs text-muted-foreground text-center"
                                        >
                                            Complete all fields above to publish
                                        </motion.div>
                                    )}
                                </form>
                            )}
                        </CardContent>
                    </Card>

                    {/* Info Cards */}

                </motion.div>
            </div>
        </div>
    );
}