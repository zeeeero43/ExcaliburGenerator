import { useLanguage } from '../hooks/useLanguage';
import { Button } from './ui/button';

export function LanguageSwitcher() {
  const { currentLanguage, switchLanguage } = useLanguage();

  const handleLanguageChange = (lang: 'es' | 'de' | 'en') => {
    switchLanguage(lang);
    // Force complete page reload to ensure all translations are updated
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <div className="flex space-x-1">
      <Button
        variant={currentLanguage === 'es' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleLanguageChange('es')}
        className="px-2 py-1"
      >
        ES
      </Button>
      <Button
        variant={currentLanguage === 'de' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleLanguageChange('de')}
        className="px-2 py-1"
      >
        DE
      </Button>
      <Button
        variant={currentLanguage === 'en' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleLanguageChange('en')}
        className="px-2 py-1"
      >
        EN
      </Button>
    </div>
  );
}
