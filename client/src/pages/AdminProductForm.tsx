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
import { ExpandableTextarea } from '@/components/ExpandableTextarea';
import { RichTextEditor } from '@/components/RichTextEditor';
import { translateProductData } from '@/lib/translation';

// German translations for the admin form
const adminTexts = {
  de: {
    // Form labels
    productNameEs: 'Produktname (Spanisch) - automatisch übersetzt',
    productNameDe: 'Produktname (Deutsch) - Haupteingabe',
    productNameEn: 'Produktname (Englisch) - automatisch übersetzt',
    shortDescEs: 'Kurzbeschreibung (Spanisch) - automatisch übersetzt',
    shortDescDe: 'Kurzbeschreibung (Deutsch) - Haupteingabe',
    shortDescEn: 'Kurzbeschreibung (Englisch) - automatisch übersetzt',
    descriptionEs: 'Beschreibung (Spanisch) - automatisch übersetzt',
    descriptionDe: 'Beschreibung (Deutsch) - Haupteingabe',
    descriptionEn: 'Beschreibung (Englisch)',
    category: 'Kategorie',
    subcategory: 'Unterkategorie',
    sku: 'Artikelnummer',
    price: 'Preis',
    priceNote: 'Preisnotiz',
    mainImage: 'Hauptbild',
    additionalImages: 'Weitere Bilder',
    addImage: 'Bild hinzufügen',
    removeImage: 'Bild entfernen',
    active: 'Aktiv',
    featured: 'Vorgestellt',
    stockStatus: 'Lagerstatus',
    inStock: 'Auf Lager',
    availabilityEs: 'Verfügbarkeit (Spanisch)',
    availabilityDe: 'Verfügbarkeit (Deutsch)',
    availabilityEn: 'Verfügbarkeit (Englisch)',
    
    // Stock status
    in_stock: 'Auf Lager',
    out_of_stock: 'Nicht verfügbar',
    limited: 'Begrenzt verfügbar',
    
    // Form actions
    save: 'Produkt speichern',
    cancel: 'Abbrechen',
    edit: 'Bearbeiten',
    create: 'Erstellen',
    forceRefresh: '🔄 Daten neu laden',
    backToDashboard: 'Zurück zum Dashboard',
    selectCategory: 'Kategorie auswählen',
    selectSubcategory: 'Unterkategorie auswählen',
    selectImage: 'Bild auswählen',
    
    // Form titles
    newProduct: 'Neues Produkt',
    editProduct: 'Produkt bearbeiten',
    
    // Messages
    noCategories: 'Keine Kategorien verfügbar',
    noSubcategories: 'Keine Unterkategorien verfügbar',
    categoryRequired: 'Kategorie ist erforderlich',
    nameRequired: 'Name ist erforderlich',
    shortDescRequired: 'Kurzbeschreibung ist erforderlich',
    
    // Success/Error
    productSaved: 'Produkt erfolgreich gespeichert',
    productError: 'Fehler beim Speichern des Produkts',
    translating: 'Übersetze...',
    translationComplete: 'Übersetzung abgeschlossen!',
    translationError: 'Fehler bei der Übersetzung'
  }
};

const t = (key: string) => adminTexts.de[key] || key;

