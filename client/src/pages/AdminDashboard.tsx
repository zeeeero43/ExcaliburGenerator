import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, getQueryFn } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { Plus, Package, Grid3X3, MessageSquare, LogOut, Edit, Trash2, Eye, BarChart, Image, Languages } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Category, Product, Inquiry, AdminUser } from '@shared/schema';

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
  const [adminLanguage, setAdminLanguage] = useState(() => 
    localStorage.getItem('admin-language') || 'de'
  );

  const handleLanguageChange = (lang: string) => {
    setAdminLanguage(lang);
    localStorage.setItem('admin-language', lang);
  };

  const t = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      de: {
        dashboard: 'Excalibur Cuba Admin',
        welcome: 'Willkommen',
        analytics: 'Analytics',
        websiteImages: 'Website-Bilder',
        viewWebsite: 'Website ansehen',
        logout: 'Abmelden',
        categories: 'Kategorien',
        activeCategories: 'Aktive Kategorien',
        products: 'Produkte',
        activeProducts: 'Aktive Produkte',
        inquiries: 'Anfragen',
        newInquiries: 'Neue Anfragen',
        settings: 'Einstellungen',
        systemSettings: 'System-Einstellungen',
        recentProducts: 'Aktuelle Produkte',
        recentCategories: 'Aktuelle Kategorien',
        recentInquiries: 'Aktuelle Anfragen',
        addProduct: 'Produkt hinzufügen',
        addCategory: 'Kategorie hinzufügen',
        edit: 'Bearbeiten',
        delete: 'Löschen',
        view: 'Ansehen',
        name: 'Name',
        status: 'Status',
        email: 'E-Mail',
        message: 'Nachricht',
        price: 'Preis',
        category: 'Kategorie',
        active: 'Aktiv',
        inactive: 'Inaktiv',
        new: 'Neu',
        replied: 'Beantwortet',
        total: 'insgesamt',
        online: 'Online',
        systemRunning: 'System läuft',
        manageProducts: 'Produkte verwalten',
        manageCategories: 'Kategorien verwalten',
        customerInquiries: 'Kundenanfragen',
        productManagement: 'Produktverwaltung',
        productManagementDesc: 'Verwalten Sie Ihre Produkte einfach und schnell',
        categoryManagement: 'Kategorienverwaltung',
        categoryManagementDesc: 'Organisieren Sie Ihre Produktkategorien',
        inquiryManagement: 'Anfragenverwaltung',
        inquiryManagementDesc: 'Bearbeiten Sie Kundenanfragen',
        noProductsAvailable: 'Keine Produkte verfügbar',
        noCategoriesAvailable: 'Keine Kategorien verfügbar',
        noInquiriesAvailable: 'Keine Anfragen verfügbar',
        image: 'Bild',
        stockStatus: 'Lagerbestand',
        availability: 'Verfügbarkeit',
        createdAt: 'Erstellt am',
        actions: 'Aktionen'
      },
      es: {
        dashboard: 'Admin Excalibur Cuba',
        welcome: 'Bienvenido',
        analytics: 'Análisis',
        websiteImages: 'Imágenes del Sitio',
        viewWebsite: 'Ver Sitio Web',
        logout: 'Cerrar Sesión',
        categories: 'Categorías',
        activeCategories: 'Categorías Activas',
        products: 'Productos',
        activeProducts: 'Productos Activos',
        inquiries: 'Consultas',
        newInquiries: 'Consultas Nuevas',
        settings: 'Configuración',
        systemSettings: 'Configuración del Sistema',
        recentProducts: 'Productos Recientes',
        recentCategories: 'Categorías Recientes',
        recentInquiries: 'Consultas Recientes',
        addProduct: 'Agregar Producto',
        addCategory: 'Agregar Categoría',
        edit: 'Editar',
        delete: 'Eliminar',
        view: 'Ver',
        name: 'Nombre',
        status: 'Estado',
        email: 'Correo',
        message: 'Mensaje',
        price: 'Precio',
        category: 'Categoría',
        active: 'Activo',
        inactive: 'Inactivo',
        new: 'Nuevo',
        replied: 'Respondido',
        total: 'total',
        online: 'En Línea',
        systemRunning: 'Sistema funcionando',
        manageProducts: 'Gestionar Productos',
        manageCategories: 'Gestionar Categorías',
        customerInquiries: 'Consultas de Clientes',
        productManagement: 'Gestión de Productos',
        productManagementDesc: 'Gestione sus productos de forma fácil y rápida',
        categoryManagement: 'Gestión de Categorías',
        categoryManagementDesc: 'Organice sus categorías de productos',
        inquiryManagement: 'Gestión de Consultas',
        inquiryManagementDesc: 'Procese consultas de clientes',
        noProductsAvailable: 'No hay productos disponibles',
        noCategoriesAvailable: 'No hay categorías disponibles',
        noInquiriesAvailable: 'No hay consultas disponibles',
        image: 'Imagen',
        stockStatus: 'Estado de Stock',
        availability: 'Disponibilidad',
        createdAt: 'Creado el',
        actions: 'Acciones'
      }
    };
    
    return translations[adminLanguage]?.[key] || translations.de[key] || key;
  };

  // Fetch data
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/admin/categories'],
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('dashboard')}</h1>
              <p className="text-sm text-gray-600">{t('welcome')}, {(user as AdminUser)?.firstName || (user as AdminUser)?.username || 'Admin'}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={adminLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-auto min-w-[140px]">
                  <div className="flex items-center gap-2">
                    <Languages className="w-4 h-4" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setLocation('/admin/analytics')}
              >
                <BarChart className="w-4 h-4 mr-2" />
                {t('analytics')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation('/admin/site-images')}
              >
                <Image className="w-4 h-4 mr-2" />
                {t('websiteImages')}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('/', '_blank')}
              >
                <Eye className="w-4 h-4 mr-2" />
                {t('viewWebsite')}
              </Button>
              <Button
                variant="outline"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t('logout')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('categories')}</CardTitle>
              <Grid3X3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">{t('activeCategories')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('products')}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProducts}</div>
              <p className="text-xs text-muted-foreground">{totalProducts} {t('total')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('newInquiries')}</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingInquiries}</div>
              <p className="text-xs text-muted-foreground">{inquiries.length} {t('total')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('status')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{t('online')}</div>
              <p className="text-xs text-muted-foreground">{t('systemRunning')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products">{t('manageProducts')}</TabsTrigger>
            <TabsTrigger value="categories">{t('manageCategories')}</TabsTrigger>
            <TabsTrigger value="inquiries">{t('customerInquiries')}</TabsTrigger>
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
                  {products.map((product: Product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <img
                          src={product.mainImage || '/placeholder-product.jpg'}
                          alt={product.nameEs}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div>
                          <h3 className="font-medium">{product.nameEs}</h3>
                          <p className="text-sm text-gray-600">{product.shortDescriptionEs}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={product.isActive ? "default" : "secondary"}>
                              {product.isActive ? "Aktiv" : "Inaktiv"}
                            </Badge>
                            {product.isFeatured && (
                              <Badge variant="outline">Empfohlen</Badge>
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
                  ))}
                  
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
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <CardTitle className="text-base">{category.nameEs}</CardTitle>
                        <CardDescription className="text-sm">
                          {category.descriptionEs}
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