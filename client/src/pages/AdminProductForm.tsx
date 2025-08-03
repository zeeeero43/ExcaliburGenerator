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
  subcategoryId: z.number().nullable().optional(),
  sku: z.string().optional(),
  oldPrice: z.string().optional(),
  newPrice: z.string().optional(),
  priceOnRequest: z.boolean().default(false),
  mainImage: z.string().optional(),
  images: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  stockStatus: z.enum(['in_stock', 'out_of_stock', 'limited']).default('in_stock'),
  availabilityTextEs: z.string().optional(),
  availabilityTextDe: z.string().optional(),
  availabilityTextEn: z.string().optional(),
  sortOrder: z.number().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function AdminProductForm() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationTimeout, setTranslationTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // 🚀 SMART CACHING: Prevent re-translation of existing data
  const [isLoadingExistingProduct, setIsLoadingExistingProduct] = useState(true);
  const [originalTexts, setOriginalTexts] = useState<Record<string, string>>({});

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
      categoryId: 1,
      subcategoryId: null,
      sku: '',
      oldPrice: '',
      newPrice: '',
      priceOnRequest: false,
      mainImage: '',
      images: [],
      isActive: true,
      isFeatured: false,
      stockStatus: 'in_stock',
      availabilityTextEs: '',
      availabilityTextDe: '',
      availabilityTextEn: '',
      sortOrder: 0,
    },
  });

  // Fetch product data for editing
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: [`/api/admin/products/${id}`],
    enabled: isEditing,
  }) as { data: any, isLoading: boolean };

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
  
  // Debug subcategory filtering
  console.log('🔄 Selected category ID:', selectedCategoryId);
  console.log('🔄 All subcategories:', allSubcategories);
  console.log('🔄 Filtered subcategories:', subcategories);
  console.log('🔄 Current subcategoryId value:', form.watch('subcategoryId'));

  // 🚀 NEW TRANSLATION LOGIC: Clear translation when text changes, keep when editing unchanged text
  const handleAutoTranslation = async (germanText: string, toField: string, originalFieldName: string) => {
    if (!germanText || germanText.trim() === '') {
      // If German text is empty, clear the translation
      form.setValue(toField as keyof ProductFormData, '');
      return;
    }
    
    // When editing: if text changed from original, clear translation and retranslate
    if (isEditing && originalTexts[originalFieldName] && originalTexts[originalFieldName] !== germanText) {
      console.log(`🔄 TEXT CHANGED: "${originalFieldName}" changed, clearing and retranslating`);
      form.setValue(toField as keyof ProductFormData, ''); // Clear old translation
    }
    
    // When editing: if text unchanged, keep existing translation
    if (isEditing && originalTexts[originalFieldName] === germanText) {
      console.log(`🟡 TEXT UNCHANGED: "${originalFieldName}" unchanged, keeping existing translation`);
      return;
    }
    
    // For new products or changed text: translate
    if (!isEditing || (isEditing && originalTexts[originalFieldName] !== germanText)) {
    
      console.log(`🔄 TRANSLATING: "${originalFieldName}" - "${germanText.substring(0, 30)}..."`);
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
            console.log(`✅ TRANSLATED (${data.provider || 'Unknown'}): "${germanText.substring(0, 30)}..." -> "${data.translatedText.substring(0, 30)}..."`);
          } else if (data.error) {
            console.error(`❌ TRANSLATION ERROR: ${data.error} - ${data.details || 'Unknown'}`);
          }
        }
      } catch (error) {
        console.error('❌ Translation failed:', error);
      } finally {
        setIsTranslating(false);
      }
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
        handleAutoTranslation(germanName, 'nameEs', 'nameDe');
        handleAutoTranslation(germanName, 'nameEn', 'nameDe');
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
        handleAutoTranslation(germanDesc, 'shortDescriptionEs', 'shortDescriptionDe');
        handleAutoTranslation(germanDesc, 'shortDescriptionEn', 'shortDescriptionDe');
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
        handleAutoTranslation(germanFullDesc, 'descriptionEs', 'descriptionDe');
        handleAutoTranslation(germanFullDesc, 'descriptionEn', 'descriptionDe');
      }, 1000);
      
      setTranslationTimeout(timeout);
    }
  }, [form.watch('descriptionDe')]);

  // Real-time translation with debounce for availability field
  useEffect(() => {
    const germanAvailability = form.watch('availabilityTextDe');
    if (germanAvailability) {
      if (translationTimeout) {
        clearTimeout(translationTimeout);
      }
      
      const timeout = setTimeout(() => {
        handleAutoTranslation(germanAvailability, 'availabilityTextEs', 'availabilityTextDe');
        handleAutoTranslation(germanAvailability, 'availabilityTextEn', 'availabilityTextDe');
      }, 1000);
      
      setTranslationTimeout(timeout);
    }
  }, [form.watch('availabilityTextDe')]);

  // Handle price on request translation
  const handlePriceOnRequestTranslation = async () => {
    try {
      const germanText = 'Preis auf Anfrage';
      
      // Translate to Spanish
      const spanishResult = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: germanText, targetLanguage: 'es' })
      });
      const spanishData = await spanishResult.json();
      
      // Translate to English
      const englishResult = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: germanText, targetLanguage: 'en' })
      });
      const englishData = await englishResult.json();
      
      // Price on request doesn't need translation for pricing fields anymore
      // Just clear the prices
      
      toast({
        title: "Übersetzt",
        description: "\"Preis auf Anfrage\" wurde automatisch übersetzt",
      });
    } catch (error) {
      console.error('Translation error:', error);
      form.setValue('priceNote', 'Precio bajo consulta');
    }
  };

  // 🚀 SMART CACHING: Set form data when product is loaded without triggering translations
  useEffect(() => {
    if (product) {
      console.log('🔄 SMART CACHE: Loading existing product, storing original texts');
      console.log('🔄 Product subcategoryId:', product.subcategoryId);
      
      // 🚀 CACHE: Store original texts to prevent re-translation
      setOriginalTexts({
        nameDe: product.nameDe || '',
        shortDescriptionDe: product.shortDescriptionDe || '',
        descriptionDe: product.descriptionDe || '',
        availabilityTextDe: product.availabilityTextDe || '',
      });
      
      // 🚀 CACHE: Block auto-translation during loading
      setIsLoadingExistingProduct(true);
      
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
        categoryId: product.categoryId || 1,
        subcategoryId: product.subcategoryId === null ? null : product.subcategoryId,
        sku: product.sku || '',
        oldPrice: product.oldPrice || product.price || '',
        newPrice: product.newPrice || '',
        priceOnRequest: product.priceOnRequest || false,
        mainImage: product.mainImage || '',
        images: product.images || [],
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        stockStatus: product.stockStatus || 'in_stock',
        availabilityTextEs: product.availabilityTextEs || '',
        availabilityTextDe: product.availabilityTextDe || '',
        availabilityTextEn: product.availabilityTextEn || '',
        sortOrder: product.sortOrder || 0,
      });

      // Ensure subcategory is properly set after category is set
      setTimeout(() => {
        if (product.subcategoryId !== undefined) {
          form.setValue('subcategoryId', product.subcategoryId === null ? null : product.subcategoryId);
          console.log('🔄 Setting subcategoryId after delay:', product.subcategoryId);
        } else {
          form.setValue('subcategoryId', null);
          console.log('🔄 Setting subcategoryId to null (no subcategory)');
        }
        
        // 🚀 CACHE: Enable auto-translation after loading is complete
        setTimeout(() => {
          setIsLoadingExistingProduct(false);
          console.log('✅ SMART CACHE ENABLED: Product loaded, auto-translation enabled for NEW changes only');
        }, 200);
      }, 100);
    }
  }, [product, form]);

  // 🚀 SMART CACHING: For new products, enable translation immediately
  useEffect(() => {
    if (!isEditing) {
      setIsLoadingExistingProduct(false);
      console.log('✅ SMART CACHE ENABLED: New product mode, auto-translation enabled');
    }
  }, [isEditing]);

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
      
      console.log('🚀 Mutation starting:', { url, method, data });
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('🚀 API Response:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ API Error:', errorData);
        throw new Error(errorData.error || 'Fehler beim Speichern');
      }

      const result = await response.json();
      console.log('✅ API Success:', result);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Produkt gespeichert",
        description: isEditing ? "Produkt wurde aktualisiert" : "Neues Produkt wurde erstellt",
      });
      // Invalidate both admin and public product caches
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
      // Invalidate the specific product cache if editing
      if (isEditing && id) {
        queryClient.invalidateQueries({ queryKey: [`/api/admin/products/${id}`] });
      }
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
    console.log('🚀 Form submitted with data:', data);
    console.log('🚀 Form errors:', form.formState.errors);
    console.log('🚀 Form isValid:', form.formState.isValid);
    
    // Manuelle Validierung für kritische Felder
    if (!data.nameDe || !data.shortDescriptionDe || !data.categoryId || data.categoryId < 1) {
      console.log('❌ Manual validation failed');
      toast({
        title: "Formular ungültig",
        description: "Produktname, Kurzbeschreibung und Kategorie sind erforderlich",
        variant: "destructive"
      });
      return;
    }
    
    // Ignore form.formState.isValid - proceed with submission
    console.log('✅ Manual validation passed, proceeding with submission');
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
                          <Input 
                            {...field} 
                            placeholder="Solar Panele 410Watt Pink, neueste Monokristelline, Halbzell PERC Technologie"
                            onChange={(e) => {
                              field.onChange(e);
                              // 🚀 SMART TRANSLATION: Only translate on actual text changes
                              if (e.target.value !== originalTexts.nameDe) {
                                handleAutoTranslation(e.target.value, 'nameEs', 'nameDe');
                                handleAutoTranslation(e.target.value, 'nameEn', 'nameDe');
                              }
                            }}
                          />
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
                          // Only reset subcategoryId if this is not an existing product being loaded
                          if (!isEditing || !product) {
                            form.setValue('subcategoryId', undefined);
                          }
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
                      <FormLabel>3. Unterkategorie (optional)</FormLabel>
                      <Select
                        value={field.value ? field.value.toString() : 'none'}
                        onValueChange={(value) => {
                          console.log('🔄 Subcategory changed to:', value);
                          if (value === 'none') {
                            field.onChange(null);
                          } else {
                            const numValue = parseInt(value);
                            field.onChange(isNaN(numValue) ? null : numValue);
                          }
                        }}
                        disabled={!selectedCategoryId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Unterkategorie wählen..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">
                            <span className="text-gray-500">Keine Unterkategorie</span>
                          </SelectItem>
                          {subcategories.map((subcategory: Subcategory) => (
                            <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                              {subcategory.nameDe || subcategory.nameEs}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        Ohne Unterkategorie erscheint das Produkt direkt unter der Kategorie
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 4. Sortierung */}
                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>4. Sortierung (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          placeholder="z.B. 1, 2, 3... (niedrige Zahl = weiter oben)"
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500">
                        Produkte ohne Nummer kommen automatisch nach denen mit Nummer
                      </p>
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
                      <FormLabel>5. Beschreibung *</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          label="Kurzbeschreibung"
                          value={field.value || ''}
                          onChange={(value) => {
                            field.onChange(value);
                            // 🚀 SMART TRANSLATION: Only translate on actual text changes
                            if (value !== originalTexts.shortDescriptionDe) {
                              handleAutoTranslation(value, 'shortDescriptionEs', 'shortDescriptionDe');
                              handleAutoTranslation(value, 'shortDescriptionEn', 'shortDescriptionDe');
                            }
                          }}
                          placeholder="Test 1-2-3"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />



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
                
                <div className="space-y-4">
                  {/* Preis-auf-Anfrage Checkbox */}
                  <FormField
                    control={form.control}
                    name="priceOnRequest"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base font-medium">
                            Preis auf Anfrage
                          </FormLabel>
                          <div className="text-sm text-gray-600">
                            Aktiviere diese Option, wenn der Preis auf Anfrage ist. Wird automatisch übersetzt.
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (checked) {
                                // Clear prices when enabling price on request
                                form.setValue('oldPrice', '');
                                form.setValue('newPrice', '');
                                // Auto-translate "Preis auf Anfrage"
                                handlePriceOnRequestTranslation();
                              }
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

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
                      name="newPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Neuer Preis (USD)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="799.99"
                              disabled={form.watch('priceOnRequest')}
                              className={form.watch('priceOnRequest') ? 'opacity-50 cursor-not-allowed' : ''}
                              onChange={(e) => {
                                field.onChange(e);
                                // If new price is empty, copy old price value
                                if (!e.target.value && form.watch('oldPrice')) {
                                  // This is handled in display logic, not here
                                }
                              }}
                            />
                          </FormControl>
                          <div className="text-xs text-gray-500 mt-1">
                            Leer lassen für normalen Preis, ausfüllen für reduzierten Preis
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="oldPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alter Preis (USD)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="999.99"
                              disabled={form.watch('priceOnRequest')}
                              className={form.watch('priceOnRequest') ? 'opacity-50 cursor-not-allowed' : ''}
                            />
                          </FormControl>
                          <div className="text-xs text-gray-500 mt-1">
                            Originalpreis oder aktueller Preis wenn nicht reduziert
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                        <div className="space-y-2">
                          <ImageUpload
                            onImageSelect={(url) => {
                              console.log('ImageUpload onImageSelect called with:', url);
                              field.onChange(url);
                            }}
                            currentImage={field.value}
                          />
                          <div className="text-sm text-gray-600">oder URL eingeben:</div>
                          <Input 
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="mt-1"
                          />
                        </div>
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
                  name="images"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zusätzliche Bilder (Galerie)</FormLabel>
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
                                  <img src={url} alt={`Zusätzliches Bild ${index + 1}`} className="w-full h-20 object-contain bg-gray-100 rounded border" />
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
                              onCheckedChange={(checked) => {
                                field.onChange(checked ? 'in_stock' : 'out_of_stock');
                                // Wenn "auf Lager" gesetzt wird, Verfügbarkeitsdaten löschen
                                if (checked) {
                                  form.setValue('availabilityTextDe', '');
                                  form.setValue('availabilityTextEs', '');
                                  form.setValue('availabilityTextEn', '');
                                }
                              }}
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
              <div className={`space-y-4 ${form.watch('stockStatus') === 'in_stock' ? 'opacity-50 pointer-events-none' : ''}`}>
                <h3 className="text-lg font-semibold">Verfügbarkeit (wenn nicht auf Lager)</h3>
                <p className="text-sm text-gray-600">Nur Deutsch eingeben - automatische Übersetzung erfolgt in Echtzeit</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="availabilityTextDe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verfügbarkeit (Deutsch) *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="z.B. in 2 Wochen verfügbar" 
                            disabled={form.watch('stockStatus') === 'in_stock'}
                            onChange={(e) => {
                              field.onChange(e);
                              // 🚀 SMART TRANSLATION: Only translate on actual text changes
                              if (e.target.value !== originalTexts.availabilityTextDe) {
                                handleAutoTranslation(e.target.value, 'availabilityTextEs', 'availabilityTextDe');
                                handleAutoTranslation(e.target.value, 'availabilityTextEn', 'availabilityTextDe');
                              }
                            }}
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500">Nur Deutsch eingeben - wird automatisch übersetzt</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="availabilityTextEs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verfügbarkeit (Spanisch)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="z.B. disponible en 2 semanas" 
                            disabled={form.watch('stockStatus') === 'in_stock'}
                            readOnly
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500">Automatisch übersetzt aus Deutsch</p>
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
                          <Input 
                            {...field} 
                            placeholder="e.g. available in 2 weeks" 
                            disabled={form.watch('stockStatus') === 'in_stock'}
                            readOnly
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500">Automatisch übersetzt aus Deutsch</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {form.watch('stockStatus') === 'in_stock' && (
                  <p className="text-sm text-gray-500 italic">
                    Diese Felder sind deaktiviert, da das Produkt auf Lager ist.
                  </p>
                )}
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
                  onClick={() => {
                    console.log('🚀 Submit button clicked');
                    console.log('🚀 Form state:', form.formState);
                    console.log('🚀 Form values:', form.getValues());
                  }}
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