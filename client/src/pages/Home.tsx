import { Shield, Truck, Users, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../hooks/useLanguage';
import { HeroSlider } from '../components/HeroSlider';
import { ProductCard } from '../components/ProductCard';
import type { Product, Category } from '@shared/schema';

export default function Home() {
  const { t, currentLanguage } = useLanguage();
  
  // Fetch featured products and categories from database
  const { data: featuredProducts = [] } = useQuery<Product[]>({
    queryKey: ['/api/products/featured'],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  return (
    <div>
      {/* Hero Section */}
      <HeroSlider />

      {/* Features Bar */}
      <section className="bg-excalibur-light py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <Shield className="w-12 h-12 text-excalibur-blue mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {t('bestQuality')}
              </h3>
              <p className="text-excalibur-gray">
                {t('bestQualityDesc')}
              </p>
            </div>
            <div className="flex flex-col items-center">
              <Truck className="w-12 h-12 text-excalibur-orange mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {t('fastDelivery')}
              </h3>
              <p className="text-excalibur-gray">
                {t('fastDeliveryDesc')}
              </p>
            </div>
            <div className="flex flex-col items-center">
              <Users className="w-12 h-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {t('technicalSupport')}
              </h3>
              <p className="text-excalibur-gray">
                {t('technicalSupportDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              {t('ourProducts')}
            </h2>
            <p className="text-xl text-excalibur-gray">
              {t('productsSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Only show products that are explicitly featured by admin */}
            {featuredProducts.length > 0 ? (
              featuredProducts.map((product) => {
                let title, description;
                
                switch (currentLanguage) {
                  case 'de':
                    title = product.nameDe;
                    description = product.shortDescriptionDe;
                    break;
                  case 'en':
                    title = product.nameEn;
                    description = product.shortDescriptionEn;
                    break;
                  default:
                    title = product.nameEs;
                    description = product.shortDescriptionEs;
                }

                return (
                  <ProductCard
                    key={product.id}
                    title={title || product.nameEs}
                    description={description || product.shortDescriptionEs}
                    image={product.mainImage || "https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"}
                    linkText={t('viewDetails')}
                    category={product.slug}
                  />
                );
              })
            ) : (
              /* Show empty state - admin must create and feature products */
              <div className="col-span-full text-center py-16">
                <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Keine Produkte verfügbar
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Erstellen Sie Produkte im Admin-Panel und markieren Sie sie als "Empfohlen", 
                    damit sie auf der Startseite angezeigt werden.
                  </p>
                  <p className="text-sm text-gray-500">
                    Login: /admin/login (admin/admin123)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About Section with Cuba focus */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">
              {t('aboutUs')}
            </h2>
            <p className="text-xl text-excalibur-gray mb-8">
              {t('aboutUsSubtitle')}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <CheckCircle className="w-8 h-8 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-3">{t('qualityProducts')}</h3>
                <p className="text-gray-600">{t('qualityProductsDesc')}</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <Truck className="w-8 h-8 text-excalibur-blue mb-4" />
                <h3 className="text-xl font-semibold mb-3">{t('reliableShipping')}</h3>
                <p className="text-gray-600">{t('reliableShippingDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              {t('solarEnergyInCuba')}
            </h2>
            
            <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
              <p>
                {t('solarEnergyIntro')}
              </p>
              
              <h3 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">
                {t('whySolarEnergy')}
              </h3>
              <p>
                {t('whySolarEnergyDesc')}
              </p>
              
              <h3 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">
                {t('ourSolutions')}
              </h3>
              <p>
                {t('ourSolutionsDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}