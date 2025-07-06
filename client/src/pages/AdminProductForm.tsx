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

// Admin Translation Hook
function useAdminTranslation() {
  const [adminLanguage] = useState(() => 
    localStorage.getItem('admin-language') || 'de'
  );

  const t = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
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
        descriptionEn: 'Beschreibung (Englisch) - automatisch übersetzt',
        category: 'Kategorie',
        subcategory: 'Unterkategorie',
        sku: 'Artikelnummer',
        price: 'Preis',
        priceNote: 'Preishinweis',
        mainImage: 'Hauptbild',
        additionalImages: 'Zusätzliche Bilder',
        addImage: 'Bild hinzufügen',
        removeImage: 'Bild entfernen',
        active: 'Aktiv',
        featured: 'Empfohlen',
        stockStatus: 'Lagerbestand',
        inStock: 'Auf Lager',
        availabilityEs: 'Verfügbarkeit (Spanisch)',
        availabilityDe: 'Verfügbarkeit (Deutsch)',
        availabilityEn: 'Verfügbarkeit (Englisch)',
        specifications: 'Spezifikationen',
        
        // Stock status
        in_stock: 'Auf Lager',
        out_of_stock: 'Nicht verfügbar',
        limited: 'Begrenzt verfügbar',
        
        // Actions
        backToDashboard: 'Zurück zum Dashboard',
        addProduct: 'Produkt hinzufügen',
        editProduct: 'Produkt bearbeiten',
        saveProduct: 'Produkt speichern',
        selectCategory: 'Kategorie auswählen',
        selectSubcategory: 'Unterkategorie auswählen',
        selectImage: 'Bild auswählen',
        
        // Validation messages
        nameRequired: 'Name ist erforderlich',
        shortDescRequired: 'Kurzbeschreibung ist erforderlich',
        categoryRequired: 'Kategorie ist erforderlich',
        
        // Success/Error
        productSaved: 'Produkt erfolgreich gespeichert',
        productError: 'Fehler beim Speichern des Produkts',
        translating: 'Übersetze...',
        translationComplete: 'Übersetzung abgeschlossen!',
        translationError: 'Fehler bei der Übersetzung'
      },
      es: {
        // Form labels
        productNameEs: 'Nombre del Producto (Español) - traducido automáticamente',
        productNameDe: 'Nombre del Producto (Alemán) - entrada principal', 
        productNameEn: 'Nombre del Producto (Inglés) - traducido automáticamente',
        shortDescEs: 'Descripción Corta (Español) - traducido automáticamente',
        shortDescDe: 'Descripción Corta (Alemán) - entrada principal',
        shortDescEn: 'Descripción Corta (Inglés) - traducido automáticamente',
        descriptionEs: 'Descripción (Español) - traducido automáticamente',
        descriptionDe: 'Descripción (Alemán) - entrada principal',
        descriptionEn: 'Descripción (Inglés)',
        category: 'Categoría',
        subcategory: 'Subcategoría',
        sku: 'Código de Producto',
        price: 'Precio',
        priceNote: 'Nota de Precio',
        mainImage: 'Imagen Principal',
        additionalImages: 'Imágenes Adicionales',
        addImage: 'Agregar Imagen',
        removeImage: 'Eliminar Imagen',
        active: 'Activo',
        featured: 'Destacado',
        stockStatus: 'Estado de Stock',
        inStock: 'En Stock',
        availabilityEs: 'Disponibilidad (Español)',
        availabilityDe: 'Disponibilidad (Alemán)',
        availabilityEn: 'Disponibilidad (Inglés)',
        specifications: 'Especificaciones',
        
        // Stock status
        in_stock: 'En Stock',
        out_of_stock: 'Agotado',
        limited: 'Stock Limitado',
        
        // Actions
        backToDashboard: 'Volver al Panel',
        addProduct: 'Agregar Producto',
        editProduct: 'Editar Producto',
        saveProduct: 'Guardar Producto',
        selectCategory: 'Seleccionar categoría',
        selectSubcategory: 'Seleccionar subcategoría',
        selectImage: 'Seleccionar imagen',
        
        // Validation messages
        nameRequired: 'El nombre es requerido',
        shortDescRequired: 'La descripción corta es requerida',
        categoryRequired: 'La categoría es requerida',
        
        // Success/Error
        productSaved: 'Producto guardado exitosamente',
        productError: 'Error al guardar el producto'
      }
    };
    
    return translations[adminLanguage]?.[key] || translations.de[key] || key;
  };

  return { t, currentLanguage: adminLanguage };
}

