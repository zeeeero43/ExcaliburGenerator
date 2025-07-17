import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, getQueryFn } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { Plus, Package, Grid3X3, MessageSquare, LogOut, Edit, Trash2, Eye, BarChart, Image, Languages, FileImage, Phone, Layers, Copy } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Category, Product, Inquiry, AdminUser, Subcategory } from '@shared/schema';

// Check if user is authenticated
function useAdminAuth() {
  const [, setLocation] = useLocation();
  
  const { data: user, isLoading, error } = useQuery<AdminUser>({
    queryKey: ['/api/admin/user'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !user && error) {
      setLocation('/admin/login');
    }
  }, [user, isLoading, error, setLocation]);

  return { user, isLoading, isAuthenticated: !!user };
}

export default function AdminDashboard() {
  const { user, isLoading, isAuthenticated } = useAdminAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();



  // Fetch data
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/admin/categories'],
    enabled: isAuthenticated,
  });

  const { data: subcategories = [] } = useQuery<Subcategory[]>({
    queryKey: ['/api/admin/subcategories'],
    enabled: isAuthenticated,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/admin/products'],
    enabled: isAuthenticated,
  });

  const { data: inquiries = [] } = useQuery<Inquiry[]>({
    queryKey: ['/api/admin/inquiries'],
    enabled: isAuthenticated,
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Logout failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation('/admin/login');
      toast({
        title: "Erfolgreich abgemeldet",
        description: "Sie wurden sicher abgemeldet.",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete product');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate both admin and public product caches
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
      toast({
        title: "Produkt gelöscht",
        description: "Das Produkt wurde erfolgreich entfernt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler beim Löschen",
        description: "Das Produkt konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete category');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
      toast({
        title: "Kategorie gelöscht",
        description: "Die Kategorie wurde erfolgreich entfernt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler beim Löschen",
        description: "Die Kategorie konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  // Delete subcategory mutation
  const deleteSubcategoryMutation = useMutation({
    mutationFn: async (subcategoryId: number) => {
      const response = await fetch(`/api/admin/subcategories/${subcategoryId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete subcategory');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subcategories'] });
      toast({
        title: "Unterkategorie gelöscht",
        description: "Die Unterkategorie wurde erfolgreich entfernt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler beim Löschen",
        description: "Die Unterkategorie konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  // Update inquiry status mutation
  const updateInquiryMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/admin/inquiries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update inquiry');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inquiries'] });
      toast({
        title: "Anfrage aktualisiert",
        description: "Der Status wurde erfolgreich geändert.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Anfrage konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  // Delete inquiry mutation
  const deleteInquiryMutation = useMutation({
    mutationFn: async (inquiryId: number) => {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete inquiry');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inquiries'] });
      toast({
        title: "Anfrage gelöscht",
        description: "Die Anfrage wurde erfolgreich entfernt.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler beim Löschen",
        description: "Die Anfrage konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  // Duplicate product mutation
  const duplicateProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await fetch(`/api/admin/products/${productId}/duplicate`, {
        method: 'POST',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to duplicate product');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate both admin and public product caches
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
      toast({
        title: "Produkt dupliziert",
        description: "Das Produkt wurde erfolgreich dupliziert.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler beim Duplizieren",
        description: "Das Produkt konnte nicht dupliziert werden.",
        variant: "destructive",
      });
    },
  });



  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-excalibur-blue"></div>
          <p className="mt-4 text-gray-600">Lade Admin-Panel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const pendingInquiries = inquiries.filter((inquiry: Inquiry) => inquiry.status === 'new').length;
  const totalProducts = products.length;
  const activeProducts = products.filter((product: Product) => product.isActive).length;
  const totalSubcategories = subcategories.length;
  const activeSubcategories = subcategories.filter((subcategory: Subcategory) => subcategory.isActive).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-4 space-y-4 lg:space-y-0">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Willkommen, {(user as AdminUser)?.firstName || (user as AdminUser)?.username || 'Admin'}!</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex gap-2 lg:gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation('/admin/analytics')}
                  className="text-xs sm:text-sm whitespace-nowrap"
                >
                  <BarChart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Analytics</span>
                  <span className="sm:hidden">Analytics</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation('/admin/site-images')}
                  className="text-xs sm:text-sm whitespace-nowrap"
                >
                  <Image className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Website-Bilder</span>
                  <span className="sm:hidden">Website</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation('/admin/images')}
                  className="text-xs sm:text-sm whitespace-nowrap"
                >
                  <FileImage className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Bildverwaltung</span>
                  <span className="sm:hidden">Bilder</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation('/admin/contact')}
                  className="text-xs sm:text-sm whitespace-nowrap"
                >
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Kontakt</span>
                  <span className="sm:hidden">Kontakt</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('/', '_blank')}
                  className="text-xs sm:text-sm whitespace-nowrap"
                >
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Website ansehen</span>
                  <span className="sm:hidden">Seite</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  className="text-xs sm:text-sm col-span-2 sm:col-span-1 whitespace-nowrap"
                >
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Abmelden</span>
                  <span className="sm:hidden">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kategorien</CardTitle>
              <Grid3X3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">Aktive Kategorien</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unterkategorien</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSubcategories}</div>
              <p className="text-xs text-muted-foreground">{activeSubcategories} aktiv</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produkte</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProducts}</div>
              <p className="text-xs text-muted-foreground">{totalProducts} insgesamt</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Neue Anfragen</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingInquiries}</div>
              <p className="text-xs text-muted-foreground">{inquiries.length} insgesamt</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
              <p className="text-xs text-muted-foreground">System läuft</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products">Produkte verwalten</TabsTrigger>
            <TabsTrigger value="categories">Kategorien verwalten</TabsTrigger>
            <TabsTrigger value="subcategories">Unterkategorien</TabsTrigger>
            <TabsTrigger value="inquiries">Kundenanfragen</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Produktverwaltung</h2>
                <p className="text-gray-600">Verwalten Sie Ihre Produkte einfach und schnell</p>
              </div>
              <Button onClick={() => setLocation('/admin/products/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Neues Produkt
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Aktuelle Produkte</CardTitle>
                <CardDescription>
                  Übersicht über alle Ihre Produkte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products
                    .sort((a, b) => {
                      // Sort by category first, then by subcategory, then by sortOrder
                      const categoryA = categories.find(c => c.id === a.categoryId)?.nameDe || '';
                      const categoryB = categories.find(c => c.id === b.categoryId)?.nameDe || '';
                      
                      if (categoryA !== categoryB) {
                        return categoryA.localeCompare(categoryB);
                      }
                      
                      const subcategoryA = subcategories.find(s => s.id === a.subcategoryId)?.nameDe || '';
                      const subcategoryB = subcategories.find(s => s.id === b.subcategoryId)?.nameDe || '';
                      
                      if (subcategoryA !== subcategoryB) {
                        return subcategoryA.localeCompare(subcategoryB);
                      }
                      
                      // Sort by sortOrder (0 means no order, goes to end)
                      if (a.sortOrder && b.sortOrder) {
                        return a.sortOrder - b.sortOrder;
                      }
                      if (a.sortOrder && !b.sortOrder) return -1;
                      if (!a.sortOrder && b.sortOrder) return 1;
                      return 0;
                    })
                    .map((product: Product) => {
                      const category = categories.find(c => c.id === product.categoryId);
                      const subcategory = subcategories.find(s => s.id === product.subcategoryId);
                      
                      return (
                        <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <img
                              src={product.mainImage || '/placeholder-product.jpg'}
                              alt={product.nameEs}
                              className="w-24 h-24 object-contain bg-gray-100 rounded"
                            />
                            <div>
                              <h3 className="font-medium">{product.nameDe || product.nameEs}</h3>
                              <p className="text-sm text-gray-600">
                                {((product.shortDescriptionDe || product.shortDescriptionEs) || '').length > 80 
                                  ? `${((product.shortDescriptionDe || product.shortDescriptionEs) || '').substring(0, 80)}...` 
                                  : (product.shortDescriptionDe || product.shortDescriptionEs)}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant={product.isActive ? "default" : "secondary"}>
                                  {product.isActive ? "Aktiv" : "Inaktiv"}
                                </Badge>
                                {product.isFeatured && (
                                  <Badge variant="outline">Empfohlen</Badge>
                                )}
                                <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                                  {category?.nameDe || 'Keine Kategorie'}
                                </Badge>
                                {subcategory && (
                                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                    {subcategory.nameDe}
                                  </Badge>
                                )}
                                {product.sortOrder && product.sortOrder > 0 && (
                                  <Badge variant="default" className="bg-orange-600 hover:bg-orange-700">
                                    Platz: {product.sortOrder}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLocation(`/admin/products/${product.id}/edit`)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => duplicateProductMutation.mutate(product.id)}
                              disabled={duplicateProductMutation.isPending}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm('Sind Sie sicher, dass Sie dieses Produkt löschen möchten?')) {
                                  deleteProductMutation.mutate(product.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  
                  {products.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Produkte gefunden</h3>
                      <p className="text-gray-600 mb-4">Erstellen Sie Ihr erstes Produkt</p>
                      <Button onClick={() => setLocation('/admin/products/new')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Erstes Produkt erstellen
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Kategorienverwaltung</h2>
                <p className="text-gray-600">Organisieren Sie Ihre Produktkategorien</p>
              </div>
              <Button 
                onClick={() => {
                  console.log('Navigating to category form...');
                  setLocation('/admin/categories/new');
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Neue Kategorie
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category: Category) => (
                <Card key={category.id}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <img
                        src={category.image || '/placeholder-category.jpg'}
                        alt={category.nameEs}
                        className="w-20 h-20 object-contain bg-gray-100 rounded"
                      />
                      <div>
                        <CardTitle className="text-base">{category.nameDe || category.nameEs}</CardTitle>
                        <CardDescription className="text-sm">
                          {category.descriptionDe || category.descriptionEs}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <Badge variant={category.isActive ? "default" : "secondary"}>
                        {category.isActive ? "Aktiv" : "Inaktiv"}
                      </Badge>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/admin/categories/${category.id}/edit`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Sind Sie sicher, dass Sie diese Kategorie löschen möchten?')) {
                              deleteCategoryMutation.mutate(category.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Subcategories Tab */}
          <TabsContent value="subcategories" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Unterkategorien-Verwaltung</h2>
                <p className="text-gray-600">Organisieren Sie Ihre Unterkategorien mit freier Positionierung</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    // Sort subcategories by position
                    const sorted = [...subcategories].sort((a, b) => a.sortOrder - b.sortOrder);
                    console.log('Sorted subcategories:', sorted);
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Sortierung anzeigen
                </Button>
                <Button 
                  onClick={() => {
                    console.log('Navigating to subcategory form...');
                    window.location.href = '/admin/subcategories/new';
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Neue Unterkategorie
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subcategories
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((subcategory: Subcategory) => {
                  const parentCategory = categories.find(c => c.id === subcategory.categoryId);
                  return (
                    <Card key={subcategory.id} className="relative">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-sm">
                                {subcategory.sortOrder}
                              </span>
                            </div>
                            <img
                              src={subcategory.image || '/placeholder-category.jpg'}
                              alt={subcategory.nameDe || subcategory.nameEs}
                              className="w-16 h-16 object-contain bg-gray-100 rounded"
                            />
                            <div>
                              <CardTitle className="text-base">{subcategory.nameDe || subcategory.nameEs}</CardTitle>
                              <CardDescription className="text-sm">
                                {parentCategory?.nameDe || parentCategory?.nameEs || 'Keine Kategorie'}
                              </CardDescription>
                            </div>
                          </div>
                          <Layers className="w-4 h-4 text-gray-400" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-4">
                          {subcategory.descriptionDe || subcategory.descriptionEs || 'Keine Beschreibung'}
                        </p>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <Badge variant={subcategory.isActive ? "default" : "secondary"}>
                              {subcategory.isActive ? "Aktiv" : "Inaktiv"}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              Position: {subcategory.sortOrder}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLocation(`/admin/subcategories/${subcategory.id}/edit`)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm('Sind Sie sicher, dass Sie diese Unterkategorie löschen möchten?')) {
                                  deleteSubcategoryMutation.mutate(subcategory.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>

            {subcategories.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Unterkategorien gefunden</h3>
                  <p className="text-gray-600 mb-4">Erstellen Sie Ihre erste Unterkategorie zur besseren Organisation</p>
                  <Button onClick={() => window.location.href = '/admin/subcategories/new'}>
                    <Plus className="w-4 h-4 mr-2" />
                    Erste Unterkategorie erstellen
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Inquiries Tab */}
          <TabsContent value="inquiries" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Kundenanfragen</h2>
              <p className="text-gray-600">Bearbeiten Sie Kundenanfragen</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Neue Anfragen</CardTitle>
                <CardDescription>
                  {pendingInquiries} neue Anfragen warten auf Bearbeitung
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inquiries.slice(0, 10).map((inquiry: Inquiry) => (
                    <div key={inquiry.id} className="flex justify-between items-start p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium">{inquiry.name}</h3>
                          <Badge 
                            className={`${
                              inquiry.status === 'new' 
                                ? 'bg-orange-500 text-white hover:bg-orange-600' 
                                : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                          >
                            {inquiry.status === 'new' ? 'Neu' : 'Bearbeitet'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{inquiry.email}</p>
                        <p className="text-sm">{inquiry.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(inquiry.createdAt!).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            updateInquiryMutation.mutate({ 
                              id: inquiry.id, 
                              status: inquiry.status === 'new' ? 'processed' : 'new' 
                            });
                          }}
                        >
                          {inquiry.status === 'new' ? 'Als bearbeitet markieren' : 'Als neu markieren'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.open(`mailto:${inquiry.email}?subject=Re: Ihre Anfrage&body=Hallo ${inquiry.name},%0D%0A%0D%0AVielen Dank für Ihre Anfrage.%0D%0A%0D%0A${inquiry.message}%0D%0A%0D%0AMit freundlichen Grüßen%0D%0AExcalibur Cuba Team`, '_blank');
                          }}
                        >
                          E-Mail senden
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Sind Sie sicher, dass Sie diese Anfrage löschen möchten?')) {
                              deleteInquiryMutation.mutate(inquiry.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Löschen
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {inquiries.length === 0 && (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Anfragen</h3>
                      <p className="text-gray-600">Alle Anfragen wurden bearbeitet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}