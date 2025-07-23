import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Header } from './Header';
import { Footer } from './Footer';
import { WhatsAppButton } from './WhatsAppButton';
import { CookieBanner } from './CookieBanner';
import { LocalBusinessStructuredData } from './StructuredData';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  // UNIVERSAL PAGE TRACKING: Track every page visit (auch Inkognito)
  useEffect(() => {
    const trackPageVisit = async () => {
      try {
        const response = await fetch('/api/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page: location,
            userAgent: navigator.userAgent,
            referrer: document.referrer || '',
            timestamp: new Date().toISOString()
          }),
        });
      } catch (error) {
        // Silent tracking - no console output
      }
    };

    // Track immediately, even without cookie consent
    trackPageVisit();
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col">
      <LocalBusinessStructuredData />
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
      <CookieBanner />
    </div>
  );
}
