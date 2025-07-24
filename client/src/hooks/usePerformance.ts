import { useState, useEffect } from 'react';
import { useLanguage } from './useLanguage';

interface PerformanceSettings {
  imageQuality: 'high' | 'medium' | 'low';
  enableAnimations: boolean;
  lazyLoadImages: boolean;
  reduceRequests: boolean;
  compressedMode: boolean;
}

export function usePerformance() {
  const { currentLanguage } = useLanguage();
  const [settings, setSettings] = useState<PerformanceSettings>({
    imageQuality: 'high',
    enableAnimations: true,
    lazyLoadImages: true,
    reduceRequests: false,
    compressedMode: false
  });

  useEffect(() => {
    // 🇨🇺 CUBAN PERFORMANCE OPTIMIZATION: Reduced quality for Spanish users
    if (currentLanguage === 'es') {
      setSettings({
        imageQuality: 'low', // Smaller images for slow internet
        enableAnimations: false, // Disable animations for better performance
        lazyLoadImages: true, // Lazy load all images
        reduceRequests: true, // Bundle requests where possible
        compressedMode: true // Enable all compression features
      });
    } else {
      setSettings({
        imageQuality: 'high',
        enableAnimations: true,
        lazyLoadImages: true,
        reduceRequests: false,
        compressedMode: false
      });
    }
  }, [currentLanguage]);

  // Get optimized image URL based on performance settings
  const getOptimizedImageUrl = (originalUrl: string) => {
    if (!originalUrl) return originalUrl;
    
    if (settings.imageQuality === 'low' && currentLanguage === 'es') {
      // For Cuban users: reduce quality and size
      if (originalUrl.includes('unsplash.com')) {
        return originalUrl.replace('?', '?w=400&q=60&'); // Small, low quality
      }
      if (originalUrl.startsWith('/uploads/')) {
        return originalUrl; // Server-side compression already applied
      }
    }
    
    return originalUrl;
  };

  // Get CSS classes for performance optimization
  const getPerformanceClasses = () => {
    const classes = [];
    
    if (!settings.enableAnimations && currentLanguage === 'es') {
      classes.push('motion-reduce'); // Disable animations for Spanish users
    }
    
    if (settings.compressedMode && currentLanguage === 'es') {
      classes.push('compressed-mode'); // Enable compressed layout
    }
    
    return classes.join(' ');
  };

  return {
    settings,
    getOptimizedImageUrl,
    getPerformanceClasses,
    isCubanOptimized: currentLanguage === 'es'
  };
}