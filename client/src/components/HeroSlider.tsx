import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from './ui/button';
import type { SiteSetting } from '@shared/schema';

interface Slide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonAction: () => void;
}

export function HeroSlider() {
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Lade Site-Settings für die Hero-Bilder (öffentlicher Endpoint)
  const { data: siteSettings = [] } = useQuery<SiteSetting[]>({
    queryKey: ['/api/site-settings'],
    retry: false,
  });

  // Helfer-Funktion um Bild-URL aus Settings zu holen
  const getImageUrl = (key: string, fallback: string) => {
    const setting = siteSettings.find(s => s.key === key);
    return setting?.value || fallback;
  };

  const slides: Slide[] = [
    {
      id: 1,
      image: getImageUrl('hero_image_1', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080'),
      title: t('heroTitle1'),
      subtitle: '',
      buttonText: t('viewProducts'),
      buttonAction: () => window.location.href = '/products'
    },
    {
      id: 2,
      image: getImageUrl('hero_image_2', 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080'),
      title: t('heroTitle2'),
      subtitle: '',
      buttonText: t('viewProducts'),
      buttonAction: () => window.location.href = '/products'
    },
    {
      id: 3,
      image: getImageUrl('hero_image_3', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080'),
      title: t('heroTitle3'),
      subtitle: '',
      buttonText: t('viewProducts'),
      buttonAction: () => window.location.href = '/products'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/30 z-10"></div>
      
      {/* Slides */}
      <div className="relative h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="text-center text-white max-w-4xl px-6">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
                  {slide.title}
                </h1>
                <Button
                  onClick={slide.buttonAction}
                  className="bg-excalibur-orange text-white px-8 py-4 text-lg font-semibold hover:bg-orange-600 transition-colors"
                  size="lg"
                >
                  {slide.buttonText}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-30">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-white scale-125'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
