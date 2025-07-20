import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Rate Limiting für verschiedene Endpoints
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Höheres Limit für Development
  message: { 
    error: 'Zu viele Anfragen von dieser IP-Adresse. Versuchen Sie es später erneut.',
    retryAfter: 15 * 60 
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Statische Assets und Development-Dateien ausschließen
  skip: (req) => {
    const staticPaths = ['/uploads/', '/assets/', '/favicon.ico', '/_vite/', '/src/', '/@vite/', '/node_modules/'];
    return staticPaths.some(path => req.path.startsWith(path));
  }
});

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 5, // Max 5 Login-Versuche pro IP
  message: { 
    error: 'Zu viele Login-Versuche. Konto vorübergehend gesperrt.',
    retryAfter: 15 * 60 
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 Minute
  max: process.env.NODE_ENV === 'development' ? 600 : 60, // Höheres Limit für Development
  message: { 
    error: 'API-Rate-Limit erreicht. Reduzieren Sie die Anfragerate.',
    retryAfter: 60 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const uploadRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 Minuten
  max: 10, // Max 10 Uploads alle 5 Minuten
  message: { 
    error: 'Upload-Limit erreicht. Warten Sie 5 Minuten.',
    retryAfter: 5 * 60 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security Headers mit Helmet
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net"
      ],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'",
        "https://www.googletagmanager.com"
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https:",
        "http:"
      ],
      fontSrc: [
        "'self'", 
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net"
      ],
      connectSrc: [
        "'self'",
        "https://api.ipapi.com",
        "https://ip-api.com",
        "https://ipapi.co"
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Input Sanitization Middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      // Entfernen gefährlicher HTML/JS Patterns
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/eval\s*\(/gi, '')
        .replace(/expression\s*\(/gi, '');
    }
    if (typeof value === 'object' && value !== null) {
      const sanitized = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val);
      }
      return sanitized;
    }
    return value;
  };

  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }

  next();
};

// SQL Injection Protection - Validation Schema
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid ID format').transform(Number)
});

export const slugParamSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid slug format')
});

// Request Validation Middleware
export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid request parameters',
          details: error.errors.map(e => e.message)
        });
      }
      return res.status(400).json({ error: 'Invalid request format' });
    }
  };
};

// IP Whitelist für Admin-Bereiche (optional)
export const adminIPWhitelist = (allowedIPs: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (allowedIPs.length === 0) {
      return next(); // Kein Whitelist aktiv
    }

    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    if (allowedIPs.includes(clientIP) || clientIP === '::1' || clientIP === '127.0.0.1') {
      return next();
    }

    return res.status(403).json({ 
      error: 'Access denied from this IP address',
      code: 'IP_NOT_ALLOWED'
    });
  };
};

// Error Handler - Keine sensitiven Daten preisgeben
export const secureErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('🔒 SECURITY ERROR:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // In Production keine Stack Traces oder Details preisgeben
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    res.status(500).json({
      error: 'Ein interner Server-Fehler ist aufgetreten.',
      code: 'INTERNAL_ERROR',
      timestamp: Date.now()
    });
  } else {
    res.status(500).json({
      error: err.message || 'Unbekannter Server-Fehler',
      stack: err.stack,
      code: 'DEVELOPMENT_ERROR'
    });
  }
};

// CORS Configuration
export const corsConfig = {
  origin: function(origin: string | undefined, callback: Function) {
    // Erlaubte Domains für CORS
    const allowedOrigins = [
      'http://localhost:5000',
      'https://excalibur-cuba.com',
      'https://www.excalibur-cuba.com'
    ];
    
    // Erlaube Requests ohne Origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`🔒 CORS: Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};