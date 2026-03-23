'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HardDrive, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import { api } from '@/lib/api';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const router = useRouter();

    const allowedDomains = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 
        'aol.com', 'protonmail.com', 'pm.me', 'zoho.com', 'yandex.com', 'mail.com',
        'wp.pl', 'onet.pl', 'o2.pl', 'interia.pl', 'gazeta.pl', 'tlen.pl', 'vp.pl'
    ];

    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isPasswordValid = hasMinLength && hasUpperCase && hasSpecialChar;

    const emailDomain = email.split('@')[1]?.toLowerCase();
    const isEmailDomainValid = email.includes('@') && emailDomain && allowedDomains.includes(emailDomain);
    const emailTouched = email.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await api.post('/auth/register', {
                email,
                password,
                captcha_token: captchaToken
            });

            setSuccess(true);
            setTimeout(() => {
                router.push('/auth/login');
            }, 2000);
        } catch (err: any) {
            if (err.response?.status === 400) {
                setError(err.response.data.detail || 'Registration failed');
            } else if (err.response?.status === 422) {
                setError('Invalid input format');
            } else {
                setError('Something went wrong. Please try again later.');
            }
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
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h2 className="text-3xl font-black mb-2 font-display tracking-tight">Vault Created</h2>
                            <p className="text-slate-400 font-medium">Initializing your secure workspace...</p>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-3xl font-black text-center mb-2 font-display tracking-tight">Create Account</h2>
                            <p className="text-slate-400 text-center mb-10 font-medium">Join the zero-knowledge revolution</p>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 mb-8 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <span className="text-sm font-semibold">{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2 ml-1" htmlFor="email">
                                        Email Address
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        className={`input-field ${emailTouched && !isEmailDomainValid ? 'border-red-500/50 focus:border-red-500/50' : ''}`}
                                        placeholder="name@gmail.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    {emailTouched && !isEmailDomainValid && (
                                        <p className="text-xs text-red-400 mt-2 font-medium flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> Please use a known provider (e.g. Gmail, WP, Outlook)
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2 ml-1" htmlFor="password">
                                        Vault Password
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        required
                                        className="input-field"
                                        placeholder="Military-grade password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    
                                    <div className="mt-3 space-y-1.5 bg-black/20 p-3 rounded-lg border border-white/5">
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Password Requirements</p>
                                        <div className={`flex items-center gap-2 text-xs font-semibold ${hasMinLength ? 'text-emerald-400' : 'text-slate-400'}`}>
                                            <CheckCircle2 className={`w-3.5 h-3.5 ${hasMinLength ? 'opacity-100' : 'opacity-30'}`} />
                                            <span>At least 8 characters</span>
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs font-semibold ${hasUpperCase ? 'text-emerald-400' : 'text-slate-400'}`}>
                                            <CheckCircle2 className={`w-3.5 h-3.5 ${hasUpperCase ? 'opacity-100' : 'opacity-30'}`} />
                                            <span>One uppercase letter</span>
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs font-semibold ${hasSpecialChar ? 'text-emerald-400' : 'text-slate-400'}`}>
                                            <CheckCircle2 className={`w-3.5 h-3.5 ${hasSpecialChar ? 'opacity-100' : 'opacity-30'}`} />
                                            <span>One special character (!@#$)</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-center mt-2">
                                    <ReCAPTCHA
                                        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                                        onChange={(token) => setCaptchaToken(token)}
                                        theme="dark"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || !captchaToken || !isPasswordValid || !isEmailDomainValid}
                                    className="btn-primary w-full py-4 mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center group relative overflow-hidden transition-all duration-300"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
                                    {isLoading ? (
                                        <RefreshCw className="w-6 h-6 animate-spin" />
                                    ) : (
                                        'Create Secure Vault'
                                    )}
                                </button>
                            </form>

                            <div className="mt-10 text-center text-sm text-slate-500 font-medium">
                                Already have a vault?{' '}
                                <Link href="/auth/login" className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-black transition-colors">
                                    Sign In
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
