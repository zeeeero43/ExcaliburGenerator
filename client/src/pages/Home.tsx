import { Shield, Truck, Users, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../hooks/useLanguage';
import { HeroSlider } from '../components/HeroSlider';
import { ProductCard } from '../components/ProductCard';
import { FormattedText } from '../components/FormattedText';
import { Button } from '../components/ui/button';
import { Link } from 'wouter';
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
              <div className="text-excalibur-gray">
                <FormattedText text={t('bestQualityDesc')} />
              </div>
            </div>
            <div className="flex flex-col items-center">
              <Truck className="w-12 h-12 text-excalibur-orange mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {t('fastDelivery')}
              </h3>
              <div className="text-excalibur-gray">
                <FormattedText text={t('fastDeliveryDesc')} />
              </div>
            </div>
            <div className="flex flex-col items-center">
              <Users className="w-12 h-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {t('technicalSupport')}
              </h3>
              <div className="text-excalibur-gray">
                <FormattedText text={t('technicalSupportDesc')} />
              </div>
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
            <div className="text-xl text-excalibur-gray">
              <FormattedText text={t('productsSubtitle')} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Only show products that are explicitly featured by admin */}
            {featuredProducts.length > 0 ? (
              featuredProducts.map((product) => {
                let title: string;
                let description: string;
                
                switch (currentLanguage) {
                  case 'de':
                    title = product.nameDe || product.nameEs || '';
                    description = product.shortDescriptionDe || product.shortDescriptionEs || '';
                    break;
                  case 'en':
                    title = product.nameEn || product.nameEs || '';
                    description = product.shortDescriptionEn || product.shortDescriptionEs || '';
                    break;
                  default:
                    title = product.nameEs || '';
                    description = product.shortDescriptionEs || '';
                }
                
                // Limit description length for better display - use FormattedText for proper rendering
                const shouldTruncate = description && description.length > 120;
                const displayDescription = shouldTruncate ? `${description.substring(0, 120)}...` : description;

                return (
                  <ProductCard
                    key={product.id}
                    title={title}
                    description={description}
                    image={product.mainImage || "https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"}
                    linkText={t('viewDetails')}
                    category={product.slug}
                  />
                );
              })
            ) : (
              /* Show fallback products when no featured products are available */
              <div className="col-span-full text-center py-16">
                <div className="bg-blue-50 rounded-lg p-8 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {t('ourProducts')}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {t('productsSubtitle')}
                  </p>
                  <Link href="/products">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      {t('viewProducts')}
                    </Button>
                  </Link>
                </div>
              </div>
            )}
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
                <Truck className="w-12 h-12 mx-auto mb-4 text-excalibur-blue" />
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
                  <Truck className="w-8 h-8 text-excalibur-blue" />
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
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-3">{t('technicalAdvisory') as string}</h3>
                <p className="text-gray-600 mb-2">{t('germany') as string}</p>
                <a href="tel:+4916032394399" className="text-excalibur-blue font-semibold hover:underline">
                  {t('technicalAdvisoryPhone')}
                </a>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-3">{t('salesLabel') as string}</h3>
                <p className="text-gray-600 mb-2">{t('cuba') as string}</p>
                <a href="tel:+5358781416" className="text-excalibur-blue font-semibold hover:underline">
                  {t('salesPhone')}
                </a>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold mb-3">{t('warehouseDelivery') as string}</h3>
                <p className="text-gray-600 mb-2">{t('havanaLocation') as string}</p>
                <a href="tel:+5354731490" className="text-excalibur-blue font-semibold hover:underline">
                  {t('deliveryPhone')}
                </a>
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