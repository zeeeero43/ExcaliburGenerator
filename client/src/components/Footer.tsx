import { Link } from 'wouter';
import { Facebook, MessageCircle, Mail, MapPin, Phone } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-excalibur-blue rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold">EXCALIBUR CUBA</h3>
                <p className="text-gray-400">Power & Solar Solutions</p>
              </div>
            </div>
            <p className="text-gray-400 mb-4">
              {t('companyDescription')}
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://api.whatsapp.com/send?phone=5358781416"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle size={20} />
              </a>
              <a
                href="tel:+4916032394383"
                className="w-10 h-10 bg-excalibur-orange rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                aria-label="Phone"
              >
                <Phone size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links & Contact Combined (Mobile) / Separate (Desktop) */}
          <div className="md:col-span-1">
            <h4 className="text-lg font-semibold mb-4">{t('quickLinks')}</h4>
            <ul className="space-y-2 text-gray-400 mb-6">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  {t('home')}
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  {t('products')}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  {t('contact')}
                </Link>
              </li>
              <li>
                <Link href="/cuba-energia-solar" className="hover:text-white transition-colors">
                  Cuba Energía Solar
                </Link>
              </li>
              <li>
                <Link href="/legal" className="hover:text-white transition-colors">
                  Rechtliches
                </Link>
              </li>
            </ul>
            
            {/* Contact Info - Shows under Quick Links on Mobile */}
            <div className="md:hidden">
              <h4 className="text-lg font-semibold mb-4">{t('contact')}</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="flex items-start space-x-2">
                  <MapPin size={16} className="mt-1 text-excalibur-orange" />
                  <span>Havanna del Este, Cuba</span>
                </li>
                <li className="flex items-start space-x-2">
                  <MessageCircle size={16} className="mt-1 text-green-500" />
                  <span>{t('supportSales') as string}: +49 160 323 9439</span>
                </li>
                <li className="flex items-start space-x-2">
                  <MessageCircle size={16} className="mt-1 text-green-500" />
                  <span>{t('administrationSales') as string}: +53 5878 1416</span>
                </li>
                <li className="flex items-start space-x-2">
                  <MessageCircle size={16} className="mt-1 text-green-500" />
                  <span>{t('deliveryPickup') as string}: +53 54 73 14 90</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Info - Separate Column on Desktop */}
          <div className="hidden md:block">
            <h4 className="text-lg font-semibold mb-4">{t('contact')}</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li className="flex items-start space-x-2">
                <MapPin size={16} className="mt-1 text-excalibur-orange" />
                <span>Havanna del Este, Cuba</span>
              </li>
              <li className="flex items-start space-x-2">
                <MessageCircle size={16} className="mt-1 text-green-500" />
                <span>{t('supportSales') as string}: +49 160 323 9439</span>
              </li>
              <li className="flex items-start space-x-2">
                <MessageCircle size={16} className="mt-1 text-green-500" />
                <span>{t('administrationSales') as string}: +53 5878 1416</span>
              </li>
              <li className="flex items-start space-x-2">
                <MessageCircle size={16} className="mt-1 text-green-500" />
                <span>{t('deliveryPickup') as string}: +53 54 73 14 90</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 Excalibur Cuba. {t('allRightsReserved')}</p>
        </div>
      </div>
    </footer>
  );
}
