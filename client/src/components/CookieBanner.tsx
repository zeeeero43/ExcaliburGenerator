import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { X, Settings, Check } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function CookieBanner() {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    localStorage.setItem('cookie-consent', JSON.stringify(allAccepted));
    setIsVisible(false);
    
    // Initialize tracking scripts if analytics accepted
    if ((window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        'analytics_storage': 'granted',
        'ad_storage': 'granted'
      });
    }
  };

  const acceptSelected = () => {
    localStorage.setItem('cookie-consent', JSON.stringify(preferences));
    setIsVisible(false);
    
    // Update consent for tracking
    if ((window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        'analytics_storage': preferences.analytics ? 'granted' : 'denied',
        'ad_storage': preferences.marketing ? 'granted' : 'denied'
      });
    }
  };

  const rejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    localStorage.setItem('cookie-consent', JSON.stringify(onlyNecessary));
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-black/50 backdrop-blur-sm">
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-6">
          {!showSettings ? (
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">
                  {t('cookieBanner.title')}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {t('cookieBanner.description')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    onClick={acceptAll}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {t('cookieBanner.acceptAll')}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowSettings(true)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {t('cookieBanner.settings')}
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={rejectAll}
                    className="text-gray-600"
                  >
                    {t('cookieBanner.rejectAll')}
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="self-start lg:self-center"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {t('cookieBanner.settingsTitle')}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{t('cookieBanner.necessary')}</h4>
                    <p className="text-sm text-gray-600">{t('cookieBanner.necessaryDesc')}</p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">{t('cookieBanner.required')}</span>
                    <input 
                      type="checkbox" 
                      checked={true} 
                      disabled 
                      className="w-4 h-4"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{t('cookieBanner.analytics')}</h4>
                    <p className="text-sm text-gray-600">{t('cookieBanner.analyticsDesc')}</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      analytics: e.target.checked
                    }))}
                    className="w-4 h-4"
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{t('cookieBanner.marketing')}</h4>
                    <p className="text-sm text-gray-600">{t('cookieBanner.marketingDesc')}</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      marketing: e.target.checked
                    }))}
                    className="w-4 h-4"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={acceptAll}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  {t('cookieBanner.acceptAll')}
                </Button>
                <Button 
                  onClick={acceptSelected}
                  variant="outline"
                >
                  {t('cookieBanner.acceptSelected')}
                </Button>
                <Button 
                  variant="ghost"
                  onClick={rejectAll}
                  className="text-gray-600"
                >
                  {t('cookieBanner.rejectAll')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}