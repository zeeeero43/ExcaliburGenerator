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

// Form validation schema
const categoryFormSchema = z.object({
  name: z.string().min(1, 'System-Name ist erforderlich'),
  nameEs: z.string().min(1, 'Spanischer Name ist erforderlich'),
  nameEn: z.string().min(1, 'Englischer Name ist erforderlich'),
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
              Geben Sie die Kategorie-Informationen in allen Sprachen ein
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* German Fields */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Deutsch</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nameDe"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name (Deutsch)</FormLabel>
                          <FormControl>
                            <Input placeholder="Kategorie Name..." {...field} />
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
                          <FormLabel>System Name</FormLabel>
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
                        <FormLabel>Beschreibung (Deutsch)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Kategorie Beschreibung auf Deutsch..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Spanish Fields */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Español</h3>
                  <FormField
                    control={form.control}
                    name="nameEs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre (Español)</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre de categoría..." {...field} />
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
                        <FormLabel>Descripción (Español)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descripción de categoría en español..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* English Fields */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">English</h3>
                  <FormField
                    control={form.control}
                    name="nameEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name (English)</FormLabel>
                        <FormControl>
                          <Input placeholder="Category name..." {...field} />
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
                          <Textarea
                            placeholder="Category description in English..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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