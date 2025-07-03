import { useState } from 'react';
import { Filter, Grid, List } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { productCategories } from '../data/products';

export default function Products() {
  const { t, currentLanguage } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = Object.entries(productCategories).map(([key, category]) => ({
    id: key,
    name: category.name[currentLanguage]
  }));

  const productData = [
    {
      id: 'solar-systems',
      title: t('completeSolarSystems'),
      description: t('completeSolarSystemsDesc'),
      image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
      linkText: t('viewSystems'),
      category: 'solar-systems'
    },
    {
      id: 'panels',
      title: t('solarPanels'),
      description: t('solarPanelsDesc'),
      image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
      linkText: t('viewPanels'),
      category: 'panels'
    },
    {
      id: 'inverters',
      title: t('inverters'),
      description: t('invertersDesc'),
      image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
      linkText: t('viewInverters'),
      category: 'inverters'
    },
    {
      id: 'batteries',
      title: t('batteries'),
      description: t('batteriesDesc'),
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
      linkText: t('viewBatteries'),
      category: 'batteries'
    },
    {
      id: 'generators',
      title: t('generators'),
      description: t('generatorsDesc'),
      image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
      linkText: t('viewGenerators'),
      category: 'generators'
    },
    {
      id: 'accessories',
      title: t('accessories'),
      description: t('accessoriesDesc'),
      image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
      linkText: t('viewAccessories'),
      category: 'accessories'
    }
  ];

  const filteredProducts = selectedCategory === 'all' 
    ? productData 
    : productData.filter(product => product.category === selectedCategory);

  return (
    <div className="py-16 bg-white min-h-screen">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {t('ourProducts')}
          </h1>
          <p className="text-xl text-excalibur-gray">
            {t('productsSubtitle')}
          </p>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <Filter size={20} className="text-excalibur-gray" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('select')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid size={16} />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        <div className={`grid gap-8 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              title={product.title}
              description={product.description}
              image={product.image}
              linkText={product.linkText}
              category={product.category}
              className={viewMode === 'list' ? 'md:flex md:flex-row' : ''}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-excalibur-gray text-lg">
              No se encontraron productos en esta categoría.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
