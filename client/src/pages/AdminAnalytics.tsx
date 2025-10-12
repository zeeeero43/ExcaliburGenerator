import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Eye, MousePointerClick, TrendingUp, Globe, Smartphone, Clock, RotateCw } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

type TimeRange = '1' | '7' | '30';

interface AnalyticsOverview {
  totalVisitors: number;
  totalSessions: number;
  pageViews: number;
  bounceRate: number;
  avgSessionDuration: number;
  newUsers: number;
  returningUsers: number;
}

interface TopPage {
  pagePath: string;
  pageTitle: string;
  pageViews: number;
  uniqueVisitors: number;
}

interface CountryStat {
  country: string;
  visitors: number;
  sessions: number;
  percentage: number;
}

interface DeviceStat {
  deviceCategory: string;
  visitors: number;
  sessions: number;
  percentage: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: overview, refetch: refetchOverview } = useQuery<AnalyticsOverview>({
    queryKey: [`/api/admin/analytics/overview?days=${timeRange}`],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const { data: topPages } = useQuery<TopPage[]>({
    queryKey: [`/api/admin/analytics/top-pages?days=${timeRange}`],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const { data: countries } = useQuery<CountryStat[]>({
    queryKey: [`/api/admin/analytics/countries?days=${timeRange}`],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const { data: devices } = useQuery<DeviceStat[]>({
    queryKey: [`/api/admin/analytics/devices?days=${timeRange}`],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const { data: trend } = useQuery<Array<{ date: string; visitors: number; sessions: number }>>({
    queryKey: [`/api/admin/analytics/trend?days=${timeRange}`],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatChartDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      // Date format: YYYYMMDD
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      const date = parseISO(`${year}-${month}-${day}`);
      return format(date, 'dd.MM', { locale: de });
    } catch {
      return dateString;
    }
  };

  const chartData = trend?.map(item => ({
    date: formatChartDate(item.date),
    Besucher: item.visitors,
    Sessions: item.sessions,
  })) || [];

  const deviceChartData = devices?.map(device => ({
    name: device.deviceCategory === 'desktop' ? 'Desktop' : 
          device.deviceCategory === 'mobile' ? 'Mobile' : 
          device.deviceCategory === 'tablet' ? 'Tablet' : device.deviceCategory,
    value: device.visitors,
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Google Analytics Echtzeit-Daten</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <Button
              variant={timeRange === '1' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('1')}
            >
              24 Stunden
            </Button>
            <Button
              variant={timeRange === '7' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('7')}
            >
              7 Tage
            </Button>
            <Button
              variant={timeRange === '30' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('30')}
            >
              30 Tage
            </Button>
          </div>
          
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RotateCw className="w-4 h-4 mr-2" />
            Auto-Refresh {autoRefresh ? 'AN' : 'AUS'}
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Besucher</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.totalVisitors.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overview?.newUsers || 0} neu, {overview?.returningUsers || 0} wiederkehrend
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessions</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.totalSessions.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ø {overview?.totalSessions && overview?.totalVisitors 
                  ? (overview.totalSessions / overview.totalVisitors).toFixed(1) 
                  : 0} pro Besucher
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Seitenaufrufe</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.pageViews.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ø {overview?.pageViews && overview?.totalSessions 
                  ? (overview.pageViews / overview.totalSessions).toFixed(1) 
                  : 0} pro Session
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ø Sitzungsdauer</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overview?.avgSessionDuration ? formatDuration(overview.avgSessionDuration) : '0:00'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Absprungrate: {overview?.bounceRate ? (overview.bounceRate * 100).toFixed(1) : 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Visitors Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Besuchertrend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Besucher" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="Sessions" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Device Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Geräte-Verteilung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deviceChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deviceChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Top Seiten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPages?.slice(0, 5).map((page, idx) => (
                  <div key={idx} className="flex items-start gap-3 pb-3 border-b">
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="font-medium text-sm truncate" title={page.pageTitle}>
                        {page.pageTitle}
                      </div>
                      <div className="text-xs text-gray-500 truncate" title={page.pagePath}>
                        {page.pagePath}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-blue-600">{page.pageViews}</div>
                      <div className="text-xs text-gray-500 whitespace-nowrap">{page.uniqueVisitors} Besucher</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Countries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Top Länder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {countries?.slice(0, 5).map((country, idx) => (
                  <div key={idx} className="flex items-center justify-between pb-3 border-b">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="font-medium">{country.country}</div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-bold text-blue-600">{country.visitors}</div>
                      <div className="text-xs text-gray-500">{country.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
