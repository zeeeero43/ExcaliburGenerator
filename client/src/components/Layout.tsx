import { ReactNode, useEffect, useRef } from 'react';
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
  const lastTrackedLocation = useRef<string>('');

  // Track page views globally for all pages - only real user pages
  useEffect(() => {
    const trackPageView = async () => {
      try {
        // Avoid tracking the same page multiple times
        if (lastTrackedLocation.current === location) {
          return;
        }

        // STRICT filter - only track real user pages, nothing else
        const isRealUserPage = 
          location === '/' ||
          location === '/products' ||
          location === '/about' ||
          location === '/contact' ||
          location === '/impressum' ||
          location === '/datenschutz' ||
          (location.startsWith('/products/') && !location.includes('.')) ||
          (location.startsWith('/product/') && !location.includes('.')) ||
          (location.startsWith('/admin') && !location.includes('/admin/login') && !location.includes('.'));

        // Block all development files and technical paths
        const isDevelopmentFile = 
          location.includes('/src/') ||
          location.includes('.tsx') ||
          location.includes('.ts') ||
          location.includes('.js') ||
          location.includes('.mjs') ||
          location.includes('.css') ||
          location.includes('/@') ||
          location.includes('/node_modules/') ||
          location.includes('__') ||
          location.includes('hot-update') ||
          location.includes('vite') ||
          location.includes('react-refresh');

        // Only track if it's a real user page AND not a development file
        if (isRealUserPage && !isDevelopmentFile) {
          console.log('Tracking page:', location); // Debug log
          lastTrackedLocation.current = location;
          
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
