import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { google } from '@google-analytics/data/build/protos/protos';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROPERTY_ID = '506069216';
const CREDENTIALS_PATH = path.join(__dirname, '../google-analytics-credentials.json');

let analyticsDataClient: BetaAnalyticsDataClient;

function getClient() {
  if (!analyticsDataClient) {
    // Check if credentials are provided via environment variable (for VPS/production)
    if (process.env.GOOGLE_ANALYTICS_CREDENTIALS) {
      try {
        const credentials = JSON.parse(process.env.GOOGLE_ANALYTICS_CREDENTIALS);
        analyticsDataClient = new BetaAnalyticsDataClient({
          credentials: credentials,
        });
        console.log('📊 Google Analytics: Using credentials from environment variable');
      } catch (error) {
        console.error('❌ Failed to parse GOOGLE_ANALYTICS_CREDENTIALS:', error);
        throw new Error('Invalid GOOGLE_ANALYTICS_CREDENTIALS format');
      }
    }
    // Otherwise, use local file (for development)
    else if (fs.existsSync(CREDENTIALS_PATH)) {
      analyticsDataClient = new BetaAnalyticsDataClient({
        keyFilename: CREDENTIALS_PATH,
      });
      console.log('📊 Google Analytics: Using credentials from local file');
    } else {
      console.error('❌ No Google Analytics credentials found!');
      throw new Error('Google Analytics credentials not configured');
    }
  }
  return analyticsDataClient;
}

export interface AnalyticsOverview {
  totalVisitors: number;
  totalSessions: number;
  pageViews: number;
  bounceRate: number;
  avgSessionDuration: number;
  newUsers: number;
  returningUsers: number;
}

export interface TopPage {
  pagePath: string;
  pageTitle: string;
  pageViews: number;
  uniqueVisitors: number;
}

export interface CountryStat {
  country: string;
  visitors: number;
  sessions: number;
  percentage: number;
}

export interface DeviceStat {
  deviceCategory: string;
  visitors: number;
  sessions: number;
  percentage: number;
}

export interface RealtimeData {
  activeUsers: number;
  screenPageViews: number;
  topPages: Array<{ pagePath: string; activeUsers: number }>;
}

export async function getAnalyticsOverview(daysAgo: number = 7): Promise<AnalyticsOverview> {
  const client = getClient();
  
  const [response] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [
      {
        startDate: `${daysAgo}daysAgo`,
        endDate: 'today',
      },
    ],
    metrics: [
      { name: 'activeUsers' },
      { name: 'sessions' },
      { name: 'screenPageViews' },
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' },
      { name: 'newUsers' },
    ],
  });

  const row = response.rows?.[0];
  if (!row) {
    return {
      totalVisitors: 0,
      totalSessions: 0,
      pageViews: 0,
      bounceRate: 0,
      avgSessionDuration: 0,
      newUsers: 0,
      returningUsers: 0,
    };
  }

  const totalVisitors = parseInt(row.metricValues?.[0]?.value || '0');
  const totalSessions = parseInt(row.metricValues?.[1]?.value || '0');
  const pageViews = parseInt(row.metricValues?.[2]?.value || '0');
  const bounceRate = parseFloat(row.metricValues?.[3]?.value || '0');
  const avgSessionDuration = parseFloat(row.metricValues?.[4]?.value || '0');
  const newUsers = parseInt(row.metricValues?.[5]?.value || '0');
  const returningUsers = totalVisitors - newUsers;

  return {
    totalVisitors,
    totalSessions,
    pageViews,
    bounceRate,
    avgSessionDuration,
    newUsers,
    returningUsers,
  };
}

export async function getTopPages(daysAgo: number = 7, limit: number = 10): Promise<TopPage[]> {
  const client = getClient();
  
  const [response] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [
      {
        startDate: `${daysAgo}daysAgo`,
        endDate: 'today',
      },
    ],
    dimensions: [
      { name: 'pagePath' },
      { name: 'pageTitle' },
    ],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'activeUsers' },
    ],
    orderBys: [
      {
        metric: {
          metricName: 'screenPageViews',
        },
        desc: true,
      },
    ],
    limit,
  });

  return (response.rows || []).map((row) => ({
    pagePath: row.dimensionValues?.[0]?.value || '',
    pageTitle: row.dimensionValues?.[1]?.value || 'Untitled',
    pageViews: parseInt(row.metricValues?.[0]?.value || '0'),
    uniqueVisitors: parseInt(row.metricValues?.[1]?.value || '0'),
  }));
}

