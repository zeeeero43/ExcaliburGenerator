import { useState, useEffect, useRef } from 'react';

interface TurnstileVerificationProps {
  onVerified: () => void;
  isVisible: boolean;
}

declare global {
  interface Window {
    turnstile: {
      render: (elementId: string | HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        'error-callback'?: () => void;
        'expired-callback'?: () => void;
        theme?: 'light' | 'dark';
        size?: 'normal' | 'compact';
      }) => string;
      ready: (callback: () => void) => void;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string;
      execute: (elementId?: string) => void;
      isExpired: (widgetId?: string) => boolean;
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
      if (scriptLoaded.current && window.turnstile) {
        console.log('✅ Turnstile script already loaded');
        resolve();
        return;
      }

      // Check if script is already in DOM
      const existingScript = document.querySelector('script[src*="turnstile"]');
      if (existingScript && window.turnstile) {
        scriptLoaded.current = true;
        console.log('✅ Found existing Turnstile script');
        resolve();
        return;
      }

      console.log('🔄 Loading Turnstile script with window callback...');
      
      // Define global callback function for Turnstile to call
      const callbackName = `onTurnstileLoad_${Date.now()}`;
      (window as any)[callbackName] = () => {
        console.log('✅ Turnstile loaded via window callback');
        scriptLoaded.current = true;
        resolve();
        // Clean up the global callback
        delete (window as any)[callbackName];
      };

      const script = document.createElement('script');
      script.src = `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=${callbackName}`;
      script.async = true;
      script.defer = true;
      
      let timeout: NodeJS.Timeout;
      
      script.onerror = (error) => {
        clearTimeout(timeout);
        console.error('❌ Failed to load Turnstile script:', error);
        delete (window as any)[callbackName];
        reject(new Error('Failed to load Turnstile script'));
      };

      // Add timeout
      timeout = setTimeout(() => {
        console.error('❌ Turnstile script loading timeout');
        delete (window as any)[callbackName];
        reject(new Error('Script loading timeout'));
      }, 15000);

      console.log('📦 Adding script to document head...');
      document.head.appendChild(script);
    });
  };

  const renderTurnstile = () => {
    if (!turnstileRef.current) {
      console.error('❌ Turnstile ref not available');
      setError('Failed to load security verification');
      setIsLoading(false);
      return;
    }

    if (!window.turnstile) {
      console.error('❌ Turnstile global not available for rendering');
      setError('Failed to load security verification');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🎯 Rendering Turnstile widget with explicit rendering...');
      
      // Use turnstile.ready() to ensure the API is fully initialized
      window.turnstile.ready(() => {
        try {
          widgetId.current = window.turnstile.render(turnstileRef.current!, {
            sitekey: SITE_KEY,
            callback: handleTurnstileSuccess,
            'error-callback': handleTurnstileError,
            'expired-callback': handleTurnstileExpired,
            theme: 'light',
            size: 'normal'
          });
          console.log('✅ Turnstile widget rendered successfully:', widgetId.current);
          setIsLoading(false);
        } catch (renderError) {
          console.error('❌ Failed to render within ready callback:', renderError);
          setError('Failed to load security verification');
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('❌ Failed to setup Turnstile rendering:', error);
      setError('Failed to load security verification');
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
        setError('Verification failed. Please try again.');
        resetTurnstile();
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Network error. Please try again.');
      resetTurnstile();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTurnstileError = () => {
    setError('Security verification failed. Please reload the page.');
    setIsVerifying(false);
  };

  const handleTurnstileExpired = () => {
    setError('Verification expired. Please try again.');
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
        setError('Failed to load security verification');
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
          <p className="text-excalibur-gray/70">Security Verification</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-excalibur-blue border-t-transparent rounded-full animate-spin"></div>
            <p className="text-excalibur-gray">Loading security verification...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-left">
              <h2 className="text-lg font-semibold text-excalibur-gray mb-2">
                Security Check Required
              </h2>
              <p className="text-sm text-excalibur-gray/70 mb-4">
                To protect against automated requests, we perform a brief security check. 
                This will only take a few seconds.
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
                <span className="text-sm">Verifying...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
                <div className="mt-3 space-y-2">
                  <button 
                    onClick={resetTurnstile}
                    className="block w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Try again
                  </button>
                  {process.env.NODE_ENV === 'development' && (
                    <button 
                      onClick={() => {
                        console.log('🧪 Development bypass activated');
                        onVerified();
                      }}
                      className="block w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                    >
                      Development Bypass (Skip Verification)
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="text-xs text-excalibur-gray/50 border-t border-gray-200 pt-4">
              <p>This security verification is provided by Cloudflare.</p>
              <p>Your data is handled confidentially.</p>
              {process.env.NODE_ENV === 'development' && (
                <p className="text-orange-600 mt-1">Development mode: External script loading may be restricted.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}