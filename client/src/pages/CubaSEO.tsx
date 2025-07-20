import { useEffect } from "react";

export default function CubaSEO() {
  // SEO Meta Tags für Cuba
  useEffect(() => {
    document.title = "Excalibur Cuba - Energía Solar, Generadores y Equipos | Matanzas";
    
    // Update existing meta tags or create new ones
    const updateMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    updateMeta('description', 'Excalibur Cuba: Líderes en energía solar, generadores, baterías de litio, inversores, cables MC4, construcción, trailers, excavadoras, compresores y equipos industriales en Cuba. Matanzas y Habana del Este.');
    updateMeta('keywords', 'Excalibur Cuba, energía solar Cuba, generadores Cuba, baterías litio Cuba, inversores solares Cuba, cables MC4 Cuba, armadura carbono Cuba, trailers Cuba, excavadoras Cuba, bombas concreto Cuba, compresores Cuba, filtros agua Cuba, hornos pizza Cuba, máquinas hielo Cuba, Matanzas, Habana del Este');
    updateMeta('geo.region', 'CU');
    updateMeta('geo.placename', 'Matanzas, Cuba');
    updateMeta('geo.position', '23.0411;-81.5775');
    updateMeta('ICBM', '23.0411, -81.5775');

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = 'https://excalibur-cuba.com/cuba-energia-solar';
  }, []);

  return (
    <div className="min-h-screen bg-background">

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-5xl font-bold text-excalibur-blue mb-6">
            Excalibur Cuba - Energía Solar y Equipos Industriales
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto">
            Líderes en <strong>energía solar</strong>, <strong>generadores</strong>, y equipos industriales en Cuba. 
            Desde Matanzas servimos toda la isla con los mejores productos <strong>Excalibur</strong>.
          </p>
        </section>

        {/* Keywords Content Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          
          {/* Energía Solar */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-excalibur-blue mb-4">Energía Solar Cuba</h2>
            <p className="text-gray-700">
              Sistemas completos de <strong>energía solar</strong> para Cuba. 
              Paneles solares, <strong>baterías de litio</strong>, <strong>inversores</strong> y 
              <strong>cables MC4</strong>. Soluciones de 3kW a 30kW para hogares y empresas cubanas.
            </p>
          </div>

          {/* Generadores */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-excalibur-blue mb-4">Generadores Cuba</h2>
            <p className="text-gray-700">
              <strong>Generadores Excalibur</strong> de 2kVA a 20kVA para Cuba. 
              Diésel y gasolina, perfectos como respaldo energético. 
              Disponibles en Matanzas con entrega inmediata.
            </p>
          </div>

          {/* Construcción */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-excalibur-blue mb-4">Construcción Cuba</h2>
            <p className="text-gray-700">
              <strong>Armadura de carbono</strong>, <strong>mini excavadoras</strong>, 
              <strong>bombas de concreto</strong>, <strong>placas vibradoras</strong> y 
              <strong>compresores</strong> para construcción en Cuba.
            </p>
          </div>

          {/* Transporte */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-excalibur-blue mb-4">Transporte Cuba</h2>
            <p className="text-gray-700">
              <strong>Trailers</strong> y <strong>neumáticos</strong> de alta calidad para Cuba. 
              Equipos de transporte resistentes para las condiciones cubanas.
            </p>
          </div>

          {/* Equipos Industriales */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-excalibur-blue mb-4">Equipos Industriales</h2>
            <p className="text-gray-700">
              <strong>Filtros de agua</strong>, <strong>hornos para pizza</strong>, 
              <strong>máquinas de hielo</strong> y equipos gastronómicos para negocios en Cuba.
            </p>
          </div>

          {/* Ubicación */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-excalibur-blue mb-4">Excalibur Matanzas</h2>
            <p className="text-gray-700">
              Ubicados en <strong>Matanzas, Cuba</strong> con oficina en <strong>Habana del Este</strong>. 
              Importaciones permanentes desde Alemania. 35 años de experiencia internacional.
            </p>
          </div>

        </div>

        {/* Long-form SEO Content */}
        <section className="bg-gray-50 p-8 rounded-lg mb-16">
          <h2 className="text-3xl font-bold text-excalibur-blue mb-6 text-center">
            ¿Por qué elegir Excalibur Cuba para energía solar y equipos industriales?
          </h2>
          
          <div className="prose max-w-4xl mx-auto text-gray-700">
            <p className="text-lg mb-6">
              <strong>Excalibur Cuba</strong> es la empresa líder en <strong>energía solar</strong> y 
              equipos industriales en Cuba. Con sede en <strong>Matanzas</strong> y oficina en 
              <strong>Habana del Este</strong>, ofrecemos soluciones completas para toda la isla.
            </p>
            
            <h3 className="text-xl font-bold text-excalibur-blue mb-4">Energía Solar en Cuba</h3>
            <p className="mb-6">
              Nuestros sistemas de <strong>energía solar</strong> incluyen paneles fotovoltaicos, 
              <strong>baterías de litio</strong> de larga duración, <strong>inversores</strong> de alta eficiencia 
              y todos los <strong>cables MC4</strong> necesarios. Desde sistemas residenciales de 3kW 
              hasta instalaciones comerciales de 30kW.
            </p>

            <h3 className="text-xl font-bold text-excalibur-blue mb-4">Generadores Excalibur</h3>
            <p className="mb-6">
              Los <strong>generadores Excalibur</strong> son la solución perfecta como respaldo energético 
              en Cuba. Modelos de 2kVA a 20kVA, diésel y gasolina, con paquetes de aislamiento acústico. 
              Ideales para hogares, negocios y industrias.
            </p>

            <h3 className="text-xl font-bold text-excalibur-blue mb-4">Equipos de Construcción</h3>
            <p className="mb-6">
              Para la construcción en Cuba ofrecemos <strong>armadura de carbono</strong>, 
              <strong>mini excavadoras</strong>, <strong>bombas de concreto</strong>, 
              <strong>placas vibradoras</strong> y <strong>compresores</strong>. 
              Equipos resistentes adaptados al clima tropical.
            </p>

            <h3 className="text-xl font-bold text-excalibur-blue mb-4">Ventajas de Excalibur Cuba</h3>
            <ul className="list-disc pl-6 mb-6">
              <li>Importaciones permanentes desde Alemania</li>
              <li>35 años de experiencia internacional</li>
              <li>Stock disponible en Matanzas</li>
              <li>Recogida inmediata en almacén</li>
              <li>Soporte técnico 24/7</li>
              <li>Garantía completa en todos los productos</li>
            </ul>

            <p className="text-lg font-semibold text-excalibur-blue">
              Para una Cuba más próspera con energía renovable y equipos de calidad alemana.
            </p>
          </div>
        </section>

        {/* Contact Call-to-Action */}
        <section className="bg-excalibur-blue text-white p-8 rounded-lg text-center">
          <h2 className="text-3xl font-bold mb-4">
            Contacta Excalibur Cuba
          </h2>
          <p className="text-xl mb-6">
            ¿Necesitas energía solar, generadores o equipos industriales en Cuba?
          </p>
          <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div>
              <h3 className="font-bold mb-2">Recogida / Almacén</h3>
              <p>+53 45 123456</p>
            </div>
            <div>
              <h3 className="font-bold mb-2">Soporte Técnico</h3>  
              <p>+53 45 234567</p>
            </div>
            <div>
              <h3 className="font-bold mb-2">Ventas</h3>
              <p>+53 45 345678</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}