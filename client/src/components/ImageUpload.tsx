import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image, X, Copy, Check, Trash2 } from 'lucide-react';

interface ImageUploadProps {
  onImageSelect: (url: string) => void;
  currentImage?: string;
}

interface UploadedImage {
  id: string;
  filename: string;
  url: string;
  size: number;
  uploadedAt: string;
}

export function ImageUpload({ onImageSelect, currentImage }: ImageUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch uploaded images
  const { data: images = [], isLoading } = useQuery<UploadedImage[]>({
    queryKey: ['/api/admin/images'],
    enabled: isOpen,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch('/api/admin/images/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/images'] });
      toast({
        title: "Bilder hochgeladen",
        description: "Die Bilder wurden erfolgreich hochgeladen.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler beim Hochladen",
        description: error.message || "Die Bilder konnten nicht hochgeladen werden.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const response = await fetch(`/api/admin/images/${imageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Delete failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/images'] });
      toast({
        title: "Bild gelöscht",
        description: "Das Bild wurde erfolgreich gelöscht.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler beim Löschen",
        description: error.message || "Das Bild konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadMutation.mutate(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadMutation.mutate(e.target.files);
    }
  };

  const handleImageSelect = (url: string) => {
    onImageSelect(url);
    setIsOpen(false);
    toast({
      title: "Bild ausgewählt",
      description: "Das Bild wurde erfolgreich ausgewählt.",
    });
  };

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "URL kopiert",
      description: "Die Bild-URL wurde in die Zwischenablage kopiert.",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full">
          <Upload className="w-4 h-4 mr-2" />
          Bild aus Mediathek wählen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Mediathek</DialogTitle>
          <DialogDescription>
            Laden Sie neue Bilder hoch oder wählen Sie aus vorhandenen Bildern
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bilder hochladen</CardTitle>
              <CardDescription>
                Ziehen Sie Bilder hierher oder klicken Sie zum Auswählen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-excalibur-blue bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">
                  Bilder hier ablegen oder 
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 ml-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    durchsuchen
                  </Button>
                </p>
                <p className="text-sm text-gray-600">
                  Unterstützte Formate: JPG, PNG, WebP (max. 10MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
              
              {uploadMutation.isPending && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-excalibur-blue mr-3"></div>
                    <span className="text-sm">Bilder werden hochgeladen...</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Image Gallery */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vorhandene Bilder</CardTitle>
              <CardDescription>
                Klicken Sie auf ein Bild, um es auszuwählen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-excalibur-blue"></div>
                  </div>
                ) : images.length === 0 ? (
                  <div className="text-center py-12">
                    <Image className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Bilder</h3>
                    <p className="text-gray-600">Laden Sie Ihr erstes Bild hoch</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image) => (
                      <div key={image.id} className="group relative">
                        <div 
                          className={`border-2 rounded-lg overflow-hidden cursor-pointer transition-colors ${
                            currentImage === image.url 
                              ? 'border-excalibur-blue bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleImageSelect(image.url)}
                        >
                          <div className="aspect-square">
                            <img
                              src={image.url}
                              alt={image.filename}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-medium truncate">{image.filename}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(image.size)}</p>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(image.url, image.id);
                              }}
                            >
                              {copiedId === image.id ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMutation.mutate(image.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Selection Indicator */}
                        {currentImage === image.url && (
                          <div className="absolute top-2 left-2">
                            <Badge variant="default">Ausgewählt</Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}