'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import { Shield, Trash2, Users, HardDrive, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';

interface UserItem {
    id: number;
    email: string;
    is_superuser?: boolean;
    is_active?: boolean;
    current_storage_used?: number;
    plan_id?: number;
}

export default function AdminDashboardPage() {
    const { t } = useLanguage();
    const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
    const router = useRouter();

    const [users, setUsers] = useState<UserItem[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push('/auth/login');
            } else if (!user?.is_superuser) {
                router.push('/dashboard');
            } else {
                loadUsers();
            }
        }
    }, [isAuthenticated, isLoading, user, router]);

    const loadUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data);
        } catch (err) {
            console.error('Failed to load users', err);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!confirm(t('dashboard.admin.confirmDeleteUser'))) return;

        try {
            await api.delete(`/admin/users/${userId}`);
            loadUsers();
        } catch (err: any) {
            alert(err.response?.data?.detail || t('dashboard.admin.deleteUserFailed'));
        }
    };

    const handleUpdatePlan = async (userId: number, newPlanId: number) => {
        try {
            await api.patch(`/admin/users/${userId}/plan`, { plan_id: newPlanId });
            loadUsers();
        } catch (err: any) {
            alert(err.response?.data?.detail || t('dashboard.admin.updatePlanFailed'));
        }
    };

    if (isLoading || loadingUsers || !user?.is_superuser) {
        return <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
            <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
        </div>;
    }

    return (
        <div className="min-h-screen bg-[var(--background)] selection:bg-[var(--accent)] selection:text-white pb-10">
            {/* Header */}
            <header className="glass sticky top-0 z-50 px-4 py-3 sm:px-6 lg:px-8 h-16 flex items-center gap-6 mx-4 my-4 rounded-2xl">
                <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="bg-[var(--accent)] p-1.5 rounded-lg shadow-[0_0_15px_var(--accent-glow)]">
                        <HardDrive className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold tracking-tight font-display text-xl hidden sm:block">CloudVault</span>
                </Link>
                <div className="h-6 border-l border-white/10 hidden sm:block"></div>
                <div className="flex items-center gap-2 text-red-400 font-bold">
                    <Shield className="w-4 h-4" /> {t('dashboard.admin.validatedSuperuser')}
                </div>
                <div className="ml-auto flex items-center gap-4">
                     <Link href="/dashboard/tickets" className="text-xs font-bold text-slate-300 hover:text-white transition-colors bg-white/5 py-1.5 px-3 rounded-lg flex items-center gap-2">
                        {t('dashboard.nav.viewTickets')}
                     </Link>
                    <Link href="/dashboard" className="text-xs font-bold text-slate-400 hover:text-white transition-colors">
                        {t('dashboard.nav.backMyVault')}
                    </Link>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-8 animate-in">
                <div className="glass p-8 rounded-2xl border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.05)]">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-black font-display tracking-tight flex items-center gap-3">
                                <Users className="w-6 h-6 text-red-400" /> {t('dashboard.admin.title')}
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">{t('dashboard.admin.desc')}</p>
                        </div>
                        <button onClick={loadUsers} className="text-slate-400 hover:text-red-400 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 active:scale-95">
                            <RefreshCw className="w-4 h-4" /> {t('dashboard.admin.refresh')}
                        </button>
                    </div>

                    <div className="bg-black/20 rounded-xl overflow-hidden border border-white/5">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-xs font-black uppercase tracking-widest text-slate-500 bg-white/5">
                                    <th className="p-4">ID</th>
                                    <th className="p-4">{t('dashboard.admin.tableEmail')}</th>
                                    <th className="p-4 hidden sm:table-cell">{t('dashboard.admin.tableRole')}</th>
                                    <th className="p-4 hidden md:table-cell">{t('dashboard.admin.tablePlan')}</th>
                                    <th className="p-4 text-right">{t('dashboard.admin.tableActions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                        <td className="p-4 font-mono text-xs text-slate-400">#{u.id}</td>
                                        <td className="p-4 font-bold text-slate-200">{u.email}</td>
                                        <td className="p-4 hidden sm:table-cell">
                                            {u.is_superuser ? (
                                                <span className="bg-red-500/10 text-red-400 text-[10px] px-2 py-0.5 rounded-full border border-red-500/20 font-black tracking-widest uppercase">{t('dashboard.admin.roleAdmin')}</span>
                                            ) : (
                                                <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-full border border-blue-500/20 font-black tracking-widest uppercase">{t('dashboard.admin.roleUser')}</span>
                                            )}
                                        </td>
                                        <td className="p-4 hidden md:table-cell">
                                            <select 
                                                className="bg-black/40 border border-white/10 text-white text-xs font-bold rounded-lg px-2 py-1 outline-none disabled:opacity-50"
                                                value={u.plan_id || 1}
                                                onChange={(e) => handleUpdatePlan(u.id, parseInt(e.target.value))}
                                                disabled={u.is_superuser}
                                            >
                                                <option value={1}>{t('dashboard.admin.planFree')}</option>
                                                <option value={2}>{t('dashboard.admin.planPremium')}</option>
                                                <option value={3}>{t('dashboard.admin.planPro')}</option>
                                            </select>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => handleDeleteUser(u.id)}
                                                disabled={u.id === user.id}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all active:scale-90 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                                                title={u.id === user.id ? t('dashboard.admin.cannotDeleteSelf') : t('dashboard.admin.deleteTooltip')}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
