'use client';

import Link from 'next/link';
import { HardDrive, Lock, Zap, Share2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen selection:bg-[var(--accent)] selection:text-white">
      {/* Header */}
      <header className="glass sticky top-0 z-50 px-4 py-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between mx-4 my-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <div className="bg-[var(--accent)] p-1.5 rounded-lg shadow-[0_0_15px_var(--accent-glow)]">
            <HardDrive className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight font-display">CloudVault<span className="text-[var(--accent)]">.</span></span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/mp3/converter" className="text-sm font-semibold text-slate-400 hover:text-[var(--accent)] transition-colors hidden md:block">
            {t('header.mp3Converter')}
          </Link>
          <Link href="/support" className="text-sm font-semibold text-slate-400 hover:text-[var(--accent)] transition-colors hidden md:block">
            {t('header.support')}
          </Link>
          <LanguageSwitcher />
          <Link href="/auth/login" className="text-sm font-semibold hover:text-[var(--accent)] transition-colors px-3 py-2 rounded-lg hover:bg-white/5 hidden xs:block">
            {t('header.login')}
          </Link>
          <Link href="/auth/register" className="btn-primary text-sm shadow-xl hidden sm:flex">
            {t('header.getStarted')}
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent)]/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />

        <div className="animate-in">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 max-w-5xl leading-[0.9] font-display">
            {t('hero.title1')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] via-purple-400 to-indigo-400">
              {t('hero.title2')}
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mb-12 leading-relaxed font-medium mx-auto">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/auth/register" className="btn-primary text-lg px-10 py-5">
              {t('hero.startFree')} <Zap className="w-5 h-5" />
            </Link>
            <button
              onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
              className="glass glass-hover text-lg px-10 py-5 font-bold rounded-xl"
            >
              {t('hero.viewPricing')}
            </button>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-32 relative bg-[var(--surface)]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass p-10 glass-hover animate-in delay-1 overflow-hidden group">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Lock className="w-7 h-7 text-[var(--accent)]" />
              </div>
              <h3 className="text-2xl font-bold mb-4 font-display">{t('features.securityTitle')}</h3>
              <p className="text-slate-400 leading-relaxed text-lg">
                {t('features.securityDesc')}
              </p>
            </div>
            <div className="glass p-10 glass-hover animate-in delay-2 overflow-hidden group border-[var(--accent)]/20">
              <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 font-display">{t('features.cloudTitle')}</h3>
              <p className="text-slate-400 leading-relaxed text-lg">
                {t('features.cloudDesc')}
              </p>
            </div>
            <div className="glass p-10 glass-hover animate-in delay-3 overflow-hidden group">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Share2 className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 font-display">{t('features.sharingTitle')}</h3>
              <p className="text-slate-400 leading-relaxed text-lg">
                {t('features.sharingDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-in">
            <h2 className="text-5xl font-black mb-6 font-display">{t('plans.title1')} <span className="text-[var(--accent)]">{t('plans.title2')}</span></h2>
            <p className="text-slate-400 mb-20 max-w-2xl mx-auto text-xl font-medium">
              {t('plans.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Free Plan */}
            <div className="glass p-10 flex flex-col items-center glass-hover animate-in delay-1">
              <h3 className="text-2xl font-bold mb-2 font-display">{t('plans.free.name')}</h3>
              <div className="text-5xl font-black mb-8 font-display">{t('plans.free.price')}<span className="text-lg font-normal text-slate-500">{t('plans.perMonth')}</span></div>
              <ul className="text-slate-300 mb-12 space-y-4 text-left w-full">
                <li className="flex items-center gap-3"><Zap className="w-5 h-5 text-[var(--accent)]" /> {t('plans.free.storage')}</li>
                <li className="flex items-center gap-3"><Zap className="w-5 h-5 text-[var(--accent)]" /> {t('plans.free.conversions')}</li>
                <li className="flex items-center gap-3"><Zap className="w-5 h-5 text-[var(--accent)]" /> {t('plans.free.sharing')}</li>
              </ul>
              <Link href="/auth/register" className="glass glass-hover w-full py-4 text-center font-bold">{t('plans.free.cta')}</Link>
            </div>

            {/* Premium Plan */}
            <div className="glass p-10 flex flex-col items-center relative overflow-hidden ring-2 ring-[var(--accent)]/50 shadow-[0_0_50px_rgba(99,102,241,0.2)] scale-105 animate-in delay-2">
              <div className="absolute top-4 right-[-35px] bg-[var(--accent)] text-black text-[10px] font-black px-10 py-1 uppercase tracking-widest rotate-45 shadow-lg">{t('plans.premium.badge')}</div>
              <h3 className="text-2xl font-bold mb-2 font-display text-[var(--accent)]">{t('plans.premium.name')}</h3>
              <div className="text-5xl font-black mb-8 font-display">{t('plans.premium.price')}<span className="text-lg font-normal text-slate-500">{t('plans.perMonth')}</span></div>
              <ul className="text-slate-200 mb-12 space-y-4 text-left w-full">
                <li className="flex items-center gap-3"><Zap className="w-5 h-5 text-[var(--accent)]" /> {t('plans.premium.storage')}</li>
                <li className="flex items-center gap-3"><Zap className="w-5 h-5 text-[var(--accent)]" /> {t('plans.premium.conversions')}</li>
                <li className="flex items-center gap-3"><Zap className="w-5 h-5 text-[var(--accent)]" /> {t('plans.premium.sharing')}</li>
                <li className="flex items-center gap-3"><Zap className="w-5 h-5 text-[var(--accent)]" /> {t('plans.premium.support')}</li>
              </ul>
              <Link href="/auth/register" className="btn-primary w-full py-4 shadow-2xl">{t('plans.premium.cta')}</Link>
            </div>

            {/* Premium Plus Plan */}
            <div className="glass p-10 flex flex-col items-center glass-hover animate-in delay-3">
              <h3 className="text-2xl font-bold mb-2 font-display">{t('plans.pro.name')}</h3>
              <div className="text-5xl font-black mb-8 font-display">{t('plans.pro.price')}<span className="text-lg font-normal text-slate-500">{t('plans.perMonth')}</span></div>
              <ul className="text-slate-300 mb-12 space-y-4 text-left w-full">
                <li className="flex items-center gap-3"><Zap className="w-5 h-5 text-[var(--accent)]" /> {t('plans.pro.storage')}</li>
                <li className="flex items-center gap-3"><Zap className="w-5 h-5 text-[var(--accent)]" /> {t('plans.pro.conversions')}</li>
                <li className="flex items-center gap-3"><Zap className="w-5 h-5 text-[var(--accent)]" /> {t('plans.pro.api')}</li>
              </ul>
              <Link href="/auth/register" className="glass glass-hover w-full py-4 text-center font-bold">{t('plans.pro.cta')}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-16 text-center">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-slate-500" />
            <span className="font-bold tracking-tight text-slate-400 font-display">CloudVault</span>
          </div>
          <div className="hidden md:block w-px h-4 bg-white/10"></div>
          <Link href="/support" className="text-slate-400 hover:text-[var(--accent)] font-bold text-sm transition-colors">
            {t('footer.supportCenter')}
          </Link>
        </div>
        <p className="text-slate-500 text-sm">{t('footer.copyright')}</p>
        <p className="text-[var(--accent)]/50 text-[10px] uppercase font-black tracking-widest mt-4">{t('footer.builtWith')}</p>
      </footer>
    </div>
  );
}
