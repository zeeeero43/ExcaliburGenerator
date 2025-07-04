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

      {/* About Excalibur Power Section */}
      <section className="py-16 bg-gradient-to-r from-excalibur-blue to-blue-700 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">
              EXCALIBUR POWER: SOLAR ANLAGEN, GENERATOREN & MEHR
            </h2>
            <p className="text-2xl font-light mb-8 text-blue-100">
              Wir möchten Cuba erleuchten
            </p>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-8">
              <p className="text-lg leading-relaxed mb-6">
                Wir sind die KKMU Harry Lag Constructions aus Matanzas & repräsentieren die Excalibur Power Group in Cuba. 
                Excalibur gehört zu den führenden Herstellern weltweit für Generatoren, Solar und vielen anderen Komponenten.
              </p>
              <div className="inline-block bg-excalibur-orange text-white px-6 py-3 rounded-lg font-semibold text-lg">
                „Beste Qualität zum besten Preis"
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <Shield className="w-12 h-12 mx-auto mb-4 text-blue-200" />
                <h3 className="text-xl font-semibold mb-2">35 Jahre Erfahrung</h3>
                <p className="text-blue-100">Joint Venture Partner AFDL IMPORT & EXPORT aus Deutschland</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <Truck className="w-12 h-12 mx-auto mb-4 text-blue-200" />
                <h3 className="text-xl font-semibold mb-2">Direkt vom Hersteller</h3>
                <p className="text-blue-100">Containerweise direkt von den Fabriken nach Cuba</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <Users className="w-12 h-12 mx-auto mb-4 text-blue-200" />
                <h3 className="text-xl font-semibold mb-2">Zentral in Havanna</h3>
                <p className="text-blue-100">Lager in Havanna del Este - leicht zu erreichen</p>
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
              Unsere Leistungen für Sie
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-excalibur-light rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-excalibur-blue" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Komplette Solaranlagen</h3>
                <p className="text-gray-600">Ca. 20 verschiedene fertig konfigurierte Systeme</p>
              </div>
              
              <div className="text-center">
                <div className="bg-excalibur-light rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-excalibur-blue" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Einzelkomponenten</h3>
                <p className="text-gray-600">Solarpaneele, Wechselrichter, Batterien und mehr</p>
              </div>
              
              <div className="text-center">
                <div className="bg-excalibur-light rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-excalibur-blue" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Technische Beratung</h3>
                <p className="text-gray-600">Individuelle Beratung für Ihre perfekte Lösung</p>
              </div>
              
              <div className="text-center">
                <div className="bg-excalibur-light rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-8 h-8 text-excalibur-blue" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Generatoren</h3>
                <p className="text-gray-600">Zuverlässige Notstromlösungen aller Größen</p>
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
                Kontaktieren Sie uns
              </h2>
              <p className="text-xl text-gray-600">
                Wir stellen Ihnen gern die für Sie passende Solaranlage nach Ihren Wünschen zusammen
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-3">Technische Beratung</h3>
                <p className="text-gray-600 mb-2">Deutschland</p>
                <a href="tel:+4916032394399" className="text-excalibur-blue font-semibold hover:underline">
                  +49 160 323 9439
                </a>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-3">Administration</h3>
                <p className="text-gray-600 mb-2">Cuba</p>
                <a href="tel:+5358781416" className="text-excalibur-blue font-semibold hover:underline">
                  +53 58 78 1416
                </a>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold mb-3">Lager & Warenausgabe</h3>
                <p className="text-gray-600 mb-2">Havanna del Este</p>
                <a href="tel:+5354731490" className="text-excalibur-blue font-semibold hover:underline">
                  +53 5473 1490
                </a>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <p className="text-gray-600 mb-4">E-Mail Kontakt:</p>
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
                    <li>✓ {t('solarAdvantage1')}</li>
                    <li>✓ {t('solarAdvantage2')}</li>
                    <li>✓ {t('solarAdvantage3')}</li>
                    <li>✓ {t('solarAdvantage4')}</li>
                    <li>✓ {t('solarAdvantage5')}</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-green-800 mb-3">
                    {t('ourSystemsTitle')}
                  </h3>
                  <ul className="text-gray-700 space-y-2">
                    <li>• {t('systemFeature1')}</li>
                    <li>• {t('systemFeature2')}</li>
                    <li>• {t('systemFeature3')}</li>
                    <li>• {t('systemFeature4')}</li>
                    <li>• {t('systemFeature5')}</li>
                  </ul>
                </div>
              </div>
              
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                Generadores de Respaldo: Seguridad Energética Garantizada
              </h3>
              <p className="text-gray-700 mb-6">
                Complementamos nuestros sistemas solares con generadores silenciosos de última generación, 
                proporcionando una solución energética integral que garantiza suministro eléctrico continuo. 
                Nuestros generadores diesel y gasolina ofrecen desde 2KVA hasta 10KVA, ideales para hogares, 
                pequeños negocios y aplicaciones industriales.
              </p>
              
              <div className="bg-gray-50 p-6 rounded-lg mb-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  ¿Por qué elegir Excalibur Power Cuba?
                </h4>
                <p className="text-gray-700">
                  Con 35 años de experiencia en el mercado energético y un sólido respaldo de nuestro partner alemán AFDL IMPORT & EXPORT, 
                  ofrecemos la mejor relación calidad-precio en componentes solares y generadores. Nuestro compromiso es iluminar Cuba 
                  con tecnología de vanguardia y servicio profesional.
                </p>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-yellow-800 mb-3">
                  Importaciones Mensuales - Siempre con Stock Disponible
                </h4>
                <p className="text-yellow-700">
                  Recibimos contenedores mensuales desde Alemania con productos frescos y las últimas tecnologías del mercado. 
                  Nuestro almacén en Havanna del Este mantiene un inventario amplio para satisfacer la demanda inmediata de nuestros clientes.
                  Esto nos permite ofrecer precios competitivos y disponibilidad garantizada.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}