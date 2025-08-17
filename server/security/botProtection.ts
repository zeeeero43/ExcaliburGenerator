// MINIMAL Bot Protection - Nur Länder-Blocking
import express, { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// MINIMAL Bot-Protection - NUR LÄNDER BLOCKIEREN
export const botProtection = (req: Request, res: Response, next: NextFunction) => {
  const forwarded = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip || '127.0.0.1';
  const clientIp = Array.isArray(forwarded) ? forwarded[0] : forwarded.toString().split(',')[0].trim();
  
  // Skip für statische Assets
  const staticPaths = ['/uploads/', '/assets/', '/favicon.ico', '/_vite/', '/src/', '/@vite/', '/node_modules/', '/api/placeholder/'];
  if (staticPaths.some(path => req.path.startsWith(path))) {
    return next();
  }
  
  // Skip für Development/Local IPs
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
  
  // NUR LÄNDER-BLOCKING - EINFACH & MINIMAL
  try {
    const geoip = require('geoip-lite');
    const geo = geoip.lookup(clientIp);
    if (geo && geo.country) {
      // NUR DIESE LÄNDER BLOCKIEREN - SONST NICHTS
      const blockedCountries = ['CN', 'SG']; // Nur China & Singapore
      
      if (blockedCountries.includes(geo.country)) {
        console.log(`🚫 COUNTRY-BLOCKED: IP ${clientIp} aus ${geo.country} - Zugriff verweigert`);
        return res.status(403).json({
          error: 'Access from your region is not permitted',
          code: 'REGION_BLOCKED'
        });
      }
      
      // ALLE ANDEREN LÄNDER: FREIER DURCHGANG
      console.log(`🌍 COUNTRY-ALLOWED: IP ${clientIp} aus ${geo.country} - Zugriff gewährt`);
    }
  } catch (error: any) {
    console.log(`🔍 GEOIP-FEHLER für IP ${clientIp}: ${error.message} - Durchgang gewährt`);
  }
  
  // FERTIG - KEIN TRACKING, KEINE LIMITS, KEINE KOMPLEXITÄT
  next();
};

// MINIMALES Rate Limiting - Praktisch deaktiviert
export const aggressiveBotRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 10000, // Praktisch unbegrenzt
  message: {
    error: 'Extreme rate limit exceeded',
    retryAfter: 5 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => true // IMMER SKIPPEN - Komplett deaktiviert
});

// Login Rate Limiting - Sehr liberal
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 50, // 50 Login-Versuche
  message: {
    error: 'Too many login attempts. Please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const forwarded = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip || '127.0.0.1';
    const clientIp = Array.isArray(forwarded) ? forwarded[0] : forwarded.toString().split(',')[0].trim();
    
    const isLocalIp = clientIp === '127.0.0.1' || 
                     clientIp === 'localhost' || 
                     clientIp === '::1' || 
                     clientIp.startsWith('192.168.') || 
                     clientIp.startsWith('10.');
                     
    return isLocalIp || process.env.NODE_ENV === 'development';
  }
});

// Bot-Statistiken für Admin - MINIMAL
export const getBotStats = () => {
  return {
    totalTracked: 0,
    blocked: 0,
    suspicious: 0,
    byCountry: { 'CN': 0, 'SG': 0 }, // Nur die blockierten Länder
    message: 'Bot protection simplified - only country blocking active'
  };
};

// Clear function (nicht mehr nötig, aber für Kompatibilität)
export const clearAllBotBlocks = () => {
  console.log('✅ NO BOT BLOCKS TO CLEAR - System is now minimal');
  return { cleared: true, message: 'Bot protection is now minimal - no blocks to clear' };
};

// Dummy functions für Kompatibilität (falls irgendwo noch verwendet)
export const smartRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10000,
  skip: () => true // Komplett deaktiviert
});

export const detectBotUserAgent = (userAgent: string): boolean => false;
export const detectSuspiciousBehavior = (ip: string, req: Request): boolean => false;
export const getCountryRisk = (country?: string): number => 1;