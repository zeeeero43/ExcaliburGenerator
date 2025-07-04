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
import type { Category, Subcategory, Product } from '@shared/schema';
import { ImageUpload } from '@/components/ImageUpload';

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
  mainImage: z.string().optional(),
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

  // Check authentication first
  const { data: user } = useQuery({
    queryKey: ['/api/admin/user'],
    retry: false,
  });

  // Fetch existing product if editing
  const { data: existingProduct, isLoading: productLoading } = useQuery<Product>({
    queryKey: ['/api/admin/products', params.id],
    enabled: Boolean(isEdit && params.id && user),
    retry: false,
  });

  // Fetch categories - must be authenticated
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery<Category[]>({
    queryKey: ['/api/admin/categories'],
    enabled: !!user,
    retry: false,
  });

  // Debug logging
  useEffect(() => {
    console.log('Form data:', { 
      isEdit,
      productId: params.id,
      existingProduct,
      productLoading,
      categories, 
      categoriesLoading, 
      categoriesError,
      categoriesCount: categories.length,
      user: !!user,
      errorMessage: categoriesError?.message
    });
  }, [isEdit, params.id, existingProduct, productLoading, categories, categoriesLoading, categoriesError, user]);

  // Fetch subcategories based on selected category
  const { data: subcategories = [] } = useQuery<Subcategory[]>({
    queryKey: ['/api/subcategories', { categoryId: selectedCategoryId }],
    enabled: !!selectedCategoryId,
  });

  // Populate form with existing product data
  useEffect(() => {
    if (existingProduct && isEdit) {
      console.log('Populating form with existing product:', existingProduct);
      
      // Reset form with existing product data
      form.reset({
        nameEs: existingProduct.nameEs || '',
        nameDe: existingProduct.nameDe || '',
        nameEn: existingProduct.nameEn || '',
        shortDescriptionEs: existingProduct.shortDescriptionEs || '',
        shortDescriptionDe: existingProduct.shortDescriptionDe || '',
        shortDescriptionEn: existingProduct.shortDescriptionEn || '',
        descriptionEs: existingProduct.descriptionEs || '',
        descriptionDe: existingProduct.descriptionDe || '',
        descriptionEn: existingProduct.descriptionEn || '',
        price: existingProduct.price || '',
        categoryId: existingProduct.categoryId || undefined,
        subcategoryId: existingProduct.subcategoryId || undefined,
        mainImage: existingProduct.mainImage || '',
        sku: existingProduct.sku || '',
        priceNote: existingProduct.priceNote || '',
        isFeatured: existingProduct.isFeatured || false,
        isActive: existingProduct.isActive !== false,
        stockStatus: (existingProduct.stockStatus as 'in_stock' | 'out_of_stock' | 'limited') || 'in_stock',
      });

      // Set category for subcategories
      if (existingProduct.categoryId) {
        setSelectedCategoryId(existingProduct.categoryId);
      }

      // Parse specifications
      if (existingProduct.specifications && typeof existingProduct.specifications === 'object') {
        const specsArray = Object.entries(existingProduct.specifications).map(([key, value]) => ({
          key,
          value: value as string,
        }));
        setSpecifications(specsArray);
      }
    }
  }, [existingProduct, isEdit, form]);

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
        price: data.price ? data.price.toString() : undefined,
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
      console.error('Product save error:', error);
      
      let errorMessage = "Unbekannter Fehler beim Speichern des Produkts.";
      
      if (error.message) {
        if (error.message.includes('Validation error')) {
          errorMessage = `Validierungsfehler: ${error.message.split('details: ')[1] || error.message}`;
        } else if (error.message.includes('Required')) {
          errorMessage = "Pflichtfelder fehlen. Bitte überprüfen Sie alle erforderlichen Felder.";
        } else if (error.message.includes('unique constraint')) {
          errorMessage = "Ein Produkt mit diesem Namen oder SKU existiert bereits.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Produkterstellung fehlgeschlagen",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Show detailed error in console for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Detailed error information:', {
          error,
          formData: form.getValues(),
          specifications
        });
      }
    },
  });

  const onSubmit = (data: ProductForm) => {
    saveProductMutation.mutate(data);
  };

  const addSpecification = () => {
    setSpecifications([...specifications, { key: '', value: '' }]);
  };

  const addSolarSpecifications = () => {
    const solarSpecs = [
      { key: 'Leistung', value: '' },
      { key: 'Spannung', value: '' },
      { key: 'Strom', value: '' },
      { key: 'Wirkungsgrad', value: '' },
      { key: 'Garantie', value: '' },
      { key: 'Abmessungen', value: '' },
      { key: 'Gewicht', value: '' },
      { key: 'Zertifizierungen', value: '' },
      { key: 'Betriebstemperatur', value: '' },
      { key: 'Schutzklasse', value: '' }
    ];
    
    // Add only those that don't already exist
    const existingKeys = specifications.map(spec => spec.key);
    const newSpecs = solarSpecs.filter(spec => !existingKeys.includes(spec.key));
    
    setSpecifications([...specifications, ...newSpecs]);
    
    toast({
      title: "Solar-Spezifikationen hinzugefügt",
      description: `${newSpecs.length} neue technische Felder wurden hinzugefügt.`,
    });
  };

  const addGeneratorSpecifications = () => {
    const generatorSpecs = [
      { key: 'Leistung', value: '' },
      { key: 'Kraftstofftyp', value: '' },
      { key: 'Tankvolumen', value: '' },
      { key: 'Laufzeit', value: '' },
      { key: 'Spannung', value: '' },
      { key: 'Frequenz', value: '' },
      { key: 'Lautstärke', value: '' },
      { key: 'Abmessungen', value: '' },
      { key: 'Gewicht', value: '' },
      { key: 'Garantie', value: '' }
    ];
    
    // Add only those that don't already exist
    const existingKeys = specifications.map(spec => spec.key);
    const newSpecs = generatorSpecs.filter(spec => !existingKeys.includes(spec.key));
    
    setSpecifications([...specifications, ...newSpecs]);
    
    toast({
      title: "Generator-Spezifikationen hinzugefügt",
      description: `${newSpecs.length} neue technische Felder wurden hinzugefügt.`,
    });
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
                            {categories.length === 0 ? (
                              <SelectItem value="" disabled>
                                Keine Kategorien verfügbar
                              </SelectItem>
                            ) : (
                              categories.map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.nameDe || category.nameEs || category.name}
                                </SelectItem>
                              ))
                            )}
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
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-800">📸 Produktbild hochladen</CardTitle>
                    <CardDescription className="text-blue-600">
                      Wichtig: Laden Sie hier das Hauptbild für Ihr Produkt hoch. Dieses wird auf der Website angezeigt.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="mainImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Hauptbild *</FormLabel>
                          <div className="space-y-2">
                            <ImageUpload 
                              onImageSelect={field.onChange}
                              currentImage={field.value}
                            />
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Oder URL eingeben: https://..." 
                                className="mt-2"
                              />
                            </FormControl>
                            {field.value && (
                              <div className="mt-2">
                                <img 
                                  src={field.value} 
                                  alt="Produktbild Vorschau" 
                                  className="w-32 h-32 object-cover rounded border"
                                />
                              </div>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Specifications */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Technische Spezifikationen</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={addSolarSpecifications}>
                        🌞 Solar-Spezifikationen
                      </Button>
                      <Button type="button" variant="outline" onClick={addGeneratorSpecifications}>
                        ⚡ Generator-Spezifikationen
                      </Button>
                      <Button type="button" variant="outline" onClick={addSpecification}>
                        ➕ Eigene Spezifikation
                      </Button>
                    </div>
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