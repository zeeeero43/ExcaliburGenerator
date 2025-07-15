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
import { ArrowLeft, Upload, X, RefreshCw } from 'lucide-react';
import type { Category, Subcategory, Product } from '@shared/schema';
import { ImageUpload } from '@/components/ImageUpload';

// Vereinfachtes Schema für Produkterstellung
const productFormSchema = z.object({
  nameEs: z.string().min(1, 'Name ist erforderlich'),
  nameDe: z.string().optional(),
  nameEn: z.string().optional(),
  shortDescriptionEs: z.string().min(1, 'Kurzbeschreibung ist erforderlich'),
  shortDescriptionDe: z.string().optional(),
  shortDescriptionEn: z.string().optional(),
  descriptionEs: z.string().optional(),
  descriptionDe: z.string().optional(),
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

  const isEditing = Boolean(id);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      nameEs: '',
      nameDe: '',
      nameEn: '',
      shortDescriptionEs: '',
      shortDescriptionDe: '',
      shortDescriptionEn: '',
      descriptionEs: '',
      descriptionDe: '',
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

  // Daten laden
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: [`/api/admin/products/${id}`],
    enabled: isEditing,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/admin/categories'],
  });

  const { data: allSubcategories = [] } = useQuery({
    queryKey: ['/api/admin/subcategories'],
  });

  // Unterkategorien filtern
  const selectedCategoryId = form.watch('categoryId');
  const subcategories = allSubcategories.filter(sub => sub.categoryId === selectedCategoryId);

  // Formulardaten setzen beim Laden
  useEffect(() => {
    if (product) {
      form.reset({
        nameEs: product.nameEs || '',
        nameDe: product.nameDe || '',
        nameEn: product.nameEn || '',
        shortDescriptionEs: product.shortDescriptionEs || '',
        shortDescriptionDe: product.shortDescriptionDe || '',
        shortDescriptionEn: product.shortDescriptionEn || '',
        descriptionEs: product.descriptionEs || '',
        descriptionDe: product.descriptionDe || '',
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

  // Daten neu laden
  const forceRefreshForm = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/admin/products/${id}`] });
    toast({
      title: "Daten aktualisiert",
      description: "Formulardaten wurden neu geladen",
    });
  };

  // Speichern
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
            Füllen Sie die Felder aus, um ein Produkt zu erstellen oder zu bearbeiten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Produktname */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="nameEs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name (Spanisch) *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Produktname auf Spanisch" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nameDe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name (Deutsch)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Produktname auf Deutsch" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name (Englisch)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Product name in English" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Kurzbeschreibung */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="shortDescriptionEs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kurzbeschreibung (Spanisch) *</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Kurze Beschreibung auf Spanisch" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shortDescriptionDe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kurzbeschreibung (Deutsch)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Kurze Beschreibung auf Deutsch" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shortDescriptionEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kurzbeschreibung (Englisch)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Short description in English" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Vollständige Beschreibung */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="descriptionEs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beschreibung (Spanisch)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Vollständige Beschreibung auf Spanisch" className="min-h-32" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="descriptionDe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beschreibung (Deutsch)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Vollständige Beschreibung auf Deutsch" className="min-h-32" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="descriptionEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beschreibung (Englisch)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Full description in English" className="min-h-32" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Kategorie und Unterkategorie */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategorie *</FormLabel>
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
                <FormField
                  control={form.control}
                  name="subcategoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unterkategorie</FormLabel>
                      <Select
                        value={field.value?.toString() || ''}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        disabled={!selectedCategoryId || subcategories.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Unterkategorie auswählen" />
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

              {/* SKU und Preis */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Artikelnummer (SKU)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="SKU-123" />
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
                      <FormLabel>Preis</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="299.99" />
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
                      <FormLabel>Preisnotiz</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="z.B. zzgl. MwSt." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Hauptbild */}
              <FormField
                control={form.control}
                name="mainImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hauptbild</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value}
                        onChange={field.onChange}
                        maxFiles={1}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Zusätzliche Bilder */}
              <FormField
                control={form.control}
                name="additionalImages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zusätzliche Bilder</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value}
                        onChange={field.onChange}
                        maxFiles={5}
                        multiple
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Lagerstatus */}
              <FormField
                control={form.control}
                name="stockStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lagerstatus</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="in_stock">Auf Lager</SelectItem>
                        <SelectItem value="out_of_stock">Nicht verfügbar</SelectItem>
                        <SelectItem value="limited">Begrenzt verfügbar</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Verfügbarkeit */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              {/* Schalter */}
              <div className="flex items-center space-x-8">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Produkt ist aktiv</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Als Empfehlung anzeigen</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              {/* Aktionen */}
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