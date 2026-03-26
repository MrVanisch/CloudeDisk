'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Shield, MessageCircle, Send, HardDrive, ArrowRight, RefreshCw, Key } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

interface TicketMessage {
    id: number;
    ticket_id: number;
    sender_id?: number | null;
    guest_sender?: string | null;
    message: string;
    created_at: string;
    sender?: { email: string; is_superuser?: boolean } | null;
}

interface Ticket {
    id: number;
    subject: string;
    status: 'OPEN' | 'CLOSED';
    created_at: string;
    token: string;
    messages?: TicketMessage[];
}

export default function SupportGuestPage() {
    const { t } = useLanguage();
    const [mode, setMode] = useState<'SELECT' | 'CREATE' | 'VIEW' | 'CHAT'>('SELECT');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [token, setToken] = useState('');
    
    const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<TicketMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    // Auto-refresh chat for guests
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeTicket && mode === 'CHAT') {
            interval = setInterval(() => {
                api.get(`/tickets/guest/${activeTicket.token}`).then((response) => {
                    setMessages(prev => {
                        const newMessages = response.data.messages || [];
                        if (prev.length !== newMessages.length) {
                           setTimeout(scrollToBottom, 100);
                        }
                        return newMessages;
                    });
                }).catch(err => console.error('Auto-refresh failed'));
            }, 5000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeTicket, mode]);

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/tickets/guest', {
                guest_email: email,
                subject: subject
            });
            setActiveTicket(response.data);
            setToken(response.data.token);
            setMode('VIEW'); // Show token to user
        } catch (err: any) {
            setError(err.response?.data?.detail || t('support.createError'));
        } finally {
            setLoading(false);
        }
    };

    const handleAccessTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/tickets/guest/${token}`);
            setActiveTicket(response.data);
            setMessages(response.data.messages || []);
            setMode('CHAT');
            scrollToBottom();
        } catch (err: any) {
            setError(t('support.invalidToken'));
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeTicket || !newMessage.trim()) return;

        setLoading(true);
        try {
            const response = await api.post(`/tickets/guest/${activeTicket.token}/messages`, { message: newMessage });
            setMessages([...messages, response.data]);
            setNewMessage('');
            scrollToBottom();
        } catch (err: any) {
            alert(err.response?.data?.detail || t('support.sendMessageError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
            <div className="absolute top-4 left-4 z-50">
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="bg-[var(--accent)] p-2 rounded-xl shadow-[0_0_15px_var(--accent-glow)]">
                        <HardDrive className="w-6 h-6 text-white" />
                    </div>
                </Link>
            </div>

            <div className="w-full max-w-2xl relative">
                {/* Mode: SELECT */}
                {mode === 'SELECT' && (
                    <div className="glass p-10 rounded-3xl relative overflow-hidden animate-in zoom-in-95">
                        <div className="absolute -top-32 -right-32 w-64 h-64 bg-[var(--accent)]/10 blur-[100px] rounded-full point-events-none" />
                        <div className="text-center mb-10">
                            <h1 className="text-4xl font-black font-display tracking-tight mb-4">{t('supportGuest.selectTitle')}</h1>
                            <p className="text-slate-400 font-medium">{t('supportGuest.selectSubtitle')}</p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <button 
                                onClick={() => setMode('CREATE')}
                                className="group bg-white/5 border border-white/5 hover:border-[var(--accent)]/50 p-6 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all hover:bg-white/10"
                            >
                                <div className="w-12 h-12 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <MessageCircle className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <h3 className="font-bold text-lg mb-1">{t('supportGuest.cardOpenTitle')}</h3>
                                    <p className="text-xs text-slate-400 font-medium leading-relaxed">{t('supportGuest.cardOpenDesc')}</p>
                                </div>
                            </button>

                            <button 
                                onClick={() => setMode('VIEW')}
                                className="group bg-white/5 border border-white/5 hover:border-emerald-500/50 p-6 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all hover:bg-white/10"
                            >
                                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Key className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <h3 className="font-bold text-lg mb-1">{t('supportGuest.cardCheckTitle')}</h3>
                                    <p className="text-xs text-slate-400 font-medium leading-relaxed">{t('supportGuest.cardCheckDesc')}</p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Mode: CREATE */}
                {mode === 'CREATE' && (
                    <div className="glass p-10 rounded-3xl relative overflow-hidden animate-in slide-in-from-bottom-4">
                        <button onClick={() => setMode('SELECT')} className="text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-colors mb-8 flex items-center gap-2">
                             &larr; {t('supportGuest.back')}
                        </button>
                        <h2 className="text-3xl font-black font-display tracking-tight mb-2">{t('supportGuest.createTitle')}</h2>
                        <p className="text-slate-400 font-medium mb-8">{t('supportGuest.createDesc')}</p>

                        {error && <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-6 text-sm font-bold border border-red-500/20">{error}</div>}

                        <form onSubmit={handleCreateTicket} className="space-y-5">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">{t('supportGuest.emailLabel')}</label>
                                <input 
                                    type="email" 
                                    required 
                                    className="input-field" 
                                    placeholder={t('supportGuest.emailPlc')}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">{t('supportGuest.subjLabel')}</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="input-field" 
                                    placeholder={t('supportGuest.subjPlc')}
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                            </div>
                            <button type="submit" disabled={loading} className="btn-primary w-full py-4 mt-4 flex items-center justify-center gap-2 disabled:opacity-50">
                                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <>{t('supportGuest.submitBtn')} <ArrowRight className="w-4 h-4" /></>}
                            </button>
                        </form>
                    </div>
                )}

                {/* Mode: VIEW TOKEN / ACCESS TICKET */}
                {mode === 'VIEW' && (
                    <div className="glass p-10 rounded-3xl relative overflow-hidden animate-in slide-in-from-bottom-4 text-center">
                        {activeTicket && !error ? (
                            <div className="animate-in zoom-in-95">
                                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Shield className="w-8 h-8 text-emerald-400" />
                                </div>
                                <h2 className="text-3xl font-black font-display tracking-tight mb-2 text-white">{t('supportGuest.successTitle')}</h2>
                                <p className="text-slate-400 font-medium mb-8 max-w-sm mx-auto">{t('supportGuest.successDesc')}</p>
                                
                                <div className="bg-black/50 border border-white/10 rounded-2xl p-6 mb-8 relative group">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 absolute -top-2 bg-[var(--background)] px-2 left-6">{t('supportGuest.accessToken')}</p>
                                    <span className="font-mono text-xl text-[var(--accent)] font-bold select-all">{token}</span>
                                </div>

                                <button onClick={() => setMode('CHAT')} className="btn-primary px-8 py-3">{t('supportGuest.enterChatBtn')}</button>
                            </div>
                        ) : (
                            <div>
                                <button onClick={() => setMode('SELECT')} className="text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-colors mb-8 flex items-center gap-2">
                                     &larr; {t('supportGuest.back')}
                                </button>
                                <h2 className="text-3xl font-black font-display tracking-tight mb-2 text-left">{t('supportGuest.accessTitle')}</h2>
                                <p className="text-slate-400 font-medium mb-8 text-left">{t('supportGuest.accessDesc')}</p>

                                {error && <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-6 text-sm font-bold border border-red-500/20 text-left">{error}</div>}

                                <form onSubmit={handleAccessTicket} className="space-y-5 text-left">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">{t('supportGuest.tokenLabel')}</label>
                                        <input 
                                            type="text" 
                                            required 
                                            className="input-field font-mono" 
                                            placeholder={t('supportGuest.tokenPlc')}
                                            value={token}
                                            onChange={(e) => setToken(e.target.value)}
                                        />
                                    </div>
                                    <button type="submit" disabled={loading} className="btn-primary w-full py-4 mt-4 flex items-center justify-center gap-2 disabled:opacity-50">
                                        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <>{t('supportGuest.accessBtn')} <ArrowRight className="w-4 h-4" /></>}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                )}

                {/* Mode: CHAT */}
                {mode === 'CHAT' && activeTicket && (
                    <div className="glass rounded-3xl relative overflow-hidden animate-in slide-in-from-bottom-4 h-[80vh] flex flex-col border-white/10 shadow-2xl">
                        <div className="p-4 sm:p-6 border-b border-white/10 bg-black/20 flex justify-between items-center shrink-0 w-full">
                            <div>
                                <h2 className="text-xl font-black font-display tracking-tight text-white line-clamp-1">{activeTicket.subject}</h2>
                                <p className="text-xs font-medium text-slate-400 flex items-center gap-2 mt-1">
                                    <span className={`w-2 h-2 rounded-full ${activeTicket.status === 'OPEN' ? 'bg-blue-500' : 'bg-slate-500'}`} />
                                    {activeTicket.status === 'OPEN' ? t('dashboard.tickets.statusOpen') : t('dashboard.tickets.statusClosed')} {t('support.ticketBadge')}
                                </p>
                            </div>
                            <button onClick={() => { setMode('SELECT'); setActiveTicket(null); setToken(''); }} className="text-xs font-black bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ml-4">
                                {t('supportGuest.exitBtn')}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                             {messages.length === 0 && (
                                <p className="text-center text-slate-500 text-sm mt-10">{t('supportGuest.waitingMsg')}</p>
                            )}
                            {messages.map((msg, idx) => {
                                // Since we are not logged in, 'mine' is if the message was sent by a guest.
                                // It could be tricky if other guests reply, but usually it's just Admin vs Guest.
                                const isMine = !msg.sender_id && msg.guest_sender;
                                const isSenderAdmin = msg.sender?.is_superuser;
                                
                                return (
                                    <div key={idx} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-end gap-2 max-w-[85%]">
                                            {!isMine && (
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isSenderAdmin ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-white/10 text-slate-300'}`}>
                                                    {isSenderAdmin ? <Shield className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                                                </div>
                                            )}
                                            
                                            <div className={`p-4 rounded-3xl ${isMine ? 'bg-[var(--accent)] text-white rounded-br-sm' : 'bg-white/10 text-slate-200 rounded-bl-sm border border-white/5'}`}>
                                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-medium mt-1 mx-1">
                                            {!isMine && <span className="text-slate-400 mr-2">{isSenderAdmin ? 'Admin' : 'Support'}</span>}
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                )
                            })}
                            <div ref={chatEndRef} />
                        </div>

                        <div className="p-4 sm:p-6 border-t border-white/10 bg-black/20 shrink-0">
                            {activeTicket.status === 'CLOSED' ? (
                                <div className="text-center text-slate-400 text-sm font-medium py-2">
                                    {t('supportGuest.closedMsg')}
                                </div>
                            ) : (
                                <form onSubmit={handleSendMessage} className="flex gap-3">
                                    <input 
                                        type="text" 
                                        placeholder={t('supportGuest.typeReplyPlc')} 
                                        className="input-field flex-1 !mb-0 rounded-2xl"
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        disabled={loading}
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={loading || !newMessage.trim()}
                                        className="w-12 h-12 bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 shrink-0"
                                    >
                                        <Send className="w-5 h-5 ml-1" />
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
