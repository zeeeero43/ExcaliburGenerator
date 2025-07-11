import { ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent } from './ui/card';
import { FormattedText } from './FormattedText';

interface ProductCardProps {
  title: string;
  description: string;
  image: string;
  linkText: string;
  category: string;
  className?: string;
}

export function ProductCard({ title, description, image, linkText, category, className = "" }: ProductCardProps) {
  return (
    <Link href={`/product/${category}`}>
      <Card className={`group cursor-pointer card-enhanced hover-lift overflow-hidden ${className}`}>
        <div className="aspect-video bg-gray-100 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-excalibur-blue transition-colors">
            {title}
          </h3>
          <div className="text-excalibur-gray mb-4 leading-relaxed">
            <FormattedText 
              text={typeof description === 'string' ? description : ''} 
              maxLength={150}
              className="text-excalibur-gray"
            />
          </div>
          <div className="flex items-center text-excalibur-blue font-semibold group-hover:text-excalibur-orange transition-colors">
            <span>{linkText}</span>
            <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
