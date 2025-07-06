import { useState, useEffect } from 'react';
import { i18n, type Language } from '../lib/i18n';
import { detectLanguageFromLocation } from '../lib/geolocation';

export function useLanguage() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('es'); // Default to Spanish for Cuban market
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initializeLanguage() {
      try {
        // Check localStorage first
        const savedLang = localStorage.getItem('excalibur-language') as Language;
        if (savedLang && ['es', 'de', 'en'].includes(savedLang)) {
          setCurrentLanguage(savedLang);
          i18n.setLanguage(savedLang);
        } else {
          // Detect language from geolocation
          const detectedLang = await detectLanguageFromLocation();
          const lang = detectedLang as Language;
          setCurrentLanguage(lang);
          i18n.setLanguage(lang);
          localStorage.setItem('excalibur-language', lang);
        }
      } catch (error) {
        console.error('Language initialization failed:', error);
        // Default to Spanish for Cuban market
        setCurrentLanguage('es');
        i18n.setLanguage('es');
      } finally {
        setIsLoading(false);
      }
    }

    initializeLanguage();
  }, []);

  const switchLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    i18n.setLanguage(lang);
    localStorage.setItem('excalibur-language', lang);
  };

  const t = (key: string) => i18n.t(key);

  return {
    currentLanguage,
    switchLanguage,
    t,
    isLoading
  };
}
