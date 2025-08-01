import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { ArrowLeft, Check, Phone, Mail, MessageCircle, Star, ShoppingCart, Shield, Zap, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'wouter';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { FormattedText } from '../components/FormattedText';
import { AddToCartButton } from '../components/AddToCartButton';
import type { Product } from '@shared/schema';

export default function ProductDetail() {
  const params = useParams();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  
  // Image Gallery State - moved to top to avoid conditional hooks
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
  
  // Get product by slug from URL params
  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: [`/api/products/${params.slug}`],
    enabled: !!params.slug,
    retry: false,
  });

  // Cuba SEO Meta Tags for Product Detail
  useEffect(() => {
    if (product) {
      const categoryName = 'Productos';
      const productName = product.nameEs || product.name;
      
      document.title = `${productName} Excalibur Cuba - ${categoryName} | Matanzas`;
      
      const updateMeta = (name: string, content: string) => {
        let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
        if (!meta) {
          meta = document.createElement('meta');
          meta.name = name;
          document.head.appendChild(meta);
        }
        meta.content = content;
      };

      updateMeta('description', `${productName} disponible en Excalibur Cuba. ${categoryName} de alta calidad para Cuba. Recogida inmediata en Matanzas. Garantía completa.`);
      updateMeta('keywords', `${productName} Cuba, ${categoryName} Cuba, Excalibur Matanzas, productos solares Cuba, equipos industriales Cuba`);
      updateMeta('geo.region', 'CU');
      updateMeta('geo.placename', 'Matanzas, Cuba');
    }
  }, [product]);

  // Track product click with mobile debugging
  useEffect(() => {
    if (product) {
      const trackProductClick = async () => {
        try {
          const response = await fetch('/api/track/product', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': navigator.userAgent,
            },
            body: JSON.stringify({
              productId: product.id,
            }),
          });
        } catch (error) {
          // Silent tracking - no console output
        }
      };
      
      // Small delay to ensure page is fully loaded on mobile
      setTimeout(trackProductClick, 100);
    }
  }, [product]);

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

  // Get availability text (custom or default)
  const getAvailabilityText = () => {
    if (!product) return t('in_stock');
    
    let customText = '';
    if (currentLanguage === 'es') {
      customText = product.availabilityTextEs || '';
    } else if (currentLanguage === 'de') {
      customText = product.availabilityTextDe || '';
    } else {
      customText = product.availabilityTextEn || '';
    }
    
    // Use custom text if available, otherwise use default translation
    return customText || t(product.stockStatus || 'in_stock');
  };

  // Helper functions for availability logic
  const hasCustomAvailabilityText = !!(product?.availabilityTextEs || product?.availabilityTextDe || product?.availabilityTextEn);
  const getEffectiveStockStatus = () => {
    if (!product) return 'in_stock';
    
    // If custom availability text exists, treat as 'limited' (yellow/orange)
    if (hasCustomAvailabilityText) {
      return 'limited';
    }
    
    return product.stockStatus || 'in_stock';
  };
  
  // Check if we have extended description content
  const hasExtendedDescription = productDescription && productDescription.length > 200;

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

  // Image Gallery Logic - only create functions if product exists
  const allImages = product ? [
    product.mainImage,
    ...(product.images && Array.isArray(product.images) ? product.images : [])
  ].filter(Boolean) : [];
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === allImages.length - 1 ? 0 : prev + 1
    );
  };
  
  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? allImages.length - 1 : prev - 1
    );
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

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image Gallery */}
          <div className="space-y-4">
            {/* Main Image - Kompakter auf Mobile */}
            <div className="aspect-video md:aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
              <img
                src={allImages[currentImageIndex] || '/api/placeholder/500/500'}
                alt={`${productName} - Bild ${currentImageIndex + 1}`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/api/placeholder/500/500';
                }}
              />
              
              {/* Navigation arrows - only show if more than 1 image */}
              {allImages.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={nextImage}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  
                  {/* Image counter */}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                    {currentImageIndex + 1} / {allImages.length}
                  </div>
                </>
              )}
            </div>
            
            {/* Thumbnail Gallery - Collapsible auf Mobile */}
            {allImages.length > 1 && (
              <div className="space-y-3">
                {/* Mobile: Show/Hide Button */}
                <div className="block md:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllImages(!showAllImages)}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    {showAllImages ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        {t('hideMobileImages') || 'Bilder ausblenden'}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        {t('showMobileImages') || `Alle ${allImages.length} Bilder anzeigen`}
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Thumbnail Grid - Always visible on Desktop, Collapsible on Mobile */}
                <div className={`
                  grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-5 gap-2 
                  transition-all duration-300 ease-in-out
                  ${showAllImages ? 'block' : 'hidden md:grid'}
                `}>
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`aspect-square rounded border-2 overflow-hidden transition-all ${
                        index === currentImageIndex 
                          ? 'border-blue-500 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${productName} - Thumbnail ${index + 1}`}
                        className="w-full h-full object-contain bg-gray-50"
                        onError={(e) => {
                          e.currentTarget.src = '/api/placeholder/100/100';
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
            
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
              
              {/* Stock Status */}
              <div className="flex items-center gap-2 mb-4">
                <Check className={`w-5 h-5 ${
                  getEffectiveStockStatus() === 'in_stock' ? 'text-green-600' : 
                  getEffectiveStockStatus() === 'limited' ? 'text-yellow-600' : 'text-red-600'
                }`} />
                <span className={`font-semibold ${
                  getEffectiveStockStatus() === 'in_stock' ? 'text-green-600' : 
                  getEffectiveStockStatus() === 'limited' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {getAvailabilityText()}
                </span>
              </div>

              {/* Price */}
              <div className="text-3xl font-bold mb-4">
                {product.priceOnRequest ? (
                  <span className="text-blue-600">{t('priceOnRequest')}</span>
                ) : product.newPrice ? (
                  // Show discounted price with crossed out old price
                  <div className="space-y-2">
                    <div className="text-green-600 font-bold">
                      ${product.newPrice}
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded ml-2">
                        {t('onSale')}
                      </span>
                    </div>
                    {product.oldPrice && (
                      <div className="text-gray-500 text-xl line-through">
                        ${product.oldPrice}
                      </div>
                    )}
                  </div>
                ) : product.oldPrice ? (
                  // Show normal price
                  <span className="text-blue-600">${product.oldPrice}</span>
                ) : (
                  <span className="text-blue-600">{t('priceOnRequest')}</span>
                )}
              </div>
            </div>



            {/* Product Short Description */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">{String(t('description'))}</CardTitle>
              </CardHeader>
              <CardContent>
                {productShortDescription ? (
                  <FormattedText 
                    text={productShortDescription} 
                    className="text-gray-700 leading-relaxed"
                  />
                ) : (
                  <p className="text-gray-500 italic">
                    {currentLanguage === 'es' ? 'Descripción disponible próximamente.' :
                     currentLanguage === 'de' ? 'Beschreibung demnächst verfügbar.' :
                     'Description coming soon.'}
                  </p>
                )}
              </CardContent>
            </Card>



            {/* Add to Cart Button */}
            <div className="mb-6">
              <AddToCartButton 
                product={product}
                size="lg"
                showQuantity={true}
                className="w-full"
              />
            </div>

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