import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Eye, Users, Globe, TrendingUp, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Link } from 'wouter';

interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  topProducts: Array<{ product: string; views: number; id: number }>;
  topCountries: Array<{ country: string; views: number }>;
  viewsByPeriod: Array<{ period: string; views: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

function useAdminAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/admin/user'],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}

export default function AdminAnalytics() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'month' | 'year'>('month');

  const { data: analytics, isLoading: analyticsLoading, refetch } = useQuery<AnalyticsData>({
    queryKey: ['/api/admin/analytics', selectedPeriod],
    enabled: isAuthenticated,
    refetchInterval: 60000, // Aktualisierung alle 60 Sekunden
    refetchOnWindowFocus: true, // Aktualisierung beim Fensterfokus
  });

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Lade...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Nicht autorisiert</h1>
          <p className="text-gray-600">Bitte loggen Sie sich ein, um auf die Analytics zuzugreifen.</p>
        </div>
      </div>
    );
  }

  const handlePeriodChange = (value: string) => {
    const period = value as 'day' | 'month' | 'year';
    setSelectedPeriod(period);
    refetch();
  };

  if (analyticsLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Website Analytics</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Analytics-Daten...</div>
        </div>
      </div>
    );
  }

  const getCountryName = (code: string) => {
    const countries: { [key: string]: string } = {
      'CU': 'Kuba',
      'DE': 'Deutschland',
      'US': 'USA',
      'ES': 'Spanien',
      'MX': 'Mexiko',
      'FR': 'Frankreich',
      'IT': 'Italien',
      'GB': 'Großbritannien',
      'CA': 'Kanada',
      'BR': 'Brasilien'
    };
    return countries[code] || code;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Zurück zum Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Website Analytics</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={analyticsLoading}
            className="flex items-center gap-2"
          >
            🔄 Aktualisieren
          </Button>
          <Tabs value={selectedPeriod} onValueChange={handlePeriodChange}>
            <TabsList>
              <TabsTrigger value="day">24 Stunden</TabsTrigger>
              <TabsTrigger value="month">Diesen Monat</TabsTrigger>
              <TabsTrigger value="year">Dieses Jahr</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 text-blue-800">
          <span className="text-lg">ℹ️</span>
          <h3 className="font-medium">Analytics-Information</h3>
        </div>
        <p className="text-blue-700 mt-2 text-sm">
          Analytics werden in Echtzeit verfolgt und zeigen echte Besucherdaten an. 
          Daten werden automatisch alle 60 Sekunden aktualisiert. 
          Die Statistiken umfassen nur tatsächliche Besucher Ihrer Website.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tatsächliche Besucher</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.uniqueVisitors || 0}</div>
            <p className="text-xs text-muted-foreground">
              Einzigartige Besucher basierend auf IP-Adressen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top-Länder</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.topCountries.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Verschiedene Länder besucht
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beliebte Produkte</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.topProducts.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Verschiedene Produkte besucht
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Page Views Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Besucher über Zeit</CardTitle>
            <CardDescription>
              Besucher im {selectedPeriod === 'day' ? 'Tagesverlauf' : selectedPeriod === 'month' ? 'Monatsverlauf' : 'Jahresverlauf'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.viewsByPeriod || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Countries Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Besucher nach Ländern</CardTitle>
            <CardDescription>Verteilung der {analytics?.uniqueVisitors || 0} einzigartigen Besucher nach Ländern</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics?.topCountries.map(country => ({
                    ...country,
                    name: getCountryName(country.country)
                  })) || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="views"
                >
                  {analytics?.topCountries.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Meistgesehene Produkte</CardTitle>
            <CardDescription>Die meistbesuchten Produkte Ihrer Website</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.topProducts.slice(0, 8).map((product, index) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <span className="font-medium">
                      {product.product}
                    </span>
                  </div>
                  <Badge variant="secondary">
                    {product.views} Aufrufe
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Country Details */}
        <Card>
          <CardHeader>
            <CardTitle>Länder-Details</CardTitle>
            <CardDescription>Verteilung der {analytics?.uniqueVisitors || 0} Besucher nach Ländern</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.topCountries.slice(0, 8).map((country, index) => (
                <div key={country.country} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <span className="font-medium">
                      {getCountryName(country.country)}
                    </span>
                    <span className="text-xs text-gray-500">({country.country})</span>
                  </div>
                  <Badge variant="secondary">
                    {country.views} Besucher
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}