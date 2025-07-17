import { Shield, Truck, Users, CheckCircle, Zap, Ship, Warehouse, MessageCircle, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../hooks/useLanguage';
import { HeroSlider } from '../components/HeroSlider';
import { ProductCard } from '../components/ProductCard';
import { FormattedText } from '../components/FormattedText';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Link } from 'wouter';
import type { Product, Category } from '@shared/schema';

export default function Home() {
  const { t, currentLanguage } = useLanguage();
  
  // Fetch categories from database (same as Products.tsx)
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Load contact settings from admin panel
  const { data: siteSettings = [] } = useQuery<any[]>({
    queryKey: ['/api/site-settings'],
    retry: false,
  });

  // Helper function to get contact info from admin settings
  const getContactInfo = (key: string, fallback: string) => {
    const setting = siteSettings.find(s => s.key === key);
    return setting?.value || fallback;
  };

  // Helper function to get localized text (same as Products.tsx)
  const getLocalizedText = (item: any, field: string) => {
    if (!item) return '';
    const langField = `${field}${currentLanguage === 'es' ? 'Es' : currentLanguage === 'de' ? 'De' : currentLanguage === 'en' ? 'En' : ''}`;
    return item[langField] || item[field] || '';
  };

  return (
    <div>
      {/* Hero Section */}
      <HeroSlider />

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 lg:px-1 xl:px-0">
          {/* Categories Grid - same as Products.tsx */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Card 
                key={category.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer group relative"
                onClick={() => window.location.href = `/products?category=${category.id}`}
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
                          window.location.href = `/products?category=${category.id}`;
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
      </section>

      {/* About Excalibur Power Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6 text-gray-800">
              {t('heroTitle1') as string}
            </h2>
            <p className="text-2xl font-light mb-8 text-excalibur-blue">
              {t('heroSubtitle') as string}
            </p>
            
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 mb-8">
              <div className="text-lg leading-relaxed mb-6 text-gray-700">
                <FormattedText text={t('aboutText1') as string} />
              </div>
              <div className="inline-block bg-excalibur-orange text-white px-6 py-3 rounded-lg font-semibold text-lg">
                {t('slogan') as string}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <Shield className="w-12 h-12 mx-auto mb-4 text-excalibur-blue" />
                <h3 className="text-xl font-semibold mb-2 text-gray-800">{t('experience') as string}</h3>
                <div className="text-gray-600">
                  <FormattedText text={t('experienceDesc') as string} />
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <Ship className="w-12 h-12 mx-auto mb-4 text-excalibur-blue" />
                <h3 className="text-xl font-semibold mb-2 text-gray-800">{t('directImport') as string}</h3>
                <div className="text-gray-600">
                  <FormattedText text={t('directImportDesc') as string} />
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <Users className="w-12 h-12 mx-auto mb-4 text-excalibur-blue" />
                <h3 className="text-xl font-semibold mb-2 text-gray-800">{t('homeLocation') as string}</h3>
                <div className="text-gray-600">
                  <FormattedText text={t('homeLocationDesc') as string} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">
              {t('ourServices') as string}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
              <div className="text-center">
                <div className="bg-excalibur-light rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-excalibur-blue" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('solarSystems') as string}</h3>
                <p className="text-gray-600">{t('solarSystemsDesc') as string}</p>
              </div>
              
              <div className="text-center">
                <div className="bg-excalibur-light rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-excalibur-blue" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('components') as string}</h3>
                <p className="text-gray-600">{t('componentsDesc') as string}</p>
              </div>
              
              <div className="text-center">
                <div className="bg-excalibur-light rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-excalibur-blue" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('technicalSupport') as string}</h3>
                <p className="text-gray-600">{t('technicalSupportDesc') as string}</p>
              </div>
              
              <div className="text-center">
                <div className="bg-excalibur-light rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-excalibur-blue" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('generators') as string}</h3>
                <p className="text-gray-600">{t('generatorsDesc') as string}</p>
              </div>
              
              <div className="text-center">
                <div className="bg-excalibur-light rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-excalibur-blue" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('constructionMachines') as string}</h3>
                <p className="text-gray-600">{t('constructionMachinesDesc') as string}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                {t('contactUs') as string}
              </h2>
              <p className="text-xl text-gray-600">
                {t('contactDesc') as string}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-3">{t('technicalAdvisory') as string}</h3>
                <p className="text-gray-600 mb-2">{t('supportSales') as string}</p>
                <div className="flex items-center justify-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-green-500" />
                  <a href={`tel:${getContactInfo('contact_technical_phone', '+49 160 323 9439').replace(/\s/g, '')}`} className="text-excalibur-blue font-semibold hover:underline">
                    {getContactInfo('contact_technical_phone', '+49 160 323 9439')}
                  </a>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-3">{t('salesLabel') as string}</h3>
                <p className="text-gray-600 mb-2">{t('administrationSales') as string}</p>
                <div className="flex items-center justify-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-green-500" />
                  <a href={`tel:${getContactInfo('contact_sales_phone', '+53 5878 1416').replace(/\s/g, '')}`} className="text-excalibur-blue font-semibold hover:underline">
                    {getContactInfo('contact_sales_phone', '+53 5878 1416')}
                  </a>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Warehouse className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold mb-3">{t('warehouseDelivery') as string}</h3>
                <p className="text-gray-600 mb-2">{t('deliveryPickup') as string}</p>
                <div className="flex items-center justify-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-green-500" />
                  <a href={`tel:${getContactInfo('contact_warehouse_phone', '+53 54 73 14 90').replace(/\s/g, '')}`} className="text-excalibur-blue font-semibold hover:underline">
                    {getContactInfo('contact_warehouse_phone', '+53 54 73 14 90')}
                  </a>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <p className="text-gray-600 mb-4">{t('emailLabel') as string}</p>
              <div className="flex flex-wrap justify-center gap-4">
                <a href="mailto:info@excalibur-cuba.com" className="bg-excalibur-blue text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                  info@excalibur-cuba.com
                </a>
                <a href="mailto:venta@excalibur-cuba.com" className="bg-excalibur-orange text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors">
                  venta@excalibur-cuba.com
                </a>
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
              {t('solarEnergyTitle')}
            </h2>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 mb-6">
                {t('solarEnergyDescription')}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-blue-800 mb-3">
                    {t('solarAdvantagesTitle')}
                  </h3>
                  <ul className="text-gray-700 space-y-2">
                    <li>{t('solarAdvantage1')}</li>
                    <li>{t('solarAdvantage2')}</li>
                    <li>{t('solarAdvantage3')}</li>
                    <li>{t('solarAdvantage4')}</li>
                    <li>{t('solarAdvantage5')}</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-green-800 mb-3">
                    {t('ourSystemsTitle')}
                  </h3>
                  <ul className="text-gray-700 space-y-2">
                    <li>{t('systemFeature1')}</li>
                    <li>{t('systemFeature2')}</li>
                    <li>{t('systemFeature3')}</li>
                    <li>{t('systemFeature4')}</li>
                    <li>{t('systemFeature5')}</li>
                  </ul>
                </div>
              </div>
              
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                {t('generatorsTitle')}
              </h3>
              <p className="text-gray-700 mb-6">
                {t('generatorsDescription')}
              </p>
              
              <div className="bg-gray-50 p-6 rounded-lg mb-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  {t('whyChooseTitle')}
                </h4>
                <p className="text-gray-700">
                  {t('whyChooseDescription')}
                </p>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-yellow-800 mb-3">
                  {t('monthlyImportsTitle')}
                </h4>
                <p className="text-yellow-700">
                  {t('monthlyImportsDescription')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}