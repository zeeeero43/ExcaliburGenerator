export interface Product {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  description: string;
  specifications: Record<string, string>;
  images: string[];
  price?: string;
  availability: boolean;
}

export const productCategories = {
  'solar-systems': {
    name: {
      es: 'Sistemas Solares Completos',
      de: 'Komplette Solarsysteme',
      en: 'Complete Solar Systems'
    },
    subcategories: {
      'without-battery': {
        es: 'Sin Almacenamiento',
        de: 'Ohne Batteriespeicher',
        en: 'Without Battery Storage'
      },
      'with-battery': {
        es: 'Con Almacenamiento',
        de: 'Mit Batteriespeicher',
        en: 'With Battery Storage'
      }
    }
  },
  'panels': {
    name: {
      es: 'Paneles Solares',
      de: 'Solarpaneele',
      en: 'Solar Panels'
    },
    subcategories: {
      'monocrystalline': {
        es: 'Monocristalinos',
        de: 'Monokristallin',
        en: 'Monocrystalline'
      },
      'polycrystalline': {
        es: 'Policristalinos',
        de: 'Polykristallin',
        en: 'Polycrystalline'
      }
    }
  },
  'inverters': {
    name: {
      es: 'Inversores',
      de: 'Wechselrichter',
      en: 'Inverters'
    },
    subcategories: {
      'string': {
        es: 'Inversores de Cadena',
        de: 'String-Wechselrichter',
        en: 'String Inverters'
      },
      'all-in-one': {
        es: 'Todo en Uno',
        de: 'All-in-One',
        en: 'All-in-One'
      }
    }
  },
  'batteries': {
    name: {
      es: 'Baterías',
      de: 'Batterien',
      en: 'Batteries'
    },
    subcategories: {
      'lithium': {
        es: 'Litio',
        de: 'Lithium',
        en: 'Lithium'
      },
      'agm': {
        es: 'AGM',
        de: 'AGM',
        en: 'AGM'
      }
    }
  },
  'generators': {
    name: {
      es: 'Generadores',
      de: 'Generatoren',
      en: 'Generators'
    },
    subcategories: {
      'diesel': {
        es: 'Diesel',
        de: 'Diesel',
        en: 'Diesel'
      },
      'gasoline': {
        es: 'Gasolina',
        de: 'Benzin',
        en: 'Gasoline'
      }
    }
  },
  'accessories': {
    name: {
      es: 'Accesorios',
      de: 'Zubehör',
      en: 'Accessories'
    },
    subcategories: {
      'mounting': {
        es: 'Soportes',
        de: 'Halterungen',
        en: 'Mounting'
      },
      'cables': {
        es: 'Cables',
        de: 'Kabel',
        en: 'Cables'
      },
      'connectors': {
        es: 'Conectores',
        de: 'Stecker',
        en: 'Connectors'
      }
    }
  }
};

// Sample products data - in real application this would come from API
export const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Sistema Solar 5KW con Bateria',
    category: 'solar-systems',
    subcategory: 'with-battery',
    description: 'Sistema solar completo de 5KW con almacenamiento de bateria para uso residencial',
    specifications: {
      'Potencia': '5000W',
      'Paneles': '20 x 250W',
      'Inversor': '5000W Hibrido',
      'Bateria': '10kWh Litio',
      'Garantia': '25 anos paneles, 10 anos bateria'
    },
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600'
    ],
    availability: true
  },
  {
    id: '2',
    name: 'Generador Diesel Silencioso 10KVA',
    category: 'generators',
    subcategory: 'diesel',
    description: 'Generador diesel silencioso de 10KVA ideal para uso residencial y comercial',
    specifications: {
      'Potencia': '10KVA / 8KW',
      'Motor': 'Diesel 4 tiempos',
      'Tanque': '50 litros',
      'Autonomia': '8-10 horas',
      'Nivel de ruido': '<60dB'
    },
    images: [
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600'
    ],
    availability: true
  }
];
