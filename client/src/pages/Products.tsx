import { useState } from 'react';
import { Filter, Grid, List, ArrowLeft, Eye } from 'lucide-react';
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
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCategories, setShowCategories] = useState(true);

  // Load real categories from database
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Load real products from database
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Helper function to get localized text
  const getLocalizedText = (item: any, field: string) => {
    if (!item) return '';
    const langField = `${field}${currentLanguage === 'es' ? 'Es' : currentLanguage === 'de' ? 'De' : currentLanguage === 'en' ? 'En' : ''}`;
    return item[langField] || item[field] || '';
  };

  // Filter products by selected category
  const filteredProducts = selectedCategory
    ? products.filter(product => 
        product.isActive && product.categoryId === selectedCategory
      )
    : [];

  // Handle category selection
  const selectCategory = (categoryId: number, categoryName: string) => {
    setSelectedCategory(categoryId);
    setShowCategories(false);
  };

  // Handle back to categories
  const backToCategories = () => {
    setSelectedCategory(null);
    setShowCategories(true);
  };

  // Get selected category name
  const getSelectedCategoryName = () => {
    if (!selectedCategory) return '';
    const category = categories.find(c => c.id === selectedCategory);
    return category ? getLocalizedText(category, 'name') || 'Kategorie' : '';
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

  // Categories View
  if (showCategories) {
    return (
      <div className="py-16 bg-white min-h-screen">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              {t('ourProducts')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('selectCategory')} - {t('productsSubtitle')}
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => (
              <Card 
                key={category.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => selectCategory(category.id, getLocalizedText(category, 'name'))}
              >
                <CardContent className="p-0">
                  {/* Category Image */}
                  <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                    <img
                      src={category.image || '/api/placeholder/400/250'}
                      alt={getLocalizedText(category, 'name')}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  {/* Category Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {getLocalizedText(category, 'name')}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {getLocalizedText(category, 'description') || 'Kategorie anzeigen'}
                    </p>
                    
                    {/* Product Count */}
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {products.filter(p => p.categoryId === category.id && p.isActive).length} {t('productCount')}
                      </Badge>
                      <Button variant="ghost" size="sm" className="group-hover:bg-excalibur-blue group-hover:text-white">
                        <Eye className="w-4 h-4 mr-2" />
                        {t('viewDetails')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Products View for Selected Category
  return (
    <div className="py-16 bg-white min-h-screen">
      <div className="container mx-auto px-4">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={backToCategories}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToCategories')}
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              {getSelectedCategoryName()}
            </h1>
            <p className="text-xl text-gray-600">
              {filteredProducts.length} {t('productCount')} {t('inThisCategory')}
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-end mb-8">
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
                      src={product.mainImage || 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=500&h=500&fit=crop'}
                      alt={getLocalizedText(product, 'name')}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        // Multiple fallback images for better reliability
                        const fallbacks = [
                          'https://images.unsplash.com/photo-1559302504-64aae6ca6834?w=500&h=500&fit=crop',
                          'https://images.unsplash.com/photo-1580908346710-72e1c4b8b7a5?w=500&h=500&fit=crop',
                          'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=500&h=500&fit=crop'
                        ];
                        
                        const currentSrc = e.currentTarget.src;
                        const currentIndex = fallbacks.findIndex(f => currentSrc.includes(f.split('?')[0].split('/').pop()));
                        
                        if (currentIndex < fallbacks.length - 1) {
                          e.currentTarget.src = fallbacks[currentIndex + 1];
                        }
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