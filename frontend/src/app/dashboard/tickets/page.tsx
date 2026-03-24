'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import { Shield, MessageCircle, Send, X, HardDrive, RefreshCw, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';

interface UserItem {
    id: number;
    email: string;
    is_superuser?: boolean;
}

interface TicketMessage {
    id: number;
    ticket_id: number;
    sender_id: number;
    message: string;
    created_at: string;
    sender: UserItem;
}

interface Ticket {
    id: number;
    user_id: number;
    subject: string;
    status: 'OPEN' | 'CLOSED';
    created_at: string;
    messages?: TicketMessage[];
}

export default function TicketsPage() {
    const { t } = useLanguage();
    const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
    const router = useRouter();

    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(true);
    
    // Active chat state
    const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<TicketMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    
    // New ticket modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newSubject, setNewSubject] = useState('');

    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push('/auth/login');
            } else {
                loadTickets();
            }
        }
    }, [isAuthenticated, isLoading, router]);

    // Auto-refresh chat
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeTicket) {
            interval = setInterval(() => {
                api.get(`/tickets/${activeTicket.id}`).then((response) => {
                    setMessages(prev => {
                        const newMessages = response.data.messages || [];
                        if (prev.length !== newMessages.length) {
                           setTimeout(scrollToBottom, 100);
                        }
                        return newMessages;
                    });
                }).catch(err => console.error('Auto-refresh failed', err));
            }, 5000); // 5 seconds
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeTicket]);

    const loadTickets = async () => {
        setLoadingTickets(true);
        try {
            const endpoint = user?.is_superuser ? '/admin/tickets' : '/tickets';
            const response = await api.get(endpoint);
            setTickets(response.data);
        } catch (err) {
            console.error('Failed to load tickets', err);
        } finally {
            setLoadingTickets(false);
        }
    };

    const loadMessages = async (ticket: Ticket) => {
        setActiveTicket(ticket);
        try {
            const response = await api.get(`/tickets/${ticket.id}`);
            setMessages(response.data.messages || []);
            scrollToBottom();
        } catch (err) {
            console.error('Failed to load messages', err);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeTicket || !newMessage.trim()) return;

        setSending(true);
        try {
            const response = await api.post(`/tickets/${activeTicket.id}/messages`, { message: newMessage });
            setMessages([...messages, response.data]);
            setNewMessage('');
            scrollToBottom();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubject.trim()) return;
        
        try {
            await api.post('/tickets', { subject: newSubject });
            setIsCreateModalOpen(false);
            setNewSubject('');
            loadTickets();
        } catch (err: any) {
            console.error('Failed to create ticket', err);
            alert(err.response?.data?.detail || 'Failed to create ticket');
        }
    };

    const toggleTicketStatus = async (ticketId: number, currentStatus: string) => {
        const newStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
        try {
            await api.patch(`/admin/tickets/${ticketId}/status?status=${newStatus}`);
            loadTickets();
            if (activeTicket && activeTicket.id === ticketId) {
                setActiveTicket({ ...activeTicket, status: newStatus as any });
            }
        } catch (err) {
            alert('Failed to update ticket status');
        }
    };

    if (isLoading || loadingTickets || !user) {
        return <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
            <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
        </div>;
    }

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <header className="glass px-4 py-3 sm:px-6 lg:px-8 h-16 flex items-center gap-6 mx-4 mt-4 mb-2 rounded-2xl shrink-0">
                <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="bg-[var(--accent)] p-1.5 rounded-lg shadow-[0_0_15px_var(--accent-glow)]">
                        <HardDrive className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold tracking-tight font-display text-xl hidden sm:block">CloudVault</span>
                </Link>
                <div className="h-6 border-l border-white/10 hidden sm:block"></div>
                <div className="flex items-center gap-2 font-bold text-slate-200">
                    <MessageCircle className="w-4 h-4 text-[var(--accent)]" /> {t('dashboard.nav.supportHub')}
                </div>
                {user.is_superuser && (
                     <div className="flex items-center gap-2 text-red-400 font-bold ml-2 text-xs uppercase tracking-widest bg-red-500/10 px-2 py-1 rounded">
                         <Shield className="w-3 h-3" /> {t('dashboard.nav.adminBadge')}
                     </div>
                )}
                
                <div className="ml-auto flex items-center gap-4">
                    {user.is_superuser && (
                        <Link href="/dashboard/admin" className="text-xs font-bold text-slate-300 hover:text-red-400 transition-colors bg-white/5 py-1.5 px-3 rounded-lg flex items-center gap-2">
                             {t('dashboard.nav.manageUsers')}
                        </Link>
                    )}
                    <Link href="/dashboard" className="text-xs font-bold text-[var(--accent)] hover:text-white transition-colors bg-[var(--accent)]/10 py-1.5 px-3 rounded-lg">
                        {t('dashboard.nav.backVault')}
                    </Link>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex gap-6 overflow-hidden animate-in">
                {/* Tickets Sidebar */}
                <div className="glass w-1/3 flex flex-col rounded-2xl overflow-hidden border-white/5 relative">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/5">
                        <h3 className="font-black font-display tracking-tight text-lg">{t('dashboard.tickets.title')}</h3>
                        <div className="flex gap-2">
                            <button onClick={loadTickets} className="p-2 text-slate-400 hover:text-[var(--accent)] transition-all rounded-lg hover:bg-white/5">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            {!user.is_superuser && (
                                <button onClick={() => setIsCreateModalOpen(true)} className="p-2 text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all rounded-lg">
                                    <Plus className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {tickets.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                <MessageCircle className="w-10 h-10 text-slate-600 mb-2" />
                                <p className="text-slate-400 font-medium text-sm">{t('dashboard.tickets.noTickets')}</p>
                            </div>
                        ) : (
                            tickets.map(ticket => (
                                <button 
                                    key={ticket.id}
                                    onClick={() => loadMessages(ticket)}
                                    className={`w-full p-4 rounded-xl flex flex-col items-start gap-1 transition-all text-left ${activeTicket?.id === ticket.id ? 'bg-[var(--accent)]/20 border border-[var(--accent)]/30' : 'hover:bg-white/5 border border-transparent'}`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className="font-bold text-sm text-slate-200 truncate pr-2">{ticket.subject}</span>
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${ticket.status === 'OPEN' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 bg-white/10'}`}>
                                            {ticket.status === 'OPEN' ? t('dashboard.tickets.statusOpen') : t('dashboard.tickets.statusClosed')}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-500 font-mono">
                                        {user.is_superuser && <span className="text-slate-400 mr-2">#{ticket.user_id}</span>}
                                        {new Date(ticket.created_at).toLocaleDateString()}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="glass flex-1 flex flex-col rounded-2xl overflow-hidden border-white/5 relative bg-black/20">
                    {activeTicket ? (
                        <>
                            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/10 backdrop-blur-md shrink-0">
                                <div>
                                    <h3 className="font-black font-display tracking-tight text-lg text-white">{activeTicket.subject}</h3>
                                    <p className="text-xs text-slate-400 font-medium tracking-wide">Ticket #{activeTicket.id}</p>
                                </div>
                                {user.is_superuser && (
                                    <button 
                                        onClick={() => toggleTicketStatus(activeTicket.id, activeTicket.status)}
                                        className={`px-3 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTicket.status === 'OPEN' ? 'text-red-400 hover:bg-red-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}
                                    >
                                        {activeTicket.status === 'OPEN' ? t('dashboard.tickets.closeTicket') : t('dashboard.tickets.reopenTicket')}
                                    </button>
                                )}
                            </div>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                                {messages.length === 0 && (
                                    <p className="text-center text-slate-500 text-sm mt-10">{t('dashboard.tickets.sayHello')}</p>
                                )}
                                {messages.map((msg, idx) => {
                                    const isMine = msg.sender_id === user.id;
                                    const isSenderAdmin = msg.sender?.is_superuser;
                                    
                                    return (
                                        <div key={idx} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                            <div className="flex items-end gap-2 max-w-[80%]">
                                                {!isMine && (
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isSenderAdmin ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-white/10 text-slate-300'}`}>
                                                        {isSenderAdmin ? <Shield className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                                                    </div>
                                                )}
                                                
                                                <div className={`p-4 rounded-2xl ${isMine ? 'bg-[var(--accent)] text-white rounded-br-sm' : 'bg-white/10 text-slate-200 rounded-bl-sm border border-white/5'}`}>
                                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-slate-500 font-medium mt-1 mx-1">
                                                {!isMine && <span className="text-slate-400 mr-2">{isSenderAdmin ? 'Admin' : msg.sender?.email}</span>}
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    )
                                })}
                                <div ref={chatEndRef} />
                            </div>
                            
                            <div className="p-4 border-t border-white/5 bg-white/5 shrink-0">
                                {activeTicket.status === 'CLOSED' && !user.is_superuser ? (
                                    <div className="text-center p-3 bg-white/5 rounded-xl text-slate-400 text-sm">
                                        {t('dashboard.tickets.ticketClosed')}
                                    </div>
                                ) : (
                                    <form onSubmit={handleSendMessage} className="flex gap-2">
                                        <input 
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder={t('dashboard.tickets.typeReplyMsg')}
                                            className="input-field flex-1 !mb-0"
                                            disabled={sending}
                                        />
                                        <button 
                                            type="submit" 
                                            disabled={sending || !newMessage.trim()}
                                            className="bg-[var(--accent)] text-white p-3 rounded-xl hover:bg-[var(--accent-hover)] transition-all disabled:opacity-50 shrink-0"
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </form>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500/50 p-6 text-center">
                            <MessageCircle className="w-16 h-16 opacity-20 mb-4" />
                            <h3 className="text-xl font-bold text-slate-400 mb-2">{t('dashboard.tickets.selectTicket')}</h3>
                            <p className="text-sm">{t('dashboard.tickets.selectDesc')}</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Create Ticket Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in transition-all duration-300" onClick={() => setIsCreateModalOpen(false)} />
                    <div className="glass w-full max-w-md p-8 relative z-10 animate-in zoom-in-95 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                         <button 
                             onClick={() => setIsCreateModalOpen(false)}
                             className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
                         >
                             <X className="w-5 h-5" />
                         </button>
                         <h3 className="text-2xl font-black font-display tracking-tight mb-6">{t('dashboard.tickets.createTicket')}</h3>
                         <form onSubmit={handleCreateTicket} className="space-y-4">
                             <div>
                                 <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">
                                     {t('dashboard.tickets.subjectLabel')}
                                 </label>
                                 <input
                                     type="text"
                                     required
                                     autoFocus
                                     className="input-field"
                                     placeholder={t('dashboard.tickets.subjectPlaceholder')}
                                     value={newSubject}
                                     onChange={(e) => setNewSubject(e.target.value)}
                                 />
                             </div>
                             <button type="submit" className="btn-primary w-full py-3">{t('dashboard.tickets.openTicketBtn')}</button>
                         </form>
                    </div>
                </div>
            )}
        </div>
    );
}
