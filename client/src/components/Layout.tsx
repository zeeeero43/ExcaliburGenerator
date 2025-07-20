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

  // SIMPLE ANALYTICS: Only track product clicks - no page tracking
  useEffect(() => {
    console.log(`📊 Navigation to: ${location} (no tracking)`);
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
