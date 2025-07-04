import { useState } from 'react';
import { Filter, Grid, List } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import type { Product, Category } from '@shared/schema';

export default function Products() {
  const { t, currentLanguage } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Load real categories from database
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Load real products from database
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Filter products by category
  const filteredProducts = selectedCategory === 'all'
    ? products.filter(product => product.isActive)
    : products.filter(product => 
        product.isActive && product.categoryId === parseInt(selectedCategory)
      );

  // Helper function to get localized text
  const getLocalizedText = (item: any, field: string) => {
    const langField = `${field}${currentLanguage === 'es' ? 'Es' : currentLanguage === 'de' ? 'De' : currentLanguage === 'en' ? 'En' : ''}`;
    return item[langField] || item[field] || '';
  };

  if (isLoading) {
    return (
      <div className="py-16 bg-white min-h-screen">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-64 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 bg-white min-h-screen">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {t('ourProducts')}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('productsSubtitle')}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 items-center justify-between">
          <div className="flex gap-4 items-center">
            <Filter className="w-5 h-5 text-gray-500" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allCategories')}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {getLocalizedText(category, 'name')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {t('noProductsFound')}
            </h3>
            <p className="text-gray-500">
              {t('noProductsMessage')}
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" 
            : "space-y-6"
          }>
            {filteredProducts.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.slug}`}
                className="block group"
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img
                      src={product.mainImage || '/api/placeholder/500/500'}
                      alt={getLocalizedText(product, 'name')}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = '/api/placeholder/500/500';
                      }}
                    />
                    {product.isFeatured && (
                      <Badge className="absolute top-3 left-3 bg-excalibur-orange text-white">
                        {t('featured')}
                      </Badge>
                    )}
                    <Badge 
                      className={`absolute top-3 right-3 ${
                        product.stockStatus === 'in_stock' 
                          ? 'bg-green-500' 
                          : product.stockStatus === 'limited'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      } text-white`}
                    >
                      {t(product.stockStatus || 'in_stock')}
                    </Badge>
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="text-xl group-hover:text-excalibur-blue transition-colors">
                      {getLocalizedText(product, 'name')}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {getLocalizedText(product, 'shortDescription')}
                    </p>
                    
                    {product.price && (
                      <div className="text-2xl font-bold text-excalibur-blue mb-2">
                        {product.price}€
                      </div>
                    )}
                    
                    <div className="text-excalibur-orange font-semibold group-hover:underline">
                      {t('viewDetails')} →
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center bg-gray-50 rounded-lg p-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">
            {t('needCustomSolution')}
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            {t('customSolutionDescription')}
          </p>
          <Link to="/contact">
            <Button size="lg" className="bg-excalibur-blue hover:bg-blue-700">
              {t('contactUs')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}