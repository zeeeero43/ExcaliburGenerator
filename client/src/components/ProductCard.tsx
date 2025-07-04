import { ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent } from './ui/card';

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
        <div className="aspect-video overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-excalibur-blue transition-colors">
            {title}
          </h3>
          <p className="text-excalibur-gray mb-4 leading-relaxed">
            {description}
          </p>
          <div className="flex items-center text-excalibur-blue font-semibold group-hover:text-excalibur-orange transition-colors">
            <span>{linkText}</span>
            <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
