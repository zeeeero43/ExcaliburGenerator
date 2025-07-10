import { useState } from 'react';
import { Phone, Mail, MapPin, Headphones, Building, Warehouse, MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../hooks/useLanguage';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form';
import { useToast } from '../hooks/use-toast';

const createInquirySchema = (language: string) => z.object({
  name: z.string().min(2, 
    language === 'de' ? 'Der Name muss mindestens 2 Zeichen haben' :
    language === 'en' ? 'Name must be at least 2 characters' :
    'El nombre debe tener al menos 2 caracteres'
  ),
  phone: z.string().min(8, 
    language === 'de' ? 'Ungültige Telefonnummer' :
    language === 'en' ? 'Invalid phone number' :
    'Teléfono inválido'
  ),
  message: z.string().min(10, 
    language === 'de' ? 'Die Nachricht muss mindestens 10 Zeichen haben' :
    language === 'en' ? 'Message must be at least 10 characters' :
    'El mensaje debe tener al menos 10 caracteres'
  ),
});

type InquiryForm = z.infer<ReturnType<typeof createInquirySchema>>;

export default function Contact() {
  const { t, currentLanguage } = useLanguage();
  const { toast } = useToast();

  // Kontaktinformationen aus site-settings laden
  const { data: siteSettings = [] } = useQuery<any[]>({
    queryKey: ['/api/site-settings'],
    retry: false,
  });

  // Hilfsfunktion um Kontaktinformationen zu laden
  const getContactInfo = (key: string, fallback: string) => {
    const setting = siteSettings.find(s => s.key === key);
    return setting?.value || fallback;
  };

  const inquirySchema = createInquirySchema(currentLanguage);
  const form = useForm<InquiryForm>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      name: '',
      phone: '',
      message: '',
    },
  });

  const submitInquiry = useMutation({
    mutationFn: async (data: InquiryForm) => {
      return apiRequest('POST', '/api/inquiries', {
        ...data,
        language: currentLanguage,
      });
    },
    onSuccess: () => {
      toast({
        title: "¡Consulta enviada!",
        description: t('formSubmitted'),
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: t('formError'),
        variant: "destructive",
      });
      console.error('Form submission error:', error);
    },
  });

  const onSubmit = (data: InquiryForm) => {
    submitInquiry.mutate(data);
  };

  const contactInfo = [
    {
      icon: Headphones,
      title: t('technicalAdvisory'),
      phone: getContactInfo('contact_technical_phone', '+49 160 323 9439'),
      description: t('whatsappAvailable'),
      color: 'text-excalibur-blue'
    },
    {
      icon: Building,
      title: t('salesLabel'),
      phone: getContactInfo('contact_sales_phone', '+53 58781416'),
      description: 'Administración general',
      color: 'text-excalibur-orange'
    },
    {
      icon: Warehouse,
      title: t('warehouseDelivery'),
      phone: getContactInfo('contact_warehouse_phone', '+53 58781416'),
      description: 'Habana del Este',
      color: 'text-green-500'
    }
  ];



  return (
    <div className="py-16 bg-white min-h-screen">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {t('contactUs')}
          </h1>
          <p className="text-xl text-excalibur-gray">
            {t('contactSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            {/* Phone Contacts */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                {t('contactInfo')}
              </h2>
              
              <div className="space-y-4">
                {contactInfo.map((contact, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-start space-x-4 p-6">
                      <contact.icon className={`w-6 h-6 mt-1 ${contact.color}`} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">
                          {contact.title}
                        </h3>
                        <p className="text-lg font-mono text-excalibur-gray mb-1">
                          {contact.phone}
                        </p>
                        <p className="text-sm text-excalibur-gray">
                          {contact.description}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <a
                          href={`tel:${contact.phone}`}
                          className="p-2 bg-excalibur-light rounded-lg hover:bg-gray-200 transition-colors"
                          title="Llamar"
                        >
                          <Phone size={16} />
                        </a>
                        {(contact.phone.includes('+53') || contact.phone.includes('WA')) && (
                          <a
                            href={`https://api.whatsapp.com/send?phone=${contact.phone.replace(/\s/g, '').replace(/[()]/g, '').split('(')[0]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                            title="WhatsApp"
                          >
                            <MessageCircle size={16} />
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>



            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-excalibur-orange" />
                  <span>{t('contactLocationTitle')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-excalibur-gray">
                  {t('contactLocationDesc')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>{t('requestQuote')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('name')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('phone')}</FormLabel>
                          <FormControl>
                            <Input {...field} type="tel" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('message')}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={4}
                            placeholder={t('messagePlaceholder')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="submit"
                    className="w-full bg-excalibur-blue hover:bg-blue-700"
                    disabled={submitInquiry.isPending}
                  >
                    {submitInquiry.isPending ? 'Enviando...' : t('sendRequest')}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
