import React from 'react';
import { ShoppingCart, Plus, Minus, Trash2, MessageCircle, X } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Cart({ isOpen, onClose }: CartProps) {
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCart();
  const { t } = useLanguage();

  if (!isOpen) return null;

  const generateWhatsAppMessage = () => {
    const message = `${t('whatsAppMessage')}\n\n`;
    const itemsList = items.map(item => 
      `• ${item.product.name} - ${t('quantity')}: ${item.quantity}`
    ).join('\n');
    
    const total = getTotalPrice();
    const totalMessage = total > 0 ? `\n\n${t('total')}: ${total.toFixed(2)}` : '';
    
    return encodeURIComponent(message + itemsList + totalMessage);
  };

  const sendWhatsApp = () => {
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://api.whatsapp.com/send?phone=+5358781416&text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header with Logo */}
        <div className="bg-excalibur-blue text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
              <span className="text-excalibur-blue font-bold text-xl">E</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">EXCALIBUR CUBA</h2>
              <p className="text-blue-100">{t('myCart')}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-blue-600"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Cart Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-24 h-24 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {t('cartEmpty')}
              </h3>
              <p className="text-gray-500">{t('cartEmptyDesc')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {item.product.mainImage ? (
                          <img 
                            src={item.product.mainImage} 
                            alt={item.product.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://images.unsplash.com/photo-1559302504-64aae6ca6834?w=100&h=100&fit=crop';
                            }}
                          />
                        ) : (
                          <ShoppingCart className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {item.product.name}
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">
                          {item.product.shortDescription || item.product.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Badge variant="secondary" className="px-3 py-1">
                              {item.quantity}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeItem(item.product.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            {t('removeFromCart')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-6 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold">
                {items.length} {t('cartItems')}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={clearCart}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('clearCart')}
              </Button>
            </div>
            
            <Separator className="mb-4" />
            
            <Button
              onClick={sendWhatsApp}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              {t('sendViaWhatsApp')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}