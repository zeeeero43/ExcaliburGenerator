import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Header } from './Header';
import { Footer } from './Footer';
import { WhatsAppButton } from './WhatsAppButton';
import { CookieBanner } from './CookieBanner';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  // Track page views globally for all pages - only real user pages
  useEffect(() => {
    const trackPageView = async () => {
      try {
        // Only track actual user-facing pages, not development files
        const validPages = ['/', '/products', '/about', '/contact', '/impressum', '/datenschutz'];
        const isProductPage = location.startsWith('/products/') || location.startsWith('/product/');
        const isAdminPage = location.startsWith('/admin') && !location.includes('/admin/login');
        
        // Track only if it's a valid page, product page, or admin page
        if (validPages.includes(location) || isProductPage || isAdminPage) {
          await fetch('/api/track', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              page: location,
              userAgent: navigator.userAgent,
              referrer: document.referrer,
            }),
          });
        }
      } catch (error) {
        console.error('Error tracking page view:', error);
      }
    };
    
    trackPageView();
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col">
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