// Form validation schema
const productFormSchema = z.object({
  nameEs: z.string().min(1, t('nameRequired')),
  nameDe: z.string().optional(),
  nameEn: z.string().optional(),
  shortDescriptionEs: z.string().min(1, t('shortDescRequired')),
  shortDescriptionDe: z.string().optional(),
  shortDescriptionEn: z.string().optional(),
  descriptionEs: z.string().optional(),
  descriptionDe: z.string().optional(),
  descriptionEn: z.string().optional(),
  categoryId: z.number().min(1, t('categoryRequired')),
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
  const handleAutoTranslation = async (germanText: string, fromField: string, toField: string) => {
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
          from: 'de',
          to: toField.includes('Es') ? 'es' : 'en',
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

  // Real-time translation with debounce
  useEffect(() => {
    const germanName = form.watch('nameDe');
    if (germanName) {
      if (translationTimeout) {
        clearTimeout(translationTimeout);
      }
      
      const timeout = setTimeout(() => {
        handleAutoTranslation(germanName, 'nameDe', 'nameEs');
        handleAutoTranslation(germanName, 'nameDe', 'nameEn');
      }, 1000);
      
      setTranslationTimeout(timeout);
    }
  }, [form.watch('nameDe')]);

  useEffect(() => {
    const germanDesc = form.watch('shortDescriptionDe');
    if (germanDesc) {
      if (translationTimeout) {
        clearTimeout(translationTimeout);
      }
      
      const timeout = setTimeout(() => {
        handleAutoTranslation(germanDesc, 'shortDescriptionDe', 'shortDescriptionEs');
        handleAutoTranslation(germanDesc, 'shortDescriptionDe', 'shortDescriptionEn');
      }, 1000);
      
      setTranslationTimeout(timeout);
    }
  }, [form.watch('shortDescriptionDe')]);

  useEffect(() => {
    const germanFullDesc = form.watch('descriptionDe');
    if (germanFullDesc) {
      if (translationTimeout) {
        clearTimeout(translationTimeout);
      }
      
      const timeout = setTimeout(() => {
        handleAutoTranslation(germanFullDesc, 'descriptionDe', 'descriptionEs');
        handleAutoTranslation(germanFullDesc, 'descriptionDe', 'descriptionEn');
      }, 1000);
      
      setTranslationTimeout(timeout);
    }
  }, [form.watch('descriptionDe')]);

  // Set form data when product is loaded
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
        throw new Error(errorData.error || 'Failed to save product');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('productSaved'),
        description: isEditing ? t('editProduct') : t('newProduct'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      setLocation('/admin');
    },
    onError: (error: Error) => {
      toast({
        title: t('productError'),
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
          {t('backToDashboard')}
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? t('editProduct') : t('newProduct')}
        </h1>
        {isEditing && (
          <Button
            variant="outline"
            onClick={forceRefreshForm}
            className="ml-auto"
          >
            {t('forceRefresh')}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? t('editProduct') : t('newProduct')}</CardTitle>
          <CardDescription>
            Alle Felder werden automatisch vom Deutschen ins Spanische und Englische übersetzt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Product Names */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="nameDe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('productNameDe')} *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Deutscher Produktname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nameEs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('productNameEs')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Automatisch übersetzt" />
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
                      <FormLabel>{t('productNameEn')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Automatically translated" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Short Descriptions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="shortDescriptionDe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('shortDescDe')} *</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Deutsche Kurzbeschreibung" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shortDescriptionEs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('shortDescEs')}</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Automatisch übersetzt" />
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
                      <FormLabel>{t('shortDescEn')}</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Automatically translated" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Full Descriptions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="descriptionDe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('descriptionDe')}</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Deutsche Beschreibung"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="descriptionEs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('descriptionEs')}</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Automatisch übersetzt"
                        />
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
                      <FormLabel>{t('descriptionEn')}</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Automatically translated"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Category and Subcategory */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('category')} *</FormLabel>
                      <Select
                        value={field.value?.toString() || ''}
                        onValueChange={(value) => {
                          field.onChange(parseInt(value));
                          form.setValue('subcategoryId', 0);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectCategory')} />
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
                      <FormLabel>{t('subcategory')}</FormLabel>
                      <Select
                        value={field.value?.toString() || ''}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        disabled={!selectedCategoryId || subcategories.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectSubcategory')} />
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

              {/* SKU and Price */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sku')}</FormLabel>
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
                      <FormLabel>{t('price')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="z.B. 299.99" />
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
                      <FormLabel>{t('priceNote')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="z.B. zzgl. MwSt." />
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
                    <FormLabel>{t('mainImage')}</FormLabel>
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

              {/* Additional Images */}
              <FormField
                control={form.control}
                name="additionalImages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('additionalImages')}</FormLabel>
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

              {/* Stock Status */}
              <FormField
                control={form.control}
                name="stockStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('stockStatus')}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="in_stock">{t('in_stock')}</SelectItem>
                        <SelectItem value="out_of_stock">{t('out_of_stock')}</SelectItem>
                        <SelectItem value="limited">{t('limited')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Availability */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="availabilityDe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('availabilityDe')}</FormLabel>
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
                      <FormLabel>{t('availabilityEs')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Automatisch übersetzt" />
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
                      <FormLabel>{t('availabilityEn')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Automatically translated" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Switches */}
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
                      <FormLabel>{t('active')}</FormLabel>
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
                      <FormLabel>{t('featured')}</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              {/* Translation Status */}
              {isTranslating && (
                <div className="text-sm text-blue-600 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  {t('translating')}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation('/admin')}
                >
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={saveProductMutation.isPending}
                >
                  {saveProductMutation.isPending ? 'Speichere...' : t('save')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}