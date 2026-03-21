'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HardDrive, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await api.post('/auth/forgot-password', { email });
            setSuccess(true);
            setTimeout(() => {
                router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
            }, 2500);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-8">
                    <Link href="/" className="flex items-center gap-2">
                        <HardDrive className="w-10 h-10 text-[var(--accent)]" />
                        <span className="font-bold text-2xl tracking-tight">CloudVault<span className="text-[var(--accent)]">.</span></span>
                    </Link>
                </div>

                <div className="glass p-8 md:p-12 relative overflow-hidden animate-in">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 blur-3xl -z-10" />

                    {success ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h2 className="text-2xl font-black mb-2 font-display tracking-tight">Code Sent!</h2>
                            <p className="text-sm text-slate-400 font-medium">
                                If the email exists securely in our database, a 6-digit code has been sent.
                            </p>
                            <p className="text-xs text-slate-500 mt-4 animate-pulse">Redirecting to next step...</p>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-3xl font-black text-center mb-2 font-display tracking-tight">Recover Vault</h2>
                            <p className="text-slate-400 text-center mb-8 font-medium">Enter your email to receive a secure recovery code</p>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 mb-6 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <span className="text-sm font-semibold">{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2 ml-1" htmlFor="email">
                                        Vault Email Vector
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        className="input-field"
                                        placeholder="name@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn-primary w-full py-4 mt-2 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center group relative overflow-hidden transition-all active:scale-[0.98]"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
                                    {isLoading ? (
                                        <RefreshCw className="w-6 h-6 animate-spin" />
                                    ) : (
                                        'Request Recovery Code'
                                    )}
                                </button>
                            </form>

                            <div className="mt-8 text-center text-sm">
                                <Link href="/auth/login" className="text-slate-500 hover:text-white font-medium transition-colors flex items-center justify-center gap-2">
                                    <RefreshCw className="w-4 h-4 rotate-180" />
                                    Return to Authentication
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
