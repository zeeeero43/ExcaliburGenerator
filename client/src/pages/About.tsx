import { Shield, Users, Award, Globe } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Card, CardContent } from '../components/ui/card';
import type { SiteSetting } from '@shared/schema';

export default function About() {
  const { t } = useLanguage();

  // Cuba SEO Meta Tags
  useEffect(() => {
    document.title = "Sobre Excalibur Cuba - Empresa Solar y Equipos | Matanzas";
    
    const updateMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    updateMeta('description', 'Excalibur Cuba: Joint Venture con AFDL Import Export. 35 años experiencia alemana en energía solar, generadores, baterías litio. Empresa líder en Matanzas y Habana del Este.');
    updateMeta('keywords', 'Excalibur Cuba empresa, AFDL Import Export, Joint Venture Cuba, energía solar Cuba, empresa alemana Cuba, Matanzas, Habana del Este');
    updateMeta('geo.region', 'CU');
    updateMeta('geo.placename', 'Matanzas, Cuba');
  }, []);
  
  // Lade Site-Settings für dynamische Bilder
  const { data: siteSettings = [] } = useQuery<SiteSetting[]>({
    queryKey: ['/api/site-settings'],
    retry: false,
  });

  // Helfer-Funktion um Bild-URL aus Settings zu holen
  const getImageUrl = (key: string, fallback: string) => {
    const setting = siteSettings.find(s => s.key === key);
    return setting?.value || fallback;
  };

  const stats = [
    { number: '35', label: t('yearsExperience') },
    { number: '20+', label: t('solarSystems') },
    { number: '1000+', label: t('satisfiedClients') },
    { number: '24/7', label: t('technicalSupportStats') }
  ];

  const features = [
    {
      icon: Shield,
      title: t('guaranteedQuality'),
      description: t('guaranteedQualityDesc')
    },
    {
      icon: Users,
      title: t('expertTeam'),
      description: t('expertTeamDesc')
    },
    {
      icon: Award,
      title: t('customerSatisfaction'),
      description: t('customerSatisfactionDesc')
    },
    {
      icon: Globe,
      title: t('internationalReach'),
      description: t('internationalReachDesc')
    }
  ];

  return (
    <div className="py-16 bg-white min-h-screen">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            {t('aboutTitle')}
          </h1>
          <p className="text-xl text-excalibur-gray max-w-3xl mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-excalibur-blue mb-2">
                {stat.number}
              </div>
              <div className="text-sm md:text-base text-excalibur-gray">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Company Story */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              {t('ourHistory')}
            </h2>
            <div className="space-y-4 text-lg text-excalibur-gray">
              <p>{t('aboutText1')}</p>
              <p>{t('aboutText2')}</p>
              <p>
                {t('warehouseLocation')}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <img
              src={getImageUrl('about_team_image', 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500')}
              alt="Solar installation team"
              className="rounded-xl shadow-lg w-full"
              loading="lazy"
            />
            
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {t('ourWarehouse')}
                </h3>
                <p className="text-excalibur-gray">
                  {t('warehouseDesc')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">
            {t('whyChooseUs')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <feature.icon className="w-12 h-12 text-excalibur-blue mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-excalibur-gray text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Partnership */}
        <div className="bg-excalibur-light rounded-xl p-8 md:p-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              {t('strategicPartner')}
            </h2>
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-lg p-6 shadow-md mb-6">
                <h3 className="text-2xl font-bold text-excalibur-blue mb-4">
                  AFDL IMPORT & EXPORT
                </h3>
                <p className="text-excalibur-gray leading-relaxed">
                  {t('partnershipDesc')}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-excalibur-orange mb-2">35+</div>
                  <div className="text-sm text-excalibur-gray">{t('yearsExperience')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-excalibur-orange mb-2">50+</div>
                  <div className="text-sm text-excalibur-gray">{t('countriesServed')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-excalibur-orange mb-2">1000+</div>
                  <div className="text-sm text-excalibur-gray">{t('containersSent')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
