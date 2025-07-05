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
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
              {product.mainImage ? (
                <img
                  src={product.mainImage.startsWith('http') ? product.mainImage : `http://localhost:5000${product.mainImage}`}
                  alt={productName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Try different fallback images based on product category
                    const fallbackImages = [
                      'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=500&h=500&fit=crop',
                      'https://images.unsplash.com/photo-1624397640148-949b1732bb4a?w=500&h=500&fit=crop',
                      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop'
                    ];
                    const randomFallback = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
                    e.currentTarget.src = randomFallback;
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium">{productName}</p>
                    <p className="text-sm text-gray-500 mt-1">Solar-Produkt</p>
                  </div>
                </div>
              )}
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
                <Check className={`w-5 h-5 ${
                  product.stockStatus === 'in_stock' ? 'text-green-600' : 
                  product.stockStatus === 'limited' ? 'text-yellow-600' : 'text-red-600'
                }`} />
                <span className={`font-semibold ${
                  product.stockStatus === 'in_stock' ? 'text-green-600' : 
                  product.stockStatus === 'limited' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {(() => {
                    console.log('Stock Status Debug:', { 
                      stockStatus: product.stockStatus, 
                      typeof: typeof product.stockStatus,
                      isInStock: product.stockStatus === 'in_stock',
                      currentLang: currentLanguage,
                      inStockTranslation: String(t('inStock')),
                      outOfStockTranslation: String(t('outOfStock'))
                    });
                    
                    if (product.stockStatus === 'in_stock') {
                      return String(t('inStock'));
                    } else if (product.stockStatus === 'limited') {
                      return String(t('limitedStock'));
                    } else {
                      return String(t('outOfStock'));
                    }
                  })()}
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



            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{String(t('specifications'))}</CardTitle>
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

            {/* Detailed Product Description */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">{String(t('description'))}</CardTitle>
              </CardHeader>
              <CardContent>
                {productDescription ? (
                  <p className="text-gray-700 leading-relaxed">{productDescription}</p>
                ) : (
                  <p className="text-gray-500 italic">
                    {currentLanguage === 'es' ? 'Descripción detallada disponible próximamente.' :
                     currentLanguage === 'de' ? 'Detaillierte Beschreibung demnächst verfügbar.' :
                     'Detailed description coming soon.'}
                  </p>
                )}
              </CardContent>
            </Card>

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

        {/* Extended Product Features Section */}
        <div className="max-w-6xl mx-auto px-4 mt-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            {t('productFeatures')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <Shield className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-lg font-semibold mb-2">{t('qualityAssurance')}</h3>
                <p className="text-gray-600">{t('qualityAssuranceDesc')}</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <Zap className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
                <h3 className="text-lg font-semibold mb-2">{t('highPerformance')}</h3>
                <p className="text-gray-600">{t('highPerformanceDesc')}</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <Star className="w-12 h-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-semibold mb-2">{t('warranty')}</h3>
                <p className="text-gray-600">{t('warrantyDesc')}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Installation & Setup Section */}
        <div className="bg-gray-50 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              {t('installationSetup')}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h3 className="text-xl font-semibold mb-4">{t('professionalInstallation')}</h3>
                <p className="text-gray-700 mb-6">
                  {t('professionalInstallationDesc')}
                </p>
                
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>{t('installationStep1')}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>{t('installationStep2')}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>{t('installationStep3')}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>{t('installationStep4')}</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4">{t('technicalSupport')}</h3>
                <p className="text-gray-700 mb-6">
                  {t('technicalSupportDesc')}
                </p>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h4 className="font-semibold mb-3">{t('supportChannels')}</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="text-sm">+49 157 516 91275 (Germany)</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="text-sm">+53 58 78 1416 (Cuba)</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="text-sm">info@excalibur-cuba.com</span>
                    </div>
                    <div className="flex items-center">
                      <MessageCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-sm">WhatsApp 24/7</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details & Certifications */}
        <div className="py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              {t('technicalDetails')}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>{t('certifications')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>{t('ceCompliance')}</span>
                      <Badge className="bg-green-100 text-green-800">✓ {t('certified')}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t('iecStandard')}</span>
                      <Badge className="bg-green-100 text-green-800">✓ {t('certified')}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t('rohs')}</span>
                      <Badge className="bg-green-100 text-green-800">✓ {t('certified')}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t('iso9001')}</span>
                      <Badge className="bg-green-100 text-green-800">✓ {t('certified')}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>{t('warranty')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-blue-600">{t('manufacturerWarranty')}</h4>
                      <p className="text-gray-600">{t('manufacturerWarrantyDesc')}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-600">{t('performanceWarranty')}</h4>
                      <p className="text-gray-600">{t('performanceWarrantyDesc')}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-600">{t('supportWarranty')}</h4>
                      <p className="text-gray-600">{t('supportWarrantyDesc')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* About Excalibur Cuba */}
        <div className="bg-blue-900 text-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">
              {t('aboutExcaliburCuba')}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-300 mb-2">35+</div>
                <div className="text-lg">{t('yearsExperience')}</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-300 mb-2">1000+</div>
                <div className="text-lg">{t('satisfiedClients')}</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-300 mb-2">24/7</div>
                <div className="text-lg">{t('technicalSupportStats')}</div>
              </div>
            </div>
            
            <div className="text-center mt-12">
              <p className="text-lg text-blue-100 max-w-3xl mx-auto">
                {t('aboutExcaliburDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}