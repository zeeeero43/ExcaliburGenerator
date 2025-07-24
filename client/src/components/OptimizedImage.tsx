import { useState, useRef, useEffect } from 'react';
import { usePerformance } from '../hooks/usePerformance';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
}

export function OptimizedImage({ 
  src, 
  alt, 
  className = '', 
  fallbackSrc = '/api/placeholder/400/300',
  loading = 'lazy',
  priority = false 
}: OptimizedImageProps) {
  const { getOptimizedImageUrl, isCubanOptimized } = usePerformance();
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // 🇨🇺 CUBAN OPTIMIZATION: Immediate loading for high priority images
    if (priority || loading === 'eager') {
      setImageSrc(getOptimizedImageUrl(src));
      return;
    }

    // Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(getOptimizedImageUrl(src));
            observer.disconnect();
          }
        });
      },
      { 
        rootMargin: isCubanOptimized ? '50px' : '100px' // Smaller buffer for Cuban users
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src, getOptimizedImageUrl, priority, loading, isCubanOptimized]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
    }
  };

  // 🇨🇺 CUBAN OPTIMIZATION: Show placeholder immediately for faster perceived loading
  const showPlaceholder = !isLoaded && !hasError && isCubanOptimized;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {showPlaceholder && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <span className="text-gray-400 text-sm">Cargando...</span>
        </div>
      )}
      
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={`
          transition-opacity duration-300 
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
          ${isCubanOptimized ? 'image-rendering-optimize-speed' : ''}
          w-full h-full object-cover
        `}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        decoding={isCubanOptimized ? 'sync' : 'async'}
      />
    </div>
  );
}