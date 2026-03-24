'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import {
    LogOut, HardDrive, Upload, File as FileIcon,
    Trash2, Download, Share2, Shield, RefreshCw, X, Lock,
    Image as ImageIcon, Video as VideoIcon, Music as MusicIcon, ChevronRight, Copy, CheckCircle2
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

interface FileItem {
    id: number;
    original_filename: string;
    size_bytes: number;
    mime_type: string;
    conversion_status: 'NONE' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    share_token: string | null;
    created_at: string;
}

export default function DashboardPage() {
    const { t } = useLanguage();
    const { user, isAuthenticated, isLoading, checkAuth, logout } = useAuthStore();
    const router = useRouter();

    const [files, setFiles] = useState<FileItem[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [convertingId, setConvertingId] = useState<number | null>(null);
    const [selectedFileForConversion, setSelectedFileForConversion] = useState<FileItem | null>(null);
    const [isConversionModalOpen, setIsConversionModalOpen] = useState(false);
    const [shareModal, setShareModal] = useState<{isOpen: boolean, url: string} | null>(null);
    const [copied, setCopied] = useState(false);
    const [deleteModal, setDeleteModal] = useState<number | null>(null);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);
    const [downloadProgress, setDownloadProgress] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/auth/login');
        }

        if (isAuthenticated) {
            loadFiles();
        }
    }, [isAuthenticated, isLoading, router]);

    const loadFiles = async () => {
        try {
            const response = await api.get('/files/');
            setFiles(response.data);
        } catch (err) {
            console.error('Failed to load files', err);
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);

        setIsUploading(true);
        setUploadProgress(0);

        try {
            await api.post('/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                },
            });
            checkAuth();
            loadFiles();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Upload failed');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDownload = async (fileId: number, filename: string) => {
        setDownloadingId(fileId);
        setDownloadProgress(0);
        try {
            const response = await api.get(`/files/download/${fileId}`, {
                responseType: 'blob',
                onDownloadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setDownloadProgress(percentCompleted);
                    }
                },
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (err) {
            alert('Failed to download file');
        } finally {
            setDownloadingId(null);
            setDownloadProgress(0);
        }
    };

    const confirmDelete = async () => {
        if (!deleteModal) return;

        try {
            await api.delete(`/files/${deleteModal}`);
            checkAuth(); 
            loadFiles();
            setDeleteModal(null);
        } catch (err) {
            alert('Failed to delete file');
        }
    };

    const handleShare = async (fileId: number, isShared: boolean) => {
        try {
            if (isShared) {
                await api.post(`/files/${fileId}/unshare`);
                loadFiles();
            } else {
                const res = await api.post(`/files/${fileId}/share`);
                loadFiles();
                
                // Construct absolute URL for sharing
                const shareUrl = res.data.share_url.startsWith('/') 
                    ? `${window.location.origin}${res.data.share_url}` 
                    : res.data.share_url;
                
                setShareModal({ isOpen: true, url: shareUrl });
                setCopied(false);
            }
        } catch (err) {
            alert('Failed to update share settings');
        }
    };

    const handleCopyLink = async () => {
        if (!shareModal) return;
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(shareModal.url);
            } else {
                // Fallback for non-HTTPS (VPS IP)
                const textArea = document.createElement("textarea");
                textArea.value = shareModal.url;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                textArea.style.top = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                } catch (err) {
                    console.error('Fallback copy failed', err);
                }
                document.body.removeChild(textArea);
            }
            
            setCopied(true);
            setTimeout(() => {
                setShareModal(null);
                setCopied(false);
            }, 2000);
        } catch (err) {
            alert("Failed to copy link");
        }
    };

    const handleConvertClick = (file: FileItem) => {
        setSelectedFileForConversion(file);
        setIsConversionModalOpen(true);
    };

    const handleStartConversion = async (targetFormat: string) => {
        if (!selectedFileForConversion) return;
        
        const fileId = selectedFileForConversion.id;
        setIsConversionModalOpen(false);
        setConvertingId(fileId);
        
        try {
            await api.post(`/files/${fileId}/convert/${targetFormat}`);
            // No alert here, the UI will show processing status via loadFiles
            loadFiles();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to start conversion');
        } finally {
            setConvertingId(null);
            setSelectedFileForConversion(null);
        }
    };

    const getAvailableFormats = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        
        // Strictly allow only MP4 -> MP3 for now as per requirements
        if (ext === 'mp4') {
            return [
                { id: 'mp3', label: 'MP3 Extract', icon: <MusicIcon className="w-4 h-4" /> },
            ];
        }

        // For all other formats, return empty array to disable conversion UI
        return [];
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (isLoading || !user) {
        return <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
            <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
        </div>;
    }

    const storageLimit = user.plan_id ? 10 * 1024 * 1024 * 1024 : 1024 * 1024 * 1024; 
    const storagePercentage = Math.min(100, (user.current_storage_used / storageLimit) * 100);

    return (
        <div className="min-h-screen bg-[var(--background)] selection:bg-[var(--accent)] selection:text-white">
            {/* Navbar */}
            <header className="glass sticky top-0 z-50 px-4 py-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between mx-4 my-4 rounded-2xl">
                <div className="flex items-center gap-2">
                    <div className="bg-[var(--accent)] p-1.5 rounded-lg shadow-[0_0_15px_var(--accent-glow)]">
                        <HardDrive className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold tracking-tight font-display text-xl">CloudVault</span>
                </div>
                <div className="flex items-center gap-4">
                    {user.is_superuser && (
                        <span className="bg-red-500/10 text-red-400 text-[10px] px-2 py-0.5 rounded-full border border-red-500/20 font-black tracking-widest">{t('dashboard.nav.adminBadge')}</span>
                    )}
                    <div className="flex flex-col items-end hidden sm:flex mr-4">
                        <span className="text-xs font-bold text-slate-300">{user.email}</span>
                        <Link href="/dashboard/tickets" className="text-[10px] text-[var(--accent)] uppercase tracking-wider font-black hover:text-[var(--accent-hover)] transition-colors">
                            {t('dashboard.nav.supportHub')}
                        </Link>
                    </div>
                    <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all active:scale-90">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Storage Widget */}
                    <div className="glass p-8 md:col-span-1 flex flex-col h-full overflow-hidden">
                        <h3 className="font-bold mb-6 flex items-center gap-2 font-display text-lg">
                            <Shield className="w-5 h-5 text-[var(--accent)]" />
                            {t('dashboard.storage.title')}
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm font-medium">
                                <span className="text-slate-400">{t('dashboard.storage.encryptedSpace')}</span>
                                <span className="text-white">{formatBytes(user.current_storage_used)} / {formatBytes(storageLimit)}</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden border border-white/5">
                                <div
                                    className="bg-gradient-to-r from-[var(--accent)] to-purple-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_var(--accent-glow)]"
                                    style={{ width: `${storagePercentage}%` }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest text-center pt-2">
                                {storagePercentage.toFixed(1)}% {t('dashboard.storage.capacityUsed')}
                            </p>
                        </div>

                        <div className="mt-auto pt-10">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="btn-primary w-full py-4 rounded-2xl group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
                                {isUploading ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                        <span>{t('dashboard.storage.encrypting')} {uploadProgress}%</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5" />
                                        <span>{t('dashboard.storage.uploadBtn')}</span>
                                    </>
                                )}
                            </button>
                            <p className="text-[10px] text-slate-600 text-center mt-4 flex items-center justify-center gap-2 font-bold uppercase tracking-tighter">
                                <Lock className="w-3 h-3" /> {t('dashboard.storage.zeroKnowledge')}
                            </p>
                        </div>
                    </div>

                    {/* File List */}
                    <div className="glass p-8 md:col-span-2 flex flex-col min-h-[500px]">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="font-bold font-display text-lg">{t('dashboard.vault.title')} ({files.length})</h3>
                            <button onClick={loadFiles} className="text-slate-400 hover:text-[var(--accent)] transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 active:scale-95">
                                <RefreshCw className="w-4 h-4" /> {t('dashboard.vault.syncNow')}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                            {files.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500/50">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                        <FileIcon className="w-10 h-10 opacity-20" />
                                    </div>
                                    <p className="font-medium tracking-tight">{t('dashboard.vault.emptyTitle')}</p>
                                    <p className="text-xs uppercase tracking-widest mt-2">{t('dashboard.vault.emptyDesc')}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {files.map((file, idx) => (
                                        <div 
                                            key={file.id} 
                                            className="glass p-5 flex items-center justify-between group glass-hover animate-in border-white/5"
                                            style={{ animationDelay: `${idx * 0.05}s` }}
                                        >
                                            <div className="flex items-center sm:gap-4 overflow-hidden">
                                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[var(--accent)]/10 transition-colors">
                                                    <FileIcon className="w-6 h-6 text-slate-400 group-hover:text-[var(--accent)] transition-colors" />
                                                </div>
                                                <div className="flex flex-col overflow-hidden min-w-0">
                                                    <span className="font-bold text-slate-200 truncate pr-4" title={file.original_filename}>
                                                        {file.original_filename}
                                                    </span>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
                                                        <span>{formatBytes(file.size_bytes)}</span>
                                                        <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                                        <span>{new Date(file.created_at).toLocaleDateString()}</span>
                                                        
                                                        {file.conversion_status !== 'NONE' && (
                                                            <>
                                                                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                                                <span className={`
                                                                    ${file.conversion_status === 'COMPLETED' ? 'text-emerald-500' : ''}
                                                                    ${file.conversion_status === 'FAILED' ? 'text-red-500' : ''}
                                                                    ${['PENDING', 'PROCESSING'].includes(file.conversion_status) ? 'text-blue-500 animate-pulse' : ''}
                                                                `}>
                                                                    {file.conversion_status}
                                                                </span>
                                                            </>
                                                        )}
                                                        {downloadingId === file.id && (
                                                            <>
                                                                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                                                <span className="text-emerald-500 animate-pulse flex items-center gap-1">
                                                                    <Download className="w-3 h-3" /> {t('dashboard.vault.downloading')} {downloadProgress}%
                                                                </span>
                                                            </>
                                                        )}
                                                        {file.share_token && (
                                                            <>
                                                                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                                                <span className="text-[var(--accent)] flex items-center gap-1">
                                                                    <Share2 className="w-3 h-3" /> {t('dashboard.vault.sharedVault')}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <button
                                                    onClick={() => handleConvertClick(file)}
                                                    disabled={convertingId === file.id || ['PENDING', 'PROCESSING'].includes(file.conversion_status)}
                                                    className="p-2.5 text-slate-400 hover:text-[var(--accent)] hover:bg-white/5 rounded-xl transition-all active:scale-90"
                                                    title={t('dashboard.vault.modalConvertTitle')}
                                                >
                                                    <RefreshCw className={`w-4 h-4 ${convertingId === file.id ? 'animate-spin' : ''}`} />
                                                </button>
                                                <button
                                                    onClick={() => handleShare(file.id, !!file.share_token)}
                                                    className={`p-2.5 rounded-xl transition-all active:scale-90 ${file.share_token ? 'text-[var(--accent)] bg-[var(--accent)]/10 hover:bg-red-500/10 hover:text-red-400' : 'text-slate-400 hover:text-[var(--accent)] hover:bg-white/5'}`}
                                                    title={file.share_token ? "Revoke Access" : "Create Share Link"}
                                                >
                                                    {file.share_token ? <X className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDownload(file.id, file.original_filename)}
                                                    disabled={downloadingId === file.id}
                                                    className={`p-2.5 hover:bg-white/5 rounded-xl transition-all active:scale-90 ${downloadingId === file.id ? 'text-emerald-500' : 'text-slate-400 hover:text-white'}`}
                                                    title="Decrypt & Download"
                                                >
                                                    <Download className={`w-4 h-4 ${downloadingId === file.id ? 'animate-bounce' : ''}`} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteModal(file.id)}
                                                    className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all active:scale-90"
                                                    title={t('dashboard.vault.deleteTitle')}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Conversion Modal */}
            {isConversionModalOpen && selectedFileForConversion && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in transition-all duration-300" onClick={() => setIsConversionModalOpen(false)} />
                    
                    <div className="glass w-full max-w-lg p-8 relative z-10 animate-in zoom-in-95 duration-200 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <button 
                            onClick={() => setIsConversionModalOpen(false)}
                            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="bg-[var(--accent)]/20 p-3 rounded-2xl">
                                <RefreshCw className="w-6 h-6 text-[var(--accent)]" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black font-display tracking-tight">{t('dashboard.vault.modalConvertTitle')}</h3>
                                <p className="text-sm text-slate-400 font-medium truncate max-w-[300px]" title={selectedFileForConversion.original_filename}>
                                    {selectedFileForConversion.original_filename}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4">{t('dashboard.vault.selectFormat')}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {getAvailableFormats(selectedFileForConversion.original_filename).map((format) => (
                                    <button
                                        key={format.id}
                                        onClick={() => handleStartConversion(format.id)}
                                        className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/20 transition-all group active:scale-[0.98]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="text-slate-400 group-hover:text-[var(--accent)] transition-colors">
                                                {format.icon}
                                            </div>
                                            <span className="text-sm font-bold text-slate-200 group-hover:text-white">{format.label}</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-10 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-start gap-4">
                            <Lock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-300 font-medium leading-relaxed">
                                {t('dashboard.vault.convertDesc')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Link Modal */}
            {shareModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 opacity-100 transition-opacity">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in transition-all duration-300" onClick={() => setShareModal(null)} />
                    
                    <div className="glass w-full max-w-md p-8 relative z-10 animate-in zoom-in-95 duration-200 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <button 
                            onClick={() => setShareModal(null)}
                            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col items-center text-center space-y-4 mb-8">
                            <div className="bg-[var(--accent)]/20 p-4 rounded-full">
                                <Share2 className="w-8 h-8 text-[var(--accent)]" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black font-display tracking-tight">{t('dashboard.vault.shareTitle')}</h3>
                                <p className="text-sm text-slate-400 mt-2 font-medium">{t('dashboard.vault.shareDesc')}</p>
                            </div>
                        </div>

                        <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex items-center justify-between gap-4 group">
                            <span className="text-slate-300 font-mono text-sm truncate select-all">{shareModal.url}</span>
                            <button
                                onClick={handleCopyLink}
                                className={`p-2 rounded-lg transition-all shrink-0 ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white hover:bg-[var(--accent)] hover:text-white'}`}
                                title={t('dashboard.vault.copyLink')}
                            >
                                {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>
                        {copied && <p className="text-emerald-400 text-[10px] text-center uppercase tracking-widest font-black absolute mt-3 left-0 right-0 animate-in fade-in slide-in-from-top-1">{t('dashboard.vault.linkCopied')}</p>}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 opacity-100 transition-opacity">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in transition-all duration-300" onClick={() => setDeleteModal(null)} />
                    
                    <div className="glass w-full max-w-sm p-8 relative z-10 animate-in zoom-in-95 duration-200 border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.15)] text-center">
                        <div className="bg-red-500/20 p-4 rounded-full inline-block mb-6">
                            <Trash2 className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-2xl font-black font-display tracking-tight text-white mb-2">{t('dashboard.vault.deleteTitle')}</h3>
                        <p className="text-sm text-slate-400 mb-8 font-medium">{t('dashboard.vault.deleteDesc')}</p>
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setDeleteModal(null)}
                                className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all"
                            >
                                {t('dashboard.vault.cancelBtn')}
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                            >
                                {t('dashboard.vault.deleteBtn')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
