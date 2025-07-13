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
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react';
import type { Category, Subcategory } from '@shared/schema';
import { ImageUpload } from '@/components/ImageUpload';

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
  image: z.string().optional(),
  slug: z.string().optional(),
  sortOrder: z.coerce.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

type SubcategoryForm = z.infer<typeof subcategoryFormSchema>;

export default function AdminSubcategoryForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationTimeout, setTranslationTimeout] = useState<NodeJS.Timeout | null>(null);

  // Get subcategory ID from URL path (same logic as category)
  const pathParts = window.location.pathname.split('/');
  const isEdit = window.location.pathname.includes('/edit');
  const subcategoryId = isEdit ? pathParts[pathParts.length - 2] : null;

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/admin/categories'],
  });

  // Fetch existing subcategories to suggest next position
  const { data: allSubcategories = [] } = useQuery<Subcategory[]>({
    queryKey: ['/api/admin/subcategories'],
  });

  // Fetch existing subcategory data for editing
  const { data: subcategory, isLoading: isLoadingSubcategory } = useQuery<Subcategory>({
    queryKey: [`/api/admin/subcategories/${subcategoryId}`],
    enabled: isEdit && !!subcategoryId,
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
      image: '',
      slug: '',
      sortOrder: 0,
      isActive: true,
    },
  });

  // Set next available position when creating new subcategory
  useEffect(() => {
    if (!isEdit && allSubcategories.length > 0) {
      form.setValue('sortOrder', getNextPosition());
    }
  }, [allSubcategories, isEdit, form]);

  // Update form when subcategory data loads (same logic as category)
  useEffect(() => {
    if (subcategory && isEdit) {
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
        image: subcategory.image || '',
        slug: subcategory.slug || '',
        sortOrder: subcategory.sortOrder ?? 0,
        isActive: subcategory.isActive ?? true,
      });
    }
  }, [subcategory, isEdit, form]);

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
    if (!germanText.trim() || isEdit) return;
    
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
        } else if (field === 'description') {
          form.setValue('descriptionEs', spanishText);
          form.setValue('descriptionEn', englishText);
        }
      } catch (error) {
        console.error('Translation error:', error);
      } finally {
        setIsTranslating(false);
      }
    }, 1000);
    
    setTranslationTimeout(timeout);
  };

  // Create/Update mutation
  const saveSubcategoryMutation = useMutation({
    mutationFn: async (data: SubcategoryForm) => {
      const url = isEdit ? `/api/admin/subcategories/${subcategoryId}` : '/api/admin/subcategories';
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await apiRequest(url, {
        method,
        body: JSON.stringify(data),
      });
      
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Erfolg",
        description: isEdit ? "Unterkategorie wurde aktualisiert" : "Unterkategorie wurde erstellt",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subcategories'] });
      setLocation('/admin/subcategories');
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteSubcategoryMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/admin/subcategories/${subcategoryId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Erfolg",
        description: "Unterkategorie wurde gelöscht",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subcategories'] });
      setLocation('/admin/subcategories');
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SubcategoryForm) => {
    saveSubcategoryMutation.mutate(data);
  };

  const onDelete = () => {
    if (window.confirm('Sind Sie sicher, dass Sie diese Unterkategorie löschen möchten?')) {
      deleteSubcategoryMutation.mutate();
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => setLocation('/admin/subcategories')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </Button>
        <h1 className="text-3xl font-bold">
          {isEdit ? 'Unterkategorie bearbeiten' : 'Neue Unterkategorie'}
        </h1>
        {isEdit && (
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={deleteSubcategoryMutation.isPending}
            className="ml-auto"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Löschen
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unterkategorie-Informationen</CardTitle>
          <CardDescription>
            Nur deutsche Eingabe erforderlich - automatische Übersetzung zu Spanisch/Englisch
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
                    <FormLabel>Kategorie auswählen *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Kategorie auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.nameDe || category.name}
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
                name="nameDe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name (Deutsch) *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="z.B. Batteriespeicher"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleTranslation(e.target.value, 'name');
                        }}
                      />
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
                    <FormLabel>Name (Spanisch)</FormLabel>
                    <FormControl>
                      <Input placeholder="Automatisch übersetzt" {...field} />
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
                    <FormLabel>Name (English)</FormLabel>
                    <FormControl>
                      <Input placeholder="Automatically translated" {...field} />
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
                      <Textarea
                        placeholder="z.B. Hochwertige Batteriespeicher für alle Solaranlagen"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleTranslation(e.target.value, 'description');
                        }}
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
                    <FormLabel>Beschreibung (Spanisch)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Automatisch übersetzt" {...field} />
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
                    <FormLabel>Description (English)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Automatically translated" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bild</FormLabel>
                    <FormControl>
                      <ImageUpload
                        onImageSelect={(url) => field.onChange(url)}
                        selectedImage={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Position (1, 2, 3, ...)"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Aktiv</FormLabel>
                      <div className="text-sm text-gray-500">
                        Unterkategorie ist aktiv und sichtbar
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

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={saveSubcategoryMutation.isPending || isTranslating}
                  className="flex items-center gap-2"
                >
                  {saveSubcategoryMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isEdit ? 'Aktualisieren' : 'Erstellen'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}