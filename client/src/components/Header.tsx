import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, MessageCircle, MapPin, Phone } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { LanguageSwitcher } from './LanguageSwitcher';
import { CartIcon } from './CartIcon';
import { Cart } from './Cart';
import { Button } from './ui/button';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [location] = useLocation();
  const { t } = useLanguage();

  const navigation = [
    { href: '/', label: t('home') },
    { href: '/products', label: t('products') },
    { href: '/about', label: t('about') },
    { href: '/contact', label: t('contact') },
  ];

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-excalibur-blue text-white py-2">
        <div className="container mx-auto px-4 flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <MapPin size={14} />
              <span>Havanna del Este, Cuba</span>
            </div>
            <div className="flex items-center space-x-4 hidden sm:flex">
              <div className="flex items-center space-x-1">
                <Phone size={14} />
                <span>+53 5878 1416</span>
              </div>
              <div className="flex items-center space-x-1">
                <Phone size={14} />
                <span>+49 160 323 9439</span>
              </div>
            </div>
          </div>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img 
              src="/uploads/excalibur-logo-kuba-kleiner.png" 
              alt="Excalibur Cuba" 
              className="h-8 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-gray-700 hover:text-excalibur-blue transition-colors ${
                  location === item.href ? 'text-excalibur-blue font-semibold' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
            <CartIcon onClick={() => setIsCartOpen(true)} />
          </div>



          {/* WhatsApp Button */}
          <a
            href="https://api.whatsapp.com/send?phone=5358781416"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors items-center space-x-2"
          >
            <MessageCircle size={20} />
            <span>{t('whatsapp')}</span>
          </a>

          {/* Mobile Menu Button and Cart */}
          <div className="md:hidden flex items-center space-x-2">
            <CartIcon onClick={() => setIsCartOpen(true)} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t">
            <div className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-gray-700 hover:text-excalibur-blue transition-colors ${
                    location === item.href ? 'text-excalibur-blue font-semibold' : ''
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <a
                href="https://api.whatsapp.com/send?phone=5358781416"
                target="_blank"
                rel="noopener noreferrer"
                className="flex bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors items-center space-x-2 w-fit"
              >
                <MessageCircle size={20} />
                <span>{t('whatsapp')}</span>
              </a>
            </div>
          </div>
        )}
      </nav>
      
      {/* Cart Modal */}
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}
