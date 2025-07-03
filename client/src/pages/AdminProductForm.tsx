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
import { ArrowLeft, Upload, X } from 'lucide-react';
import type { Category, Subcategory } from '@shared/schema';

const productSchema = z.object({
  nameEs: z.string().min(1, 'Produktname (Spanisch) ist erforderlich'),
  nameDe: z.string().min(1, 'Produktname (Deutsch) ist erforderlich'),
  nameEn: z.string().min(1, 'Produktname (Englisch) ist erforderlich'),
  shortDescriptionEs: z.string().min(1, 'Kurzbeschreibung (Spanisch) ist erforderlich'),
  shortDescriptionDe: z.string().min(1, 'Kurzbeschreibung (Deutsch) ist erforderlich'),
  shortDescriptionEn: z.string().min(1, 'Kurzbeschreibung (Englisch) ist erforderlich'),
  descriptionEs: z.string().optional(),
  descriptionDe: z.string().optional(),
  descriptionEn: z.string().optional(),
  categoryId: z.coerce.number().min(1, 'Kategorie ist erforderlich'),
  subcategoryId: z.coerce.number().optional(),
  sku: z.string().optional(),
  price: z.string().optional(),
  priceNote: z.string().optional(),
  mainImage: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  stockStatus: z.enum(['in_stock', 'out_of_stock', 'limited']).default('in_stock'),
  specifications: z.record(z.string()).optional(),
});

type ProductForm = z.infer<typeof productSchema>;

export default function AdminProductForm() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [specifications, setSpecifications] = useState<Array<{ key: string; value: string }>>([]);

  const isEdit = params.id && params.id !== 'new';

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
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
      sku: '',
      price: '',
      priceNote: '',
      mainImage: '',
      isActive: true,
      isFeatured: false,
      stockStatus: 'in_stock',
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/admin/categories'],
  });

  // Fetch subcategories based on selected category
  const { data: subcategories = [] } = useQuery<Subcategory[]>({
    queryKey: ['/api/subcategories', { categoryId: selectedCategoryId }],
    enabled: !!selectedCategoryId,
  });

  // Watch category changes
  const watchedCategoryId = form.watch('categoryId');
  useEffect(() => {
    if (watchedCategoryId && watchedCategoryId !== selectedCategoryId) {
      setSelectedCategoryId(watchedCategoryId);
      form.setValue('subcategoryId', undefined);
    }
  }, [watchedCategoryId, selectedCategoryId, form]);

  // Create/Update mutation
  const saveProductMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const productData = {
        ...data,
        specifications: specifications.length > 0 
          ? Object.fromEntries(specifications.map(spec => [spec.key, spec.value]))
          : undefined,
        price: data.price ? parseFloat(data.price) : undefined,
      };

      const url = isEdit ? `/api/admin/products/${params.id}` : '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save product');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      toast({
        title: isEdit ? "Produkt aktualisiert" : "Produkt erstellt",
        description: "Das Produkt wurde erfolgreich gespeichert.",
      });
      setLocation('/admin');
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Speichern des Produkts.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductForm) => {
    saveProductMutation.mutate(data);
  };

  const addSpecification = () => {
    setSpecifications([...specifications, { key: '', value: '' }]);
  };

  const removeSpecification = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index));
  };

  const updateSpecification = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...specifications];
    updated[index][field] = value;
    setSpecifications(updated);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/admin')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Produkt bearbeiten' : 'Neues Produkt erstellen'}
          </h1>
          <p className="text-gray-600">
            Erstellen Sie einfach neue Produkte für Ihren Container-Import
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Grundinformationen</CardTitle>
                <CardDescription>
                  Geben Sie die wichtigsten Produktinformationen ein
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Product Names */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="nameEs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Produktname (Spanisch) *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nombre del producto" />
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
                        <FormLabel>Produktname (Deutsch) *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Produktname" />
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
                        <FormLabel>Produktname (Englisch) *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Product name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Category Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategorie *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Kategorie wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.nameDe}
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
                          onValueChange={field.onChange} 
                          value={field.value?.toString()}
                          disabled={!selectedCategoryId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Unterkategorie wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subcategories.map((subcategory) => (
                              <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                                {subcategory.nameDe}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Short Descriptions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Kurzbeschreibung</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="shortDescriptionEs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kurzbeschreibung (Spanisch) *</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Descripción corta del producto" />
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
                          <FormLabel>Kurzbeschreibung (Deutsch) *</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Kurze Produktbeschreibung" />
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
                          <FormLabel>Kurzbeschreibung (Englisch) *</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Short product description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Details */}
            <Card>
              <CardHeader>
                <CardTitle>Produktdetails</CardTitle>
                <CardDescription>
                  Zusätzliche Informationen und Spezifikationen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* SKU and Price */}
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
                          <Input {...field} type="number" step="0.01" placeholder="999.99" />
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

                {/* Main Image */}
                <FormField
                  control={form.control}
                  name="mainImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hauptbild URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://images.unsplash.com/..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Specifications */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Technische Spezifikationen</h3>
                    <Button type="button" variant="outline" onClick={addSpecification}>
                      Spezifikation hinzufügen
                    </Button>
                  </div>
                  
                  {specifications.map((spec, index) => (
                    <div key={index} className="flex gap-4 items-end">
                      <div className="flex-1">
                        <Input
                          placeholder="Eigenschaft (z.B. Leistung)"
                          value={spec.key}
                          onChange={(e) => updateSpecification(index, 'key', e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          placeholder="Wert (z.B. 5000W)"
                          value={spec.value}
                          onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeSpecification(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Status Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Status-Einstellungen</CardTitle>
                <CardDescription>
                  Verfügbarkeit und Sichtbarkeitseinstellungen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Aktiv</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Produkt ist auf der Website sichtbar
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Empfohlen</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Auf der Startseite hervorheben
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stockStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lagerstatus</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="in_stock">Auf Lager</SelectItem>
                            <SelectItem value="limited">Begrenzt verfügbar</SelectItem>
                            <SelectItem value="out_of_stock">Nicht verfügbar</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation('/admin')}
                disabled={saveProductMutation.isPending}
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={saveProductMutation.isPending}
              >
                {saveProductMutation.isPending 
                  ? 'Speichern...' 
                  : isEdit 
                    ? 'Produkt aktualisieren'
                    : 'Produkt erstellen'
                }
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}