export async function getCountryStats(daysAgo: number = 7): Promise<CountryStat[]> {
  const client = getClient();
  
  const [response] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [
      {
        startDate: `${daysAgo}daysAgo`,
        endDate: 'today',
      },
    ],
    dimensions: [
      { name: 'country' },
    ],
    metrics: [
      { name: 'activeUsers' },
      { name: 'sessions' },
    ],
    orderBys: [
      {
        metric: {
          metricName: 'activeUsers',
        },
        desc: true,
      },
    ],
    limit: 10,
  });

  const total = (response.rows || []).reduce(
    (sum, row) => sum + parseInt(row.metricValues?.[0]?.value || '0'),
    0
  );

  return (response.rows || []).map((row) => {
    const visitors = parseInt(row.metricValues?.[0]?.value || '0');
    return {
      country: row.dimensionValues?.[0]?.value || 'Unknown',
      visitors,
      sessions: parseInt(row.metricValues?.[1]?.value || '0'),
      percentage: total > 0 ? (visitors / total) * 100 : 0,
    };
  });
}

export async function getDeviceStats(daysAgo: number = 7): Promise<DeviceStat[]> {
  const client = getClient();
  
  const [response] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [
      {
        startDate: `${daysAgo}daysAgo`,
        endDate: 'today',
      },
    ],
    dimensions: [
      { name: 'deviceCategory' },
    ],
    metrics: [
      { name: 'activeUsers' },
      { name: 'sessions' },
    ],
  });

  const total = (response.rows || []).reduce(
    (sum, row) => sum + parseInt(row.metricValues?.[0]?.value || '0'),
    0
  );

  return (response.rows || []).map((row) => {
    const visitors = parseInt(row.metricValues?.[0]?.value || '0');
    return {
      deviceCategory: row.dimensionValues?.[0]?.value || 'Unknown',
      visitors,
      sessions: parseInt(row.metricValues?.[1]?.value || '0'),
      percentage: total > 0 ? (visitors / total) * 100 : 0,
    };
  });
}

export async function getRealtimeData(): Promise<RealtimeData> {
  const client = getClient();
  
  const [response] = await client.runRealtimeReport({
    property: `properties/${PROPERTY_ID}`,
    metrics: [
      { name: 'activeUsers' },
    ],
  });

  console.log('📊 REALTIME API Response:', JSON.stringify(response, null, 2));

  const activeUsers = parseInt(response.rows?.[0]?.metricValues?.[0]?.value || '0');
  
  // Try to get top pages with pagePath dimension
  let topPages: Array<{ pagePath: string; activeUsers: number }> = [];
  
  try {
    const [pagesResponse] = await client.runRealtimeReport({
      property: `properties/${PROPERTY_ID}`,
      dimensions: [
        { name: 'pagePath' },
      ],
      metrics: [
        { name: 'activeUsers' },
      ],
      orderBys: [
        {
          metric: {
            metricName: 'activeUsers',
          },
          desc: true,
        },
      ],
      limit: 5,
    });

    console.log('📊 REALTIME Pages Response:', JSON.stringify(pagesResponse, null, 2));

    topPages = (pagesResponse.rows || []).map((row) => ({
      pagePath: row.dimensionValues?.[0]?.value || '/',
      activeUsers: parseInt(row.metricValues?.[0]?.value || '0'),
    }));
  } catch (error) {
    console.error('Error fetching realtime pages:', error);
  }

  return {
    activeUsers,
    screenPageViews: activeUsers, // Simplified: use activeUsers as proxy
    topPages,
  };
}

export async function getVisitorsTrend(daysAgo: number = 7): Promise<Array<{ date: string; visitors: number; sessions: number }>> {
  const client = getClient();
  
  const [response] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [
      {
        startDate: `${daysAgo}daysAgo`,
        endDate: 'today',
      },
    ],
    dimensions: [
      { name: 'date' },
    ],
    metrics: [
      { name: 'activeUsers' },
      { name: 'sessions' },
    ],
    orderBys: [
      {
        dimension: {
          dimensionName: 'date',
        },
      },
    ],
  });

  return (response.rows || []).map((row) => ({
    date: row.dimensionValues?.[0]?.value || '',
    visitors: parseInt(row.metricValues?.[0]?.value || '0'),
    sessions: parseInt(row.metricValues?.[1]?.value || '0'),
  }));
}
