import { useState, useRef, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

/**
 * 🇨🇺 CUBA PERFORMANCE: Lazy loading image component for slow internet
 * Only loads images when they become visible in the viewport
 */
export function LazyImage({ src, alt, className = '', fallbackSrc }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>(src);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image becomes visible
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Handle image load error with fallback
  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      console.log(`🖼️ Image failed to load: ${currentSrc}`);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      {/* Placeholder while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-sm">
            🌅 Loading...
          </div>
        </div>
      )}
      
      {/* Actual image - only load when in view */}
      <img
        ref={imgRef}
        src={isInView ? currentSrc : undefined}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy" // Native lazy loading as fallback
        decoding="async" // Async decoding for better performance
      />
    </div>
  );
}