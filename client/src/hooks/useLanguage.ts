import { useState, useEffect } from 'react';
import { i18n, type Language } from '../lib/i18n';
import { detectLanguageFromLocation } from '../lib/geolocation';
import { useQuery } from '@tanstack/react-query';

export function useLanguage() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('es'); // Default to Spanish for Cuban market
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is admin - always call useQuery unconditionally
  const { data: adminUser } = useQuery({
    queryKey: ['/api/admin/user'],
    retry: false,
  });
  
  const isAdmin = !!adminUser;

  useEffect(() => {
    async function initializeLanguage() {
      try {
        // Check localStorage first
        const savedLang = localStorage.getItem('excalibur-language') as Language;
        if (savedLang && ['es', 'de', 'en'].includes(savedLang)) {
          // If saved language is German but user is not admin, force Spanish
          if (savedLang === 'de' && !isAdmin) {
            console.log('🚫 GERMAN BLOCKED: User is not admin, forcing Spanish');
            setCurrentLanguage('es');
            i18n.setLanguage('es');
            localStorage.setItem('excalibur-language', 'es');
          } else {
            setCurrentLanguage(savedLang);
            i18n.setLanguage(savedLang);
          }
        } else {
          // Detect language from geolocation (never returns 'de' for non-admins)
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
  }, [isAdmin]); // Re-run when admin status changes

  const switchLanguage = (lang: Language) => {
    // Prevent non-admins from switching to German
    if (lang === 'de' && !isAdmin) {
      console.log('🚫 GERMAN SWITCH BLOCKED: User is not admin');
      return;
    }
    
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
