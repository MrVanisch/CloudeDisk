export type Language = 'en' | 'pl';

type Dictionary = {
  [key: string]: string | Dictionary;
};

export const translations: Record<Language, Dictionary> = {
  en: {
    header: {
      mp3Converter: 'MP3 Converter',
      support: 'Support',
      login: 'Log in',
      getStarted: 'Get Started'
    },
    hero: {
      title1: 'Secure storage',
      title2: 'without compromises.',
      subtitle: 'Military-grade encryption for your files with seamless conversion and sharing. Your data is encrypted locally before it ever reaches our servers.',
      startFree: 'Start for free',
      viewPricing: 'View Pricing'
    },
    features: {
      securityTitle: 'Absolute Security',
      securityDesc: 'Military-grade Fernet symmetric encryption ensures nobody but you can access your stored files.',
      cloudTitle: 'Cloud Conversions',
      cloudDesc: 'Convert MP4s to GIFs, resize images, or extract audio dynamically without tying up your computer.',
      sharingTitle: 'Secure Sharing',
      sharingDesc: 'Generate expiring, presigned links to share your encrypted files with clients or friends instantly.'
    },
    plans: {
      title1: 'Choose Your ',
      title2: 'Plan',
      subtitle: 'Simple, transparent pricing for your secure data. No hidden fees.',
      free: {
        name: 'Free',
        price: '0 PLN',
        storage: '1 GB Secure Storage',
        conversions: 'Basic Conversions',
        sharing: 'Secure Sharing',
        cta: 'Get Started'
      },
      premium: {
        name: 'Premium',
        badge: 'Popular',
        price: '29 PLN',
        storage: '50 GB Secure Storage',
        conversions: 'Priority Conversions',
        sharing: 'Extended Sharing',
        support: '24/7 Support',
        cta: 'Go Premium'
      },
      pro: {
        name: 'Pro',
        price: '99 PLN',
        storage: '200 GB Secure Storage',
        conversions: 'Unlimited Conversions',
        api: 'API Access',
        cta: 'Get Pro'
      },
      perMonth: '/mo'
    },
    footer: {
      supportCenter: 'Support & Help Center',
      copyright: '© 2026 CloudVault Secure Storage. All rights reserved.',
      builtWith: 'Built with Security in Mind'
    }
  },
  pl: {
    header: {
      mp3Converter: 'Konwerter MP3',
      support: 'Wsparcie',
      login: 'Zaloguj się',
      getStarted: 'Rozpocznij'
    },
    hero: {
      title1: 'Bezpieczny dysk',
      title2: 'bez kompromisów.',
      subtitle: 'Szyfrowanie wojskowej klasy dla Twoich plików z bezproblemową konwersją i udostępnianiem. Twoje dane są szyfrowane lokalnie, zanim trafią na nasze serwery.',
      startFree: 'Rozpocznij za darmo',
      viewPricing: 'Zobacz cennik'
    },
    features: {
      securityTitle: 'Absolutne Bezpieczeństwo',
      securityDesc: 'Symetryczne szyfrowanie Fernet klasy wojskowej gwarantuje, że nikt poza Tobą nie ma dostępu do Twoich pików.',
      cloudTitle: 'Konwersje w Chmurze',
      cloudDesc: 'Konwertuj MP4 na GIF-y, zmieniaj rozmiar zdjęć lub wyodrębniaj dźwięk dynamicznie, nie obciążając swojego komputera.',
      sharingTitle: 'Bezpieczne Udostępnianie',
      sharingDesc: 'Generuj wygasające, podpisane linki, aby natychmiast udostępniać swoje zaszyfrowane pliki klientom lub znajomym.'
    },
    plans: {
      title1: 'Wybierz Swój ',
      title2: 'Plan',
      subtitle: 'Prosty, przejrzysty cennik dla Twoich bezpiecznych danych. Brak ukrytych opłat.',
      free: {
        name: 'Darmowy',
        price: '0 PLN',
        storage: '1 GB Bezpiecznego Dysku',
        conversions: 'Podstawowe Konwersje',
        sharing: 'Bezpieczne Udostępnianie',
        cta: 'Rozpocznij'
      },
      premium: {
        name: 'Premium',
        badge: 'Popularny',
        price: '29 PLN',
        storage: '50 GB Bezpiecznego Dysku',
        conversions: 'Priorytetowe Konwersje',
        sharing: 'Rozszerzone Udostępnianie',
        support: 'Wsparcie 24/7',
        cta: 'Kup Premium'
      },
      pro: {
        name: 'Pro',
        price: '99 PLN',
        storage: '200 GB Bezpiecznego Dysku',
        conversions: 'Nielimitowane Konwersje',
        api: 'Dostęp do API',
        cta: 'Kup Pro'
      },
      perMonth: '/msc'
    },
    footer: {
      supportCenter: 'Centrum Wsparcia i Pomocy',
      copyright: '© 2026 CloudVault Secure Storage. Wszelkie prawa zastrzeżone.',
      builtWith: 'Zbudowane z myślą o bezpieczeństwie'
    }
  }
};
