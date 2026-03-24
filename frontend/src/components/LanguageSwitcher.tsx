'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLanguage = (lang: 'en' | 'pl') => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-400 hover:text-[var(--accent)] hover:bg-white/5 rounded-lg transition-colors"
        aria-label="Change language"
      >
        <Globe className="w-4 h-4" />
        <span className="uppercase">{language}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 glass rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-[var(--border)] overflow-hidden animate-in fade-in slide-in-from-top-2 z-[100]">
          <button 
            onClick={() => toggleLanguage('en')}
            className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-white/10 ${language === 'en' ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'text-slate-300'}`}
          >
            English
          </button>
          <button 
            onClick={() => toggleLanguage('pl')}
            className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-white/10 ${language === 'pl' ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'text-slate-300'}`}
          >
            Polski
          </button>
        </div>
      )}
    </div>
  );
}
