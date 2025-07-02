import { useLanguage } from '../hooks/useLanguage';
import { Button } from './ui/button';

export function LanguageSwitcher() {
  const { currentLanguage, switchLanguage } = useLanguage();

  return (
    <div className="flex space-x-1">
      <Button
        variant={currentLanguage === 'es' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => switchLanguage('es')}
        className="px-2 py-1"
      >
        ES
      </Button>
      <Button
        variant={currentLanguage === 'de' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => switchLanguage('de')}
        className="px-2 py-1"
      >
        DE
      </Button>
      <Button
        variant={currentLanguage === 'en' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => switchLanguage('en')}
        className="px-2 py-1"
      >
        EN
      </Button>
    </div>
  );
}
