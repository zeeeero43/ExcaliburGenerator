import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/use-toast';
import { ArrowLeft, Phone, Mail, MapPin, Save, Check } from 'lucide-react';
import { Link } from 'wouter';
import { useLanguage } from '../hooks/useLanguage';
import type { SiteSetting } from '@shared/schema';
import { apiRequest } from '../lib/queryClient';

interface ContactSetting {
  key: string;
  label: string;
  description: string;
  placeholder: string;
  icon: React.ComponentType<any>;
  type: 'phone' | 'email' | 'text';
}

const contactSettings: ContactSetting[] = [
  {
    key: 'contact_technical_phone',
    label: 'Technische Beratung Telefon',
    description: 'Telefonnummer für technische Unterstützung',
    placeholder: '+49 160 323 9439',
    icon: Phone,
    type: 'phone'
  },
  {
    key: 'contact_sales_phone',
    label: 'Verkauf Telefon',
    description: 'Telefonnummer für Verkauf und Bestellungen',
    placeholder: '+53 58781416',
    icon: Phone,
    type: 'phone'
  },
  {
    key: 'contact_warehouse_phone',
    label: 'Lager Telefon',
    description: 'Telefonnummer für Lager und Abholung',
    placeholder: '+53 58781416',
    icon: Phone,
    type: 'phone'
  },
  {
    key: 'contact_email_technical',
    label: 'Technische E-Mail',
    description: 'E-Mail für technische Anfragen',
    placeholder: 'tech@excalibur-cuba.com',
    icon: Mail,
    type: 'email'
  },
  {
    key: 'contact_email_sales',
    label: 'Verkauf E-Mail',
    description: 'E-Mail für Verkauf und Bestellungen',
    placeholder: 'sales@excalibur-cuba.com',
    icon: Mail,
    type: 'email'
  },
  {
    key: 'contact_address',
    label: 'Adresse',
    description: 'Vollständige Geschäftsadresse',
    placeholder: 'Havanna del Este, Cuba',
    icon: MapPin,
    type: 'text'
  }
];

export default function AdminContactSettings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  const [unsavedChanges, setUnsavedChanges] = useState<Set<string>>(new Set());

  // Aktuelle Site-Settings laden
  const { data: siteSettings = [], isLoading } = useQuery<SiteSetting[]>({
    queryKey: ['/api/admin/site-settings'],
    retry: false,
  });

  // Mutation zum Speichern der Einstellungen
  const saveSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      return await apiRequest('POST', '/api/admin/site-settings', { key, value });
    },
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/site-settings'] });
      
      // Entferne aus unsavedChanges
      const newUnsavedChanges = new Set(unsavedChanges);
      newUnsavedChanges.delete(key);
      setUnsavedChanges(newUnsavedChanges);
      
      toast({
        title: "Gespeichert",
        description: "Kontaktinformation wurde erfolgreich aktualisiert",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: "Fehler beim Speichern der Kontaktinformation",
        variant: "destructive",
      });
      console.error('Save error:', error);
    },
  });

  // Aktuellen Wert für ein Feld abrufen
  const getCurrentValue = (key: string): string => {
    // Prüfe zuerst editingValues
    if (editingValues[key] !== undefined) {
      return editingValues[key];
    }
    
    // Dann siteSettings
    const setting = siteSettings.find(s => s.key === key);
    if (setting) {
      return setting.value;
    }
    
    // Fallback zu Standardwerten
    const contactSetting = contactSettings.find(s => s.key === key);
    return contactSetting?.placeholder || '';
  };

  // Wert ändern
  const handleValueChange = (key: string, value: string) => {
    setEditingValues(prev => ({ ...prev, [key]: value }));
    setUnsavedChanges(prev => new Set(prev).add(key));
  };

  // Einzelnes Feld speichern
  const handleSave = (key: string) => {
    const value = getCurrentValue(key);
    saveSetting.mutate({ key, value });
  };

  // Alle Änderungen speichern
  const handleSaveAll = () => {
    Array.from(unsavedChanges).forEach(key => {
      const value = getCurrentValue(key);
      saveSetting.mutate({ key, value });
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-excalibur-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zum Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kontaktinformationen</h1>
            <p className="text-gray-600">Telefonnummern, E-Mails und Adresse verwalten</p>
          </div>
        </div>
        {unsavedChanges.size > 0 && (
          <Button onClick={handleSaveAll} className="bg-excalibur-blue hover:bg-excalibur-blue/90">
            <Save className="w-4 h-4 mr-2" />
            Alle Änderungen speichern ({unsavedChanges.size})
          </Button>
        )}
      </div>

      {/* Kontakteinstellungen */}
      <div className="grid gap-6">
        {contactSettings.map((setting) => {
          const Icon = setting.icon;
          const currentValue = getCurrentValue(setting.key);
          const hasUnsavedChanges = unsavedChanges.has(setting.key);
          const isSaving = saveSetting.isPending;

          return (
            <Card key={setting.key} className={`transition-all duration-200 ${
              hasUnsavedChanges ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-excalibur-blue/10 rounded-lg">
                      <Icon className="w-5 h-5 text-excalibur-blue" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{setting.label}</CardTitle>
                      <CardDescription>{setting.description}</CardDescription>
                    </div>
                  </div>
                  {hasUnsavedChanges && (
                    <Button
                      onClick={() => handleSave(setting.key)}
                      disabled={isSaving}
                      size="sm"
                      className="bg-excalibur-blue hover:bg-excalibur-blue/90"
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span className="ml-2">Speichern</span>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor={setting.key} className="text-sm font-medium">
                    {setting.type === 'phone' && 'Telefonnummer'}
                    {setting.type === 'email' && 'E-Mail Adresse'}
                    {setting.type === 'text' && 'Text'}
                  </Label>
                  <Input
                    id={setting.key}
                    type={setting.type === 'email' ? 'email' : setting.type === 'phone' ? 'tel' : 'text'}
                    value={currentValue}
                    onChange={(e) => handleValueChange(setting.key, e.target.value)}
                    placeholder={setting.placeholder}
                    className={`${hasUnsavedChanges ? 'border-orange-300 focus:border-orange-500' : ''}`}
                  />
                  {hasUnsavedChanges && (
                    <p className="text-sm text-orange-600 flex items-center gap-1">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      Nicht gespeicherte Änderungen
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info-Karte */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-700">
            <p>• Änderungen werden sofort auf der Website angezeigt</p>
            <p>• Telefonnummern sollten das internationale Format verwenden (+49, +53)</p>
            <p>• E-Mail-Adressen werden für Kontaktformulare und Kundenanfragen verwendet</p>
            <p>• Speichere deine Änderungen, bevor du die Seite verlässt</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}