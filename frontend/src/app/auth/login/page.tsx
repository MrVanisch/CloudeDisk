'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HardDrive, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const login = useAuthStore((state) => state.login);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // FastAPI OAuth2PasswordBearer expects form data (x-www-form-urlencoded)
            const params = new URLSearchParams();
            params.append('username', email); 
            params.append('password', password);

            const response = await api.post('/auth/login/access-token', params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            await login(response.data.access_token);
            router.push('/dashboard');
        } catch (err: any) {
            if (err.response?.status === 400 || err.response?.status === 401) {
                setError('Invalid email or password');
            } else {
                setError('Something went wrong. Please try again.');
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
                    <h2 className="text-3xl font-black text-center mb-2 font-display tracking-tight">Welcome back</h2>
                    <p className="text-slate-400 text-center mb-10 font-medium">Sign in to your secure storage</p>

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
                                className="input-field"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2 ml-1">
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-500" htmlFor="password">
                                    Password
                                </label>
                            </div>
                            <input
                                id="password"
                                type="password"
                                required
                                className="input-field"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full py-4 mt-4 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
                            {isLoading ? (
                                <RefreshCw className="w-6 h-6 animate-spin" />
                            ) : (
                                'Sign In to Vault'
                            )}
                        </button>
                        
                        <div className="text-center mt-3">
                            <Link href="/auth/forgot-password" className="text-xs font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
                                Lost access? Reset Password
                            </Link>
                        </div>
                    </form>

                    <div className="mt-10 text-center text-sm text-slate-500 font-medium">
                        Don't have an account?{' '}
                        <Link href="/auth/register" className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-black transition-colors">
                            Join CloudVault
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
