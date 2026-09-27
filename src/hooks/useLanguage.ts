import { useState, useEffect } from 'react';
import type { Language } from '@/lib/i18n';
import { translations } from '@/lib/i18n';

export function useLanguage() {
  const [lang, setLang] = useState<Language>('id');

  useEffect(() => {
    // Load from local storage on mount
    const saved = localStorage.getItem('soso-payment-lang') as Language;
    if (saved === 'en' || saved === 'id') {
      setLang(saved);
    }
  }, []);

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('soso-payment-lang', newLang);
  };

  const t = translations[lang];

  return { lang, changeLanguage, t };
}
