import { useLanguage } from '../hooks/useLanguage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Shield, FileText, Phone, Mail, MapPin } from 'lucide-react';

export default function Legal() {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">{t('legal.title')}</h1>
          <p className="text-gray-600">{t('legal.subtitle')}</p>
        </div>

        <Tabs defaultValue="impressum" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="impressum">{t('legal.impressum')}</TabsTrigger>
            <TabsTrigger value="datenschutz">{t('legal.privacy')}</TabsTrigger>
          </TabsList>

          <TabsContent value="impressum">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t('legal.impressum')}
                </CardTitle>
                <CardDescription>
                  {t('legal.impressumDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">{t('legal.company')}</h3>
                  <p className="text-gray-700">
                    EXCALIBUR POWER SOLUTIONS S.L.<br />
                    Importación y Distribución de Equipos Solares y Generadores
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">{t('legal.address')}</h3>
                  <div className="flex items-start gap-2 text-gray-700">
                    <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                    <div>
                      Calle 23 #456, entre A y B<br />
                      Vedado, La Habana 10400<br />
                      Cuba
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">{t('legal.contact')}</h3>
                  <div className="space-y-2 text-gray-700">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>+53 7 123 4567 (Cuba)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>+49 30 123 4567 (Deutschland)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>info@excalibur-cuba.com</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">{t('legal.businessLicense')}</h3>
                  <p className="text-gray-700">
                    Registro Mercantil: HRB 123456<br />
                    Licencia de Importación: MINCEX-2024-001<br />
                    CIF: A-12345678
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">{t('legal.responsiblePerson')}</h3>
                  <p className="text-gray-700">
                    {t('legal.responsiblePersonName')}: Max Mustermann<br />
                    {t('legal.position')}: Geschäftsführer / Director General
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">{t('legal.website')}</h3>
                  <p className="text-gray-700">
                    www.excalibur-cuba.com<br />
                    {t('legal.websiteDescription')}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">{t('legal.disclaimer')}</h3>
                  <p className="text-gray-700 text-sm">
                    {t('legal.disclaimerText')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="datenschutz">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t('legal.privacy')}
                </CardTitle>
                <CardDescription>
                  {t('legal.privacyDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">{t('legal.dataCollection')}</h3>
                  <p className="text-gray-700 mb-2">
                    {t('legal.dataCollectionText')}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                    <li>{t('legal.dataCollectionItem1')}</li>
                    <li>{t('legal.dataCollectionItem2')}</li>
                    <li>{t('legal.dataCollectionItem3')}</li>
                    <li>{t('legal.dataCollectionItem4')}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">{t('legal.dataUsage')}</h3>
                  <p className="text-gray-700 mb-2">
                    {t('legal.dataUsageText')}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                    <li>{t('legal.dataUsageItem1')}</li>
                    <li>{t('legal.dataUsageItem2')}</li>
                    <li>{t('legal.dataUsageItem3')}</li>
                    <li>{t('legal.dataUsageItem4')}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">{t('legal.cookies')}</h3>
                  <p className="text-gray-700">
                    {t('legal.cookiesText')}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">{t('legal.analytics')}</h3>
                  <p className="text-gray-700">
                    {t('legal.analyticsText')}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">{t('legal.dataProtection')}</h3>
                  <p className="text-gray-700">
                    {t('legal.dataProtectionText')}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">{t('legal.userRights')}</h3>
                  <p className="text-gray-700 mb-2">
                    {t('legal.userRightsText')}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                    <li>{t('legal.userRightsItem1')}</li>
                    <li>{t('legal.userRightsItem2')}</li>
                    <li>{t('legal.userRightsItem3')}</li>
                    <li>{t('legal.userRightsItem4')}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">{t('legal.dataRetention')}</h3>
                  <p className="text-gray-700">
                    {t('legal.dataRetentionText')}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">{t('legal.thirdParty')}</h3>
                  <p className="text-gray-700">
                    {t('legal.thirdPartyText')}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">{t('legal.changes')}</h3>
                  <p className="text-gray-700">
                    {t('legal.changesText')}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">{t('legal.contactForPrivacy')}</h3>
                  <p className="text-gray-700">
                    {t('legal.contactForPrivacyText')}<br />
                    <strong>Email:</strong> privacy@excalibur-cuba.com<br />
                    <strong>Tel:</strong> +53 7 123 4567
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>{t('legal.lastUpdated')}:</strong> {new Date().toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}