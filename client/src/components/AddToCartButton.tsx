import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Check } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';
import type { Product } from '@shared/schema';

interface AddToCartButtonProps {
  product: Product;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
  showQuantity?: boolean;
  className?: string;
}

export function AddToCartButton({ 
  product, 
  variant = 'default', 
  size = 'default', 
  showQuantity = false,
  className = ''
}: AddToCartButtonProps) {
  const { addItem, isInCart, items, updateQuantity } = useCart();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const currentItem = items.find(item => item.product.id === product.id);
  const currentQuantity = currentItem?.quantity || 0;

  const handleAddToCart = async () => {
    setIsAdding(true);
    
    try {
      addItem(product, quantity);
      
      toast({
        title: "✅ Hinzugefügt!",
        description: `${product.name} wurde zum Warenkorb hinzugefügt.`,
      });
      
      // Reset quantity after adding
      setQuantity(1);
      
      // Show success state briefly
      setTimeout(() => {
        setIsAdding(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "❌ Fehler",
        description: "Produkt konnte nicht hinzugefügt werden.",
        variant: "destructive",
      });
      setIsAdding(false);
    }
  };

  if (isInCart(product.id)) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Button
          variant="outline"
          size={size}
          onClick={() => updateQuantity(product.id, currentQuantity - 1)}
          disabled={currentQuantity <= 1}
        >
          <Minus className="w-4 h-4" />
        </Button>
        
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-md font-medium">
          {currentQuantity}
        </span>
        
        <Button
          variant="outline"
          size={size}
          onClick={() => updateQuantity(product.id, currentQuantity + 1)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showQuantity && (
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium min-w-[30px] text-center">
            {quantity}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuantity(quantity + 1)}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      )}
      
      <Button
        variant={variant}
        size={size}
        onClick={handleAddToCart}
        disabled={isAdding}
        className={`${isAdding ? 'bg-green-600 hover:bg-green-600' : ''}`}
      >
        {isAdding ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Hinzugefügt
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4 mr-2" />
            {t('addToCart')}
          </>
        )}
      </Button>
    </div>
  );
}