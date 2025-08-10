import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Bekannte Bot User-Agents
const KNOWN_BOTS = [
  // Crawler Bots
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider', 'yandexbot', 
  'sogou', 'facebookexternalhit', 'twitterbot', 'linkedinbot', 'whatsapp',
  
  // Scraping Bots
  'scrapy', 'python-requests', 'urllib', 'curl', 'wget', 'httpclient',
  'apache-httpclient', 'okhttp', 'go-http-client', 'node-fetch',
  
  // Aggressive Bots
  'semrushbot', 'ahrefsbot', 'mj12bot', 'dotbot', 'blexbot', 'ia_archiver',
  'archive.org_bot', 'proximic', 'exabot', 'serpstatbot', 'linkdexbot',
  
  // Security Scanners
  'nessus', 'openvas', 'nikto', 'sqlmap', 'wpscan', 'nuclei', 'masscan',
  'nmap', 'zap', 'burp', 'acunetix',
  
  // Spam/Malicious
  'seoprofiler', 'majestic12', 'uptimerobot', 'pingdom', 'monitor',
  'headlesschrome', 'phantomjs', 'selenium'
];

// Verdächtige Länder (hohe Bot-Aktivität)
const SUSPICIOUS_COUNTRIES = ['CN', 'RU', 'IN', 'VN', 'BD', 'PK', 'ID', 'BR'];

// In-Memory Bot-Tracking
const botActivity = new Map<string, {
  requests: number;
  lastSeen: Date;
  violations: number;
  blocked: boolean;
  userAgent: string;
  country?: string;
}>();

// Cleanup alte Einträge alle 30 Minuten
setInterval(() => {
  const now = Date.now();
  const thirtyMinutes = 30 * 60 * 1000;
  
  for (const [ip, data] of botActivity) {
    if (now - data.lastSeen.getTime() > thirtyMinutes) {
      botActivity.delete(ip);
    }
  }
}, 30 * 60 * 1000);

// Bot User-Agent Detektion
function detectBotUserAgent(userAgent: string): boolean {
  if (!userAgent || userAgent.length < 10) return true;
  
  const ua = userAgent.toLowerCase();
  
  // Bekannte Bot-Patterns
  if (KNOWN_BOTS.some(bot => ua.includes(bot))) {
    return true;
  }
  
  // Verdächtige Patterns
  const suspiciousPatterns = [
    // Zu einfache User-Agents
    /^[a-z\-]+\/[\d\.]+$/,
    // Fehlende wichtige Browser-Info
    /^mozilla\/[45]\.0$/,
    // Python/Scripts
    /python|script|bot|crawler|spider|scan/i,
    // Headless Browser
    /headless|phantom|selenium/i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(ua));
}

// Behavioral Bot Detection
function detectSuspiciousBehavior(ip: string, req: Request): boolean {
  const activity = botActivity.get(ip);
  if (!activity) return false;
  
  // Zu viele Requests in kurzer Zeit
  if (activity.requests > 50) return true;
  
  // Fehlende Standard-Header
  const hasReferer = req.headers.referer || req.headers.referrer;
  const hasAcceptLanguage = req.headers['accept-language'];
  const hasAccept = req.headers.accept;
  
  if (!hasReferer && !hasAcceptLanguage && !hasAccept) {
    return true;
  }
  
  // Verdächtiger Accept-Header
  if (req.headers.accept === '*/*' && !req.headers['user-agent']?.includes('curl')) {
    return true;
  }
  
  return false;
}

// Land-basierte Risiko-Bewertung
function getCountryRisk(country?: string): number {
  if (!country) return 1;
  
  // SICHERE LÄNDER - Sehr niedriges Risiko
  const safeCountries = ['CU', 'US', 'CA', 'GB', 'DE', 'FR', 'ES', 'IT', 'AU', 'NZ', 'SE', 'NO', 'DK', 'FI', 'NL', 'BE', 'CH', 'AT'];
  if (safeCountries.includes(country)) return 0.1; // Minimales Risiko
  
  // Verdächtige Länder - Hohes Risiko
  if (SUSPICIOUS_COUNTRIES.includes(country)) return 3;
  
  // Andere Länder - Normales Risiko
  return 1;
}

