import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/use-toast';
import { ArrowLeft, Image, Save, Upload } from 'lucide-react';
import { Link } from 'wouter';
import { useLanguage } from '../hooks/useLanguage';

interface SiteImage {
  id: string;
  name: string;
  description: string;
  currentUrl: string;
  location: string;
  usage: string;
}

// Alle verwendeten Bilder auf der Website
const siteImages: SiteImage[] = [
  {
    id: 'hero-solar-1',
    name: 'Hero Bild 1 - Solarenergie',
    description: 'Hauptbild im Hero-Slider für Solarenergie',
    currentUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=2000&q=80',
    location: 'Startseite - Hero Slider',
    usage: 'Hero-Slider Position 1'
  },
  {
    id: 'hero-generator-2',
    name: 'Hero Bild 2 - Generatoren',
    description: 'Hauptbild im Hero-Slider für Generatoren',
    currentUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=2000&q=80',
    location: 'Startseite - Hero Slider',
    usage: 'Hero-Slider Position 2'
  },
  {
    id: 'hero-solutions-3',
    name: 'Hero Bild 3 - Komplettlösungen',
    description: 'Hauptbild im Hero-Slider für Komplettlösungen',
    currentUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=2000&q=80',
    location: 'Startseite - Hero Slider',
    usage: 'Hero-Slider Position 3'
  },
  {
    id: 'products-solar-systems',
    name: 'Produktbereich - Solarsysteme',
    description: 'Bild für den Solarsysteme-Bereich',
    currentUrl: 'https://images.unsplash.com/photo-1558618047-fbd1774bf9f5?auto=format&fit=crop&w=800&q=80',
    location: 'Startseite - Produktbereich',
    usage: 'Solarsysteme Karte'
  },
  {
    id: 'products-solar-panels',
    name: 'Produktbereich - Solarpaneele',
    description: 'Bild für den Solarpaneele-Bereich',
    currentUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=800&q=80',
    location: 'Startseite - Produktbereich',
    usage: 'Solarpaneele Karte'
  },
  {
    id: 'products-inverters',
    name: 'Produktbereich - Wechselrichter',
    description: 'Bild für den Wechselrichter-Bereich',
    currentUrl: 'https://images.unsplash.com/photo-1621905513920-b750d2a7ac0d?auto=format&fit=crop&w=800&q=80',
    location: 'Startseite - Produktbereich',
    usage: 'Wechselrichter Karte'
  },
  {
    id: 'products-batteries',
    name: 'Produktbereich - Batterien',
    description: 'Bild für den Batterien-Bereich',
    currentUrl: 'https://images.unsplash.com/photo-1562123037-9b0e26f2e7d3?auto=format&fit=crop&w=800&q=80',
    location: 'Startseite - Produktbereich',
    usage: 'Batterien Karte'
  },
  {
    id: 'products-generators',
    name: 'Produktbereich - Generatoren',
    description: 'Bild für den Generatoren-Bereich',
    currentUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80',
    location: 'Startseite - Produktbereich',
    usage: 'Generatoren Karte'
  },
  {
    id: 'products-accessories',
    name: 'Produktbereich - Zubehör',
    description: 'Bild für den Zubehör-Bereich',
    currentUrl: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=800&q=80',
    location: 'Startseite - Produktbereich',
    usage: 'Zubehör Karte'
  },
  {
    id: 'about-warehouse',
    name: 'Über uns - Lager',
    description: 'Bild für den Lager-Bereich',
    currentUrl: 'https://images.unsplash.com/photo-1566139142475-0ceb49395ac7?auto=format&fit=crop&w=800&q=80',
    location: 'Startseite - Über uns',
    usage: 'Lager-Sektion'
  },
  {
    id: 'about-company',
    name: 'Über uns - Firmengebäude',
    description: 'Bild für die Firmen-Darstellung',
    currentUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    location: 'Über uns Seite',
    usage: 'Hauptbild der Über uns Seite'
  }
];

export default function AdminSiteImages() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState('');

  // Mutation zum Aktualisieren der Site-Settings (für Bild-URLs)
  const updateImageMutation = useMutation({
    mutationFn: async ({ imageId, url }: { imageId: string; url: string }) => {
      const response = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: `site_image_${imageId}`,
          value: url,
        }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Speichern des Bildes');
      }

      return response.json();
    },
    onSuccess: (_, { imageId }) => {
      toast({
        title: "Bild aktualisiert",
        description: "Das Website-Bild wurde erfolgreich aktualisiert.",
      });
      setEditingImage(null);
      setNewUrl('');
      
      // Invalidate queries to refresh any cached data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/site-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Das Bild konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  const handleSaveImage = (imageId: string) => {
    if (!newUrl.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine gültige Bild-URL ein.",
        variant: "destructive",
      });
      return;
    }

    updateImageMutation.mutate({ imageId, url: newUrl });
  };

  const startEditing = (imageId: string, currentUrl: string) => {
    setEditingImage(imageId);
    setNewUrl(currentUrl);
  };

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
          Hier können Sie alle Bilder verwalten, die auf der Website verwendet werden. 
          Klicken Sie auf "Bearbeiten" um die Bild-URL zu ändern.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {siteImages.map((image) => (
          <Card key={image.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image size={20} />
                {image.name}
              </CardTitle>
              <CardDescription>
                <div className="space-y-1">
                  <p><strong>Beschreibung:</strong> {image.description}</p>
                  <p><strong>Verwendet in:</strong> {image.location}</p>
                  <p><strong>Zweck:</strong> {image.usage}</p>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Aktuelles Bild anzeigen */}
                <div>
                  <Label>Aktuelles Bild:</Label>
                  <div className="mt-2 border rounded-lg overflow-hidden">
                    <img 
                      src={image.currentUrl} 
                      alt={image.name}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/400x300?text=Bild+nicht+verfügbar';
                      }}
                    />
                  </div>
                </div>

                {/* URL bearbeiten */}
                {editingImage === image.id ? (
                  <div className="space-y-2">
                    <Label htmlFor={`url-${image.id}`}>Neue Bild-URL:</Label>
                    <Input
                      id={`url-${image.id}`}
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://beispiel.com/bild.jpg"
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleSaveImage(image.id)}
                        disabled={updateImageMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <Save size={16} />
                        {updateImageMutation.isPending ? 'Speichern...' : 'Speichern'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setEditingImage(null);
                          setNewUrl('');
                        }}
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Aktuelle URL:</Label>
                    <div className="p-2 bg-gray-50 rounded text-sm break-all">
                      {image.currentUrl}
                    </div>
                    <Button 
                      onClick={() => startEditing(image.id, image.currentUrl)}
                      className="flex items-center gap-2"
                    >
                      <Upload size={16} />
                      Bild bearbeiten
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">💡 Tipps für Website-Bilder:</h3>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>• Verwenden Sie hochauflösende Bilder (mindestens 800x600 Pixel)</li>
          <li>• Optimale Formate: JPG für Fotos, PNG für Grafiken mit Transparenz</li>
          <li>• Achten Sie auf schnelle Ladezeiten - komprimierte Bilder bevorzugen</li>
          <li>• Unsplash.com bietet kostenlose, hochwertige Bilder</li>
          <li>• Verwenden Sie aussagekräftige Bilder, die zu Ihren Produkten passen</li>
        </ul>
      </div>
    </div>
  );
}