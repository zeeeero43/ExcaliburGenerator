import { useEffect } from 'react';
import { useLocation } from 'wouter';

export function PageViewTracker() {
  const [location] = useLocation();

  useEffect(() => {
    // Track page view
    const trackPageView = async () => {
      try {
        await fetch('/api/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page: location,
            userAgent: navigator.userAgent,
            referrer: document.referrer || '',
          }),
        });
      } catch (error) {
        // Silent fail - don't block user experience
        console.debug('Page tracking failed:', error);
      }
    };

    trackPageView();
  }, [location]);

  return null; // This component renders nothing
}