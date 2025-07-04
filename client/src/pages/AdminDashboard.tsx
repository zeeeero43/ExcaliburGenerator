import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, getQueryFn } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { Plus, Package, Grid3X3, MessageSquare, LogOut, Edit, Trash2, Eye } from 'lucide-react';
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
              <h1 className="text-2xl font-bold text-gray-900">Excalibur Cuba Admin</h1>
              <p className="text-sm text-gray-600">Willkommen, {(user as AdminUser)?.firstName || (user as AdminUser)?.username || 'Admin'}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => window.open('/', '_blank')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Website ansehen
              </Button>
              <Button
                variant="outline"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Abmelden
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products">Produkte verwalten</TabsTrigger>
            <TabsTrigger value="categories">Kategorien verwalten</TabsTrigger>
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
                            // Delete functionality would go here
                            toast({
                              title: "Funktion in Entwicklung",
                              description: "Löschfunktion wird bald verfügbar sein.",
                            });
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
              <Button onClick={() => setLocation('/admin/categories/new')}>
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
                          <Badge variant={inquiry.status === 'new' ? 'default' : 'secondary'}>
                            {inquiry.status === 'new' ? 'Neu' : 'Bearbeitet'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{inquiry.email}</p>
                        <p className="text-sm">{inquiry.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(inquiry.createdAt!).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Mark as read functionality
                          toast({
                            title: "Funktion in Entwicklung",
                            description: "Bearbeitungsfunktion wird bald verfügbar sein.",
                          });
                        }}
                      >
                        Bearbeiten
                      </Button>
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