// Bot-Protection Middleware
export const botProtection = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.headers['user-agent'] || '';
  const forwarded = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip;
  const clientIp = Array.isArray(forwarded) ? forwarded[0] : forwarded.toString().split(',')[0].trim();
  
  // Skip für statische Assets
  const staticPaths = ['/uploads/', '/assets/', '/favicon.ico', '/_vite/', '/src/', '/@vite/', '/node_modules/', '/api/placeholder/'];
  if (staticPaths.some(path => req.path.startsWith(path))) {
    return next();
  }
  
  // Skip für Development/Local IPs - MUSS ZUERST KOMMEN
  const isLocalIp = clientIp === '127.0.0.1' || 
                   clientIp === 'localhost' || 
                   clientIp === '::1' || 
                   clientIp.startsWith('192.168.') || 
                   clientIp.startsWith('10.') || 
                   clientIp.startsWith('172.');
                   
  if (isLocalIp || process.env.NODE_ENV === 'development') {
    console.log(`🔧 DEV-SKIP: Development IP ${clientIp} - Bot-Schutz deaktiviert`);
    return next();
  }
  
  // Skip für legitime Länder (Kuba, USA, Europa)
  try {
    const geoip = require('geoip-lite');
    const geo = geoip.lookup(clientIp);
    if (geo && geo.country) {
      // SICHERE LÄNDER: Kuba, USA, Kanada, Europa
      const safeCountries = ['CU', 'US', 'CA', 'GB', 'DE', 'FR', 'ES', 'IT', 'AU', 'NZ', 'SE', 'NO', 'DK', 'FI', 'NL', 'BE', 'CH', 'AT'];
      
      if (safeCountries.includes(geo.country)) {
        console.log(`✅ SAFE-COUNTRY: IP ${clientIp} aus ${geo.country} - Bot-Schutz minimal`);
        return next();
      }
    }
  } catch (error) {
    // Fallback wenn geoip nicht verfügbar
  }
  
  // Aktivität tracken
  const now = new Date();
  const activity = botActivity.get(clientIp) || {
    requests: 0,
    lastSeen: now,
    violations: 0,
    blocked: false,
    userAgent,
    country: undefined
  };
  
  activity.requests++;
  activity.lastSeen = now;
  activity.userAgent = userAgent;
  
  // Land ermitteln
  try {
    const geoip = require('geoip-lite');
    const geo = geoip.lookup(clientIp);
    if (geo) {
      activity.country = geo.country;
    }
  } catch (error) {
    // Fallback
  }
  
  // Bot-Erkennung
  const isBot = detectBotUserAgent(userAgent);
  const isSuspicious = detectSuspiciousBehavior(clientIp, req);
  const countryRisk = getCountryRisk(activity.country);
  
  // Violations berechnen
  let violationScore = 0;
  if (isBot) violationScore += 2;
  if (isSuspicious) violationScore += 1;
  violationScore *= countryRisk;
  
  activity.violations += violationScore;
  
  // Blocking-Entscheidung - SEHR HOHER SCHWELLWERT für USA/Europa-Schutz
  let blockingThreshold = 20; // Sehr hoch für sichere Länder
  
  // Niedrigere Schwelle nur für sehr verdächtige Länder
  if (activity.country && SUSPICIOUS_COUNTRIES.includes(activity.country)) {
    blockingThreshold = 8;
  }
  
  if (activity.violations > blockingThreshold || activity.blocked) {
    activity.blocked = true;
    botActivity.set(clientIp, activity);
    
    console.log(`🤖 BOT BLOCKED: IP=${clientIp}, Country=${activity.country}, UA=${userAgent}, Violations=${activity.violations}, Threshold=${blockingThreshold}`);
    
    return res.status(429).json({
      error: 'Request blocked - suspicious activity detected',
      code: 'BOT_DETECTED',
      retryAfter: 1800 // 30 Minuten
    });
  }
  
  // Warnung für verdächtige Aktivität
  if (violationScore > 0) {
    console.log(`⚠️  SUSPICIOUS: IP=${clientIp}, Country=${activity.country}, UA=${userAgent}, Score=${violationScore}, Total=${activity.violations}`);
  }
  
  botActivity.set(clientIp, activity);
  next();
};

// Aggressive Rate Limiting für verdächtige IPs
export const aggressiveBotRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 Minuten
  max: 50, // ERHÖHT: 50 Requests alle 5 Minuten 
  message: {
    error: 'Rate limit exceeded - too many requests',
    retryAfter: 5 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const forwarded = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip;
    const clientIp = Array.isArray(forwarded) ? forwarded[0] : forwarded.toString().split(',')[0].trim();
    
    // Skip für Development
    const isLocalIp = clientIp === '127.0.0.1' || 
                     clientIp === 'localhost' || 
                     clientIp === '::1' || 
                     clientIp.startsWith('192.168.') || 
                     clientIp.startsWith('10.');
                     
    if (isLocalIp || process.env.NODE_ENV === 'development') {
      return true;
    }
    
    // Skip für sichere Länder (Kuba, USA, Europa)
    try {
      const geoip = require('geoip-lite');
      const geo = geoip.lookup(clientIp);
      if (geo && geo.country) {
        const safeCountries = ['CU', 'US', 'CA', 'GB', 'DE', 'FR', 'ES', 'IT', 'AU', 'NZ', 'SE', 'NO', 'DK', 'FI', 'NL', 'BE', 'CH', 'AT'];
        if (safeCountries.includes(geo.country)) {
          return true; // Skip aggressive limits für sichere Länder
        }
      }
    } catch (error) {
      // Fallback
    }
    
    // ERHÖHT: Nur für sehr verdächtige IPs anwenden (höhere Schwelle)
    const activity = botActivity.get(clientIp);
    return !activity || activity.violations < 10;
  }
});

// Bot-Statistiken für Admin
export const getBotStats = () => {
  const stats = {
    totalTracked: botActivity.size,
    blocked: 0,
    suspicious: 0,
    byCountry: {} as Record<string, number>,
    topUserAgents: {} as Record<string, number>
  };
  
  for (const [ip, data] of botActivity) {
    if (data.blocked) stats.blocked++;
    if (data.violations > 2) stats.suspicious++;
    
    if (data.country) {
      stats.byCountry[data.country] = (stats.byCountry[data.country] || 0) + 1;
    }
    
    if (data.userAgent) {
      const ua = data.userAgent.substring(0, 50);
      stats.topUserAgents[ua] = (stats.topUserAgents[ua] || 0) + 1;
    }
  }
  
  return stats;
};