import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useToast } from '../hooks/use-toast';
import { ArrowLeft, Image, Save, Upload, Check, ExternalLink, Plus, FileImage } from 'lucide-react';
import { Link } from 'wouter';
import { useLanguage } from '../hooks/useLanguage';
import type { UploadedImage, SiteSetting } from '@shared/schema';
import { apiRequest } from '../lib/queryClient';

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
    id: 'about-team',
    name: 'Über Uns Team',
    description: 'Team-Bild auf der Über Uns Seite',
    location: 'Über Uns Seite',
    settingKey: 'about_team_image'
  }
];

export default function AdminSiteImages() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImageArea, setSelectedImageArea] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<'uploads' | 'url' | 'upload'>('uploads');

  // Wenn ein Bereich ausgewählt wird, die aktuelle URL in das URL-Feld laden
  const handleAreaSelection = (areaId: string) => {
    setSelectedImageArea(areaId);
    setSelectedImage(null);
    
    // Aktuelle URL des ausgewählten Bereichs laden
    const area = websiteImageAreas.find(a => a.id === areaId);
    if (area) {
      const currentUrl = getCurrentImageForArea(area.settingKey);
      setCustomImageUrl(currentUrl || '');
      
      // Wechsel zur URL-Tab wenn bereits ein Bild zugewiesen ist
      if (currentUrl) {
        setSelectedTab('url');
      }
    }
  };

  // Hochgeladene Bilder aus der Datenbank laden
  const { data: uploadedImages = [], isLoading: imagesLoading } = useQuery<UploadedImage[]>({
    queryKey: ['/api/admin/images'],
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
      setCustomImageUrl('');
      // Invalidate both admin and public site-settings to ensure immediate update
      queryClient.invalidateQueries({ queryKey: ['/api/admin/site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/site-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Das Bild konnte nicht zugewiesen werden.",
        variant: "destructive",
      });
    },
  });

  const handleAssignUploadedImage = () => {
    if (!selectedImageArea || !selectedImage) return;
    
    const area = websiteImageAreas.find(a => a.id === selectedImageArea);
    if (!area) return;

    assignImageMutation.mutate({
      settingKey: area.settingKey,
      imageUrl: selectedImage.url
    });
  };

  const handleAssignCustomUrl = () => {
    if (!selectedImageArea || !customImageUrl.trim()) return;
    
    const area = websiteImageAreas.find(a => a.id === selectedImageArea);
    if (!area) return;

    assignImageMutation.mutate({
      settingKey: area.settingKey,
      imageUrl: customImageUrl.trim()
    });
  };

  const getCurrentImageForArea = (settingKey: string): string | null => {
    const setting = siteSettings.find(s => s.key === settingKey);
    return setting?.value || null;
  };

  // Upload-Mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('images', file);
      });
      
      const response = await fetch('/api/admin/images/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload fehlgeschlagen');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload erfolgreich",
        description: `${data.length} Bild(er) hochgeladen`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/images'] });
      
      // Automatically select the first uploaded image
      if (data && data.length > 0) {
        setSelectedImage(data[0]);
        setSelectedTab('uploads');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Upload-Fehler",
        description: error.message || "Bilder konnten nicht hochgeladen werden.",
        variant: "destructive",
      });
    },
  });

  const canAssign = () => {
    if (!selectedImageArea) return false;
    if (selectedTab === 'uploads') return !!selectedImage;
    if (selectedTab === 'url') return !!customImageUrl.trim();
    return false;
  };

  const handleAssign = () => {
    if (selectedTab === 'uploads') {
      handleAssignUploadedImage();
    } else {
      handleAssignCustomUrl();
    }
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
        <p className="text-gray-600 mb-2">
          Hier können Sie die drei Hero-Bilder auf der Startseite bearbeiten. 
          Diese Bilder werden im großen Slider ganz oben auf der Homepage angezeigt.
        </p>
        <p className="text-sm text-blue-600">
          Sie können entweder ein hochgeladenes Bild verwenden oder eine URL eingeben.
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
                    isSelected ? 'bg-blue-50 border-blue-500 shadow-md' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleAreaSelection(area.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{area.name}</CardTitle>
                      {isSelected && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Wird bearbeitet
                          </span>
                          <Check className="w-5 h-5 text-blue-500" />
                        </div>
                      )}
                    </div>
                    <CardDescription>{area.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-2">Bereich: {area.location}</p>
                    {currentImage ? (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-green-600 mb-1">Aktuelles Bild:</p>
                        <img 
                          src={currentImage} 
                          alt={area.name}
                          className="w-full h-32 object-cover rounded-md"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling!.textContent = 'Bild konnte nicht geladen werden';
                          }}
                        />
                        <p className="text-xs text-gray-500 mt-1 break-all">{currentImage}</p>
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

        {/* Bild-Auswahl */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Bild auswählen</h2>
          
          <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as 'uploads' | 'url' | 'upload')} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="uploads" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Hochgeladen
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Neu hochladen
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                URL eingeben
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="uploads" className="mt-4">
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
                              onError={(e) => {
                                console.error('Image load error for:', image.url);
                                // Fallback: try with explicit localhost construction
                                const target = e.target as HTMLImageElement;
                                if (!target.src.includes('localhost:5000')) {
                                  target.src = `http://localhost:5000${image.url}`;
                                }
                              }}
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
              
              {/* Button direkt unter uploads Tab */}
              {selectedTab === 'uploads' && selectedImage && selectedImageArea && (
                <div className="mt-4">
                  <Button
                    onClick={handleAssignUploadedImage}
                    disabled={assignImageMutation.isPending}
                    className="w-full"
                  >
                    {assignImageMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Wird zugewiesen...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Bild zuweisen
                      </>
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="upload" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileImage className="w-5 h-5" />
                    Neue Bilder hochladen
                  </CardTitle>
                  <CardDescription>
                    Laden Sie neue Bilder hoch (maximal 5 Dateien, je 5MB). 
                    Nach dem Upload können Sie das Bild sofort zuweisen.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fileUpload">Bilder auswählen</Label>
                      <Input
                        id="fileUpload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="mt-1"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            uploadMutation.mutate(files);
                          }
                        }}
                        disabled={uploadMutation.isPending}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG, WebP - maximal 5MB pro Datei
                      </p>
                    </div>
                    
                    {uploadMutation.isPending && (
                      <div className="text-center py-4">
                        <div className="inline-flex items-center gap-2 text-blue-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          Bilder werden hochgeladen...
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Button direkt unter upload Tab */}
              {selectedTab === 'upload' && selectedImage && selectedImageArea && (
                <div className="mt-4">
                  <Button
                    onClick={handleAssignUploadedImage}
                    disabled={assignImageMutation.isPending}
                    className="w-full"
                  >
                    {assignImageMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Wird zugewiesen...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Bild zuweisen
                      </>
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="url" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="w-5 h-5" />
                    Bild-URL eingeben
                  </CardTitle>
                  <CardDescription>
                    Geben Sie die vollständige URL eines Bildes ein (z.B. https://unsplash.com/...)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="imageUrl">Bild-URL</Label>
                    <Input
                      id="imageUrl"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  {customImageUrl.trim() && (
                    <div className="mt-4">
                      <Label>Vorschau:</Label>
                      <div className="mt-2 border rounded-md p-2">
                        <img 
                          src={customImageUrl.trim()} 
                          alt="Vorschau"
                          className="w-full h-32 object-cover rounded-md"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling!.textContent = 'Bild konnte nicht geladen werden. Überprüfen Sie die URL.';
                            e.currentTarget.nextElementSibling!.className = 'text-red-500 text-sm text-center py-8';
                          }}
                        />
                        <div className="hidden"></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Button direkt unter URL Tab */}
              {selectedTab === 'url' && customImageUrl.trim() && selectedImageArea && (
                <div className="mt-4">
                  <Button
                    onClick={handleAssignCustomUrl}
                    disabled={assignImageMutation.isPending}
                    className="w-full"
                  >
                    {assignImageMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Wird zugewiesen...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Bild zuweisen
                      </>
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>


    </div>
  );
}