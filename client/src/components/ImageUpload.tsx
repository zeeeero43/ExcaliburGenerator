import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image, X, Copy, Check, Trash2, Search, Grid, List, SortAsc, SortDesc, FileImage, Eye } from 'lucide-react';
import type { UploadedImage } from '@shared/schema';

interface ImageUploadProps {
  onImageSelect: (url: string) => void;
  currentImage?: string;
}

export function ImageUpload({ onImageSelect, currentImage }: ImageUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<UploadedImage | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
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

  // Batch delete mutation
  const batchDeleteMutation = useMutation({
    mutationFn: async (imageIds: string[]) => {
      const deletePromises = imageIds.map(id => 
        fetch(`/api/admin/images/${id}`, { method: 'DELETE' })
      );
      
      const responses = await Promise.all(deletePromises);
      const failures = responses.filter(r => !r.ok);
      
      if (failures.length > 0) {
        throw new Error(`${failures.length} Bilder konnten nicht gelöscht werden`);
      }
      
      return responses;
    },
    onSuccess: () => {
      toast({
        title: "Bilder gelöscht",
        description: `${selectedImages.size} Bild(er) erfolgreich gelöscht.`,
      });
      setSelectedImages(new Set());
      queryClient.invalidateQueries({ queryKey: ['/api/admin/images'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Einige Bilder konnten nicht gelöscht werden.",
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
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      
      if (!isImage) {
        toast({
          title: "Ungültige Datei",
          description: `${file.name} ist keine gültige Bilddatei.`,
          variant: "destructive",
        });
        return false;
      }
      
      if (!isValidSize) {
        toast({
          title: "Datei zu groß",
          description: `${file.name} ist größer als 10MB.`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    if (validFiles.length > 0) {
      const fileList = new DataTransfer();
      validFiles.forEach(file => fileList.items.add(file));
      uploadMutation.mutate(fileList.files);
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

  // Filter and sort images
  const filteredAndSortedImages = images
    .filter(image => {
      const matchesSearch = image.filename.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || 
        (filterCategory === 'products' && image.filename.includes('product')) ||
        (filterCategory === 'categories' && image.filename.includes('category')) ||
        (filterCategory === 'other' && !image.filename.includes('product') && !image.filename.includes('category'));
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.filename.localeCompare(b.filename);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'date':
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full">
          <Upload className="w-4 h-4 mr-2" />
          Bild aus Mediathek wählen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Professionelle Mediathek
          </DialogTitle>
          <DialogDescription>
            Laden Sie neue Bilder hoch, verwalten Sie Ihre Sammlung und wählen Sie das perfekte Bild aus
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* LEFT SIDEBAR: Controls and Settings */}
          <div className="w-1/3 flex flex-col space-y-4 overflow-y-auto">
            {/* Header Actions */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                {selectedImages.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => batchDeleteMutation.mutate(Array.from(selectedImages))}
                    disabled={batchDeleteMutation.isPending}
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {selectedImages.size} löschen
                  </Button>
                )}
                
                <div className="flex items-center border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Badge variant="outline" className="text-sm text-center">
                {filteredAndSortedImages.length} Bilder
              </Badge>
            </div>

            {/* Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Bilder hochladen
                </CardTitle>
                <CardDescription className="text-sm">
                  Mehrere Bilder gleichzeitig (max. 10MB)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <FileImage className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-medium mb-1">
                    Bilder ablegen oder 
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 ml-1 h-auto text-sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      durchsuchen
                    </Button>
                  </p>
                  <p className="text-xs text-gray-600">
                    JPG, PNG, WebP
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
                  <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-xs">Hochladen...</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Filter Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Filter & Sortierung</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search */}
                  <div className="space-y-2">
                    <Label htmlFor="search" className="text-sm">Suche</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Dateiname..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm">Kategorie</Label>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Bilder</SelectItem>
                        <SelectItem value="products">Produkt-Bilder</SelectItem>
                        <SelectItem value="categories">Kategorie-Bilder</SelectItem>
                        <SelectItem value="other">Andere Bilder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort By */}
                  <div className="space-y-2">
                    <Label className="text-sm">Sortieren</Label>
                    <Select value={sortBy} onValueChange={(value: 'date' | 'name' | 'size') => setSortBy(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Datum</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="size">Größe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort Order */}
                  <div className="space-y-2">
                    <Label className="text-sm">Reihenfolge</Label>
                    <Button
                      variant="outline"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="w-full justify-start"
                    >
                      {sortOrder === 'asc' ? <SortAsc className="w-4 h-4 mr-2" /> : <SortDesc className="w-4 h-4 mr-2" />}
                      {sortOrder === 'asc' ? 'Aufsteigend' : 'Absteigend'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Actions */}
            {filteredAndSortedImages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Aktionen</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const visibleIds = filteredAndSortedImages.map(img => img.id);
                      if (selectedImages.size === visibleIds.length) {
                        setSelectedImages(new Set());
                      } else {
                        setSelectedImages(new Set(visibleIds));
                      }
                    }}
                    className="w-full"
                  >
                    {selectedImages.size === filteredAndSortedImages.length ? 'Alle abwählen' : 'Alle auswählen'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT MAIN AREA: Image Gallery */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Image className="w-5 h-5" />
                Bildergalerie
              </h3>
              {selectedImages.size > 0 && (
                <Badge variant="secondary">
                  {selectedImages.size} ausgewählt
                </Badge>
              )}
            </div>

            <div className="flex-1 border rounded-lg overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredAndSortedImages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <Image className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">
                      {searchTerm || filterCategory !== 'all' ? 'Keine Bilder gefunden' : 'Keine Bilder hochgeladen'}
                    </p>
                  </div>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="p-4">
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {filteredAndSortedImages.map((image) => {
                          const isSelected = selectedImages.has(image.id);
                          
                          return (
                            <div 
                              key={image.id}
                              className={`group relative border-2 rounded-lg overflow-hidden transition-all cursor-pointer hover:shadow-md ${
                                isSelected 
                                  ? 'border-blue-500 ring-2 ring-blue-200' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => {
                                const newSelected = new Set(selectedImages);
                                if (isSelected) {
                                  newSelected.delete(image.id);
                                } else {
                                  newSelected.add(image.id);
                                }
                                setSelectedImages(newSelected);
                              }}
                            >
                              <div className="aspect-square relative">
                                <img
                                  src={image.url}
                                  alt={image.filename}
                                  className="w-full h-full object-cover"
                                />
                                
                                {isSelected && (
                                  <div className="absolute top-2 left-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                  </div>
                                )}
                                
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity" />
                                
                                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleImageSelect(image.url);
                                      }}
                                      className="h-6 px-2 text-xs flex-1"
                                    >
                                      Auswählen
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewImage(image);
                                      }}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredAndSortedImages.map((image) => {
                          const isSelected = selectedImages.has(image.id);
                          
                          return (
                            <div 
                              key={image.id}
                              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                                isSelected 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => {
                                const newSelected = new Set(selectedImages);
                                if (isSelected) {
                                  newSelected.delete(image.id);
                                } else {
                                  newSelected.add(image.id);
                                }
                                setSelectedImages(newSelected);
                              }}
                            >
                              <img
                                src={image.url}
                                alt={image.filename}
                                className="w-16 h-16 object-cover rounded-md"
                              />
                              
                              <div className="flex-1 ml-4">
                                <p className="font-medium">{image.filename}</p>
                                <p className="text-sm text-gray-600">
                                  {formatFileSize(image.size)} • {formatDate(image.createdAt)}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleImageSelect(image.url);
                                  }}
                                >
                                  Auswählen
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewImage(image);
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </div>

        {/* Preview Dialog */}
        <Dialog open={previewImage !== null} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{previewImage?.filename}</DialogTitle>
              <DialogDescription>
                {previewImage && formatFileSize(previewImage.size)} • {previewImage && formatDate(previewImage.createdAt)}
              </DialogDescription>
            </DialogHeader>
            {previewImage && (
              <div className="space-y-4">
                <img
                  src={previewImage.url}
                  alt={previewImage.filename}
                  className="w-full h-auto max-h-96 object-contain rounded-lg"
                />
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    onClick={() => {
                      handleImageSelect(previewImage.url);
                      setPreviewImage(null);
                    }}
                  >
                    Dieses Bild auswählen
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(previewImage.url, previewImage.id)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    URL kopieren
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}