// German-first workflow - only German required for creation
function createProductSchema(t: (key: string) => string) {
  return z.object({
    nameEs: z.string().optional(),
    nameDe: z.string().min(1, 'Produktname (Deutsch) ist erforderlich'),
    nameEn: z.string().optional(),
    shortDescriptionEs: z.string().optional(),
    shortDescriptionDe: z.string().min(1, 'Kurzbeschreibung (Deutsch) ist erforderlich'),
    shortDescriptionEn: z.string().optional(),
    descriptionEs: z.string().optional(),
    descriptionDe: z.string().optional(),
    descriptionEn: z.string().optional(),
    categoryId: z.coerce.number().min(1, 'Kategorie ist erforderlich'),
    subcategoryId: z.coerce.number().optional(),
    sku: z.string().optional(),
    price: z.string().optional(),
    priceNote: z.string().optional(),
    mainImage: z.string().optional(),
    images: z.array(z.string()).optional(),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    stockStatus: z.enum(['in_stock', 'out_of_stock', 'limited']).default('in_stock'),
    inStock: z.boolean().default(true),
    availabilityTextEs: z.string().optional(),
    availabilityTextDe: z.string().optional(),
    availabilityTextEn: z.string().optional(),
    specifications: z.record(z.string()).optional(),
  });
}

