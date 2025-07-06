import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import type { Category, Product, Inquiry, AdminUser } from '@shared/schema';

// Simple authentication hook
function useAdminAuth() {
  const [, setLocation] = useLocation();
  
  const { data: user, isLoading, error } = useQuery<AdminUser>({
    queryKey: ['/api/admin/user'],
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !user && error) {
      setLocation('/admin/login');
    }
  }, [user, isLoading, error, setLocation]);

  return { user, isLoading, isAuthenticated: !!user };
}

export default function SimpleAdminDashboard() {
  const { user, isLoading, isAuthenticated } = useAdminAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

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
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Lade Admin-Panel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const pendingInquiries = inquiries.filter((inquiry: Inquiry) => inquiry.status === 'new').length;
  const activeProducts = products.filter((product: Product) => product.isActive).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Willkommen, {user?.username || 'Admin'}!</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.open('/', '_blank')}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Website ansehen
              </button>
              <button
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {logoutMutation.isPending ? 'Abmelden...' : 'Abmelden'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Kategorien</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Aktive Produkte</p>
                <p className="text-2xl font-bold text-gray-900">{activeProducts}</p>
                <p className="text-xs text-gray-500">{products.length} gesamt</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Neue Anfragen</p>
                <p className="text-2xl font-bold text-gray-900">{pendingInquiries}</p>
                <p className="text-xs text-gray-500">{inquiries.length} gesamt</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-2xl font-bold text-green-600">Online</p>
                <p className="text-xs text-gray-500">System läuft</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Übersicht
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'products'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Produkte
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'categories'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Kategorien
            </button>
            <button
              onClick={() => setActiveTab('inquiries')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'inquiries'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Anfragen
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Willkommen im Admin-Panel</h2>
              <p className="text-gray-600 mb-4">
                Hier können Sie Ihre Website verwalten. Verwenden Sie die Tabs oben, um zwischen den verschiedenen Bereichen zu wechseln.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setLocation('/admin/products/new')}
                  className="p-4 border border-gray-200 rounded-lg text-left hover:bg-gray-50"
                >
                  <h3 className="font-medium text-gray-900">Neues Produkt hinzufügen</h3>
                  <p className="text-sm text-gray-600">Fügen Sie ein neues Produkt zu Ihrem Katalog hinzu</p>
                </button>
                <button
                  onClick={() => setLocation('/admin/categories/new')}
                  className="p-4 border border-gray-200 rounded-lg text-left hover:bg-gray-50"
                >
                  <h3 className="font-medium text-gray-900">Neue Kategorie erstellen</h3>
                  <p className="text-sm text-gray-600">Organisieren Sie Ihre Produkte in Kategorien</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Produktverwaltung</h2>
              <button
                onClick={() => setLocation('/admin/products/new')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Neues Produkt
              </button>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium">Aktuelle Produkte</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {products.map((product: Product) => (
                  <div key={product.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={product.mainImage || '/placeholder-product.jpg'}
                        alt={product.nameEs}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">{product.nameEs}</h4>
                        <p className="text-sm text-gray-600">{product.shortDescriptionEs}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded ${
                          product.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.isActive ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setLocation(`/admin/products/${product.id}/edit`)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Bearbeiten
                      </button>
                    </div>
                  </div>
                ))}
                {products.length === 0 && (
                  <div className="px-6 py-8 text-center text-gray-500">
                    Keine Produkte vorhanden. Erstellen Sie Ihr erstes Produkt!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Kategorienverwaltung</h2>
              <button
                onClick={() => setLocation('/admin/categories/new')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Neue Kategorie
              </button>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium">Aktuelle Kategorien</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {categories.map((category: Category) => (
                  <div key={category.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={category.image || '/placeholder-category.jpg'}
                        alt={category.nameEs}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">{category.nameEs}</h4>
                        <p className="text-sm text-gray-600">{category.descriptionEs}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setLocation(`/admin/categories/${category.id}/edit`)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Bearbeiten
                      </button>
                    </div>
                  </div>
                ))}
                {categories.length === 0 && (
                  <div className="px-6 py-8 text-center text-gray-500">
                    Keine Kategorien vorhanden. Erstellen Sie Ihre erste Kategorie!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inquiries' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Kundenanfragen</h2>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium">Anfragen</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {inquiries.map((inquiry: Inquiry) => (
                  <div key={inquiry.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{inquiry.name}</h4>
                        <p className="text-sm text-gray-600">{inquiry.email}</p>
                        <p className="text-sm text-gray-800 mt-2">{inquiry.message}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 text-xs rounded ${
                          inquiry.status === 'new' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : inquiry.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {inquiry.status === 'new' ? 'Neu' : 
                           inquiry.status === 'in_progress' ? 'In Bearbeitung' : 'Abgeschlossen'}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(inquiry.createdAt).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {inquiries.length === 0 && (
                  <div className="px-6 py-8 text-center text-gray-500">
                    Keine Anfragen vorhanden.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}