import { Shield, Truck, Users, CheckCircle } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { HeroSlider } from '../components/HeroSlider';
import { ProductCard } from '../components/ProductCard';

export default function Home() {
  const { t } = useLanguage();

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
            <ProductCard
              title={t('completeSolarSystems')}
              description={t('completeSolarSystemsDesc')}
              image="https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
              linkText={t('viewSystems')}
              category="solar-systems"
            />
            
            <ProductCard
              title={t('solarPanels')}
              description={t('solarPanelsDesc')}
              image="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
              linkText={t('viewPanels')}
              category="panels"
            />
            
            <ProductCard
              title={t('inverters')}
              description={t('invertersDesc')}
              image="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
              linkText={t('viewInverters')}
              category="inverters"
            />
            
            <ProductCard
              title={t('batteries')}
              description={t('batteriesDesc')}
              image="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
              linkText={t('viewBatteries')}
              category="batteries"
            />
            
            <ProductCard
              title={t('generators')}
              description={t('generatorsDesc')}
              image="https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
              linkText={t('viewGenerators')}
              category="generators"
            />
            
            <ProductCard
              title={t('accessories')}
              description={t('accessoriesDesc')}
              image="https://images.unsplash.com/photo-1581092921461-eab62e97a780?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
              linkText={t('viewAccessories')}
              category="accessories"
            />
          </div>
        </div>
      </section>

      {/* About Preview Section */}
      <section className="py-16 bg-excalibur-light">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-800 mb-6">
                {t('aboutTitle')}
              </h2>
              <div className="space-y-4 text-lg text-excalibur-gray">
                <p>{t('aboutText1')}</p>
                <p>{t('aboutText2')}</p>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-excalibur-blue">35</div>
                  <div className="text-sm text-excalibur-gray">{t('yearsExperience')}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-excalibur-orange">20+</div>
                  <div className="text-sm text-excalibur-gray">{t('solarSystems')}</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <img
                src="https://images.unsplash.com/photo-1586953208448-b95a79798f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500"
                alt="Warehouse in Cuba"
                className="rounded-xl shadow-lg w-full"
                loading="lazy"
              />
              
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {t('ourWarehouse')}
                </h3>
                <p className="text-excalibur-gray">
                  {t('warehouseDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content Section - Why Solar in Cuba */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-800 mb-6">
                ¿Por qué elegir energía solar en Cuba?
              </h2>
              <p className="text-xl text-excalibur-gray leading-relaxed">
                Cuba tiene más de 300 días de sol al año, convirtiendo la energía solar en la mejor inversión energética. 
                Nuestros sistemas reducen tu factura eléctrica hasta en 90% y proporcionan independencia energética completa.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="text-center p-6 bg-excalibur-light rounded-xl">
                <div className="text-3xl font-bold text-excalibur-blue mb-4">300+</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Días de sol anuales</h3>
                <p className="text-excalibur-gray">Irradiación solar promedio de 5.5 kWh/m² ideal para generación fotovoltaica</p>
              </div>
              <div className="text-center p-6 bg-excalibur-light rounded-xl">
                <div className="text-3xl font-bold text-excalibur-orange mb-4">90%</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Reducción en factura</h3>
                <p className="text-excalibur-gray">Ahorro promedio en costos de electricidad con sistema solar dimensionado correctamente</p>
              </div>
              <div className="text-center p-6 bg-excalibur-light rounded-xl">
                <div className="text-3xl font-bold text-green-600 mb-4">25</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Años de garantía</h3>
                <p className="text-excalibur-gray">Garantía de rendimiento en paneles solares respaldada por fabricantes internacionales</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                El mercado solar cubano en crecimiento
              </h3>
              <p className="text-excalibur-gray leading-relaxed mb-4">
                El mercado solar cubano está en crecimiento exponencial. Con las nuevas regulaciones gubernamentales 
                que permiten la venta de excedentes a la red nacional, invertir en energía solar nunca ha sido más rentable.
              </p>
              <p className="text-excalibur-gray leading-relaxed">
                Como representantes oficiales de Excalibur Power Group y con el respaldo de AFDL Import & Export de Alemania, 
                garantizamos productos de calidad internacional a precios competitivos, con stock disponible en nuestro 
                almacén de Havanna del Este para entrega inmediata.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
