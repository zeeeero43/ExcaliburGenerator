import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image, Trash2, Copy, Check, FileImage, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import type { UploadedImage } from '@shared/schema';

export default function AdminImageManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [deleteImageId, setDeleteImageId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Lade alle hochgeladenen Bilder
  const { data: images = [], isLoading } = useQuery<UploadedImage[]>({
    queryKey: ['/api/admin/images'],
    retry: false,
  });

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
        const error = await response.json();
        throw new Error(error.error || 'Upload fehlgeschlagen');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload erfolgreich",
        description: `${data.length} Bild(er) hochgeladen`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/images'] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload-Fehler",
        description: error.message || "Bilder konnten nicht hochgeladen werden.",
        variant: "destructive",
      });
    },
  });

  // Lösch-Mutation
  const deleteMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const response = await fetch(`/api/admin/images/${imageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Löschen fehlgeschlagen');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bild gelöscht",
        description: "Das Bild wurde erfolgreich gelöscht.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/images'] });
      setDeleteImageId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Lösch-Fehler",
        description: error.message || "Das Bild konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  // Batch-Lösch-Mutation
  const batchDeleteMutation = useMutation({
    mutationFn: async (imageIds: number[]) => {
      const promises = imageIds.map(id => 
        fetch(`/api/admin/images/${id}`, { method: 'DELETE' })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Bilder gelöscht",
        description: `${selectedImages.size} Bild(er) erfolgreich gelöscht.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/images'] });
      setSelectedImages(new Set());
    },
    onError: (error: any) => {
      toast({
        title: "Lösch-Fehler",
        description: "Einige Bilder konnten nicht gelöscht werden.",
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

  const toggleImageSelection = (imageId: number) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
  };

  const copyToClipboard = (url: string, id: number) => {
    const fullUrl = url.startsWith('http') ? url : `http://localhost:5000${url}`;
    navigator.clipboard.writeText(fullUrl);
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

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'Unbekannt';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Bildverwaltung</h1>
            <p className="text-gray-600">Verwalten Sie alle hochgeladenen Bilder</p>
          </div>
        </div>
        
        {selectedImages.size > 0 && (
          <Button
            variant="destructive"
            onClick={() => batchDeleteMutation.mutate(Array.from(selectedImages))}
            disabled={batchDeleteMutation.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {selectedImages.size} Bild(er) löschen
          </Button>
        )}
      </div>

      {/* Upload-Bereich */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Neue Bilder hochladen
          </CardTitle>
          <CardDescription>
            Laden Sie neue Bilder hoch (maximal 5 Dateien, je 5MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FileImage className="w-12 h-12 mx-auto mb-4 text-gray-400" />
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
              Unterstützte Formate: JPG, PNG, WebP (max. 5MB pro Datei)
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-sm">Bilder werden hochgeladen...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bildergalerie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Hochgeladene Bilder ({images.length})
            </span>
            {images.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedImages.size === images.length) {
                    setSelectedImages(new Set());
                  } else {
                    setSelectedImages(new Set(images.map(img => img.id)));
                  }
                }}
              >
                {selectedImages.size === images.length ? 'Alle abwählen' : 'Alle auswählen'}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12">
              <Image className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Keine Bilder hochgeladen</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {images.map((image) => {
                const isSelected = selectedImages.has(image.id);
                
                return (
                  <div 
                    key={image.id}
                    className={`group relative border-2 rounded-lg overflow-hidden transition-all ${
                      isSelected 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Auswahl-Checkbox */}
                    <div className="absolute top-2 left-2 z-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleImageSelection(image.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>

                    {/* Bild */}
                    <div className="aspect-square cursor-pointer" onClick={() => toggleImageSelection(image.id)}>
                      <img
                        src={image.url}
                        alt={image.filename}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes('localhost:5000')) {
                            target.src = `http://localhost:5000${image.url}`;
                          }
                        }}
                      />
                    </div>

                    {/* Info und Aktionen */}
                    <div className="p-2 bg-white">
                      <p className="text-xs font-medium truncate">{image.filename}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(image.size)} • {formatDate(image.createdAt ?? null)}
                      </p>
                    </div>

                    {/* Hover-Aktionen */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(image.url, image.id);
                          }}
                          className="h-8 w-8 p-0"
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
                            setDeleteImageId(image.id);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lösch-Dialog */}
      <AlertDialog open={deleteImageId !== null} onOpenChange={() => setDeleteImageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bild löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie dieses Bild löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteImageId && deleteMutation.mutate(deleteImageId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}