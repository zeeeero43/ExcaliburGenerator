import { Shield, Users, Award, Globe } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { Card, CardContent } from '../components/ui/card';

export default function About() {
  const { t } = useLanguage();

  const stats = [
    { number: '35', label: t('yearsExperience') },
    { number: '20+', label: t('solarSystems') },
    { number: '1000+', label: 'Clientes satisfechos' },
    { number: '24/7', label: 'Soporte técnico' }
  ];

  const features = [
    {
      icon: Shield,
      title: 'Calidad Garantizada',
      description: 'Productos certificados internacionalmente con garantías extendidas'
    },
    {
      icon: Users,
      title: 'Equipo Experto',
      description: 'Técnicos especializados con más de 10 años de experiencia'
    },
    {
      icon: Award,
      title: 'Mejor Precio',
      description: 'Compras directas de fábrica para ofrecer los mejores precios'
    },
    {
      icon: Globe,
      title: 'Alcance Internacional',
      description: 'Respaldados por AFDL Import & Export de Alemania'
    }
  ];

  return (
    <div className="py-16 bg-white min-h-screen">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            {t('aboutTitle')}
          </h1>
          <p className="text-xl text-excalibur-gray max-w-3xl mx-auto leading-relaxed">
            Representantes oficiales de Excalibur Power Group en Cuba, 
            ofreciendo soluciones energéticas de alta calidad para iluminar el futuro de Cuba.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-excalibur-blue mb-2">
                {stat.number}
              </div>
              <div className="text-sm md:text-base text-excalibur-gray">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Company Story */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              Nuestra Historia
            </h2>
            <div className="space-y-4 text-lg text-excalibur-gray">
              <p>{t('aboutText1')}</p>
              <p>{t('aboutText2')}</p>
              <p>
                Nuestro almacén en Havanna del Este está estratégicamente ubicado 
                para servir a toda Cuba con entregas rápidas y stock abundante. 
                Trabajamos directamente con las fábricas para garantizar los mejores 
                precios y la más alta calidad.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <img
              src="https://images.unsplash.com/photo-1586953208448-b95a79798f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500"
              alt="Almacén Excalibur Cuba"
              className="rounded-xl shadow-lg w-full"
              loading="lazy"
            />
            
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {t('ourWarehouse')}
                </h3>
                <p className="text-excalibur-gray">
                  {t('warehouseDesc')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">
            ¿Por qué elegir Excalibur Cuba?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <feature.icon className="w-12 h-12 text-excalibur-blue mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-excalibur-gray text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Partnership */}
        <div className="bg-excalibur-light rounded-xl p-8 md:p-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              Nuestro Socio Estratégico
            </h2>
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-lg p-6 shadow-md mb-6">
                <h3 className="text-2xl font-bold text-excalibur-blue mb-4">
                  AFDL IMPORT & EXPORT
                </h3>
                <p className="text-excalibur-gray leading-relaxed">
                  Con sede en Alemania y 35 años de experiencia en el mercado internacional, 
                  AFDL Import & Export es nuestro socio Joint Venture que nos permite 
                  ofrecer productos de la más alta calidad a precios competitivos. 
                  Su experiencia y red de contactos directos con las fábricas nos 
                  permite mantener un inventario abundante y precios excepcionales.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-excalibur-orange mb-2">35+</div>
                  <div className="text-sm text-excalibur-gray">Años de experiencia</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-excalibur-orange mb-2">50+</div>
                  <div className="text-sm text-excalibur-gray">Países servidos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-excalibur-orange mb-2">1000+</div>
                  <div className="text-sm text-excalibur-gray">Contenedores enviados</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
