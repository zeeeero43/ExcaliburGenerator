import { useState, useEffect } from 'react';
import { Filter, Grid, List, ArrowLeft, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { FormattedText } from '../components/FormattedText';
import { AddToCartButton } from '../components/AddToCartButton';
import type { Product, Category, Subcategory } from '@shared/schema';

export default function Products() {
  const { t, currentLanguage } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCategories, setShowCategories] = useState(true);
  const [showSubcategories, setShowSubcategories] = useState(false);

  // Load real categories from database
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Load subcategories from database
  const { data: subcategories = [] } = useQuery<Subcategory[]>({
    queryKey: ['/api/subcategories'],
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

  // Handle category selection
  const selectCategory = (categoryId: number, categoryName: string) => {
    setSelectedCategory(categoryId);
    setShowCategories(false);
    setShowSubcategories(true);
    window.scrollTo(0, 0);
  };

  // Handle URL parameters on initial load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    
    if (categoryParam && categories.length > 0) {
      const categoryId = parseInt(categoryParam);
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        selectCategory(categoryId, getLocalizedText(category, 'name'));
      }
    }
  }, [categories]); // Depends on categories being loaded

  // Helper function to get availability text (custom or default)
  const getAvailabilityText = (product: any) => {
    if (!product) return t('in_stock');
    
    let customText = '';
    if (currentLanguage === 'es') {
      customText = product.availabilityTextEs || '';
    } else if (currentLanguage === 'de') {
      customText = product.availabilityTextDe || '';
    } else {
      customText = product.availabilityTextEn || '';
    }
    
    // Use custom text if available, otherwise use default translation
    return customText || t(product.stockStatus || 'in_stock');
  };

  // Helper function to check if product has custom availability text
  const hasCustomAvailabilityText = (product: any) => {
    if (!product) return false;
    return !!(product.availabilityTextEs || product.availabilityTextDe || product.availabilityTextEn);
  };

  // Helper function to get effective stock status (considering custom availability)
  const getEffectiveStockStatus = (product: any) => {
    if (!product) return 'in_stock';
    
    // If custom availability text exists, treat as 'limited' (yellow/orange)
    if (hasCustomAvailabilityText(product)) {
      return 'limited';
    }
    
    return product.stockStatus || 'in_stock';
  };

  // Filter subcategories by selected category
  const filteredSubcategories = selectedCategory
    ? subcategories.filter(subcategory => 
        subcategory.isActive && subcategory.categoryId === selectedCategory
      )
    : [];

  // Filter products by selected subcategory
  const filteredProducts = selectedSubcategory
    ? products.filter(product => 
        product.isActive && product.subcategoryId === selectedSubcategory
      )
    : [];

  // Handle subcategory selection
  const selectSubcategory = (subcategoryId: number, subcategoryName: string) => {
    setSelectedSubcategory(subcategoryId);
    setShowSubcategories(false);
    window.scrollTo(0, 0);
  };

  // Handle back to categories
  const backToCategories = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setShowCategories(true);
    setShowSubcategories(false);
    window.scrollTo(0, 0);
  };

  // Handle back to subcategories
  const backToSubcategories = () => {
    setSelectedSubcategory(null);
    setShowSubcategories(true);
    window.scrollTo(0, 0);
  };

  // Get selected category name
  const getSelectedCategoryName = () => {
    if (!selectedCategory) return '';
    const category = categories.find(c => c.id === selectedCategory);
    return category ? getLocalizedText(category, 'name') || 'Kategorie' : '';
  };

  // Get selected subcategory name
  const getSelectedSubcategoryName = () => {
    if (!selectedSubcategory) return '';
    const subcategory = subcategories.find(s => s.id === selectedSubcategory);
    return subcategory ? getLocalizedText(subcategory, 'name') || 'Unterkategorie' : '';
  };

  if (isLoading) {
    return (
      <div className="py-16 bg-white min-h-screen">
        <div className="container mx-auto px-4 lg:px-1 xl:px-0">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

  // Subcategories View
  if (showSubcategories) {
    return (
      <div className="py-16 bg-white min-h-screen">
        <div className="container mx-auto px-4 lg:px-1 xl:px-0">
          {/* Header */}
          <div className="text-center mb-8">
            <Button 
              variant="outline" 
              onClick={backToCategories}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('backToCategories')}
            </Button>
            <h1 className="text-3xl font-bold text-gray-800 mb-8">
              {getSelectedCategoryName()}
            </h1>
          </div>

          {/* Subcategories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSubcategories.map((subcategory) => (
              <Card 
                key={subcategory.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer group relative"
                onClick={() => selectSubcategory(subcategory.id, getLocalizedText(subcategory, 'name'))}
              >
                <CardContent className="p-0">
                  {/* Subcategory Image with overlay button */}
                  <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden relative">
                    <img
                      src={subcategory.image || 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=500&h=300&fit=crop'}
                      alt={getLocalizedText(subcategory, 'name')}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=500&h=300&fit=crop';
                      }}
                    />
                    
                    {/* Button positioned top-right over image */}
                    <div className="absolute top-2 right-2">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="bg-green-600 text-white hover:bg-green-700 shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectSubcategory(subcategory.id, getLocalizedText(subcategory, 'name'));
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {t('viewDetails')}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Subcategory Info - smaller padding */}
                  <div className="p-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {getLocalizedText(subcategory, 'name')}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>


        </div>
      </div>
    );
  }

  // Categories View
  if (showCategories) {
    return (
      <div className="py-16 bg-white min-h-screen">
        <div className="container mx-auto px-4 lg:px-1 xl:px-0">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-8">
              {t('ourProducts')}
            </h1>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Card 
                key={category.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer group relative"
                onClick={() => selectCategory(category.id, getLocalizedText(category, 'name'))}
              >
                <CardContent className="p-0">
                  {/* Category Image with overlay button */}
                  <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden relative">
                    <img
                      src={category.image}
                      alt={getLocalizedText(category, 'name')}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=500&h=300&fit=crop';
                      }}
                    />
                    
                    {/* Button positioned top-right over image */}
                    <div className="absolute top-2 right-2">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="bg-green-600 text-white hover:bg-green-700 shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectCategory(category.id, getLocalizedText(category, 'name'));
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {t('viewDetails')}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Category Info - smaller padding */}
                  <div className="p-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {getLocalizedText(category, 'name')}
                    </h3>
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
      <div className="container mx-auto px-4 lg:px-1 xl:px-0">
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
            <h1 className="text-4xl font-bold text-gray-800 mb-8">
              {getSelectedCategoryName()}
            </h1>
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
            <div className="text-gray-500">
              <FormattedText text={t('noProductsMessage')} />
            </div>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
            : "space-y-4"
          }>
            {filteredProducts.map((product) => (
              <div key={product.id} className="group">
                <Link to={`/product/${product.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1 cursor-pointer">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img
                        src={product.mainImage || 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=500&h=500&fit=crop'}
                        alt={getLocalizedText(product, 'name')}
                        className="w-full h-56 object-contain bg-gray-100 transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1559302504-64aae6ca6834?w=500&h=500&fit=crop';
                        }}
                      />
                      {product.isFeatured && (
                        <Badge className="absolute top-3 left-3 bg-excalibur-orange text-white">
                          {t('featured')}
                        </Badge>
                      )}
                      
                      {/* Details Button - Top Right */}
                      <div className="absolute top-2 right-2">
                        <Button 
                          variant="default" 
                          size="xs" 
                          className="bg-green-600 text-white hover:bg-green-700 shadow-lg text-xs px-2 py-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          {t('viewDetails')}
                        </Button>
                      </div>
                    </div>
                    
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg group-hover:text-excalibur-blue transition-colors">
                        {getLocalizedText(product, 'name')}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      {/* Price removed as per customer feedback */}
                    </CardContent>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        )}



        {/* Call to Action */}
        <div className="mt-8 text-center bg-gray-50 rounded-lg p-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">
            {t('needCustomSolution')}
          </h3>
          <div className="text-gray-600 mb-6 max-w-2xl mx-auto">
            <FormattedText text={t('customSolutionDescription')} />
          </div>
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