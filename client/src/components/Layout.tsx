import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Header } from './Header';
import { Footer } from './Footer';
import { WhatsAppButton } from './WhatsAppButton';
import { CookieBanner } from './CookieBanner';
import { LocalBusinessStructuredData } from './StructuredData';
import { usePerformance } from '../hooks/usePerformance';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { getPerformanceClasses, isCubanOptimized, settings } = usePerformance();

  // 📱 MOBILE-OPTIMIZED TRACKING: Robust tracking for all devices (especially Cuban mobile users)
  useEffect(() => {
    const trackPageVisit = async () => {
      try {
        // Multiple attempts for poor mobile connections
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
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
                timestamp: new Date().toISOString(),
                isMobile: /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
                connectionType: (navigator as any).connection?.effectiveType || 'unknown'
              }),
              signal: AbortSignal.timeout(5000) // 5 second timeout for mobile connections
            });
            
            if (response.ok) {
              break; // Success, exit retry loop
            }
            attempts++;
          } catch (fetchError) {
            attempts++;
            if (attempts < maxAttempts) {
              // Wait before retry (exponential backoff for mobile networks)
              await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            }
          }
        }
      } catch (error) {
        // Silent tracking - no console output, but track attempt in local storage for debugging
        if (typeof window !== 'undefined') {
          const failedAttempts = parseInt(localStorage.getItem('tracking_failures') || '0') + 1;
          localStorage.setItem('tracking_failures', failedAttempts.toString());
        }
      }
    };

    // 🇨🇺 CUBAN OPTIMIZATION: Longer delay for tracking to prioritize page render
    const delay = isCubanOptimized ? 500 : 100;
    const timer = setTimeout(trackPageVisit, delay);
    return () => clearTimeout(timer);
  }, [location]);

  return (
    <div className={`min-h-screen flex flex-col ${getPerformanceClasses()}`}>
      {/* 🇨🇺 CUBAN OPTIMIZATION: Conditional loading of non-essential components */}
      {!settings.reduceRequests && <LocalBusinessStructuredData />}
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
      {/* Load cookie banner with delay for Cuban users */}
      {!isCubanOptimized && <CookieBanner />}
      {isCubanOptimized && (
        <div style={{ display: 'none' }}>
          <CookieBanner />
        </div>
      )}
    </div>
  );
}
