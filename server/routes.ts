import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated, loginUser, logoutUser, type AuthRequest } from "./cookieAuth";
import { seedDatabase } from "./seed";
import { setupSEO } from "./seo";
import { z } from "zod";
import { insertCategorySchema, insertSubcategorySchema, insertProductSchema, insertInquirySchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import geoip from 'geoip-lite';
import cookieParser from 'cookie-parser';
import { 
  loginRateLimit, 
  apiRateLimit, 
  uploadRateLimit,
  validateParams,
  idParamSchema,
  slugParamSchema
} from "./security/middleware";
import { 
  enhancedAuth, 
  loginBruteForceProtection, 
  logLoginAttempt,
  requireAdmin,
  hashPassword,
  verifyPassword,
  validatePassword
} from "./security/auth";
import { secureUpload, handleUploadError } from "./security/fileUpload";

// REGION BLOCKING MIDDLEWARE - Blocks Chinese and Singaporean IP addresses
function blockRegionsMiddleware(req: any, res: any, next: any) {
  // Get real IP address (handle proxy headers)
  const forwarded = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip;
  const clientIp = Array.isArray(forwarded) ? forwarded[0] : forwarded.toString().split(',')[0].trim();
  
  // Skip blocking for local/development IPs
  if (clientIp === '127.0.0.1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.') || clientIp === 'unknown') {
    return next();
  }
  
  // Check if IP is from blocked countries
  const geo = geoip.lookup(clientIp);
  const blockedCountries = ['CN', 'SG']; // China and Singapore
  
  if (geo && blockedCountries.includes(geo.country)) {
    const countryName = geo.country === 'CN' ? 'China' : geo.country === 'SG' ? 'Singapore' : geo.country;
    console.log(`🚫 REGION BLOCKED: IP ${clientIp} from ${geo.city || countryName} (${geo.country}) - Access denied`);
    
    // Return simple blocked message
    return res.status(403).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Access Denied</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>Access Denied</h1>
        <p>This website is not available in your region.</p>
        <p>IP: ${clientIp}</p>
        <p>Country: ${countryName}</p>
      </body>
      </html>
    `);
  }
  
  // Allow all other countries
  next();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// SIMPLE UPLOAD: No security restrictions per user request
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const fileId = uuidv4();
      const extension = path.extname(file.originalname).toLowerCase();
      const filename = `${Date.now()}-${fileId}${extension}`;
      cb(null, filename);
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 20
  }
});

// Function to compress and optimize uploaded images for better performance
async function compressUploadedImage(uploadedPath: string, originalName: string): Promise<string> {
  console.log("🖼️ IMAGE COMPRESSION: Processing uploaded file", {
    originalName,
    uploadedPath
  });

  const fileId = uuidv4();
  const extension = path.extname(originalName).toLowerCase();
  const filename = `${Date.now()}-${fileId}${extension}`;
  const outputPath = path.join(uploadsDir, filename);

  // Compress image with sharp for better performance
  await sharp(uploadedPath)
    .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 78 })
    .png({ compressionLevel: 6 })
    .toFile(outputPath);

  // Delete original uncompressed file
  fs.unlinkSync(uploadedPath);
  
  console.log("✅ IMAGE COMPRESSION: File compressed and optimized", { filename });
  return filename;
}


// Helper function to generate slug from text
function generateSlug(text: string): string {
  const baseSlug = text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  // Add timestamp to make it unique
  const timestamp = Date.now();
  return `${baseSlug}-${timestamp}`;
}

// Simple dictionary-based translation for common words/phrases
function simpleTranslation(text: string, fromLang: string, toLang: string): string {
  const translations: Record<string, Record<string, string>> = {
    // German to Spanish
    'de-es': {
      'Details': 'Detalles',
      'details': 'detalles',
      'Details anzeigen': 'Ver detalles',
      'Produkte': 'Productos',
      'Kategorien': 'Categorías',
      'Verfügbar': 'Disponible',
      'verfügbar': 'disponible',
      'Nicht verfügbar': 'No disponible',
      'Begrenzt verfügbar': 'Disponibilidad limitada',
      'In den Warenkorb': 'Añadir al carrito',
      'Warenkorb': 'Carrito',
      'Startseite': 'Página principal',
      'Über uns': 'Acerca de nosotros',
      'Kontakt': 'Contacto',
      'Preis': 'Precio',
    },
    // German to English
    'de-en': {
      'Details': 'Details',
      'details': 'details',
      'Details anzeigen': 'View details',
      'Produkte': 'Products',
      'Kategorien': 'Categories',
      'Verfügbar': 'Available',
      'verfügbar': 'available',
      'Nicht verfügbar': 'Not available',
      'Begrenzt verfügbar': 'Limited availability',
      'In den Warenkorb': 'Add to cart',
      'Warenkorb': 'Cart',
      'Startseite': 'Home',
      'Über uns': 'About us',
      'Kontakt': 'Contact',
      'Preis': 'Price',
    },
    // Spanish to German
    'es-de': {
      'Detalles': 'Details',
      'detalles': 'Details',
      'Ver detalles': 'Details anzeigen',
      'Productos': 'Produkte',
      'Categorías': 'Kategorien',
      'Disponible': 'Verfügbar',
      'disponible': 'verfügbar',
      'No disponible': 'Nicht verfügbar',
      'Disponibilidad limitada': 'Begrenzt verfügbar',
      'Añadir al carrito': 'In den Warenkorb',
      'Carrito': 'Warenkorb',
      'Página principal': 'Startseite',
      'Acerca de nosotros': 'Über uns',
      'Contacto': 'Kontakt',
      'Precio': 'Preis',
    },
  };
  
  const langPair = `${fromLang}-${toLang}`;
  const dictionary = translations[langPair];
  
  if (!dictionary) {
    return text; // No dictionary available for this language pair
  }
  
  // Check for exact matches first
  if (dictionary[text]) {
    return dictionary[text];
  }
  
  // Check for partial matches in common phrases
  for (const [key, value] of Object.entries(dictionary)) {
    if (text.includes(key)) {
      return text.replace(key, value);
    }
  }
  
  return text; // No translation found
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup cookie parser for authentication
  app.use(cookieParser());

  // REGION BLOCKING: Apply to ALL routes - must be before other routes
  app.use(blockRegionsMiddleware);
  console.log("🚫 REGION BLOCKING: China & Singapore middleware activated for all routes");

  // CRITICAL: Register API routes IMMEDIATELY after session setup to ensure priority
  console.log("🔥 CRITICAL: Registering API routes with HIGH PRIORITY");
  
  // TEMP DEBUG: Test route without any authentication
  app.get("/api/debug/products", async (req: AuthRequest, res) => {
    console.log("🔍 DEBUG: Simple products endpoint reached");
    try {
      const products = await storage.getProducts({});
      console.log("🔍 DEBUG: Found products:", products.length);
      res.json({ count: products.length, products: products.slice(0, 3) });
    } catch (error) {
      console.log("🔍 DEBUG: Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get single product by ID - TEMP PUBLIC
  app.get("/api/admin/products/:id", async (req: AuthRequest, res) => {
    console.log("🔍 CRITICAL: HIGH PRIORITY GET /api/admin/products/:id route HIT!", {
      params: req.params,
      originalUrl: req.originalUrl,
      method: req.method
    });
    
    try {
      const id = parseInt(req.params.id);
      console.log("🔍 CRITICAL: Parsed ID:", id);
      
      const product = await storage.getProductById(id);
      console.log("🔍 CRITICAL: Product from storage:", product ? "FOUND" : "NOT FOUND");
      
      if (!product) {
        console.log("🔍 CRITICAL: Returning 404 - Product not found");
        return res.status(404).json({ error: "Product not found" });
      }
      
      console.log("🔍 CRITICAL: Returning product JSON");
      res.json(product);
    } catch (error) {
      console.error("🔍 CRITICAL: Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });



  // Seed database on startup
  try {
    await seedDatabase();
  } catch (error) {
    console.error("Failed to seed database:", error);
  }

  // 🚀 SMART Multi-API Translation system with performance optimization
  app.post("/api/translate", async (req: AuthRequest, res) => {
    try {
      const { text, fromLang, toLang } = req.body;
      
      console.log(`🔄 SMART TRANSLATE: ${fromLang} -> ${toLang}, length: ${text?.length || 0}, text preview: "${text?.substring(0, 50)}..."`);
      
      if (!text || !fromLang || !toLang) {
        console.log("❌ Missing parameters:", { text: !!text, fromLang, toLang });
        return res.json({ translatedText: text || '', error: 'MISSING_PARAMS' });
      }

      if (fromLang === toLang) {
        console.log("⚠️ Same language, returning original");
        return res.json({ translatedText: text });
      }

      // 🚀 PRIMARY: Try DeepL API first (best quality)
      console.log(`🔄 Using DeepL API as primary translation service...`);
      
      try {
        // Map language codes to DeepL format
        const deeplLangMap: Record<string, string> = {
          'de': 'DE',
          'en': 'EN',
          'es': 'ES',
          'fr': 'FR',
          'it': 'IT',
          'pt': 'PT',
          'ru': 'RU',
          'ja': 'JA',
          'zh': 'ZH'
        };
        
        const sourceLang = deeplLangMap[fromLang] || fromLang.toUpperCase();
        const targetLang = deeplLangMap[toLang] || toLang.toUpperCase();
        
        console.log(`🔄 DeepL: Translating from ${sourceLang} to ${targetLang}`);
        
        // Multiple API key sources for VPS compatibility
        const apiKey = process.env.DEEPL_API_KEY || process.env.DEEPL_KEY || global.DEEPL_API_KEY;
        
        if (!apiKey) {
          console.log(`⚠️ No DeepL API key found, skipping to fallback...`);
          throw new Error('No DeepL API key configured');
        }
        
        console.log(`📊 DeepL: Processing ${text.length} characters (limit: ~130,000) - TEXT: "${text.substring(0, 100)}..."`);
        
        const deeplResponse = await fetch('https://api-free.deepl.com/v2/translate', {
          method: 'POST',
          headers: {
            'Authorization': `DeepL-Auth-Key ${apiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            'text': text,
            'source_lang': sourceLang,
            'target_lang': targetLang,
          }),
          signal: AbortSignal.timeout(8000)
        });

        if (deeplResponse.ok) {
          const deeplData = await deeplResponse.json();
          console.log(`📡 DeepL Response: ${JSON.stringify(deeplData)}`);
          
          if (deeplData.translations && deeplData.translations.length > 0) {
            const translatedText = deeplData.translations[0].text;
            if (translatedText && translatedText !== text) {
              console.log(`✅ DeepL SUCCESS: "${text.substring(0, 30)}..." -> "${translatedText.substring(0, 30)}..."`);
              return res.json({ translatedText, provider: 'DeepL' });
            }
          }
        } else {
          const errorText = await deeplResponse.text();
          console.log(`❌ DeepL Error: ${deeplResponse.status} - ${errorText}`);
          throw new Error(`DeepL API error: ${deeplResponse.status}`);
        }
      } catch (deeplError: any) {
        console.log(`⚠️ DeepL failed: ${deeplError.message}, falling back to MyMemory...`);
      }

      // FALLBACK: MyMemory API
      console.log(`🔄 Using MyMemory API as fallback...`);
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`;

      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`📡 MyMemory Response: status=${response.status}, responseStatus=${data.responseStatus}`);
          
          if (data.responseStatus === 200 && data.responseData?.translatedText) {
            const translatedText = data.responseData.translatedText;
            if (!translatedText.includes('MYMEMORY WARNING') && translatedText !== text) {
              console.log(`✅ MyMemory fallback success: "${text.substring(0, 30)}..." -> "${translatedText.substring(0, 30)}..."`);
              return res.json({ translatedText, provider: 'MyMemory-Fallback' });
            }
          }
        }
        
        // All APIs failed - try dictionary fallback
        console.log(`🔄 All APIs failed, trying dictionary fallback...`);
        const dictionaryResult = simpleTranslation(text, fromLang, toLang);
        if (dictionaryResult !== text) {
          console.log(`✅ Dictionary fallback success: "${text}" -> "${dictionaryResult}"`);
          return res.json({ translatedText: dictionaryResult, provider: 'Dictionary' });
        }
        
        console.log(`❌ All translation methods failed, returning original text`);
        res.json({ 
          translatedText: text, 
          error: 'ALL_APIS_FAILED', 
          details: 'DeepL and MyMemory both unavailable' 
        });
        
      } catch (fetchError: any) {
        console.error('❌ MyMemory API error:', fetchError.message);
        
        // Final dictionary fallback after network error
        console.log(`🔄 Network error, trying dictionary fallback...`);
        const dictionaryResult = simpleTranslation(text, fromLang, toLang);
        if (dictionaryResult !== text) {
          console.log(`✅ Dictionary fallback success: "${text}" -> "${dictionaryResult}"`);
          return res.json({ translatedText: dictionaryResult, provider: 'Dictionary' });
        }
        
        res.json({ 
          translatedText: text, 
          error: 'NETWORK_ERROR', 
          details: 'All translation services unavailable' 
        });
      }
    } catch (error: any) {
      console.error('❌ Translation system error:', error);
      res.json({ translatedText: req.body.text || '', error: 'SYSTEM_ERROR', details: error.message });
    }
  });

  // Authentication routes
  // SECURITY: Enhanced Admin Login with Brute Force Protection
  app.post("/api/admin/login", loginBruteForceProtection, async (req: AuthRequest, res) => {
    const startTime = Date.now();
    console.log("🔐 SECURITY LOGIN: Enhanced admin login request", { 
      ip: req.ip, 
      userAgent: req.get('User-Agent')?.substring(0, 50),
      username: req.body?.username || '[MISSING]',
      timestamp: new Date().toISOString()
    });
    
    try {
      const { username, password } = req.body;
      
      // SECURITY: Input Validation
      if (!username || !password) {
        logLoginAttempt(req, false, username);
        console.warn("🔒 SECURITY: Missing credentials in login attempt");
        return res.status(400).json({ 
          error: "Benutzername und Passwort sind erforderlich",
          code: "MISSING_CREDENTIALS"
        });
      }

      // SECURITY: Enhanced Login with detailed logging
      console.log("🔐 SECURITY LOGIN: Validating credentials for:", username);
      const result = await loginUser(username, password);
      
      if (result) {
        const { user, token } = result;
        logLoginAttempt(req, true, username);
        const { password: _, ...userWithoutPassword } = user;
        const duration = Date.now() - startTime;
        
        // Set HTTP-only cookie for authentication
        res.cookie('excalibur-auth', token, {
          httpOnly: true,
          secure: false, // Set to true in production with HTTPS
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          sameSite: 'lax'
        });
        
        console.log("🔐 SECURITY LOGIN: Successful authentication", {
          username: userWithoutPassword.username,
          duration: `${duration}ms`
        });
        
        res.json({ success: true, user: userWithoutPassword });
      } else {
        logLoginAttempt(req, false, username);
        const duration = Date.now() - startTime;
        
        console.warn("🔒 SECURITY LOGIN: Failed authentication attempt", {
          username,
          duration: `${duration}ms`,
          ip: req.ip
        });
        
        res.status(401).json({ 
          error: "Ungültige Anmeldedaten",
          code: "INVALID_CREDENTIALS"
        });
      }
    } catch (error) {
      console.error("🔒 SECURITY LOGIN ERROR:", error);
      logLoginAttempt(req, false);
      res.status(500).json({ 
        error: "Login fehlgeschlagen - Server-Fehler",
        code: "SERVER_ERROR"
      });
    }
  });

  app.post("/api/admin/logout", async (req: AuthRequest, res) => {
    try {
      logoutUser(res);
      res.json({ success: true });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  app.get("/api/admin/user", isAuthenticated, async (req: AuthRequest, res) => {
    console.log("🔍 ADMIN USER: Request reached /api/admin/user");
    console.log("🔍 ADMIN USER: Auth user exists:", !!req.user);
    try {
      const { password: _, ...userWithoutPassword } = req.user!;
      console.log("🔍 ADMIN USER: Returning user:", userWithoutPassword.username);
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("🔍 ADMIN USER: Error fetching current user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Google Analytics API Endpoints
  const { 
    getAnalyticsOverview, 
    getTopPages, 
    getCountryStats, 
    getDeviceStats, 
    getRealtimeData,
    getVisitorsTrend 
  } = await import('./services/googleAnalytics.js');

  app.get("/api/admin/analytics/overview", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const daysAgo = req.query.days ? parseInt(req.query.days as string) : 7;
      const overview = await getAnalyticsOverview(daysAgo);
      res.json(overview);
    } catch (error) {
      console.error("Error fetching analytics overview:", error);
      res.status(500).json({ error: "Failed to fetch analytics overview" });
    }
  });

  app.get("/api/admin/analytics/top-pages", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const daysAgo = req.query.days ? parseInt(req.query.days as string) : 7;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const topPages = await getTopPages(daysAgo, limit);
      res.json(topPages);
    } catch (error) {
      console.error("Error fetching top pages:", error);
      res.status(500).json({ error: "Failed to fetch top pages" });
    }
  });

  app.get("/api/admin/analytics/countries", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const daysAgo = req.query.days ? parseInt(req.query.days as string) : 7;
      const countries = await getCountryStats(daysAgo);
      res.json(countries);
    } catch (error) {
      console.error("Error fetching country stats:", error);
      res.status(500).json({ error: "Failed to fetch country stats" });
    }
  });

  app.get("/api/admin/analytics/devices", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const daysAgo = req.query.days ? parseInt(req.query.days as string) : 7;
      const devices = await getDeviceStats(daysAgo);
      res.json(devices);
    } catch (error) {
      console.error("Error fetching device stats:", error);
      res.status(500).json({ error: "Failed to fetch device stats" });
    }
  });

  app.get("/api/admin/analytics/realtime", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const realtime = await getRealtimeData();
      res.json(realtime);
    } catch (error) {
      console.error("Error fetching realtime data:", error);
      res.status(500).json({ error: "Failed to fetch realtime data" });
    }
  });

  app.get("/api/admin/analytics/trend", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const daysAgo = req.query.days ? parseInt(req.query.days as string) : 7;
      const trend = await getVisitorsTrend(daysAgo);
      res.json(trend);
    } catch (error) {
      console.error("Error fetching visitors trend:", error);
      res.status(500).json({ error: "Failed to fetch visitors trend" });
    }
  });

  // Google Analytics Credentials Management
  app.post("/api/admin/analytics/credentials", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { credentials } = req.body;
      
      if (!credentials) {
        return res.status(400).json({ error: "Credentials JSON required" });
      }

      // Validate JSON format
      let credentialsObj;
      try {
        credentialsObj = typeof credentials === 'string' ? JSON.parse(credentials) : credentials;
      } catch {
        return res.status(400).json({ error: "Invalid JSON format" });
      }

      // Validate required fields
      if (!credentialsObj.client_email || !credentialsObj.private_key) {
        return res.status(400).json({ error: "Missing required fields (client_email, private_key)" });
      }

      // Save encrypted credentials
      await storage.saveGoogleAnalyticsCredentials(
        JSON.stringify(credentialsObj),
        req.user!.id
      );

      res.json({ success: true, message: "Credentials saved successfully" });
    } catch (error) {
      console.error("Error saving Google Analytics credentials:", error);
      res.status(500).json({ error: "Failed to save credentials" });
    }
  });

  app.get("/api/admin/analytics/credentials/status", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const hasCredentials = await storage.hasGoogleAnalyticsCredentials();
      res.json({ configured: hasCredentials });
    } catch (error) {
      console.error("Error checking credentials status:", error);
      res.status(500).json({ error: "Failed to check credentials status" });
    }
  });

  // 🇨🇺 CUBAN OPTIMIZATION: Categories API with caching
  app.get("/api/categories", async (req: AuthRequest, res) => {
    try {
      // Set caching headers for Cuban users with slow connections
      res.set({
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // 5 min cache, 10 min stale
        'ETag': `categories-${Date.now()}`,
        'Vary': 'Accept-Encoding'
      });
      
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // 🇨🇺 CUBAN OPTIMIZATION: Subcategories API with caching
  app.get("/api/subcategories", async (req: AuthRequest, res) => {
    try {
      // Set caching headers for Cuban users with slow connections
      res.set({
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // 5 min cache, 10 min stale
        'ETag': `subcategories-${Date.now()}`,
        'Vary': 'Accept-Encoding'
      });
      
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const subcategories = await storage.getSubcategories(categoryId);
      res.json(subcategories);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      res.status(500).json({ error: "Failed to fetch subcategories" });
    }
  });

  // Admin subcategories API
  // TEMP FIX: Make admin subcategories public for debugging  
  app.get("/api/admin/subcategories", async (req: AuthRequest, res) => {
    console.log("🔍 ADMIN SUBCATEGORIES: Request reached subcategories endpoint");
    try {
      const subcategories = await storage.getSubcategories();
      console.log("🔍 ADMIN SUBCATEGORIES: Found subcategories count:", subcategories.length);
      res.json(subcategories);
    } catch (error) {
      console.error("🔍 ADMIN SUBCATEGORIES: Error fetching subcategories:", error);
      console.error("🔍 ADMIN SUBCATEGORIES: Error stack:", error.stack);
      res.status(500).json({ error: "Failed to fetch subcategories", details: error.message });
    }
  });

  app.get("/api/admin/subcategories/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const subcategory = await storage.getSubcategoryById(parseInt(req.params.id));
      if (!subcategory) {
        return res.status(404).json({ error: "Subcategory not found" });
      }
      res.json(subcategory);
    } catch (error) {
      console.error("Error fetching subcategory:", error);
      res.status(500).json({ error: "Failed to fetch subcategory" });
    }
  });

  app.post("/api/admin/subcategories", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const subcategoryData = req.body;
      
      // Generate slug if not provided
      if (!subcategoryData.slug) {
        subcategoryData.slug = generateSlug(subcategoryData.nameDe || subcategoryData.name);
      }

      const validatedData = insertSubcategorySchema.parse(subcategoryData);
      const subcategory = await storage.createSubcategory(validatedData);
      res.json(subcategory);
    } catch (error) {
      console.error("Error creating subcategory:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create subcategory" });
    }
  });

  app.put("/api/admin/subcategories/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const subcategoryData = insertSubcategorySchema.partial().parse(req.body);
      const subcategory = await storage.updateSubcategory(parseInt(req.params.id), subcategoryData);
      res.json(subcategory);
    } catch (error) {
      console.error("Error updating subcategory:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update subcategory" });
    }
  });

  app.delete("/api/admin/subcategories/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const subcategoryId = parseInt(req.params.id);
      console.log(`🗑️ SERVER DELETE SUBCATEGORY: Starting deletion for subcategory ID: ${subcategoryId}`);
      
      // First update all products in this subcategory to remove subcategory reference
      console.log(`🗑️ SERVER DELETE SUBCATEGORY: Fetching products for subcategory ${subcategoryId}`);
      const products = await storage.getProducts({ subcategoryId });
      console.log(`🗑️ SERVER DELETE SUBCATEGORY: Found ${products.length} products to update`);
      
      for (const product of products) {
        console.log(`🗑️ SERVER DELETE SUBCATEGORY: Updating product ${product.id} to remove subcategory reference`);
        await storage.updateProduct(product.id, { subcategoryId: null });
      }
      console.log(`🗑️ SERVER DELETE SUBCATEGORY: All products updated successfully`);
      
      // Then delete the subcategory
      console.log(`🗑️ SERVER DELETE SUBCATEGORY: Deleting subcategory ${subcategoryId}`);
      await storage.deleteSubcategory(subcategoryId);
      console.log(`🗑️ SERVER DELETE SUBCATEGORY: Subcategory ${subcategoryId} deleted successfully`);
      
      res.json({ success: true });
    } catch (error) {
      console.error("🗑️ SERVER DELETE SUBCATEGORY: CRITICAL ERROR:", error);
      console.error("🗑️ SERVER DELETE SUBCATEGORY: Error name:", error.name);
      console.error("🗑️ SERVER DELETE SUBCATEGORY: Error message:", error.message);
      console.error("🗑️ SERVER DELETE SUBCATEGORY: Error stack:", error.stack);
      res.status(500).json({ error: "Failed to delete subcategory", details: error.message });
    }
  });



  // TEMP FIX: Make admin categories public for debugging  
  app.get("/api/admin/categories", async (req: AuthRequest, res) => {
    console.log("🔍 ADMIN CATEGORIES: Request reached categories endpoint");
    try {
      const categories = await storage.getCategories();
      console.log("🔍 ADMIN CATEGORIES: Found categories count:", categories.length);
      res.json(categories);
    } catch (error) {
      console.error("🔍 ADMIN CATEGORIES: Error fetching categories:", error);
      console.error("🔍 ADMIN CATEGORIES: Error stack:", error.stack);
      res.status(500).json({ error: "Failed to fetch categories", details: error.message });
    }
  });

  app.get("/api/admin/categories/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const category = await storage.getCategoryById(parseInt(req.params.id));
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });

  app.post("/api/admin/categories", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const categoryData = req.body;
      
      // Generate slug if not provided
      if (!categoryData.slug) {
        categoryData.slug = generateSlug(categoryData.nameEs || categoryData.name);
      }

      const validatedData = insertCategorySchema.parse(categoryData);
      const category = await storage.createCategory(validatedData);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  app.put("/api/admin/categories/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(parseInt(req.params.id), categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/admin/categories/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      console.log(`🗑️ SERVER DELETE CATEGORY: Starting deletion for category ID: ${categoryId}`);
      
      // First delete all products in this category to avoid foreign key constraints
      console.log(`🗑️ SERVER DELETE CATEGORY: Fetching products for category ${categoryId}`);
      const products = await storage.getProducts({ categoryId });
      console.log(`🗑️ SERVER DELETE CATEGORY: Found ${products.length} products to delete`);
      
      for (const product of products) {
        console.log(`🗑️ SERVER DELETE CATEGORY: Deleting product ${product.id} (${product.nameEs})`);
        await storage.deleteProduct(product.id);
      }
      console.log(`🗑️ SERVER DELETE CATEGORY: All products deleted successfully`);
      
      // Delete all subcategories in this category
      console.log(`🗑️ SERVER DELETE CATEGORY: Fetching subcategories for category ${categoryId}`);
      const subcategories = await storage.getSubcategories(categoryId);
      console.log(`🗑️ SERVER DELETE CATEGORY: Found ${subcategories.length} subcategories to delete`);
      
      for (const subcategory of subcategories) {
        console.log(`🗑️ SERVER DELETE CATEGORY: Deleting subcategory ${subcategory.id} (${subcategory.nameEs})`);
        await storage.deleteSubcategory(subcategory.id);
      }
      console.log(`🗑️ SERVER DELETE CATEGORY: All subcategories deleted successfully`);
      
      // Now delete the category
      console.log(`🗑️ SERVER DELETE CATEGORY: Deleting category ${categoryId}`);
      await storage.deleteCategory(categoryId);
      console.log(`🗑️ SERVER DELETE CATEGORY: Category ${categoryId} deleted successfully`);
      
      res.json({ success: true });
    } catch (error) {
      console.error("🗑️ SERVER DELETE CATEGORY: CRITICAL ERROR:", error);
      console.error("🗑️ SERVER DELETE CATEGORY: Error name:", error.name);
      console.error("🗑️ SERVER DELETE CATEGORY: Error message:", error.message);
      console.error("🗑️ SERVER DELETE CATEGORY: Error stack:", error.stack);
      res.status(500).json({ error: "Failed to delete category", details: error.message });
    }
  });







  // Subcategories API for category filtering
  app.get("/api/subcategories", async (req: AuthRequest, res) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const subcategories = await storage.getSubcategories(categoryId);
      res.json(subcategories);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      res.status(500).json({ error: "Failed to fetch subcategories" });
    }
  });

  app.post("/api/admin/subcategories", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const subcategoryData = req.body;
      
      console.log("🔍 Creating subcategory with data:", subcategoryData);
      
      // Generate slug if not provided
      if (!subcategoryData.slug) {
        subcategoryData.slug = generateSlug(subcategoryData.nameDe || subcategoryData.name);
      }

      const validatedData = insertSubcategorySchema.parse(subcategoryData);
      const subcategory = await storage.createSubcategory(validatedData);
      
      console.log("✅ Subcategory created successfully:", subcategory);
      res.json(subcategory);
    } catch (error) {
      console.error("❌ Error creating subcategory:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create subcategory" });
    }
  });

  app.put("/api/admin/subcategories/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const subcategoryData = req.body;
      
      const subcategory = await storage.updateSubcategory(id, subcategoryData);
      res.json(subcategory);
    } catch (error) {
      console.error("Error updating subcategory:", error);
      res.status(500).json({ error: "Failed to update subcategory" });
    }
  });

  app.delete("/api/admin/subcategories/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSubcategory(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      res.status(500).json({ error: "Failed to delete subcategory" });
    }
  });

  // 🇨🇺 CUBAN OPTIMIZATION: Products API with caching
  app.get("/api/products", async (req: AuthRequest, res) => {
    try {
      // Set caching headers for Cuban users with slow connections
      res.set({
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // 5 min cache, 10 min stale
        'ETag': `products-${Date.now()}`,
        'Vary': 'Accept-Encoding'
      });
      
      const filters = {
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
        subcategoryId: req.query.subcategoryId ? parseInt(req.query.subcategoryId as string) : undefined,
        search: req.query.search as string || undefined,
        isActive: true
      };
      
      const products = await storage.getProducts(filters);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/featured", async (req: AuthRequest, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching featured products:", error);
      res.status(500).json({ error: "Failed to fetch featured products" });
    }
  });

  app.get("/api/products/:slug", async (req: AuthRequest, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  // TEMP FIX: Override admin products route FIRST
  app.get("/api/admin/products", async (req: AuthRequest, res) => {
    console.log("🔍 ADMIN PRODUCTS: PUBLIC ROUTE REACHED!");
    try {
      const filters = {
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
        subcategoryId: req.query.subcategoryId ? parseInt(req.query.subcategoryId as string) : undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined
      };
      
      console.log("🔍 ADMIN PRODUCTS: Applying filters:", filters);
      const products = await storage.getProducts(filters);
      console.log("🔍 ADMIN PRODUCTS: Found products count:", products.length);
      res.json(products);
    } catch (error) {
      console.error("🔍 ADMIN PRODUCTS: Error fetching products:", error);
      console.error("🔍 ADMIN PRODUCTS: Error stack:", error.stack);
      res.status(500).json({ error: "Failed to fetch products", details: error.message });
    }
  });

  app.post("/api/admin/products", async (req: AuthRequest, res) => {
    try {
      // Transform the request body to match the schema
      const transformedData = {
        ...req.body,
        name: req.body.nameEs, // Use Spanish name as main name
        slug: req.body.slug || generateSlug(req.body.nameEs),
        oldPrice: req.body.oldPrice ? req.body.oldPrice.toString() : null,
        newPrice: req.body.newPrice ? req.body.newPrice.toString() : null,
        shortDescription: req.body.shortDescriptionEs,
        description: req.body.descriptionEs,
        subcategoryId: (req.body.subcategoryId === 0 || req.body.subcategoryId === null || req.body.subcategoryId === undefined || isNaN(req.body.subcategoryId)) ? null : req.body.subcategoryId, // Convert 0, null, undefined, NaN to null
      };
      
      const productData = insertProductSchema.parse(transformedData);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error: any) {
      console.error("Error creating product:", error);
      
      if (error.name === 'ZodError') {
        const validationErrors = error.errors.map((e: any) => {
          const field = e.path.join('.');
          return `${field}: ${e.message}`;
        }).join(', ');
        
        return res.status(400).json({ 
          error: "Validation error", 
          details: validationErrors,
          fields: error.errors.map((e: any) => e.path.join('.'))
        });
      }
      
      if (error.code === '23505') { // PostgreSQL unique constraint violation
        return res.status(409).json({ 
          error: "Conflict error",
          details: "Ein Produkt mit diesem Namen existiert bereits. Bitte wählen Sie einen anderen Namen."
        });
      }
      
      res.status(500).json({ 
        error: "Server error",
        details: error.message || "Unbekannter Server-Fehler"
      });
    }
  });

  app.put("/api/admin/products/:id", async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // 🔧 SLUG FIX: Load existing product to check if name changed
      const existingProduct = await storage.getProductById(id);
      if (!existingProduct) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // 🔧 CRITICAL FIX: Only generate new slug if name actually changed
      let newSlug = existingProduct.slug; // Keep existing slug by default
      
      // Check if the Spanish name (nameEs) has actually changed
      const nameChanged = req.body.nameEs && req.body.nameEs.trim() !== existingProduct.nameEs?.trim();
      
      if (nameChanged) {
        newSlug = generateSlug(req.body.nameEs);
        console.log(`🔧 SLUG UPDATE: Name changed from "${existingProduct.nameEs}" to "${req.body.nameEs}", updating slug from "${existingProduct.slug}" to "${newSlug}"`);
      } else {
        console.log(`🔧 SLUG PRESERVED: Name unchanged, keeping existing slug "${existingProduct.slug}"`);
      }
      
      // Transform the request body to match the schema (same as create)
      const transformedData = {
        ...req.body,
        name: req.body.nameEs, // Use Spanish name as main name
        slug: newSlug,
        oldPrice: req.body.oldPrice ? req.body.oldPrice.toString() : null,
        newPrice: req.body.newPrice ? req.body.newPrice.toString() : null,
        shortDescription: req.body.shortDescriptionEs,
        description: req.body.descriptionEs,
        subcategoryId: (req.body.subcategoryId === 0 || req.body.subcategoryId === null || req.body.subcategoryId === undefined || isNaN(req.body.subcategoryId)) ? null : req.body.subcategoryId, // Convert 0, null, undefined, NaN to null
      };
      
      const product = await storage.updateProduct(id, transformedData);
      res.json(product);
    } catch (error: any) {
      console.error("Error updating product:", error);
      
      if (error.name === 'ZodError') {
        const validationErrors = error.errors.map((e: any) => {
          const field = e.path.join('.');
          return `${field}: ${e.message}`;
        }).join(', ');
        
        return res.status(400).json({ 
          error: "Validation error", 
          details: validationErrors,
          fields: error.errors.map((e: any) => e.path.join('.'))
        });
      }
      
      if (error.code === '23505') { // PostgreSQL unique constraint violation
        return res.status(409).json({ 
          error: "Conflict error",
          details: "Ein Produkt mit diesem Namen existiert bereits. Bitte wählen Sie einen anderen Namen."
        });
      }
      
      if (error.code === '23503') { // PostgreSQL foreign key constraint violation
        return res.status(400).json({ 
          error: "Invalid reference",
          details: "Ungültige Kategorie oder Unterkategorie ausgewählt."
        });
      }
      
      res.status(500).json({ 
        error: "Server error",
        details: error.message || "Unbekannter Server-Fehler"
      });
    }
  });

  // Enhanced product deletion with detailed error logging
  app.delete("/api/admin/products/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`🗑️ SERVER DELETE PRODUCT: Starting deletion for product ID: ${id}`);
      
      // Check if product exists first
      const product = await storage.getProductById(id);
      if (!product) {
        console.log(`🗑️ SERVER DELETE PRODUCT: Product ${id} not found`);
        return res.status(404).json({ error: "Product not found" });
      }
      
      console.log(`🗑️ SERVER DELETE PRODUCT: Found product ${id} (${product.nameEs}), proceeding with deletion`);
      await storage.deleteProduct(id);
      console.log(`🗑️ SERVER DELETE PRODUCT: Product ${id} deleted successfully`);
      
      res.json({ success: true });
    } catch (error) {
      console.error("🗑️ SERVER DELETE PRODUCT: CRITICAL ERROR:", error);
      console.error("🗑️ SERVER DELETE PRODUCT: Error name:", error.name);
      console.error("🗑️ SERVER DELETE PRODUCT: Error message:", error.message);
      console.error("🗑️ SERVER DELETE PRODUCT: Error stack:", error.stack);
      res.status(500).json({ 
        error: "Failed to delete product",
        details: error.message,
        errorName: error.name
      });
    }
  });

  // Duplicate product
  app.post("/api/admin/products/:id/duplicate", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const originalProduct = await storage.getProductById(id);
      
      if (!originalProduct) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Create duplicated product with modified names
      const duplicatedProduct = {
        ...originalProduct,
        nameEs: `${originalProduct.nameEs} - Kopie`,
        nameDe: `${originalProduct.nameDe} - Kopie`,
        nameEn: `${originalProduct.nameEn} - Copy`,
        name: `${originalProduct.name} - Kopie`,
        slug: `${originalProduct.slug}-kopie-${Date.now()}`,
        isActive: false, // Set as inactive by default
        isFeatured: false, // Remove featured status
        sku: originalProduct.sku ? `${originalProduct.sku}-COPY` : null,
      };

      // Remove the id so it gets auto-generated
      const { id: _, createdAt, updatedAt, ...productToCreate } = duplicatedProduct;

      const newProduct = await storage.createProduct(productToCreate);
      res.json(newProduct);
    } catch (error: any) {
      console.error("Error duplicating product:", error);
      res.status(500).json({ 
        error: "Server error",
        details: error.message || "Fehler beim Duplizieren des Produkts"
      });
    }
  });


  // Inquiries API
  app.post("/api/inquiries", async (req: AuthRequest, res) => {
    try {
      const inquiryData = insertInquirySchema.parse(req.body);
      const inquiry = await storage.createInquiry(inquiryData);
      res.json({ success: true, inquiry });
    } catch (error) {
      console.error("Error creating inquiry:", error);
      res.status(500).json({ error: "Failed to submit inquiry" });
    }
  });

  // TEMP FIX: Make admin inquiries public for debugging  
  app.get("/api/admin/inquiries", async (req: AuthRequest, res) => {
    console.log("🔍 ADMIN INQUIRIES: Request reached inquiries endpoint");
    try {
      const inquiries = await storage.getInquiries();
      console.log("🔍 ADMIN INQUIRIES: Found inquiries count:", inquiries.length);
      res.json(inquiries);
    } catch (error) {
      console.error("🔍 ADMIN INQUIRIES: Error fetching inquiries:", error);
      console.error("🔍 ADMIN INQUIRIES: Error stack:", error.stack);
      res.status(500).json({ error: "Failed to fetch inquiries", details: error.message });
    }
  });

  app.put("/api/admin/inquiries/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const inquiryData = req.body;
      
      const inquiry = await storage.updateInquiry(id, inquiryData);
      res.json(inquiry);
    } catch (error) {
      console.error("Error updating inquiry:", error);
      res.status(500).json({ error: "Failed to update inquiry" });
    }
  });

  app.delete("/api/admin/inquiries/:id", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteInquiry(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting inquiry:", error);
      res.status(500).json({ error: "Failed to delete inquiry" });
    }
  });




  // Good Bot Detection - Allow legitimate crawlers and search engines
  function isGoodBot(userAgent: string, ip: string): boolean {
    const goodBots = [
      // Search engines
      'googlebot', 'bingbot', 'duckduckbot', 'baiduspider', 'yandexbot',
      // Social media crawlers
      'facebookexternalhit', 'twitterbot', 'linkedinbot', 'whatsapp',
      // Monitoring and SEO tools
      'uptimerobot', 'pingdom', 'gtmetrix', 'site24x7',
      // Archive and research
      'archive.org', 'wayback', 'ia_archiver',
      // Security scanners (legitimate)
      'securitytrails', 'shodan'
    ];

    const lowerUA = userAgent.toLowerCase();
    return goodBots.some(bot => lowerUA.includes(bot));
  }

  // Advanced Bot Detection - Check for suspicious patterns
  function detectSuspiciousBot(fingerprint: any, mouseAnalysis: any, timeSpent: number, userAgent: string): { isBot: boolean, reason: string, score: number } {
    let botScore = 0;
    let reasons: string[] = [];

    // Check fingerprint anomalies
    if (!fingerprint) {
      botScore += 50;
      reasons.push('missing_fingerprint');
    } else {
      // Suspicious screen sizes (common bot values)
      if (fingerprint.screenWidth === 1024 && fingerprint.screenHeight === 768) {
        botScore += 15;
        reasons.push('common_bot_resolution');
      }
      
      // No plugins at all (suspicious for real browsers)
      if (fingerprint.plugins.length === 0) {
        botScore += 20;
        reasons.push('no_plugins');
      }

      // Suspicious timezone mismatches
      if (fingerprint.timezone === 'UTC' || !fingerprint.timezone) {
        botScore += 10;
        reasons.push('suspicious_timezone');
      }

      // Hardware concurrency too high (server environments)
      if (fingerprint.hardwareConcurrency > 16) {
        botScore += 15;
        reasons.push('high_cpu_count');
      }

      // Missing or suspicious language settings
      if (!fingerprint.language || fingerprint.language === 'en') {
        botScore += 5;
        reasons.push('generic_language');
      }
    }

    // Mouse movement analysis
    if (!mouseAnalysis || mouseAnalysis.score < 50) {
      botScore += 30;
      reasons.push('poor_mouse_behavior');
    }

    // Too fast completion (bots often complete immediately)
    if (timeSpent < 2000) {
      botScore += 25;
      reasons.push('too_fast');
    }

    // User agent analysis
    const suspiciousUA = [
      'headless', 'phantom', 'selenium', 'webdriver', 'python', 'curl', 'wget', 'httpclient',
      'bot', 'spider', 'crawler', 'scraper', 'automation'
    ];
    
    const lowerUA = userAgent.toLowerCase();
    if (suspiciousUA.some(sus => lowerUA.includes(sus))) {
      botScore += 40;
      reasons.push('suspicious_user_agent');
    }

    // Missing common browser headers
    if (!userAgent.includes('Mozilla') || !userAgent.includes('AppleWebKit')) {
      botScore += 20;
      reasons.push('non_browser_ua');
    }

    return {
      isBot: botScore >= 60, // Threshold for bot detection
      reason: reasons.join(', '),
      score: botScore
    };
  }

  // Custom Human Verification Endpoint
  app.post("/api/verify-human", async (req: AuthRequest, res) => {
    try {
      const { fingerprint, mouseAnalysis, timeSpent, stage } = req.body;
      
      // Get client information
      const forwarded = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip;
      const clientIp = Array.isArray(forwarded) ? forwarded[0] : forwarded.toString().split(',')[0].trim();
      const userAgent = req.headers['user-agent'] || '';

      console.log(`🤖 CUSTOM BOT CHECK: IP ${clientIp}, Stage: ${stage}`);

      // Check if it's a good bot first
      if (isGoodBot(userAgent, clientIp)) {
        console.log(`✅ GOOD BOT DETECTED: ${userAgent.substring(0, 50)}...`);
        res.cookie('human_verified', 'true', {
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for good bots
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/'
        });
        return res.json({ success: true, reason: 'good_bot' });
      }

      // Advanced bot detection
      const botAnalysis = detectSuspiciousBot(fingerprint, mouseAnalysis, timeSpent, userAgent);
      
      console.log(`🔍 BOT ANALYSIS:`, {
        ip: clientIp,
        isBot: botAnalysis.isBot,
        score: botAnalysis.score,
        reason: botAnalysis.reason,
        mouseScore: mouseAnalysis?.score || 0,
        timeSpent,
        userAgent: userAgent.substring(0, 100)
      });

      if (botAnalysis.isBot) {
        console.log(`🚫 BOT DETECTED: IP ${clientIp}, Score: ${botAnalysis.score}, Reason: ${botAnalysis.reason}`);
        return res.status(403).json({ 
          success: false, 
          reason: `Automated access detected: ${botAnalysis.reason}`,
          botScore: botAnalysis.score
        });
      }

      // Human verification successful
      res.cookie('human_verified', 'true', {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for humans
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      
      console.log(`✅ HUMAN VERIFIED: IP ${clientIp}, Mouse Score: ${mouseAnalysis?.score || 0}, Time: ${timeSpent}ms`);
      res.json({ 
        success: true, 
        humanScore: 100 - botAnalysis.score,
        mouseScore: mouseAnalysis?.score || 0
      });

    } catch (error) {
      console.error("💥 HUMAN VERIFICATION ERROR:", error);
      res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
      });
    }
  });

  // Check if user needs custom human verification
  app.get("/api/check-verification", async (req: AuthRequest, res) => {
    try {
      // Get client information
      const forwarded = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip;
      const clientIp = Array.isArray(forwarded) ? forwarded[0] : forwarded.toString().split(',')[0].trim();
      const userAgent = req.headers['user-agent'] || '';
      
      // Skip verification for local/development IPs
      if (clientIp === '127.0.0.1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.') || clientIp === 'unknown') {
        console.log(`🔐 VERIFICATION SKIP: Local IP ${clientIp}`);
        return res.json({ needsVerification: false, reason: 'local' });
      }

      // Check if it's a good bot (search engines, etc.)
      if (isGoodBot(userAgent, clientIp)) {
        console.log(`🤖 GOOD BOT BYPASS: ${userAgent.substring(0, 50)}...`);
        return res.json({ needsVerification: false, reason: 'good_bot' });
      }

      // Check if IP is from Cuba (exclude from verification)
      let country = 'OTHER';
      try {
        const geo = geoip.lookup(clientIp);
        if (geo && geo.country) {
          country = geo.country;
          console.log(`🌍 GEO LOOKUP: IP ${clientIp} → ${geo.city || 'Unknown'}, ${country}`);
        }
      } catch (error) {
        console.log(`🌍 GEO ERROR: ${error.message}`);
      }

      // Skip verification for Cuban users
      if (country === 'CU') {
        console.log(`🇨🇺 CUBA BYPASS: IP ${clientIp} from Cuba - no verification needed`);
        return res.json({ needsVerification: false, reason: 'cuba' });
      }

      // Check if already verified with custom system
      const isVerified = req.cookies.human_verified === 'true';
      
      if (isVerified) {
        console.log(`✅ ALREADY VERIFIED: IP ${clientIp} has valid human verification cookie`);
        return res.json({ needsVerification: false, reason: 'verified' });
      }

      console.log(`🤖 CUSTOM VERIFICATION NEEDED: IP ${clientIp} from ${country}`);
      res.json({ 
        needsVerification: true, 
        country: country,
        ip: clientIp,
        verificationType: 'custom'
      });
      
    } catch (error) {
      console.error("💥 VERIFICATION CHECK ERROR:", error);
      // On error, default to requiring verification for safety
      res.json({ needsVerification: true, reason: 'error' });
    }
  });


  // Geolocation endpoint for language detection
  app.get("/api/geolocation", async (req: AuthRequest, res) => {
    try {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      
      // Get real IP address (handle proxy headers)
      const realIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || ip;
      const clientIp = Array.isArray(realIp) ? realIp[0] : realIp.toString().split(',')[0].trim();
      
      console.log(`🌍 GEOLOCATION: Original=${ip}, Real=${clientIp}`);
      
      // Use geoip-lite for accurate country detection
      let country = 'CU';
      if (clientIp !== 'unknown' && clientIp !== '127.0.0.1' && !clientIp.startsWith('192.168.') && !clientIp.startsWith('10.')) {
        const geo = geoip.lookup(clientIp);
        if (geo && geo.country) {
          country = geo.country;
          console.log(`🌍 GEOLOCATION SUCCESS: IP ${clientIp} → ${country} (${geo.city || 'Unknown city'})`);
        } else {
          console.log(`🌍 GEOLOCATION FAILED: IP ${clientIp} not found, using default CU`);
        }
      } else {
        console.log(`🌍 LOCAL IP: ${clientIp} is local/development IP, using default CU`);
      }
      
      // Map countries to languages - NO GERMAN for regular users!
      // German is ONLY available for logged-in admins
      let language = 'es'; // Spanish as global default
      
      switch(country) {
        case 'US':
        case 'GB':
        case 'CA':
        case 'AU':
        case 'NZ':
        case 'IE':
          language = 'en';
          break;
        // NO GERMAN CASE - German is admin-only!
        // case 'DE': // REMOVED - no auto-German anymore
        // case 'AT': // REMOVED - no auto-German anymore  
        // case 'CH': // REMOVED - no auto-German anymore
        default:
          language = 'es'; // Spanish as default (including for German-speaking countries)
      }
      
      res.json({ 
        country: country,
        language 
      });
    } catch (error) {
      console.error("Geolocation error:", error);
      res.json({ 
        country: 'CU', // Default to Cuba on error
        language: 'es' // Default to Spanish on error
      });
    }
  });

  // Static file serving for uploads
  app.use('/uploads', express.static(uploadsDir));

  // Image Upload Routes
  app.get("/api/admin/images", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const images = await storage.getUploadedImages();
      res.json(images);
    } catch (error) {
      console.error("Error fetching images:", error);
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  // SIMPLE UPLOAD: No security restrictions per user request
  app.post("/api/admin/images/upload", upload.array("images", 20), async (req, res) => {
    console.log("📁 SIMPLE UPLOAD: Direct file upload", {
      fileCount: req.files?.length || 0
    });
    
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "Keine Dateien hochgeladen" });
      }

      const uploadedImages = [];
      
      for (const file of files) {
        console.log("📁 FILE UPLOAD: Processing file", {
          filename: file.originalname,
          size: file.size
        });

        const savedFilename = await compressUploadedImage(file.path, file.originalname);
        
        const filepath = path.join(uploadsDir, savedFilename);
        const stats = fs.statSync(filepath);
        
        const imageData = {
          filename: savedFilename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: stats.size,
          url: `/uploads/${savedFilename}`,
          uploadedBy: null // No user tracking
        };

        const savedImage = await storage.createUploadedImage(imageData);
        uploadedImages.push(savedImage);

        console.log("✅ IMAGE SAVED:", {
          id: savedImage.id,
          filename: savedImage.filename,
          size: savedImage.size
        });
      }

      res.json({
        success: true,
        images: uploadedImages,
        message: `${uploadedImages.length} Bilder erfolgreich hochgeladen`
      });

    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ 
        error: "Upload fehlgeschlagen - Server-Fehler",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // SECURITY: Protected Image Deletion with Parameter Validation
  app.delete("/api/admin/images/:id", isAuthenticated, validateParams(idParamSchema), async (req: AuthRequest, res) => {
    console.log("🔒 SECURITY DELETE: Protected image deletion request", {
      imageId: req.params.id,
      userId: (req as any).session?.userId,
      ip: req.ip
    });
    
    try {
      const imageId = parseInt(req.params.id);
      
      // SECURITY: Validate numeric ID
      if (isNaN(imageId) || imageId <= 0) {
        console.warn("🔒 SECURITY DELETE: Invalid image ID", { id: req.params.id });
        return res.status(400).json({ 
          error: "Ungültige Bild-ID",
          code: "INVALID_ID"
        });
      }
      
      const image = await storage.getUploadedImageById(imageId);
      
      if (!image) {
        console.warn("🔒 SECURITY DELETE: Image not found", { imageId });
        return res.status(404).json({ 
          error: "Bild nicht gefunden",
          code: "NOT_FOUND"
        });
      }

      // Delete file from filesystem
      const filePath = path.join(uploadsDir, image.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("🔒 SECURITY DELETE: File deleted from filesystem", { filename: image.filename });
      }

      await storage.deleteUploadedImage(imageId);
      
      console.log("🔒 SECURITY DELETE: Image deletion successful", { 
        imageId, 
        filename: image.filename 
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("🔒 SECURITY DELETE ERROR:", error);
      res.status(500).json({ 
        error: "Löschen fehlgeschlagen - Server-Fehler",
        code: "DELETE_ERROR"
      });
    }
  });


  // Site Settings API routes
  app.post("/api/admin/site-settings", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { key, value } = req.body;
      
      if (!key || !value) {
        return res.status(400).json({ error: "Key and value are required" });
      }
      
      const setting = await storage.updateSiteSetting(key, value);
      res.json(setting);
    } catch (error) {
      console.error("Error updating site setting:", error);
      res.status(500).json({ error: "Failed to update site setting" });
    }
  });

  app.get("/api/admin/site-settings", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching site settings:", error);
      res.status(500).json({ error: "Failed to fetch site settings" });
    }
  });

  // Public endpoint for site settings (for hero images, hero titles and contact info on public pages)
  app.get("/api/site-settings", async (req: AuthRequest, res) => {
    try {
      const settings = await storage.getSiteSettings();
      // Return image-related settings, hero titles and contact information for public access
      const publicSettings = settings.filter(setting => 
        setting.key.includes('hero_image_') || 
        setting.key.includes('hero_title_') ||  // FIX: Include hero titles
        setting.key.includes('product_fallback_image') ||
        setting.key.includes('contact_') ||
        setting.type === 'image'
      );
      res.json(publicSettings);
    } catch (error) {
      console.error("Error fetching public site settings:", error);
      res.status(500).json({ error: "Failed to fetch site settings" });
    }
  });


  // DIRECT LOGIN OVERRIDE - WORKING VERSION
  app.post("/api/admin/login", (req, res) => {
    import('bcryptjs').then(bcryptModule => {
      import('pg').then(pgModule => {
        const bcrypt = bcryptModule.default;
        const { Pool } = pgModule.default;
        
        (async () => {
          try {
            const { username, password } = req.body;
            console.log("🔐 LOGIN ATTEMPT:", username);
            
            const pool = new Pool({ connectionString: process.env.DATABASE_URL });
            const client = await pool.connect();
            const result = await client.query("SELECT * FROM admin_users WHERE username = $1", [username]);
            
            if (result.rows.length > 0 && result.rows[0].is_active) {
              const isValid = await bcrypt.compare(password, result.rows[0].password);
              console.log("✅ Password valid:", isValid);
              
              if (isValid) {
                client.release();
                console.log("🎉 LOGIN SUCCESS!");
                return res.json({ 
                  success: true, 
                  user: { 
                    id: result.rows[0].id, 
                    username: result.rows[0].username 
                  } 
                });
              }
            }
            
            client.release();
            console.log("❌ Invalid credentials");
            res.status(401).json({ error: "Invalid credentials" });
          } catch (error) {
            console.error("💥 Login error:", error);
            res.status(500).json({ error: "Login failed: " + (error as Error).message });
          }
        })();
      });
    });
  });

  // Setup SEO routes (robots.txt, sitemap.xml, structured data)
  setupSEO(app);

  const httpServer = createServer(app);
  return httpServer;
}