import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Product } from '@shared/schema';

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  addedAt: Date;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemPrice: (product: any) => number | null;
  isInCart: (productId: number) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('excalibur-cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setItems(parsedCart.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt)
        })));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('excalibur-cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, quantity: number = 1) => {
    setItems(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      
      if (existingItem) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...prev, {
        id: Date.now(),
        product,
        quantity,
        addedAt: new Date()
      }];
    });
  };

  const removeItem = (productId: number) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    
    setItems(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      // 🚀 KORREKTE PREISLOGIK: newPrice hat Priorität, dann oldPrice
      if (item.product.priceOnRequest) {
        return total; // Preis auf Anfrage = kein fester Preis
      }
      
      const newPrice = item.product.newPrice ? parseFloat(item.product.newPrice) : null;
      const oldPrice = item.product.oldPrice ? parseFloat(item.product.oldPrice) : null;
      
      // newPrice hat Priorität (ist der aktuelle Verkaufspreis)
      const price = newPrice || oldPrice || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  // 🚀 NEUE FUNKTION: Preis für einzelnes Produkt ermitteln
  const getItemPrice = (product: any) => {
    if (product.priceOnRequest) return null;
    const newPrice = product.newPrice ? parseFloat(product.newPrice) : null;
    const oldPrice = product.oldPrice ? parseFloat(product.oldPrice) : null;
    return newPrice || oldPrice || 0;
  };

  const isInCart = (productId: number) => {
    return items.some(item => item.product.id === productId);
  };

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getTotalItems,
      getTotalPrice,
      getItemPrice,
      isInCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}