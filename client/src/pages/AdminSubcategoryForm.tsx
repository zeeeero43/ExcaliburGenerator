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
import { ArrowLeft } from 'lucide-react';
import type { Category, Subcategory } from '@shared/schema';

const subcategoryFormSchema = z.object({
  categoryId: z.number().min(1, "Kategorie ist erforderlich"),
  name: z.string().min(1, "Name ist erforderlich"),
  nameEs: z.string().min(1, "Spanischer Name ist erforderlich"),
  nameDe: z.string().min(1, "Deutscher Name ist erforderlich"),
  nameEn: z.string().min(1, "Englischer Name ist erforderlich"),
  description: z.string().optional(),
  descriptionEs: z.string().optional(),
  descriptionDe: z.string().optional(),
  descriptionEn: z.string().optional(),
  slug: z.string().optional(),
  sortOrder: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

type SubcategoryForm = z.infer<typeof subcategoryFormSchema>;

export default function AdminSubcategoryForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null);

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
    // Generate slug if not provided
    if (!data.slug) {
      data.slug = data.nameEs.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="nameEs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name (Spanisch)</FormLabel>
                        <FormControl>
                          <Input placeholder="z.B. Paneles Solares" {...field} />
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
                        <FormLabel>Name (Deutsch)</FormLabel>
                        <FormControl>
                          <Input placeholder="z.B. Solarmodule" {...field} />
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
                        <FormLabel>Name (Englisch)</FormLabel>
                        <FormControl>
                          <Input placeholder="z.B. Solar Panels" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug (URL)</FormLabel>
                        <FormControl>
                          <Input placeholder="wird automatisch generiert" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="descriptionEs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beschreibung (Spanisch)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Beschreibung der Unterkategorie..."
                            className="min-h-[100px]"
                            {...field}
                          />
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
                            placeholder="Beschreibung der Unterkategorie..."
                            className="min-h-[100px]"
                            {...field}
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
                        <FormLabel>Beschreibung (Englisch)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Subcategory description..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
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