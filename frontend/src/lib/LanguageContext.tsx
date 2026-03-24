'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from './translations';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('language') as Language;
    if (saved && (saved === 'en' || saved === 'pl')) {
      setLanguageState(saved);
    } else {
      const browserLang = navigator.language;
      if (browserLang.toLowerCase().includes('pl')) {
        setLanguageState('pl');
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  /**
   * Helper function to get translation by path (e.g., 'hero.title1')
   */
  const t = (path: string): string => {
    // If not mounted on client yet, default to English to prevent hydration mismatch errors occasionally,
    // though Next.js might still mismatch. We handle this explicitly in UI if needed.
    const keys = path.split('.');
    let current: any = translations[language];
    
    for (const key of keys) {
      if (current === undefined) return path;
      current = current[key];
    }
    
    return typeof current === 'string' ? current : path;
  };

  // Provide a safe default for server-side rendering
  if (!isMounted) {
     // A trick to avoid hydration mismatch is to not return children until mounted, 
     // but that causes flicker. Instead we just let the default 'en' render.
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
