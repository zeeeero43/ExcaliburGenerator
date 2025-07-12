import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { Category, Subcategory } from '@shared/schema';

const subcategoryFormSchema = z.object({
  categoryId: z.coerce.number().min(1, "Kategorie ist erforderlich"),
  name: z.string().optional(),
  nameEs: z.string().optional(),
  nameDe: z.string().min(1, "Deutscher Name ist erforderlich"),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  descriptionEs: z.string().optional(),
  descriptionDe: z.string().optional(),
  descriptionEn: z.string().optional(),
  slug: z.string().optional(),
  sortOrder: z.coerce.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

type SubcategoryForm = z.infer<typeof subcategoryFormSchema>;

export default function AdminSubcategoryForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationTimeout, setTranslationTimeout] = useState<NodeJS.Timeout | null>(null);

  // Extract ID from URL if editing
  useEffect(() => {
    const path = window.location.pathname;
    const editMatch = path.match(/\/admin\/subcategories\/(\d+)\/edit/);
    if (editMatch) {
      setIsEditing(true);
      setSubcategoryId(parseInt(editMatch[1]));
    }
  }, []);

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/admin/categories'],
  });

  // Fetch existing subcategories to suggest next position
  const { data: allSubcategories = [] } = useQuery<Subcategory[]>({
    queryKey: ['/api/admin/subcategories'],
  });

  // Fetch subcategory data if editing
  const { data: subcategory } = useQuery<Subcategory>({
    queryKey: ['/api/admin/subcategories', subcategoryId],
    enabled: isEditing && !!subcategoryId,
  });

  // Calculate next available position
  const getNextPosition = () => {
    if (allSubcategories.length === 0) return 1;
    const maxPosition = Math.max(...allSubcategories.map(sub => sub.sortOrder));
    return maxPosition + 1;
  };

  const form = useForm<SubcategoryForm>({
    resolver: zodResolver(subcategoryFormSchema),
    defaultValues: {
      categoryId: 0,
      name: '',
      nameEs: '',
      nameDe: '',
      nameEn: '',
      description: '',
      descriptionEs: '',
      descriptionDe: '',
      descriptionEn: '',
      slug: '',
      sortOrder: 0,
      isActive: true,
    },
  });

  // Set next available position when creating new subcategory
  useEffect(() => {
    if (!isEditing && allSubcategories.length > 0) {
      form.setValue('sortOrder', getNextPosition());
    }
  }, [allSubcategories, isEditing, form]);

  // Translation function
  const translateText = async (text: string, targetLang: string) => {
    if (!text.trim()) return '';
    
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          fromLang: 'de',
          toLang: targetLang
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status}`);
      }
      
      const data = await response.json();
      return data.translatedText || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  };

  // Handle automatic translation with delay
  const handleTranslation = async (germanText: string, field: 'name' | 'description') => {
    if (!germanText.trim() || isEditing) return;
    
    // Clear existing timeout
    if (translationTimeout) {
      clearTimeout(translationTimeout);
    }
    
    // Set new timeout for translation
    const timeout = setTimeout(async () => {
      setIsTranslating(true);
      try {
        const [spanishText, englishText] = await Promise.all([
          translateText(germanText, 'es'),
          translateText(germanText, 'en')
        ]);
        
        if (field === 'name') {
          form.setValue('nameEs', spanishText);
          form.setValue('nameEn', englishText);
        } else {
          form.setValue('descriptionEs', spanishText);
          form.setValue('descriptionEn', englishText);
        }
        
        toast({
          title: "Übersetzung abgeschlossen",
          description: `${field === 'name' ? 'Name' : 'Beschreibung'} wurde automatisch übersetzt`,
        });
      } catch (error) {
        console.error('Translation failed:', error);
      } finally {
        setIsTranslating(false);
      }
    }, 1000);
    
    setTranslationTimeout(timeout);
  };

  // Update form when subcategory data is loaded
  useEffect(() => {
    if (subcategory && isEditing) {
      form.reset({
        categoryId: subcategory.categoryId,
        name: subcategory.name || '',
        nameEs: subcategory.nameEs || '',
        nameDe: subcategory.nameDe || '',
        nameEn: subcategory.nameEn || '',
        description: subcategory.description || '',
        descriptionEs: subcategory.descriptionEs || '',
        descriptionDe: subcategory.descriptionDe || '',
        descriptionEn: subcategory.descriptionEn || '',
        slug: subcategory.slug || '',
        sortOrder: subcategory.sortOrder || 0,
        isActive: subcategory.isActive,
      });
    }
  }, [subcategory, isEditing, form]);

  const mutation = useMutation({
    mutationFn: async (data: SubcategoryForm) => {
      const url = isEditing 
        ? `/api/admin/subcategories/${subcategoryId}`
        : '/api/admin/subcategories';
      const method = isEditing ? 'PUT' : 'POST';
      
      await apiRequest(url, {
        method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subcategories'] });
      toast({
        title: isEditing ? "Unterkategorie aktualisiert" : "Unterkategorie erstellt",
        description: "Die Unterkategorie wurde erfolgreich gespeichert.",
      });
      setLocation('/admin');
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Ein Fehler ist aufgetreten.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SubcategoryForm) => {
    console.log('🚀 SUBMIT DATA:', data);
    
    // Generate slug if not provided
    if (!data.slug) {
      const nameForSlug = data.nameEs || data.nameDe || data.nameEn || data.name || 'unterkategorie';
      data.slug = nameForSlug.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    
    // Ensure categoryId is set
    if (!data.categoryId || data.categoryId === 0) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie eine Kategorie aus.",
        variant: "destructive",
      });
      return;
    }
    
    // Ensure German name is set
    if (!data.nameDe || data.nameDe.trim() === '') {
      toast({
        title: "Fehler", 
        description: "Deutscher Name ist erforderlich.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('🚀 FINAL SUBMIT DATA:', data);
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setLocation('/admin')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Admin-Panel
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Unterkategorie bearbeiten' : 'Neue Unterkategorie'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'Bearbeiten Sie die Unterkategorie-Details' : 'Erstellen Sie eine neue Unterkategorie'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Unterkategorie-Details</CardTitle>
            <CardDescription>
              Geben Sie die Details für die Unterkategorie in allen Sprachen ein
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategorie</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Wählen Sie eine Kategorie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.nameEs}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* German Title First */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nameDe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold">Name (Deutsch) <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              placeholder="z.B. Solarmodule" 
                              {...field}
                              className="text-lg p-3 border-2 border-gray-300 focus:border-blue-500"
                              onChange={(e) => {
                                field.onChange(e);
                                handleTranslation(e.target.value, 'name');
                              }}
                            />
                            {isTranslating && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <div className="text-xs text-gray-500">
                          Wird automatisch in Spanisch und Englisch übersetzt
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Auto-translated fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <FormField
                      control={form.control}
                      name="nameEs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-600">→ Name (Spanisch)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Wird automatisch übersetzt..." 
                              {...field} 
                              className="bg-gray-100 border-gray-200"
                              readOnly 
                            />
                          </FormControl>
                          <div className="text-xs text-gray-500">
                            Automatisch übersetzt
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nameEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-600">→ Name (Englisch)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Wird automatisch übersetzt..." 
                              {...field} 
                              className="bg-gray-100 border-gray-200"
                              readOnly 
                            />
                          </FormControl>
                          <div className="text-xs text-gray-500">
                            Automatisch übersetzt
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="descriptionDe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beschreibung (Deutsch)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Textarea
                              placeholder="Beschreibung der Unterkategorie..."
                              className="min-h-[100px]"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                handleTranslation(e.target.value, 'description');
                              }}
                            />
                            {isTranslating && (
                              <div className="absolute right-3 top-3">
                                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <div className="text-xs text-gray-500">
                          Wird automatisch übersetzt
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="descriptionEs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beschreibung (Spanisch)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descripción de la subcategoría..."
                            className="min-h-[100px]"
                            {...field}
                            readOnly
                          />
                        </FormControl>
                        <div className="text-xs text-gray-500">
                          Automatisch übersetzt
                        </div>
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
                          <Textarea
                            placeholder="Subcategory description..."
                            className="min-h-[100px]"
                            {...field}
                            readOnly
                          />
                        </FormControl>
                        <div className="text-xs text-gray-500">
                          Automatisch übersetzt
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position/Reihenfolge</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Input 
                              type="number" 
                              placeholder="0" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                            <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                              💡 <strong>Positionierung:</strong> Niedrige Zahlen erscheinen zuerst (1, 2, 3, etc.)<br/>
                              {!isEditing && (
                                <>Empfohlen: <strong>{getNextPosition()}</strong> (nächste verfügbare Position)</>
                              )}
                              {isEditing && (
                                <>Aktuell: <strong>{field.value}</strong> - ändern Sie die Zahl für neue Position</>
                              )}
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Aktiv</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Unterkategorie auf der Website anzeigen
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

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/admin')}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending
                      ? 'Speichern...'
                      : isEditing
                      ? 'Unterkategorie aktualisieren'
                      : 'Unterkategorie erstellen'
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}