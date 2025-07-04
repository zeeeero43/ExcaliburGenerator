import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, Phone, Mail, MessageCircle, Star, ShoppingCart, Shield, Zap } from 'lucide-react';
import { Link } from 'wouter';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import type { Product } from '@shared/schema';

export default function ProductDetail() {
  const params = useParams();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  
  // Get product by slug from URL params
  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ['/api/products', params.slug],
    enabled: !!params.slug,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="py-16 bg-white min-h-screen">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-16 bg-white min-h-screen">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {t('productNotFound') as string}
          </h1>
          <Link href="/products">
            <Button>
              <ArrowLeft size={16} className="mr-2" />
              {t('backToProducts') as string}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Get localized product data
  const currentLanguage = t('currentLanguage') as string as 'es' | 'de' | 'en';
  const productName = currentLanguage === 'es' ? product.nameEs : 
                      currentLanguage === 'de' ? product.nameDe : 
                      product.nameEn;
  const productDescription = currentLanguage === 'es' ? product.descriptionEs : 
                            currentLanguage === 'de' ? product.descriptionDe : 
                            product.descriptionEn;
  const productShortDescription = currentLanguage === 'es' ? product.shortDescriptionEs : 
                                  currentLanguage === 'de' ? product.shortDescriptionDe : 
                                  product.shortDescriptionEn;

  const handleContactWhatsApp = () => {
    const message = `¡Hola! Estoy interesado en el producto: ${productName}`;
    const whatsappUrl = `https://wa.me/4915751691275?text=${encodeURIComponent(message) as string}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleContactEmail = () => {
    const subject = `Consulta sobre: ${productName}`;
    const body = `Hola,\n\nMe interesa obtener más información sobre el producto:\n\n${productName}\n\nGracias.`;
    window.location.href = `mailto:info@excalibur-cuba.com?subject=${encodeURIComponent(subject) as string}&body=${encodeURIComponent(body) as string}`;
  };

  return (
    <div className="py-16 bg-white min-h-screen">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-blue-600">
            {t('home') as string}
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-blue-600">
            {t('products') as string}
          </Link>
          <span>/</span>
          <span className="text-gray-800">{productName}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={product.mainImage || '/api/placeholder/500/500'}
                alt={productName}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Trust Badges */}
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-green-600" />
                <span>{t('qualityGuarantee') as string}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Zap className="w-4 h-4 text-blue-600" />
                <span>{t('fastDelivery') as string}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Star className="w-4 h-4 text-yellow-600" />
                <span>{t('expertSupport') as string}</span>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Product Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{productName}</h1>
              <p className="text-lg text-gray-600 mb-4">{productShortDescription}</p>
              
              {/* Stock Status */}
              <div className="flex items-center gap-2 mb-4">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-green-600 font-semibold">
                  {product.stockStatus === 'in_stock' ? t('inStock') as string : 
                   product.stockStatus === 'limited' ? t('limitedStock') as string : 
                   t('outOfStock') as string}
                </span>
              </div>

              {/* Price */}
              {product.price && (
                <div className="text-3xl font-bold text-blue-600 mb-4">
                  ${product.price}
                  {product.priceNote && (
                    <span className="text-sm text-gray-500 ml-2">{product.priceNote}</span>
                  )}
                </div>
              )}
            </div>

            {/* Product Description */}
            {productDescription && (
              <div>
                <h2 className="text-xl font-semibold mb-3">{t('description') as string}</h2>
                <p className="text-gray-700 leading-relaxed">{productDescription}</p>
              </div>
            )}

            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('specifications') as string}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <span className="font-medium text-gray-700">{key}:</span>
                        <span className="text-gray-600">{value as string}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('interestedInProduct') as string}</h3>
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  onClick={handleContactWhatsApp}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  {t('contactWhatsApp') as string}
                </Button>
                
                <Button 
                  onClick={handleContactEmail}
                  variant="outline"
                  size="lg"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  {t('contactEmail') as string}
                </Button>
                
                <Button 
                  onClick={() => window.open('tel:+4915751691275', '_blank')}
                  variant="outline"
                  size="lg"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  {t('contactPhone') as string}
                </Button>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">{t('whyChooseUs') as string}</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• {t('germanQuality') as string}</li>
                <li>• {t('monthlyContainerImports') as string}</li>
                <li>• {t('technicalSupport') as string}</li>
                <li>• {t('bestPrices') as string}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}