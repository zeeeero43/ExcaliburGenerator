import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, RefreshCw, Info } from 'lucide-react';
import type { Category, Subcategory, Product } from '@shared/schema';
import { ImageUpload } from '@/components/ImageUpload';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Alert, AlertDescription } from '@/components/ui/alert';

const productFormSchema = z.object({
  nameDe: z.string().min(1, 'Produktname ist erforderlich'),
  nameEs: z.string().optional(),
  nameEn: z.string().optional(),
  shortDescriptionDe: z.string().min(1, 'Kurzbeschreibung ist erforderlich'),
  shortDescriptionEs: z.string().optional(),
  shortDescriptionEn: z.string().optional(),
  descriptionDe: z.string().optional(),
  descriptionEs: z.string().optional(),
  descriptionEn: z.string().optional(),
  categoryId: z.number().min(1, 'Kategorie ist erforderlich'),
  subcategoryId: z.number().optional(),
  sku: z.string().optional(),
  price: z.string().optional(),
  priceNote: z.string().optional(),
  mainImage: z.string().optional(),
  additionalImages: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  stockStatus: z.enum(['in_stock', 'out_of_stock', 'limited']).default('in_stock'),
  availabilityEs: z.string().optional(),
  availabilityDe: z.string().optional(),
  availabilityEn: z.string().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function AdminProductForm() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationTimeout, setTranslationTimeout] = useState<NodeJS.Timeout | null>(null);

  const isEditing = Boolean(id);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      nameDe: '',
      nameEs: '',
      nameEn: '',
      shortDescriptionDe: '',
      shortDescriptionEs: '',
      shortDescriptionEn: '',
      descriptionDe: '',
      descriptionEs: '',
      descriptionEn: '',
      categoryId: 0,
      subcategoryId: 0,
      sku: '',
      price: '',
      priceNote: '',
      mainImage: '',
      additionalImages: [],
      isActive: true,
      isFeatured: false,
      stockStatus: 'in_stock',
      availabilityEs: '',
      availabilityDe: '',
      availabilityEn: '',
    },
  });

  // Fetch product data for editing
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: [`/api/admin/products/${id}`],
    enabled: isEditing,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/admin/categories'],
  });

  // Fetch subcategories
  const { data: allSubcategories = [] } = useQuery({
    queryKey: ['/api/admin/subcategories'],
  });

  // Filter subcategories based on selected category
  const selectedCategoryId = form.watch('categoryId');
  const subcategories = allSubcategories.filter(sub => sub.categoryId === selectedCategoryId);

  // Auto-translation function
  const handleAutoTranslation = async (germanText: string, toField: string) => {
    if (!germanText || germanText.trim() === '') return;
    
    setIsTranslating(true);
    
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: germanText,
          fromLang: 'de',
          toLang: toField.includes('Es') ? 'es' : 'en',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.translatedText && data.translatedText !== germanText) {
          form.setValue(toField as keyof ProductFormData, data.translatedText);
        }
      }
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  // Real-time translation with debounce for product name
  useEffect(() => {
    const germanName = form.watch('nameDe');
    if (germanName) {
      if (translationTimeout) {
        clearTimeout(translationTimeout);
      }
      
      const timeout = setTimeout(() => {
        handleAutoTranslation(germanName, 'nameEs');
        handleAutoTranslation(germanName, 'nameEn');
      }, 1000);
      
      setTranslationTimeout(timeout);
    }
  }, [form.watch('nameDe')]);

  // Real-time translation with debounce for short description
  useEffect(() => {
    const germanDesc = form.watch('shortDescriptionDe');
    if (germanDesc) {
      if (translationTimeout) {
        clearTimeout(translationTimeout);
      }
      
      const timeout = setTimeout(() => {
        handleAutoTranslation(germanDesc, 'shortDescriptionEs');
        handleAutoTranslation(germanDesc, 'shortDescriptionEn');
      }, 1000);
      
      setTranslationTimeout(timeout);
    }
  }, [form.watch('shortDescriptionDe')]);

  // Real-time translation with debounce for full description
  useEffect(() => {
    const germanFullDesc = form.watch('descriptionDe');
    if (germanFullDesc) {
      if (translationTimeout) {
        clearTimeout(translationTimeout);
      }
      
      const timeout = setTimeout(() => {
        handleAutoTranslation(germanFullDesc, 'descriptionEs');
        handleAutoTranslation(germanFullDesc, 'descriptionEn');
      }, 1000);
      
      setTranslationTimeout(timeout);
    }
  }, [form.watch('descriptionDe')]);

  // Set form data when product is loaded
  useEffect(() => {
    if (product) {
      form.reset({
        nameDe: product.nameDe || '',
        nameEs: product.nameEs || '',
        nameEn: product.nameEn || '',
        shortDescriptionDe: product.shortDescriptionDe || '',
        shortDescriptionEs: product.shortDescriptionEs || '',
        shortDescriptionEn: product.shortDescriptionEn || '',
        descriptionDe: product.descriptionDe || '',
        descriptionEs: product.descriptionEs || '',
        descriptionEn: product.descriptionEn || '',
        categoryId: product.categoryId || 0,
        subcategoryId: product.subcategoryId || 0,
        sku: product.sku || '',
        price: product.price || '',
        priceNote: product.priceNote || '',
        mainImage: product.mainImage || '',
        additionalImages: product.additionalImages || [],
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        stockStatus: product.stockStatus || 'in_stock',
        availabilityEs: product.availabilityEs || '',
        availabilityDe: product.availabilityDe || '',
        availabilityEn: product.availabilityEn || '',
      });
    }
  }, [product, form]);

  // Force refresh function
  const forceRefreshForm = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/admin/products/${id}`] });
    toast({
      title: "Daten aktualisiert",
      description: "Formulardaten wurden neu geladen",
    });
  };

  // Save product mutation
  const saveProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const url = isEditing ? `/api/admin/products/${id}` : '/api/admin/products';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Speichern');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Produkt gespeichert",
        description: isEditing ? "Produkt wurde aktualisiert" : "Neues Produkt wurde erstellt",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      setLocation('/admin');
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    saveProductMutation.mutate(data);
  };

  if (isLoadingProduct) {
    return <div className="p-6">Lade Produktdaten...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => setLocation('/admin')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zum Dashboard
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Produkt bearbeiten' : 'Neues Produkt'}
        </h1>
        {isEditing && (
          <Button
            variant="outline"
            onClick={forceRefreshForm}
            className="ml-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Daten neu laden
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Produkt bearbeiten' : 'Neues Produkt erstellen'}</CardTitle>
          <CardDescription>
            Deutsch-zu-Spanisch Workflow für optimale Übersetzungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* German-First Workflow Info */}
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Deutsch-zu-Spanisch Workflow</strong><br />
              Nur 3 deutsche Eingaben erforderlich:
              <ul className="list-disc ml-4 mt-1">
                <li>Produktname (Deutsch) - wird automatisch übersetzt</li>
                <li>Kurzbeschreibung (Deutsch) - wird automatisch übersetzt</li>
                <li>Kategorie auswählen</li>
              </ul>
              Spanische und englische Versionen werden automatisch generiert.
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Grundinformationen */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Grundinformationen</h3>
                <p className="text-sm text-gray-600">Geben Sie die wichtigsten Produktinformationen ein</p>
                
                {/* 1. Produktname */}
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="nameDe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>1. Produktname *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Solar Panele 410Watt Pink, neueste Monokristelline, Halbzell PERC Technologie" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Auto-translated versions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="text-sm">
                      <span className="text-gray-500">→ Automatisch übersetzt (Spanisch)</span>
                      <div className="bg-gray-50 p-2 rounded text-sm">
                        {form.watch('nameEs') || 'Paneles solares 410Watt Pink, última monocristalina...'}
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">→ Automatisch übersetzt (Englisch)</span>
                      <div className="bg-gray-50 p-2 rounded text-sm">
                        {form.watch('nameEn') || 'Solar panels 410Watt Pink, latest monocrystalline...'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Kategorie */}
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>2. Kategorie *</FormLabel>
                      <Select
                        value={field.value?.toString() || ''}
                        onValueChange={(value) => {
                          field.onChange(parseInt(value));
                          form.setValue('subcategoryId', 0);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Kategorie auswählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category: Category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.nameDe || category.nameEs}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 3. Unterkategorie (Optional) */}
                <FormField
                  control={form.control}
                  name="subcategoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>3. Unterkategorie (Optional)</FormLabel>
                      <Select
                        value={field.value?.toString() || ''}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        disabled={!selectedCategoryId || subcategories.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Unterkategorie wählen..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subcategories.map((subcategory: Subcategory) => (
                            <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                              {subcategory.nameDe || subcategory.nameEs}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Kurzbeschreibung */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Kurzbeschreibung</h3>
                
                <FormField
                  control={form.control}
                  name="shortDescriptionDe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>4. Beschreibung *</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Test 1-2-3"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="text-sm text-gray-600 mb-2">Vorschau:</div>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  {form.watch('shortDescriptionDe') || 'Test 1-2-3'}
                </div>

                {/* Auto-translated versions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <span className="text-sm text-gray-500">→ Automatisch übersetzt (Spanisch)</span>
                    <div className="bg-gray-50 p-3 rounded text-sm min-h-[80px] relative">
                      {form.watch('shortDescriptionEs') || 'Prueba 1-2-3'}
                      <button type="button" className="absolute bottom-2 right-2 text-xs text-gray-400 hover:text-gray-600">
                        ⛶
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm text-gray-500">→ Automatisch übersetzt (Englisch)</span>
                    <div className="bg-gray-50 p-3 rounded text-sm min-h-[80px] relative">
                      {form.watch('shortDescriptionEn') || 'Test 1-2-3'}
                      <button type="button" className="absolute bottom-2 right-2 text-xs text-gray-400 hover:text-gray-600">
                        ⛶
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Produktdetails */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Produktdetails</h3>
                <p className="text-sm text-gray-600">Zusätzliche Informationen und Spezifikationen</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU/Artikelnummer</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="EXC-001" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preis (USD)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="999.99" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priceNote"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preishinweis</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Preis auf Anfrage" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Produktbild hochladen */}
              <div className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>📸 Produktbild hochladen</strong><br />
                    Wichtig: Laden Sie hier das Hauptbild für Ihr Produkt hoch. Dieses wird auf der Website angezeigt.
                  </AlertDescription>
                </Alert>

                <FormField
                  control={form.control}
                  name="mainImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hauptbild *</FormLabel>
                      <FormControl>
                        <ImageUpload
                          onImageSelect={field.onChange}
                          currentImage={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Zusätzliche Bilder */}
              <div className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>🖼️ Zusätzliche Bilder</strong><br />
                    Zusätzliche Bilder für die Produktgalerie. Diese werden auf der Produktdetailseite angezeigt.
                  </AlertDescription>
                </Alert>

                <FormField
                  control={form.control}
                  name="additionalImages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zusätzliche Bilder</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <ImageUpload
                            onImageSelect={(url) => {
                              const current = field.value || [];
                              field.onChange([...current, url]);
                            }}
                            currentImage=""
                          />
                          {field.value && field.value.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                              {field.value.map((url: string, index: number) => (
                                <div key={index} className="relative">
                                  <img src={url} alt={`Zusätzliches Bild ${index + 1}`} className="w-full h-20 object-cover rounded" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newImages = field.value.filter((_: string, i: number) => i !== index);
                                      field.onChange(newImages);
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Status-Einstellungen */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Status-Einstellungen</h3>
                <p className="text-sm text-gray-600">Verfügbarkeit und Sichtbarkeitseinstellungen</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Aktiv</FormLabel>
                        <div className="flex items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                        <p className="text-xs text-gray-500">Produkt ist auf der Website sichtbar</p>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Empfohlen</FormLabel>
                        <div className="flex items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                        <p className="text-xs text-gray-500">Auf der Startseite hervorheben</p>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stockStatus"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Auf Lager</FormLabel>
                        <div className="flex items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value === 'in_stock'}
                              onCheckedChange={(checked) => 
                                field.onChange(checked ? 'in_stock' : 'out_of_stock')
                              }
                            />
                          </FormControl>
                        </div>
                        <p className="text-xs text-gray-500">Produkt ist verfügbar</p>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Verfügbarkeit (wenn nicht auf Lager) */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Verfügbarkeit (wenn nicht auf Lager)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="availabilityDe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verfügbarkeit (Deutsch)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="z.B. in 2 Wochen verfügbar" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="availabilityEs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verfügbarkeit (Spanisch)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="z.B. disponible en 2 semanas" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="availabilityEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verfügbarkeit (Englisch)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. available in 2 weeks" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Translation Status */}
              {isTranslating && (
                <div className="text-sm text-blue-600 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Übersetze automatisch...
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation('/admin')}
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  disabled={saveProductMutation.isPending}
                >
                  {saveProductMutation.isPending ? 'Speichere...' : 'Produkt speichern'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}