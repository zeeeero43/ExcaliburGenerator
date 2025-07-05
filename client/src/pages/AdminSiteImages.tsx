import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/use-toast';
import { ArrowLeft, Image, Save, Upload, Check } from 'lucide-react';
import { Link } from 'wouter';
import { useLanguage } from '../hooks/useLanguage';
import type { UploadedImage, SiteSetting } from '@shared/schema';

interface WebsiteImageArea {
  id: string;
  name: string;
  description: string;
  location: string;
  settingKey: string;
}

// Website-Bereiche die Bilder benötigen
const websiteImageAreas: WebsiteImageArea[] = [
  {
    id: 'hero-1',
    name: 'Hero Bild 1',
    description: 'Erstes Bild im Hero-Slider',
    location: 'Startseite - Hero Slider',
    settingKey: 'hero_image_1'
  },
  {
    id: 'hero-2',
    name: 'Hero Bild 2',
    description: 'Zweites Bild im Hero-Slider',
    location: 'Startseite - Hero Slider',
    settingKey: 'hero_image_2'
  },
  {
    id: 'hero-3',
    name: 'Hero Bild 3',
    description: 'Drittes Bild im Hero-Slider',
    location: 'Startseite - Hero Slider',
    settingKey: 'hero_image_3'
  },
  {
    id: 'solar-systems',
    name: 'Solarsysteme Bereich',
    description: 'Bild für Solarsysteme Produktkarte',
    location: 'Startseite - Produktbereich',
    settingKey: 'product_solar_systems'
  },
  {
    id: 'solar-panels',
    name: 'Solarpaneele Bereich',
    description: 'Bild für Solarpaneele Produktkarte',
    location: 'Startseite - Produktbereich',
    settingKey: 'product_solar_panels'
  },
  {
    id: 'generators',
    name: 'Generatoren Bereich',
    description: 'Bild für Generatoren Produktkarte',
    location: 'Startseite - Produktbereich',
    settingKey: 'product_generators'
  }
];

export default function AdminSiteImages() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImageArea, setSelectedImageArea] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);

  // Hochgeladene Bilder aus der Datenbank laden
  const { data: uploadedImages = [], isLoading: imagesLoading } = useQuery<UploadedImage[]>({
    queryKey: ['/api/admin/uploaded-images'],
    retry: false,
  });

  // Aktuelle Site-Settings laden
  const { data: siteSettings = [] } = useQuery<SiteSetting[]>({
    queryKey: ['/api/admin/site-settings'],
    retry: false,
  });

  // Mutation zum Zuweisen eines Bildes zu einem Website-Bereich
  const assignImageMutation = useMutation({
    mutationFn: async ({ settingKey, imageUrl }: { settingKey: string; imageUrl: string }) => {
      const response = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: settingKey,
          value: imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Zuweisen des Bildes');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bild zugewiesen",
        description: "Das Bild wurde erfolgreich dem Website-Bereich zugewiesen.",
      });
      setSelectedImageArea(null);
      setSelectedImage(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/site-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Das Bild konnte nicht zugewiesen werden.",
        variant: "destructive",
      });
    },
  });

  const handleAssignImage = () => {
    if (!selectedImageArea || !selectedImage) return;
    
    const area = websiteImageAreas.find(a => a.id === selectedImageArea);
    if (!area) return;

    assignImageMutation.mutate({
      settingKey: area.settingKey,
      imageUrl: selectedImage.url
    });
  };

  const getCurrentImageForArea = (settingKey: string): string | null => {
    const setting = siteSettings.find(s => s.key === settingKey);
    return setting?.value || null;
  };

  if (imagesLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Website-Bilder verwalten</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Bilder...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/dashboard">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft size={16} />
            Zurück zum Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Website-Bilder verwalten</h1>
      </div>

      <div className="mb-6">
        <p className="text-gray-600">
          Wählen Sie einen Website-Bereich aus und ordnen Sie dann ein hochgeladenes Bild zu.
          Die Bilder werden sofort auf der Website aktualisiert.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Website-Bereiche */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Website-Bereiche</h2>
          <div className="space-y-4">
            {websiteImageAreas.map((area) => {
              const currentImage = getCurrentImageForArea(area.settingKey);
              const isSelected = selectedImageArea === area.id;
              
              return (
                <Card 
                  key={area.id} 
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedImageArea(area.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{area.name}</CardTitle>
                      {isSelected && <Check className="w-5 h-5 text-blue-500" />}
                    </div>
                    <CardDescription>{area.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-2">Bereich: {area.location}</p>
                    {currentImage ? (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-green-600">Aktuelles Bild:</p>
                        <img 
                          src={currentImage} 
                          alt={area.name}
                          className="w-full h-32 object-cover rounded-md mt-1"
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-orange-600">Kein Bild zugewiesen</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Hochgeladene Bilder */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Hochgeladene Bilder</h2>
          {uploadedImages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <Image className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-600 text-center">
                  Keine Bilder hochgeladen. Laden Sie zuerst Bilder über das Produktformular hoch.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {uploadedImages.map((image) => {
                const isSelected = selectedImage?.id === image.id;
                
                return (
                  <Card 
                    key={image.id}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-green-50 border-green-500' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedImage(image)}
                  >
                    <CardContent className="p-3">
                      <div className="relative">
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                        <img 
                          src={image.url} 
                          alt={image.filename}
                          className="w-full h-32 object-cover rounded-md"
                        />
                      </div>
                      <p className="text-sm font-medium mt-2 truncate">{image.filename}</p>
                      <p className="text-xs text-gray-500">
                        {Math.round(image.size / 1024)} KB
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Zuweisungs-Button */}
      {selectedImageArea && selectedImage && (
        <div className="fixed bottom-6 right-6">
          <Button 
            onClick={handleAssignImage}
            disabled={assignImageMutation.isPending}
            size="lg"
            className="shadow-lg"
          >
            <Save className="w-4 h-4 mr-2" />
            Bild zuweisen
          </Button>
        </div>
      )}
    </div>
  );
}