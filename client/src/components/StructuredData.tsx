import { useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';

// LocalBusiness Structured Data für Cuba SEO
export function LocalBusinessStructuredData() {
  const { currentLanguage } = useLanguage();

  useEffect(() => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Excalibur Cuba",
      "alternateName": "Excalibur Power Cuba",
      "description": {
        es: "Energía solar, generadores y equipos industriales en Cuba. Líder en sistemas solares completos, baterías de litio, inversores, generadores Excalibur.",
        de: "Solarenergie, Generatoren und Industrieanlagen in Kuba. Marktführer für komplette Solarsysteme, Lithium-Batterien, Wechselrichter, Excalibur-Generatoren.",
        en: "Solar energy, generators and industrial equipment in Cuba. Leader in complete solar systems, lithium batteries, inverters, Excalibur generators."
      }[currentLanguage] || "Energía solar, generadores y equipos industriales en Cuba.",
      "url": "https://excalibur-cuba.com",
      "telephone": [
        "+53 45 123456",
        "+53 45 234567", 
        "+53 45 345678"
      ],
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Matanzas",
        "addressRegion": "Matanzas",
        "addressCountry": "CU",
        "streetAddress": "Matanzas, Cuba"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "23.0411",
        "longitude": "-81.5775"
      },
      "areaServed": {
        "@type": "Country",
        "name": "Cuba"
      },
      "serviceArea": {
        "@type": "GeoCircle",
        "geoMidpoint": {
          "@type": "GeoCoordinates",
          "latitude": "23.0411",
          "longitude": "-81.5775"
        },
        "geoRadius": "500000"
      },
      "priceRange": "$$",
      "currenciesAccepted": "USD, EUR, CUP",
      "paymentAccepted": "Cash, Credit Card",
      "openingHours": "Mo-Sa 08:00-18:00",
      "hasMap": "https://www.google.com/maps/place/Matanzas,+Cuba",
      "servedCuisine": [],
      "keywords": "energía solar Cuba, generadores Cuba, baterías litio Cuba, inversores solares Cuba, cables MC4 Cuba, armadura carbono Cuba, trailers Cuba, excavadoras Cuba, compresores Cuba, filtros agua Cuba, hornos pizza Cuba, máquinas hielo Cuba, Matanzas, Habana del Este",
      "sameAs": [
        "https://wa.me/53451234567",
        "https://www.facebook.com/excalibur-power-cuba"
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "150"
      },
      "image": [
        "https://excalibur-cuba.com/uploads/excalibur-logo-kuba.png"
      ]
    };

    // Remove existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[type="application/ld+json"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [currentLanguage]);

  return null;
}