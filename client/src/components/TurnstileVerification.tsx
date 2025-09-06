import { useState, useEffect, useRef } from 'react';

interface TurnstileVerificationProps {
  onVerified: () => void;
  isVisible: boolean;
}

declare global {
  interface Window {
    turnstile: {
      render: (elementId: string, options: {
        sitekey: string;
        callback: (token: string) => void;
        'error-callback'?: () => void;
        'expired-callback'?: () => void;
        theme?: 'light' | 'dark';
        size?: 'normal' | 'compact';
      }) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

export function TurnstileVerification({ onVerified, isVisible }: TurnstileVerificationProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const scriptLoaded = useRef(false);

  const SITE_KEY = "0x4AAAAAABzt-Jv6hk3A31uS";

  const loadTurnstileScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (scriptLoaded.current) {
        resolve();
        return;
      }

      if (window.turnstile) {
        scriptLoaded.current = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        scriptLoaded.current = true;
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Turnstile script'));
      };

      document.head.appendChild(script);
    });
  };

  const renderTurnstile = async () => {
    if (!turnstileRef.current || !window.turnstile) return;

    try {
      widgetId.current = window.turnstile.render(turnstileRef.current, {
        sitekey: SITE_KEY,
        callback: handleTurnstileSuccess,
        'error-callback': handleTurnstileError,
        'expired-callback': handleTurnstileExpired,
        theme: 'light',
        size: 'normal'
      });
    } catch (error) {
      console.error('Failed to render Turnstile:', error);
      setError('Fehler beim Laden der Sicherheitsverifikation');
      setIsLoading(false);
    }
  };

  const handleTurnstileSuccess = async (token: string) => {
    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch('/api/verify-turnstile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
        credentials: 'include'
      });

      const result = await response.json();

      if (result.success) {
        // Set cookie to remember verification
        document.cookie = `turnstile_verified=true; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Strict; Secure`;
        onVerified();
      } else {
        setError('Verifikation fehlgeschlagen. Bitte versuchen Sie es erneut.');
        resetTurnstile();
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.');
      resetTurnstile();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTurnstileError = () => {
    setError('Sicherheitsverifikation fehlgeschlagen. Bitte laden Sie die Seite neu.');
    setIsVerifying(false);
  };

  const handleTurnstileExpired = () => {
    setError('Verifikation abgelaufen. Bitte versuchen Sie es erneut.');
    resetTurnstile();
  };

  const resetTurnstile = () => {
    if (widgetId.current && window.turnstile) {
      window.turnstile.reset(widgetId.current);
    }
    setIsVerifying(false);
    setError(null);
  };

  useEffect(() => {
    if (!isVisible) return;

    const initializeTurnstile = async () => {
      try {
        await loadTurnstileScript();
        setIsLoading(false);
        // Small delay to ensure DOM is ready
        setTimeout(renderTurnstile, 100);
      } catch (error) {
        console.error('Failed to initialize Turnstile:', error);
        setError('Fehler beim Laden der Sicherheitsverifikation');
        setIsLoading(false);
      }
    };

    initializeTurnstile();

    return () => {
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
          widgetId.current = null;
        } catch (error) {
          console.error('Error removing Turnstile widget:', error);
        }
      }
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4 text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-excalibur-blue rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">E</span>
          </div>
          <h1 className="text-2xl font-bold text-excalibur-gray mb-2">Excalibur Cuba</h1>
          <p className="text-excalibur-gray/70">Sicherheitsverifikation</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-excalibur-blue border-t-transparent rounded-full animate-spin"></div>
            <p className="text-excalibur-gray">Lade Sicherheitsverifikation...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-left">
              <h2 className="text-lg font-semibold text-excalibur-gray mb-2">
                Sicherheitsüberprüfung erforderlich
              </h2>
              <p className="text-sm text-excalibur-gray/70 mb-4">
                Zum Schutz vor automatisierten Anfragen führen wir eine kurze Sicherheitsüberprüfung durch. 
                Dies dauert nur wenige Sekunden.
              </p>
            </div>

            {/* Turnstile Widget Container */}
            <div className="flex justify-center">
              <div 
                ref={turnstileRef}
                className="inline-block"
              />
            </div>

            {isVerifying && (
              <div className="flex items-center justify-center gap-2 text-excalibur-blue">
                <div className="w-4 h-4 border-2 border-excalibur-blue border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Verifikation läuft...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
                <button 
                  onClick={resetTurnstile}
                  className="mt-2 text-red-600 text-sm underline hover:no-underline"
                >
                  Erneut versuchen
                </button>
              </div>
            )}

            <div className="text-xs text-excalibur-gray/50 border-t border-gray-200 pt-4">
              <p>Diese Sicherheitsüberprüfung wird von Cloudflare bereitgestellt.</p>
              <p>Ihre Daten werden vertraulich behandelt.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}