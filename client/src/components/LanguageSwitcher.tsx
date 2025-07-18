import { useLanguage } from '../hooks/useLanguage';
import { Button } from './ui/button';
import { useQuery } from '@tanstack/react-query';

export function LanguageSwitcher() {
  const { currentLanguage, switchLanguage } = useLanguage();
  
  // Check if user is admin
  const { data: adminUser } = useQuery({
    queryKey: ['/api/admin/user'],
    retry: false,
  });
  
  const isAdmin = !!adminUser;

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
      {/* DE Button - nur für Admins sichtbar */}
      {isAdmin && (
        <Button
          variant={currentLanguage === 'de' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleLanguageChange('de')}
          className="px-2 py-1"
        >
          DE
        </Button>
      )}
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
