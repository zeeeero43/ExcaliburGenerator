import { useRoute } from 'wouter';
import { ArrowLeft, Check, Phone, Mail, MessageCircle } from 'lucide-react';
import { Link } from 'wouter';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { sampleProducts } from '../data/products';

export default function ProductDetail() {
  const [, params] = useRoute('/products/:category/:id?');
  const { t } = useLanguage();
  
  // In a real application, you would fetch product data based on params
  const product = sampleProducts[0]; // Using sample data for demonstration

  if (!product) {
    return (
      <div className="py-16 bg-white min-h-screen">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Producto no encontrado
          </h1>
          <Link href="/products">
            <Button>
              <ArrowLeft size={16} className="mr-2" />
              Volver a productos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 bg-white min-h-screen">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-excalibur-gray mb-8">
          <Link href="/" className="hover:text-excalibur-blue">
            {t('home')}
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-excalibur-blue">
            {t('products')}
          </Link>
          <span>/</span>
          <span className="text-gray-800">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-xl bg-gray-100">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1, 5).map((image, index) => (
                  <div key={index} className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={image}
                      alt={`${product.name} ${index + 2}`}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="secondary" className="capitalize">
                  {product.category}
                </Badge>
                {product.availability && (
                  <Badge variant="default" className="bg-green-500">
                    <Check size={14} className="mr-1" />
                    Disponible
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                {product.name}
              </h1>
              <p className="text-lg text-excalibur-gray leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Specifications */}
            <Card>
              <CardHeader>
                <CardTitle>Especificaciones Técnicas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="font-medium text-gray-700">{key}:</span>
                      <span className="text-excalibur-gray">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Actions */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {t('contactInfo')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a
                  href="https://api.whatsapp.com/send?phone=5358781416"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-colors"
                >
                  <MessageCircle size={18} />
                  <span>WhatsApp</span>
                </a>
                <a
                  href="tel:+5358781416"
                  className="flex items-center justify-center space-x-2 bg-excalibur-blue text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Phone size={18} />
                  <span>Llamar</span>
                </a>
                <a
                  href="mailto:info@excalibur-cuba.com"
                  className="flex items-center justify-center space-x-2 bg-excalibur-orange text-white px-4 py-3 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Mail size={18} />
                  <span>Email</span>
                </a>
              </div>
            </div>

            {/* Back Button */}
            <Link href="/products">
              <Button variant="outline" className="w-full sm:w-auto">
                <ArrowLeft size={16} className="mr-2" />
                Volver a productos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
