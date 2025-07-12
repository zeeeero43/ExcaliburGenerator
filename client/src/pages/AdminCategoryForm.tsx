import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { insertCategorySchema, type Category } from '@shared/schema';
import { ImageUpload } from '@/components/ImageUpload';
import { translateProductData } from '@/lib/translation';

// Form validation schema
const categoryFormSchema = z.object({
  name: z.string().min(1, 'System-Name ist erforderlich'),
  nameEs: z.string().optional(),
  nameEn: z.string().optional(),
  nameDe: z.string().min(1, 'Deutscher Name ist erforderlich'),
  description: z.string().optional(),
  descriptionEs: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionDe: z.string().optional(),
  slug: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

type CategoryForm = z.infer<typeof categoryFormSchema>;

export default function AdminCategoryForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debounced translation
  const debounceTranslation = (() => {
    let timeout: NodeJS.Timeout;
    return (germanValue: string, fieldType: 'name' | 'description') => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        if (germanValue.trim()) {
          try {
            const { spanish, english } = await translateProductData({
              name: fieldType === 'name' ? germanValue : '',
              shortDescription: fieldType === 'description' ? germanValue : '',
              description: ''
            });
            
            if (fieldType === 'name') {
              if (spanish.name && spanish.name.trim()) form.setValue('nameEs', spanish.name);
              if (english.name && english.name.trim()) form.setValue('nameEn', english.name);
            } else if (fieldType === 'description') {
              if (spanish.shortDescription && spanish.shortDescription.trim()) form.setValue('descriptionEs', spanish.shortDescription);
              if (english.shortDescription && english.shortDescription.trim()) form.setValue('descriptionEn', english.shortDescription);
            }
          } catch (error) {
            console.error('Translation failed:', error);
          }
        }
      }, 1000);
    };
  })();
  
  // Get category ID from URL path
  const pathParts = window.location.pathname.split('/');
  const isEdit = window.location.pathname.includes('/edit');
  const categoryId = isEdit ? pathParts[pathParts.length - 2] : null;

  // Fetch existing category data for editing
  const { data: category, isLoading: isLoadingCategory } = useQuery<Category>({
    queryKey: [`/api/admin/categories/${categoryId}`],
    enabled: isEdit && !!categoryId,
  });

  // Form setup
  const form = useForm<CategoryForm>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      nameEs: '',
      nameEn: '',
      nameDe: '',
      description: '',
      descriptionEs: '',
      descriptionEn: '',
      descriptionDe: '',
      slug: '',
      image: '',
      isActive: true,
      sortOrder: 0,
    },
  });

  // Update form when category data loads
  useEffect(() => {
    if (category && isEdit) {
      form.reset({
        name: category.name,
        nameEs: category.nameEs || '',
        nameEn: category.nameEn || '',
        nameDe: category.nameDe || '',
        description: category.description || '',
        descriptionEs: category.descriptionEs || '',
        descriptionEn: category.descriptionEn || '',
        descriptionDe: category.descriptionDe || '',
        slug: category.slug || '',
        image: category.image || '',
        isActive: category.isActive ?? true,
        sortOrder: category.sortOrder ?? 0,
      });
    }
  }, [category, isEdit, form]);

  // Create/Update mutation
  const saveCategoryMutation = useMutation({
    mutationFn: async (data: CategoryForm) => {
      const url = isEdit ? `/api/admin/categories/${categoryId}` : '/api/admin/categories';
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Erfolg",
        description: isEdit ? "Kategorie wurde aktualisiert" : "Kategorie wurde erstellt",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
      setLocation('/admin');
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Speichern der Kategorie",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Delete failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Erfolg",
        description: "Kategorie wurde gelöscht",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
      setLocation('/admin');
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Löschen der Kategorie",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CategoryForm) => {
    saveCategoryMutation.mutate(data);
  };

  const handleDelete = () => {
    if (window.confirm('Sind Sie sicher, dass Sie diese Kategorie löschen möchten?')) {
      deleteCategoryMutation.mutate();
    }
  };

  if (isLoadingCategory) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Laden...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => setLocation('/admin')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </Button>
          <h1 className="text-3xl font-bold">
            {isEdit ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Kategorie-Informationen</CardTitle>
            <CardDescription>
              Nur deutsche Eingabe erforderlich - automatische Übersetzung zu Spanisch/Englisch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* German Input Fields */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Deutsche Eingabe (Pflichtfelder)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nameDe"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-800 font-bold">1. Kategorie Name (Deutsch) - PFLICHTFELD</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="z.B. Solaranlagen" 
                              {...field}
                              className="border-gray-300 focus:border-gray-600"
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
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>System Name (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="system-name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="descriptionDe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-800 font-bold">2. Beschreibung (Deutsch) - Optional</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Kategorie Beschreibung auf Deutsch..."
                            rows={3}
                            {...field}
                            className="border-gray-300 focus:border-gray-600"
                            onChange={(e) => {
                              field.onChange(e);
                              debounceTranslation(e.target.value, 'description');
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Auto-translated Fields */}
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-600">→ Automatisch übersetzt</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nameEs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-600">Nombre (Español)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Wird automatisch übersetzt..." 
                              {...field}
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
                          <FormLabel className="text-gray-600">Name (English)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Wird automatisch übersetzt..." 
                              {...field}
                              className="bg-gray-100 border-gray-200"
                              readOnly
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="descriptionEs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-600">Descripción (Español)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Wird automatisch übersetzt..."
                              rows={3}
                              {...field}
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
                      name="descriptionEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-600">Description (English)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Wird automatisch übersetzt..."
                              rows={3}
                              {...field}
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

                {/* Category Image */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-800">📸 Kategorie-Bild</CardTitle>
                    <CardDescription className="text-blue-600">
                      Fügen Sie ein Bild für diese Kategorie hinzu. Dieses wird in der Kategorieansicht angezeigt.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Kategorie-Bild</FormLabel>
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
                                  alt="Kategorie-Bild Vorschau" 
                                  className="w-32 h-32 object-contain bg-gray-100 rounded border"
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

                {/* Sort Order */}
                <Card className="bg-green-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-green-800">📊 Reihenfolge der Kategorie</CardTitle>
                    <CardDescription className="text-green-600">
                      Bestimmen Sie die Reihenfolge mit Zahlen (1-2-3-4-5-6-7-8 etc.). Niedrigere Zahlen erscheinen zuerst.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="sortOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Reihenfolge-Nummer</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0"
                              max="999"
                              placeholder="z.B. 1 für erste Position, 2 für zweite Position..."
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                              className="w-32"
                            />
                          </FormControl>
                          <div className="text-sm text-green-600 mt-1">
                            💡 Tipp: Verwenden Sie 1 für die wichtigste Kategorie, 2 für die zweitwichtigste, etc.
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-between pt-6 border-t">
                  <div>
                    {isEdit && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleteCategoryMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Löschen
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation('/admin')}
                    >
                      Abbrechen
                    </Button>
                    <Button
                      type="submit"
                      disabled={saveCategoryMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {saveCategoryMutation.isPending ? 'Speichern...' : 'Speichern'}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}