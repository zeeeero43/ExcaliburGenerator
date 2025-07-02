import { MessageCircle } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

export function WhatsAppButton() {
  const { t } = useLanguage();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <a
        href="https://api.whatsapp.com/send?phone=5358781416"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-all duration-300 flex items-center space-x-2 group hover:shadow-xl"
      >
        <MessageCircle size={24} />
        <span className="hidden group-hover:block whitespace-nowrap pr-2 transition-all duration-300">
          {t('needHelp')}
        </span>
      </a>
    </div>
  );
}