export default function AdminProductForm() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const { t } = useAdminTranslation();
  
  const productSchema = createProductSchema(t);
  type ProductForm = z.infer<typeof productSchema>;
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  
  // Track form initialization to prevent re-triggering
  const [formInitialized, setFormInitialized] = useState(false);



  // Extract product ID from URL properly
  const productId = params.id && params.id !== 'new' ? parseInt(params.id) : null;
  const isEdit = Boolean(productId);



  // Real-time translation function with improved long text handling
  const handleRealTimeTranslation = async (germanValue: string, fieldType: 'name' | 'shortDescription' | 'description') => {
    if (!germanValue.trim()) return;
    
    try {
      console.log(`🔄 Starting translation for ${fieldType} (${germanValue.length} chars)...`);
      
      // Show loading toast for long texts
      if (germanValue.length > 200) {
        toast({
          title: "🔄 Übersetzung läuft...",
          description: `Langer Text wird übersetzt (${germanValue.length} Zeichen)...`,
        });
      }
      
      const germanData = {
        [fieldType]: germanValue,
        name: fieldType === 'name' ? germanValue : '',
        shortDescription: fieldType === 'shortDescription' ? germanValue : '',
        description: fieldType === 'description' ? germanValue : '',
      };
      
      const { spanish, english } = await translateProductData(germanData);
      
      // Update form with translations based on field type
      if (fieldType === 'name') {
        if (spanish.name) form.setValue('nameEs', spanish.name);
        if (english.name) form.setValue('nameEn', english.name);
        console.log('✅ Name translated:', { de: germanValue, es: spanish.name, en: english.name });
      } else if (fieldType === 'shortDescription') {
        if (spanish.shortDescription) form.setValue('shortDescriptionEs', spanish.shortDescription);
        if (english.shortDescription) form.setValue('shortDescriptionEn', english.shortDescription);
        console.log('✅ Short description translated:', { de: germanValue.substring(0, 50) + '...', es: spanish.shortDescription?.substring(0, 50) + '...', en: english.shortDescription?.substring(0, 50) + '...' });
      } else if (fieldType === 'description') {
        if (spanish.description) form.setValue('descriptionEs', spanish.description);
        if (english.description) form.setValue('descriptionEn', english.description);
        console.log('✅ Full description translated:', { 
          originalLength: germanValue.length, 
          spanishLength: spanish.description?.length, 
          englishLength: english.description?.length 
        });
      }
      
      // Success toast with character count for long texts
      const charInfo = germanValue.length > 200 ? ` (${germanValue.length} Zeichen verarbeitet)` : '';
      toast({
        title: "🌍 Automatische Übersetzung abgeschlossen",
        description: `${fieldType} wurde ins Spanische und Englische übersetzt${charInfo}.`,
      });
      
    } catch (error) {
      console.error('Real-time translation failed:', error);
      toast({
        title: "⚠️ Übersetzung fehlgeschlagen",
        description: "Die automatische Übersetzung ist vorübergehend nicht verfügbar. Versuchen Sie es erneut oder geben Sie die Übersetzungen manuell ein.",
        variant: "destructive",
      });
    }
  };

  // Debounced translation
  const [translationTimeouts, setTranslationTimeouts] = useState<Record<string, NodeJS.Timeout>>({});

  const debounceTranslation = (value: string, fieldType: 'name' | 'shortDescription' | 'description') => {
    // Clear existing timeout
    if (translationTimeouts[fieldType]) {
      clearTimeout(translationTimeouts[fieldType]);
    }
    
    // Set longer timeout for longer texts to allow user to finish typing
    const delay = value.length > 200 ? 2500 : 1500; // 2.5s for long texts, 1.5s for short
    
    // Set new timeout
    const timeoutId = setTimeout(() => {
      handleRealTimeTranslation(value, fieldType);
    }, delay);
    
    setTranslationTimeouts(prev => ({
      ...prev,
      [fieldType]: timeoutId
    }));
  };

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    mode: 'onChange', // CRITICAL: Enable live validation for better form behavior
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
      images: [],
      isActive: true,
      isFeatured: false,
      stockStatus: 'in_stock',
      inStock: true,
      availabilityTextEs: '',
      availabilityTextDe: '',
      availabilityTextEn: '',
    },
  });

  // Check authentication first
  const { data: user } = useQuery({
    queryKey: ['/api/admin/user'],
    retry: false,
  });

  // Fetch existing product if editing
  const { data: existingProduct, isLoading: productLoading } = useQuery<Product>({
    queryKey: [`/api/admin/products/${productId}`],
    enabled: Boolean(isEdit && productId && user),
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
      productId,
      existingProduct,
      productLoading,
      categories, 
      categoriesLoading, 
      categoriesError,
      categoriesCount: categories.length,
      user: !!user,
      errorMessage: categoriesError?.message
    });
  }, [isEdit, productId, existingProduct, productLoading, categories, categoriesLoading, categoriesError, user]);

  // Fetch subcategories based on selected category
  const { data: subcategories = [] } = useQuery<Subcategory[]>({
    queryKey: ['/api/subcategories', { categoryId: selectedCategoryId }],
    enabled: !!selectedCategoryId,
  });

  // Populate form with existing product data
  useEffect(() => {
    if (existingProduct && isEdit && !formInitialized) {
      console.log('🔄 DEBUG: Populating form with existing product:', {
        id: existingProduct.id,
        nameEs: existingProduct.nameEs,
        nameDe: existingProduct.nameDe,
        price: existingProduct.price,
        categoryId: existingProduct.categoryId
      });
      
      // Set the category first for subcategory loading
      if (existingProduct.categoryId) {
        setSelectedCategoryId(existingProduct.categoryId);
      }
      
      // CRITICAL: Ensure form reset works with correct data mapping
      const formData = {
        nameEs: existingProduct.nameEs || '',
        nameDe: existingProduct.nameDe || existingProduct.name || '',
        nameEn: existingProduct.nameEn || '',
        shortDescriptionEs: existingProduct.shortDescriptionEs || '',
        shortDescriptionDe: existingProduct.shortDescriptionDe || existingProduct.shortDescription || '',
        shortDescriptionEn: existingProduct.shortDescriptionEn || '',
        descriptionEs: existingProduct.descriptionEs || '',
        descriptionDe: existingProduct.descriptionDe || existingProduct.description || '',
        descriptionEn: existingProduct.descriptionEn || '',
        price: existingProduct.price ? String(existingProduct.price) : '',
        categoryId: existingProduct.categoryId || undefined,
        subcategoryId: existingProduct.subcategoryId || undefined,
        mainImage: existingProduct.mainImage || '',
        images: (existingProduct.images && Array.isArray(existingProduct.images)) ? existingProduct.images : [],
        sku: existingProduct.sku || '',
        priceNote: existingProduct.priceNote || '',
        isFeatured: Boolean(existingProduct.isFeatured),
        isActive: existingProduct.isActive !== false,
        stockStatus: (existingProduct.stockStatus as 'in_stock' | 'out_of_stock' | 'limited') || 'in_stock',
        inStock: existingProduct.inStock !== false,
        availabilityTextEs: existingProduct.availabilityTextEs || '',
        availabilityTextDe: existingProduct.availabilityTextDe || '',
        availabilityTextEn: existingProduct.availabilityTextEn || '',
      };

      console.log('🔄 DEBUG: Setting form data:', formData);
      
      // CRITICAL FIX: Use form.reset() like in AdminCategoryForm
      form.reset(formData);
      
      console.log('✅ DEBUG: Form reset with data:', formData);
      console.log('✅ DEBUG: Current form values after reset:', form.getValues());
      setFormInitialized(true);


    }
  }, [existingProduct, isEdit, form, formInitialized]);

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
        price: data.price ? data.price.toString() : undefined,
      };

      const url = isEdit ? `/api/admin/products/${params.id}` : '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';

      console.log('📤 Sende Produktdaten:', productData);
      console.log('🌐 URL:', url, 'Method:', method);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      console.log('📥 Server Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('📛 Server-Fehler-Details:', errorData);
        
        let errorMessage = errorData.error || 'Failed to save product';
        if (errorData.details) {
          errorMessage += ` - Details: ${errorData.details}`;
        }
        if (errorData.fields) {
          errorMessage += ` - Betroffene Felder: ${errorData.fields.join(', ')}`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Erfolgreich gespeichert:', result);
      return result;
    },
    onSuccess: (result) => {
      // Success feedback
      const actionText = isEdit ? 'aktualisiert' : 'erstellt';
      toast({
        title: `✅ Produkt erfolgreich ${actionText}!`,
        description: `Das Produkt wurde erfolgreich gespeichert und ist jetzt verfügbar.`,
        variant: "default",

      });
      
      // Invalidate and refresh queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: [`/api/admin/products/${params.id}`] });
      }
      
      // Navigate back to admin dashboard after brief delay
      setTimeout(() => {
        setLocation('/admin');
      }, 1500);
    },
    onError: (error: any) => {
      console.error('🚨 PRODUKTERSTELLUNG FEHLGESCHLAGEN:', error);
      
      let errorMessage = "Unbekannter Fehler beim Speichern des Produkts.";
      let debugInfo = "";
      
      // Detaillierte Fehleranalyse
      if (error.message) {
        console.log('📋 Fehlermeldung:', error.message);
        
        if (error.message.includes('Validation error')) {
          errorMessage = `❌ Validierungsfehler: ${error.message.split('details: ')[1] || error.message}`;
          debugInfo = "Überprüfen Sie alle Pflichtfelder (rot markiert)";
        } else if (error.message.includes('Required')) {
          errorMessage = "Pflichtfelder fehlen. Bitte überprüfen Sie alle erforderlichen Felder.";
        } else if (error.message.includes('unique constraint')) {
          errorMessage = "Ein Produkt mit diesem Namen oder SKU existiert bereits.";
        } else if (error.message.includes('value too long')) {
          errorMessage = "Ein Textfeld ist zu lang. Bitte kürzen Sie die Eingaben.";
        } else if (error.message.includes('401')) {
          errorMessage = "Nicht autorisiert. Bitte melden Sie sich neu an.";
        } else if (error.message.includes('500')) {
          errorMessage = "Server-Fehler. Bitte versuchen Sie es erneut.";
        } else {
          errorMessage = `Fehler: ${error.message}`;
        }
      }
      
      toast({
        title: "❌ Produkterstellung fehlgeschlagen",
        description: errorMessage,
        variant: "destructive",
      });
      

    },
  });

  const onSubmit = (data: ProductForm) => {
    // Basic validation
    if (!data.nameDe) {
      toast({
        title: "Fehlende Angabe",
        description: "Produktname (Deutsch) ist erforderlich",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.shortDescriptionDe) {
      toast({
        title: "Fehlende Angabe",
        description: "Beschreibung (Deutsch) ist erforderlich",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.categoryId) {
      toast({
        title: "Fehlende Angabe",
        description: "Kategorie auswählen ist erforderlich", 
        variant: "destructive",
      });
      return;
    }
    
    saveProductMutation.mutate(data);
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
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mt-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Deutsch-zu-Spanisch Workflow</h2>
            <p className="text-gray-700 text-sm">
              Nur 3 deutsche Eingaben erforderlich:
            </p>
            <ul className="text-gray-700 text-sm mt-2 list-disc ml-5">
              <li>Produktname (Deutsch) - wird automatisch übersetzt</li>
              <li>Kurzbeschreibung (Deutsch) - wird automatisch übersetzt</li>
              <li>Kategorie auswählen</li>
            </ul>
            <p className="text-gray-700 text-sm mt-2">
              Spanische und englische Versionen werden automatisch generiert.
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <Card className={`${(form.formState.errors.nameDe || form.formState.errors.categoryId || form.formState.errors.shortDescriptionDe) ? 'border-red-500 border-2' : ''}`}>
              <CardHeader>
                <CardTitle>Grundinformationen</CardTitle>
                <CardDescription>
                  Geben Sie die wichtigsten Produktinformationen ein
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Product Names */}
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="nameDe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-800 font-bold text-lg">1. Produktname <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="z.B. 300W Monokristallines Solarpanel" 
                            className="text-lg p-3 border-2 border-gray-300 focus:border-gray-600"
                            onChange={(e) => {
                              field.onChange(e);
                              debounceTranslation(e.target.value, 'name');
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <FormField
                      control={form.control}
                      name="nameEs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-600">→ Automatisch übersetzt (Spanisch)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Wird automatisch übersetzt..." 
                              className="bg-gray-100 border-gray-200"
                              readOnly
                            />
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
                          <FormLabel className="text-gray-600">→ Automatisch übersetzt (Englisch)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Wird automatisch übersetzt..." 
                              className="bg-gray-100 border-gray-200"
                              readOnly
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Category Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-800 font-bold text-lg">2. Kategorie <span className="text-red-500">*</span></FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger className="text-lg p-3 border-2 border-gray-300 focus:border-gray-600">
                              <SelectValue placeholder="Kategorie wählen..." />
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
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="shortDescriptionDe"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-800 font-bold text-lg">3. Beschreibung <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <RichTextEditor
                              label=""
                              value={field.value || ''}
                              onChange={(value) => {
                                field.onChange(value);
                                debounceTranslation(value, 'shortDescription');
                              }}
                              placeholder="Produktbeschreibung mit Formatierung eingeben..."
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                      <FormField
                        control={form.control}
                        name="shortDescriptionEs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-600">→ Automatisch übersetzt (Spanisch)</FormLabel>
                            <FormControl>
                              <ExpandableTextarea 
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder="Wird automatisch übersetzt..." 
                                className="bg-gray-100 border-gray-200"
                                label="Kurzbeschreibung (Spanisch)"
                                rows={3}
                              />
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
                            <FormLabel className="text-gray-600">→ Automatisch übersetzt (Englisch)</FormLabel>
                            <FormControl>
                              <ExpandableTextarea 
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder="Wird automatisch übersetzt..."
                                className="bg-gray-100 border-gray-200"
                                label="Kurzbeschreibung (Englisch)"
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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
                                  className="max-w-xs max-h-48 object-contain rounded border"
                                  style={{ aspectRatio: 'auto' }}
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

                {/* Additional Images */}
                <Card className="bg-green-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-green-800">🖼️ {t('additionalImages')}</CardTitle>
                    <CardDescription className="text-green-600">
                      Zusätzliche Bilder für die Produktgalerie. Diese werden auf der Produktdetailseite angezeigt.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="images"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">{t('additionalImages')}</FormLabel>
                          <div className="space-y-4">
                            {/* Display existing images */}
                            {field.value && field.value.length > 0 && (
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {field.value.map((imageUrl: string, index: number) => (
                                  <div key={index} className="relative group">
                                    <img 
                                      src={imageUrl} 
                                      alt={`Zusätzliches Bild ${index + 1}`}
                                      className="w-full h-20 sm:h-24 object-cover rounded border"
                                    />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      className="absolute top-1 right-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                                      onClick={() => {
                                        const newImages = [...(field.value || [])];
                                        newImages.splice(index, 1);
                                        field.onChange(newImages);
                                      }}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Add new image */}
                            <div className="border-2 border-dashed border-green-300 rounded-lg p-4">
                              <div className="text-center space-y-2">
                                <ImageUpload 
                                  onImageSelect={(imageUrl) => {
                                    const currentImages = field.value || [];
                                    field.onChange([...currentImages, imageUrl]);
                                  }}
                                />
                                <p className="text-sm text-gray-600">oder URL eingeben:</p>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <Input 
                                    placeholder="https://..." 
                                    id="additional-image-url"
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full sm:w-auto"
                                    onClick={() => {
                                      const input = document.getElementById('additional-image-url') as HTMLInputElement;
                                      if (input?.value) {
                                        const currentImages = field.value || [];
                                        field.onChange([...currentImages, input.value]);
                                        input.value = '';
                                      }
                                    }}
                                  >
                                    {t('addImage')}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>


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
                    name="inStock"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Auf Lager</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Produkt ist verfügbar
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
                </div>

                {/* Verfügbarkeit */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Verfügbarkeit (wenn nicht auf Lager)</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="availabilityTextEs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Verfügbarkeit (Spanisch)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="z.B. 2-3 semanas, 1-2 meses" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="availabilityTextDe"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Verfügbarkeit (Deutsch)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="z.B. 2-3 Wochen, 1-2 Monate" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="availabilityTextEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Verfügbarkeit (Englisch)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. 2-3 weeks, 1-2 months" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-3 text-lg font-bold"
              >
                {saveProductMutation.isPending 
                  ? 'Speichern...' 
                  : isEdit 
                    ? 'Produkt aktualisieren'
                    : 'Neues Produkt erstellen'
                }
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}