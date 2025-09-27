import { ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent } from './ui/card';
import { FormattedText } from './FormattedText';
import { OptimizedImage } from './OptimizedImage';
import { usePerformance } from '../hooks/usePerformance';

interface ProductCardProps {
  title: string;
  description: string;
  image: string;
  linkText: string;
  category: string;
  className?: string;
}

export function ProductCard({ title, description, image, linkText, category, className = "" }: ProductCardProps) {
  const { settings } = usePerformance();
  
  return (
    <Link href={`/product/${category}`}>
      <Card className={`group cursor-pointer card-enhanced hover-lift overflow-hidden ${className}`}>
        <div className="aspect-square md:aspect-video bg-gray-100 overflow-hidden">
          <OptimizedImage
            src={image}
            alt={title}
            className={`w-full h-full object-contain ${
              settings.enableAnimations 
                ? 'group-hover:scale-105 transition-transform duration-300' 
                : ''
            }`}
            fallbackSrc="/api/placeholder/400/300"
            loading="lazy"
          />
        </div>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 group-hover:text-excalibur-blue transition-colors">
            {title}
          </h3>
          <div className="flex items-center text-excalibur-blue font-semibold group-hover:text-excalibur-orange transition-colors">
            <span>{linkText}</span>
            <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
