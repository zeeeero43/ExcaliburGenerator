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
import { smartTranslate } from '@/lib/translationCache';

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
  const [translationCount, setTranslationCount] = useState(0);
  const isTranslating = translationCount > 0;
  const [nameTimeout, setNameTimeout] = useState<NodeJS.Timeout | null>(null);
  const [shortDescTimeout, setShortDescTimeout] = useState<NodeJS.Timeout | null>(null);
  const [fullDescTimeout, setFullDescTimeout] = useState<NodeJS.Timeout | null>(null);
  const [availabilityTimeout, setAvailabilityTimeout] = useState<NodeJS.Timeout | null>(null);
  
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
  const subcategories = Array.isArray(allSubcategories) ? allSubcategories.filter((sub: any) => sub.categoryId === selectedCategoryId) : [];
  
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
    
      console.log(`🔄 PRODUCT TRANSLATION START: Field="${originalFieldName}", Text="${germanText.substring(0, 30)}...", Length=${germanText.length} chars`);
      
      if (germanText.length > 1000) {
        console.error(`🚨🚨🚨 QUOTA KILLER DETECTED! Field "${originalFieldName}" has ${germanText.length} characters!`);
        console.error(`📝 MASSIVE TEXT: "${germanText.substring(0, 200)}..."`);
        console.error(`💰 This will consume ~${Math.ceil(germanText.length/1000)}% of your monthly quota!`);
      }
      setTranslationCount(prev => prev + 1);
      
      try {
        const toLang = toField.includes('Es') ? 'es' : 'en';
        const translatedText = await smartTranslate(germanText, 'de', toLang);
        
        if (translatedText && translatedText !== germanText) {
          form.setValue(toField as keyof ProductFormData, translatedText);
          console.log(`✅ PRODUCT TRANSLATION SUCCESS: "${germanText.substring(0, 30)}..." -> "${translatedText.substring(0, 30)}..." (${germanText.length} chars used)`);
        } else {
          console.log(`⚠️ PRODUCT TRANSLATION FAILED OR SAME: "${germanText.substring(0, 30)}..."`);
        }
      } catch (error) {
        console.error('❌ Translation failed:', error);
      } finally {
        setTranslationCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  // 🚨 DISABLED: Auto-translation was causing massive API usage!
  // Real-time translation with debounce for product name
  // useEffect(() => {
  //   const germanName = form.watch('nameDe');
  //   if (germanName && !isLoadingExistingProduct) {
  //     if (nameTimeout) {
  //       clearTimeout(nameTimeout);
  //     }
  //     
  //     const timeout = setTimeout(() => {
  //       // 🇪🇸 SPANISH FIRST (Cuba market priority)
  //       handleAutoTranslation(germanName, 'nameEs', 'nameDe');
  //       // 🇺🇸 English optional (comment out to save characters)
  //       // handleAutoTranslation(germanName, 'nameEn', 'nameDe');
  //     }, 5000); // 🔥 ERHÖHT von 1.5s auf 5s
  //     
  //     setNameTimeout(timeout);
  //   }
  // }, [form.watch('nameDe'), isLoadingExistingProduct]);
  
  console.log('🚨 AUTO-TRANSLATION DISABLED: Manual translation only to prevent quota exhaustion');

  // 🚨 DISABLED: Auto-translation was causing massive API usage!
  // Real-time translation with debounce for short description
  // useEffect(() => {
  //   const germanDesc = form.watch('shortDescriptionDe');
  //   if (germanDesc && !isLoadingExistingProduct) {
  //     if (shortDescTimeout) {
  //       clearTimeout(shortDescTimeout);
  //     }
  //     
  //     const timeout = setTimeout(() => {
  //       // 🇪🇸 SPANISH FIRST (Cuba market priority)  
  //       handleAutoTranslation(germanDesc, 'shortDescriptionEs', 'shortDescriptionDe');
  //       // 🇺🇸 English optional (comment out to save characters)
  //       // handleAutoTranslation(germanDesc, 'shortDescriptionEn', 'shortDescriptionDe');
  //     }, 5000); // 🔥 ERHÖHT von 1.5s auf 5s
  //     
  //     setShortDescTimeout(timeout);
  //   }
  // }, [form.watch('shortDescriptionDe'), isLoadingExistingProduct]);

  // 🚨 DISABLED: Auto-translation was causing massive API usage!
  // Real-time translation with debounce for full description
  // useEffect(() => {
  //   const germanFullDesc = form.watch('descriptionDe');
  //   if (germanFullDesc && !isLoadingExistingProduct) {
  //     if (fullDescTimeout) {
  //       clearTimeout(fullDescTimeout);
  //     }
  //     
  //     const timeout = setTimeout(() => {
  //       // 🇪🇸 SPANISH FIRST (Cuba market priority)
  //       handleAutoTranslation(germanFullDesc, 'descriptionEs', 'descriptionDe');
  //       // 🇺🇸 English optional (comment out to save characters)
  //       // handleAutoTranslation(germanFullDesc, 'descriptionEn', 'descriptionDe');
  //     }, 8000); // 🔥 ERHÖHT von 2s auf 8s für lange Texte
  //     
  //     setFullDescTimeout(timeout);
  //   }
  // }, [form.watch('descriptionDe'), isLoadingExistingProduct]);

  // 🚨 DISABLED: Auto-translation was causing massive API usage!
  // Real-time translation with debounce for availability field
  // useEffect(() => {
  //   const germanAvailability = form.watch('availabilityTextDe');
  //   if (germanAvailability && !isLoadingExistingProduct) {
  //     if (availabilityTimeout) {
  //       clearTimeout(availabilityTimeout);
  //     }
  //     
  //     const timeout = setTimeout(() => {
  //       // 🇪🇸 SPANISH FIRST (Cuba market priority)
  //       handleAutoTranslation(germanAvailability, 'availabilityTextEs', 'availabilityTextDe');
  //       // 🇺🇸 English optional (comment out to save characters)
  //       // handleAutoTranslation(germanAvailability, 'availabilityTextEn', 'availabilityTextDe');
  //     }, 5000); // 🔥 ERHÖHT von 1.5s auf 5s
  //     
  //     setAvailabilityTimeout(timeout);
  //   }
  // }, [form.watch('availabilityTextDe'), isLoadingExistingProduct]);

  // Handle price on request translation - NO API CALLS NEEDED
  const handlePriceOnRequestTranslation = async () => {
    try {
      // Hardcoded translations - no API calls needed
      const spanishText = 'Precio a consultar';
      const englishText = 'Price on request';
      
      // Set hardcoded translations directly
      form.setValue('oldPrice', '');
      form.setValue('newPrice', '');
      
      console.log(`✅ HARDCODED: "Preis auf Anfrage" -> ES: "${spanishText}", EN: "${englishText}"`);
      
      toast({
        title: "Erfolg",
        description: "\"Preis auf Anfrage\" ohne API-Aufruf gesetzt",
      });
    } catch (error) {
      console.error('Translation error:', error);
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

  // Detailed error analysis function
  const analyzeError = (error: any, response: Response) => {
    // Network errors
    if (!navigator.onLine) {
      return {
        title: "Netzwerk-Fehler",
        description: "Keine Internetverbindung. Bitte überprüfen Sie Ihre Verbindung und versuchen Sie es erneut.",
      };
    }

    // Server response errors
    if (response) {
      if (response.status === 400) {
        return {
          title: "Ungültige Eingaben",
          description: error.message || "Die eingegebenen Daten sind ungültig. Überprüfen Sie alle Pflichtfelder.",
        };
      }
      if (response.status === 401) {
        return {
          title: "Nicht angemeldet",
          description: "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.",
        };
      }
      if (response.status === 403) {
        return {
          title: "Keine Berechtigung",
          description: "Sie haben keine Berechtigung für diese Aktion.",
        };
      }
      if (response.status === 409) {
        return {
          title: "Produkt bereits vorhanden",
          description: "Ein Produkt mit dieser SKU existiert bereits. Wählen Sie eine andere SKU.",
        };
      }
      if (response.status === 413) {
        return {
          title: "Datei zu groß",
          description: "Die hochgeladenen Bilder sind zu groß. Maximum: 5MB pro Bild.",
        };
      }
      if (response.status >= 500) {
        return {
          title: "Server-Fehler",
          description: "Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
        };
      }
    }

    // Validation specific errors
    if (error.message) {
      const msg = error.message.toLowerCase();
      
      if (msg.includes('kategorie')) {
        return {
          title: "Kategorie-Fehler",
          description: "Bitte wählen Sie eine gültige Kategorie aus der Liste aus.",
        };
      }
      if (msg.includes('name') || msg.includes('titel')) {
        return {
          title: "Produktname fehlt",
          description: "Der Produktname auf Deutsch ist erforderlich und darf nicht leer sein.",
        };
      }
      if (msg.includes('beschreibung') || msg.includes('description')) {
        return {
          title: "Beschreibung fehlt",
          description: "Die Kurzbeschreibung auf Deutsch ist erforderlich.",
        };
      }
      if (msg.includes('preis') || msg.includes('price')) {
        return {
          title: "Preis-Fehler",
          description: "Bitte geben Sie einen gültigen Preis ein oder wählen Sie 'Preis auf Anfrage'.",
        };
      }
      if (msg.includes('sku')) {
        return {
          title: "SKU-Fehler",
          description: "Die SKU muss eindeutig sein und darf nur Buchstaben, Zahlen und Bindestriche enthalten.",
        };
      }
      if (msg.includes('bild') || msg.includes('image')) {
        return {
          title: "Bild-Fehler",
          description: "Fehler beim Verarbeiten der Produktbilder. Überprüfen Sie Format und Größe.",
        };
      }
    }

    // Fallback generic error
    return {
      title: "Unbekannter Fehler",
      description: error.message || "Ein unbekannter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
    };
  };

  // Save product mutation
  const saveProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const url = isEditing ? `/api/admin/products/${id}` : '/api/admin/products';
      const method = isEditing ? 'PUT' : 'POST';
      
      console.log('🚀 Mutation starting:', { url, method, data });
      
      let response: Response;
      
      try {
        response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        console.log('🚀 API Response:', response.status, response.statusText);
        
      } catch (networkError) {
        console.error('❌ Network Error:', networkError);
        throw { 
          message: 'Netzwerkverbindung fehlgeschlagen',
          response: null 
        };
      }

      if (!response.ok) {
        let errorData: any = {};
        
        try {
          // Try to parse JSON error response
          errorData = await response.json();
        } catch (parseError) {
          // If JSON parsing fails, use status text
          errorData = { error: response.statusText };
        }
        
        console.log('❌ API Error:', errorData);
        
        const error = new Error(errorData.error || errorData.message || 'Fehler beim Speichern');
        (error as any).response = response;
        (error as any).data = errorData;
        throw error;
      }

      const result = await response.json();
      console.log('✅ API Success:', result);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "✅ Erfolg!",
        description: isEditing ? "Produkt wurde erfolgreich aktualisiert" : "Neues Produkt wurde erfolgreich erstellt",
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
    onError: (error: any) => {
      console.error('🚨 DETAILED ERROR:', error);
      
      const errorInfo = analyzeError(error, error.response);
      
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: 'destructive',
      });
    },
  });

  const validateFormData = (data: ProductFormData) => {
    const errors: string[] = [];
    
    // Required field validation
    if (!data.nameDe?.trim()) {
      errors.push("Produktname (Deutsch) ist erforderlich");
    }
    
    if (!data.shortDescriptionDe?.trim()) {
      errors.push("Kurzbeschreibung (Deutsch) ist erforderlich");
    }
    
    if (!data.categoryId || data.categoryId < 1) {
      errors.push("Bitte wählen Sie eine gültige Kategorie aus");
    }
    
    // SKU validation - now much more lenient, just no empty strings
    if (data.sku && data.sku.trim().length === 0) {
      errors.push("SKU darf nicht leer sein");
    }
    
    // Price validation
    if (data.oldPrice && isNaN(parseFloat(data.oldPrice))) {
      errors.push("Alter Preis muss eine gültige Zahl sein");
    }
    
    if (data.newPrice && isNaN(parseFloat(data.newPrice))) {
      errors.push("Neuer Preis muss eine gültige Zahl sein");
    }
    
    // Image URL validation - very lenient, only check for obviously invalid URLs
    if (data.mainImage && data.mainImage.trim()) {
      // Only block clearly invalid URLs (like just spaces, or starts with invalid chars)
      const invalidChars = /^[\s<>"`{}|\\^]+/;
      if (invalidChars.test(data.mainImage.trim())) {
        errors.push("Hauptbild-URL enthält ungültige Zeichen");
      }
    }
    
    if (data.images) {
      data.images.forEach((img, index) => {
        if (img && img.trim()) {
          const invalidChars = /^[\s<>"`{}|\\^]+/;
          if (invalidChars.test(img.trim())) {
            errors.push(`Zusatzbild ${index + 1} enthält ungültige Zeichen`);
          }
        }
      });
    }
    
    // Content length validation
    if (data.nameDe && data.nameDe.length > 100) {
      errors.push("Produktname darf maximal 100 Zeichen lang sein");
    }
    
    if (data.shortDescriptionDe && data.shortDescriptionDe.length > 500) {
      errors.push("Kurzbeschreibung darf maximal 500 Zeichen lang sein");
    }
    
    if (data.descriptionDe && data.descriptionDe.length > 5000) {
      errors.push("Vollständige Beschreibung darf maximal 5000 Zeichen lang sein");
    }
    
    return errors;
  };

  const onSubmit = (data: ProductFormData) => {
    console.log('🚀 Form submitted with data:', data);
    console.log('🚀 Form errors:', form.formState.errors);
    console.log('🚀 Form isValid:', form.formState.isValid);
    
    // Detailed frontend validation
    const validationErrors = validateFormData(data);
    
    if (validationErrors.length > 0) {
      console.log('❌ Frontend validation failed:', validationErrors);
      console.log('🍞 Attempting to show toast...');
      
      // Try to make toast more visible
      const errorMessage = validationErrors.slice(0, 2).join(' • ');
      const moreErrors = validationErrors.length > 2 ? ` (+${validationErrors.length - 2} weitere)` : '';
      
      try {
        toast({
          title: "❌ Eingabe-Fehler",
          description: `${errorMessage}${moreErrors}`,
          variant: "destructive",
        });
        console.log('🍞 Toast called successfully');
      } catch (toastError) {
        console.error('🍞 Toast error:', toastError);
        // Fallback: show as alert
        alert(`Eingabe-Fehler:\n\n${validationErrors.join('\n')}`);
      }
      return;
    }
    
    // Check React Hook Form validation as well
    if (Object.keys(form.formState.errors).length > 0) {
      console.log('❌ React Hook Form validation failed:', form.formState.errors);
      
      const formErrors = Object.entries(form.formState.errors).map(([field, error]) => {
        return `${field}: ${error?.message || 'Ungültiger Wert'}`;
      });
      
      const formErrorMessage = formErrors.slice(0, 2).join(' • ');
      const moreFormErrors = formErrors.length > 2 ? ` (+${formErrors.length - 2} weitere)` : '';
      
      try {
        toast({
          title: "❌ Formular-Fehler",
          description: `${formErrorMessage}${moreFormErrors}`,
          variant: "destructive",
        });
        console.log('🍞 Form error toast called successfully');
      } catch (toastError) {
        console.error('🍞 Form error toast failed:', toastError);
        // Fallback: show as alert
        alert(`Formular-Fehler:\n\n${formErrors.join('\n')}`);
      }
      return;
    }
    
    console.log('✅ All validation passed, proceeding with submission');
    
    // Show loading toast
    toast({
      title: "💾 Speichern...",
      description: isEditing ? "Produkt wird aktualisiert..." : "Neues Produkt wird erstellt...",
    });
    
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
                <li>Produktname (Deutsch) - mit manueller Übersetzung</li>
                <li>Kurzbeschreibung (Deutsch) - mit manueller Übersetzung</li>
                <li>Kategorie auswählen</li>
              </ul>
              Klicke auf "Übersetzen" Buttons um spanische/englische Versionen zu generieren.
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
                              // 🚨 AUTOMATIC TRANSLATION DISABLED - Use manual buttons
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Manual translation versions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-500">Spanisch</span>
                        <button
                          type="button"
                          onClick={() => {
                            const germanText = form.getValues('nameDe');
                            if (germanText) {
                              handleAutoTranslation(germanText, 'nameEs', 'nameDe');
                            }
                          }}
                          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        >
                          Übersetzen
                        </button>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-sm">
                        {form.watch('nameEs') || 'Klicke "Übersetzen" um zu übersetzen...'}
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-500">Englisch</span>
                        <button
                          type="button"
                          onClick={() => {
                            const germanText = form.getValues('nameDe');
                            if (germanText) {
                              handleAutoTranslation(germanText, 'nameEn', 'nameDe');
                            }
                          }}
                          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        >
                          Übersetzen
                        </button>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-sm">
                        {form.watch('nameEn') || 'Klicke "Übersetzen" um zu übersetzen...'}
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
                          {Array.isArray(categories) ? categories.map((category: any) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.nameDe || category.nameEs}
                            </SelectItem>
                          )) : []}
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
                            // 🚨 AUTOMATIC TRANSLATION DISABLED - Use manual buttons
                          }}
                          placeholder="Test 1-2-3"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />



                {/* Manual translation versions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Spanisch</span>
                      <button
                        type="button"
                        onClick={() => {
                          const germanText = form.getValues('shortDescriptionDe');
                          if (germanText) {
                            handleAutoTranslation(germanText, 'shortDescriptionEs', 'shortDescriptionDe');
                          }
                        }}
                        className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                      >
                        Übersetzen
                      </button>
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-sm min-h-[80px] relative">
                      {form.watch('shortDescriptionEs') || 'Klicke "Übersetzen" um zu übersetzen...'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Englisch</span>
                      <button
                        type="button"
                        onClick={() => {
                          const germanText = form.getValues('shortDescriptionDe');
                          if (germanText) {
                            handleAutoTranslation(germanText, 'shortDescriptionEn', 'shortDescriptionDe');
                          }
                        }}
                        className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                      >
                        Übersetzen
                      </button>
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-sm min-h-[80px] relative">
                      {form.watch('shortDescriptionEn') || 'Klicke "Übersetzen" um zu übersetzen...'}
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
                                      const newImages = (field.value || []).filter((_: string, i: number) => i !== index);
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
                  disabled={saveProductMutation.isPending || isTranslating}
                  onClick={() => {
                    console.log('🚀 Submit button clicked');
                    console.log('🚀 Form state:', form.formState);
                    console.log('🚀 Form values:', form.getValues());
                    console.log('🚀 isTranslating:', isTranslating);
                  }}
                >
                  {saveProductMutation.isPending ? 'Speichere...' : 
                   isTranslating ? 'Übersetzt...' : 'Produkt speichern'}
                </Button>
                

              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}