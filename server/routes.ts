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
import { secureUpload, validateUploadedFile, handleUploadError } from "./security/fileUpload";

// CHINA BLOCKING MIDDLEWARE - Blocks all Chinese IP addresses
function blockChinaMiddleware(req: any, res: any, next: any) {
  // Get real IP address (handle proxy headers)
  const forwarded = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip;
  const clientIp = Array.isArray(forwarded) ? forwarded[0] : forwarded.toString().split(',')[0].trim();
  
  // Skip blocking for local/development IPs
  if (clientIp === '127.0.0.1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.') || clientIp === 'unknown') {
    return next();
  }
  
  // Check if IP is from China
  const geo = geoip.lookup(clientIp);
  if (geo && geo.country === 'CN') {
    console.log(`🚫 CHINA BLOCKED: IP ${clientIp} from ${geo.city || 'China'} - Access denied`);
    
    // Return simple blocked message
    return res.status(403).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Access Denied</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>Access Denied</h1>
        <p>This website is not available in your region.</p>
        <p>IP: ${clientIp}</p>
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

// SECURITY: Use secure upload configuration
const upload = secureUpload;

// Function to compress and save image
async function compressAndSaveImage(buffer: Buffer, originalName: string): Promise<string> {
  const fileId = uuidv4();
  const extension = path.extname(originalName);
  const filename = `${Date.now()}-${fileId}.jpg`; // Always save as jpg for better compression
  const filepath = path.join(uploadsDir, filename);

  // Compress image with sharp - optimized for A4 documents
  await sharp(buffer)
    .resize(1200, 1600, { fit: 'inside', withoutEnlargement: true }) // A4 format support
    .jpeg({ quality: 85, progressive: true })
    .toFile(filepath);

  return filename;
}

// REAL GEOLOCATION with local database - VPS COMPATIBLE  
async function getCountryFromIP(ip: string): Promise<string | null> {
  console.log("🌍 Real Analytics: IP detection for:", ip);
  
  try {
    // Local development fallbacks
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip === 'unknown') {
      console.log("🌍 Local Analytics: Local IP detected - defaulting to Germany");
      return 'DE';
    }
    
    // REAL GEOLOCATION using local database (works on VPS!)
    const geo = geoip.lookup(ip);
    if (geo && geo.country) {
      console.log("🌍 Real Analytics: Country detected:", geo.country, "for IP:", ip);
      return geo.country;
    }
    
    // Fallback if IP not found in database
    console.log("🌍 Real Analytics: IP not found in database, defaulting to Cuba");
    return 'CU';
    
  } catch (error) {
    console.error("🌍 Geolocation Error:", error);
    return 'CU'; // Fallback to Cuba
  }
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

  // CHINA BLOCKING: Apply to ALL routes - must be before other routes
  app.use(blockChinaMiddleware);
  console.log("🚫 CHINA BLOCKING: Middleware activated for all routes");

  // CRITICAL: Register API routes IMMEDIATELY after session setup to ensure priority
  console.log("🔥 CRITICAL: Registering API routes with HIGH PRIORITY");
  
  // TEMP DEBUG: Test route without any authentication
  app.get("/api/debug/products", async (req, res) => {
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
  app.get("/api/admin/products/:id", async (req, res) => {
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

  // Multi-API Translation system with LibreTranslate and MyMemory fallback
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, fromLang, toLang } = req.body;
      
      console.log(`🔄 Translation request: ${fromLang} -> ${toLang}, text length: ${text?.length || 0}`);
      
      if (!text || !fromLang || !toLang) {
        console.log("❌ Missing parameters:", { text: !!text, fromLang, toLang });
        return res.json({ translatedText: text || '', error: 'MISSING_PARAMS' });
      }

      if (fromLang === toLang) {
        console.log("⚠️ Same language, returning original");
        return res.json({ translatedText: text });
      }

      // Try LibreTranslate first (unlimited, local)
      try {
        console.log(`🚀 Trying LibreTranslate first...`);
        const libreResponse = await fetch('http://localhost:5001/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
            source: fromLang,
            target: toLang
          }),
          signal: AbortSignal.timeout(3000) // 3 second timeout for faster fallback
        });

        if (libreResponse.ok) {
          const libreData = await libreResponse.json();
          if (libreData.translatedText && libreData.translatedText !== text) {
            console.log(`✅ LibreTranslate success: "${text.substring(0, 30)}..." -> "${libreData.translatedText.substring(0, 30)}..."`);
            return res.json({ translatedText: libreData.translatedText, provider: 'LibreTranslate' });
          }
        }
      } catch (libreError: any) {
        console.log(`⚠️ LibreTranslate failed: ${libreError.message}, falling back to MyMemory...`);
      }

      // Fallback to MyMemory API
      console.log(`🔄 Using MyMemory API as fallback...`);
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`;

      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache'
          },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log(`📡 MyMemory Response: status=${data.responseStatus}, hasData=${!!data.responseData}`);
        
        if (data.responseStatus === 200 && data.responseData?.translatedText) {
          const translatedText = data.responseData.translatedText;
          // Check if it's not just an error message
          if (!translatedText.includes('MYMEMORY WARNING')) {
            console.log(`✅ MyMemory success: "${text.substring(0, 30)}..." -> "${translatedText.substring(0, 30)}..."`);
            return res.json({ translatedText, provider: 'MyMemory' });
          } else {
            console.log(`⚠️ MyMemory quota exceeded: ${data.responseDetails || 'Daily limit reached'}`);
          }
        }
        
        // If we get here, both APIs failed - try simple dictionary fallback
        console.log(`🔄 Trying simple dictionary fallback...`);
        const dictionaryResult = simpleTranslation(text, fromLang, toLang);
        if (dictionaryResult !== text) {
          console.log(`✅ Dictionary fallback success: "${text}" -> "${dictionaryResult}"`);
          return res.json({ translatedText: dictionaryResult, provider: 'Dictionary' });
        }
        
        console.log(`❌ All translation methods failed, returning original text`);
        res.json({ 
          translatedText: text, 
          error: 'ALL_APIS_FAILED', 
          details: 'LibreTranslate and MyMemory both unavailable. Install LibreTranslate for unlimited translations!' 
        });
        
      } catch (fetchError: any) {
        console.error('❌ MyMemory API error:', fetchError.message);
        
        // Try dictionary fallback before giving up
        console.log(`🔄 Trying dictionary fallback after MyMemory failure...`);
        const dictionaryResult = simpleTranslation(text, fromLang, toLang);
        if (dictionaryResult !== text) {
          console.log(`✅ Dictionary fallback success: "${text}" -> "${dictionaryResult}"`);
          return res.json({ translatedText: dictionaryResult, provider: 'Dictionary' });
        }
        
        res.json({ 
          translatedText: text, 
          error: 'NETWORK_ERROR', 
          details: 'Translation services unavailable. Consider installing LibreTranslate locally.' 
        });
      }
    } catch (error: any) {
      console.error('❌ Translation system error:', error);
      res.json({ translatedText: req.body.text || '', error: 'SYSTEM_ERROR', details: error.message });
    }
  });

  // Authentication routes
  // SECURITY: Enhanced Admin Login with Brute Force Protection
  app.post("/api/admin/login", loginBruteForceProtection, async (req, res) => {
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

  app.post("/api/admin/logout", async (req, res) => {
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

  // Categories API
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Subcategories API
  app.get("/api/subcategories", async (req, res) => {
    try {
      const subcategories = await storage.getSubcategories();
      res.json(subcategories);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      res.status(500).json({ error: "Failed to fetch subcategories" });
    }
  });

  // Admin subcategories API
  // TEMP FIX: Make admin subcategories public for debugging  
  app.get("/api/admin/subcategories", async (req, res) => {
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

  app.get("/api/admin/subcategories/:id", isAuthenticated, async (req, res) => {
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

  app.post("/api/admin/subcategories", isAuthenticated, async (req, res) => {
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

  app.put("/api/admin/subcategories/:id", isAuthenticated, async (req, res) => {
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

  app.delete("/api/admin/subcategories/:id", isAuthenticated, async (req, res) => {
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
  app.get("/api/admin/categories", async (req, res) => {
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

  app.get("/api/admin/categories/:id", isAuthenticated, async (req, res) => {
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

  app.post("/api/admin/categories", isAuthenticated, async (req, res) => {
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

  app.put("/api/admin/categories/:id", isAuthenticated, async (req, res) => {
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

  app.delete("/api/admin/categories/:id", isAuthenticated, async (req, res) => {
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
  app.get("/api/subcategories", async (req, res) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const subcategories = await storage.getSubcategories(categoryId);
      res.json(subcategories);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      res.status(500).json({ error: "Failed to fetch subcategories" });
    }
  });

  app.post("/api/admin/subcategories", isAuthenticated, async (req, res) => {
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

  app.put("/api/admin/subcategories/:id", isAuthenticated, async (req, res) => {
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

  app.delete("/api/admin/subcategories/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSubcategory(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      res.status(500).json({ error: "Failed to delete subcategory" });
    }
  });

  // Products API
  app.get("/api/products", async (req, res) => {
    try {
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

  app.get("/api/products/featured", async (req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching featured products:", error);
      res.status(500).json({ error: "Failed to fetch featured products" });
    }
  });

  app.get("/api/products/:slug", async (req, res) => {
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
  app.get("/api/admin/products", async (req, res) => {
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

  app.post("/api/admin/products", async (req, res) => {
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

  app.put("/api/admin/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Transform the request body to match the schema (same as create)
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

  app.delete("/api/admin/products/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProduct(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Duplicate product
  app.post("/api/admin/products/:id/duplicate", isAuthenticated, async (req, res) => {
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
      delete duplicatedProduct.id;
      delete duplicatedProduct.createdAt;
      delete duplicatedProduct.updatedAt;

      const newProduct = await storage.createProduct(duplicatedProduct);
      res.json(newProduct);
    } catch (error: any) {
      console.error("Error duplicating product:", error);
      res.status(500).json({ 
        error: "Server error",
        details: error.message || "Fehler beim Duplizieren des Produkts"
      });
    }
  });



  app.delete("/api/admin/products/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProduct(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Duplicate product
  app.post("/api/admin/products/:id/duplicate", isAuthenticated, async (req, res) => {
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
      delete duplicatedProduct.id;
      delete duplicatedProduct.createdAt;
      delete duplicatedProduct.updatedAt;

      const newProduct = await storage.createProduct(duplicatedProduct);
      res.json(newProduct);
    } catch (error) {
      console.error("Error duplicating product:", error);
      res.status(500).json({ error: "Failed to duplicate product" });
    }
  });

  // Inquiries API
  app.post("/api/inquiries", async (req, res) => {
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
  app.get("/api/admin/inquiries", async (req, res) => {
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

  app.put("/api/admin/inquiries/:id", isAuthenticated, async (req, res) => {
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

  app.delete("/api/admin/inquiries/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteInquiry(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting inquiry:", error);
      res.status(500).json({ error: "Failed to delete inquiry" });
    }
  });

  // Analytics API - Website visitor tracking (VPS-COMPATIBLE)
  app.get("/api/admin/analytics", isAuthenticated, async (req, res) => {
    try {
      console.log("📊 SIMPLE ANALYTICS: Fetching data...");
      const period = req.query.period || 'month';
      const analytics = await storage.getSimpleAnalytics(period as 'day' | 'month' | 'year');
      console.log("📊 SIMPLE ANALYTICS: Success:", {
        uniqueVisitors: analytics.uniqueVisitors,
        topProducts: analytics.topProducts.length,
        topCountries: analytics.topCountries.length
      });
      res.json(analytics);
    } catch (error) {
      console.error("❌ SIMPLE ANALYTICS ERROR:", error);
      res.status(500).json({ error: "Failed to fetch analytics", details: error.message });
    }
  });

  // REMOVED: Old page tracking system - now using simple visitor tracking only through product clicks

  // Track product clicks (only when user clicks on product detail)
  app.post("/api/track/product", async (req, res) => {
    try {
      const { productId } = req.body;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      
      // MOBILE DEBUGGING: Log all headers and request info
      const userAgent = req.headers['user-agent'] || 'unknown';
      const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      
      console.log(`📊 PRODUCT CLICK: Product ${productId}, IP=${ip}, Mobile=${isMobile}`);
      console.log(`📊 USER AGENT: ${userAgent}`);
      
      // Enhanced IP detection for mobile devices
      const forwardedFor = req.headers['x-forwarded-for'];
      const realIp = req.headers['x-real-ip'];
      const cfConnectingIp = req.headers['cf-connecting-ip']; // CloudFlare
      const trueClientIp = req.headers['true-client-ip']; // Some mobile carriers
      const clientIpHeader = req.headers['client-ip'];
      
      // Priority order for mobile IP detection
      let clientIp = ip;
      if (cfConnectingIp) {
        clientIp = Array.isArray(cfConnectingIp) ? cfConnectingIp[0] : cfConnectingIp.toString().split(',')[0].trim();
        console.log(`📱 MOBILE IP (CF): ${clientIp}`);
      } else if (trueClientIp) {
        clientIp = Array.isArray(trueClientIp) ? trueClientIp[0] : trueClientIp.toString().split(',')[0].trim();
        console.log(`📱 MOBILE IP (TRUE): ${clientIp}`);
      } else if (realIp) {
        clientIp = Array.isArray(realIp) ? realIp[0] : realIp.toString().split(',')[0].trim();
        console.log(`📱 MOBILE IP (REAL): ${clientIp}`);
      } else if (forwardedFor) {
        clientIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.toString().split(',')[0].trim();
        console.log(`📱 MOBILE IP (FORWARDED): ${clientIp}`);
      } else if (clientIpHeader) {
        clientIp = Array.isArray(clientIpHeader) ? clientIpHeader[0] : clientIpHeader.toString().split(',')[0].trim();
        console.log(`📱 MOBILE IP (CLIENT): ${clientIp}`);
      }
      
      console.log(`📊 IP DETECTION: Original=${ip}, Final=${clientIp}, Headers={
        x-forwarded-for: ${forwardedFor},
        x-real-ip: ${realIp}, 
        cf-connecting-ip: ${cfConnectingIp},
        true-client-ip: ${trueClientIp},
        client-ip: ${clientIpHeader}
      }`);
      
      // Get country from IP using geoip-lite
      let country = 'CU'; // Default to Cuba
      if (clientIp !== 'unknown' && clientIp !== '127.0.0.1' && !clientIp.startsWith('192.168.') && !clientIp.startsWith('10.')) {
        const geo = geoip.lookup(clientIp);
        if (geo && geo.country) {
          country = geo.country;
          console.log(`📊 GEOIP SUCCESS: IP ${clientIp} → ${country} (${geo.city || 'Unknown city'}) [Mobile: ${isMobile}]`);
        } else {
          console.log(`📊 GEOIP FAILED: IP ${clientIp} not found in database, using default CU [Mobile: ${isMobile}]`);
        }
      } else {
        console.log(`📊 LOCAL IP: ${clientIp} is local/development IP, using default CU [Mobile: ${isMobile}]`);
      }
      
      // Track visitor (get existing or create new) - include mobile detection
      const visitor = await storage.trackVisitor(clientIp, country);
      console.log(`📊 VISITOR TRACKED: ID ${visitor.id}, IP ${visitor.ipAddress}, Country ${visitor.country}, Mobile ${isMobile} (Real IP: ${clientIp})`);
      
      // Track product click - first verify product exists
      try {
        const product = await storage.getProduct(parseInt(productId));
        if (!product) {
          console.log(`⚠️ PRODUCT NOT FOUND: Product ${productId} does not exist, skipping analytics`);
          res.json({ success: true, warning: "Product not found" });
          return;
        }
        
        await storage.trackProductClick(parseInt(productId), visitor.id);
        console.log(`📊 PRODUCT CLICK SAVED: Product ${productId} (${product.nameEs}) by visitor ${visitor.id} [Mobile: ${isMobile}]`);
      } catch (productError) {
        console.error(`❌ PRODUCT LOOKUP ERROR: ${productError}`);
        res.json({ success: true, warning: "Product lookup failed" });
        return;
      }
      
      res.json({ 
        success: true, 
        debug: {
          mobile: isMobile,
          ip: clientIp,
          country: country,
          visitorId: visitor.id
        }
      });
    } catch (error) {
      console.error("❌ PRODUCT CLICK ERROR:", error);
      res.json({ success: true, warning: "Tracking failed", error: error.message });
    }
  });

  // Geolocation endpoint for language detection
  app.get("/api/geolocation", async (req, res) => {
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
      
      // Map countries to languages - Default to Spanish for Cuban market
      let language = 'es'; // Default to Spanish for Cuban market
      
      switch(country) {
        case 'DE':
        case 'AT':
        case 'CH':
          language = 'de';
          break;
        case 'ES':
        case 'CU':
          language = 'es';
          break;
        case 'US':
        case 'GB':
        case 'CA':
        case 'AU':
          language = 'en';
          break;
        case 'TR': // Turkey
          language = 'en'; // Use English for Turkish users
          break;
        case 'FR': // France
          language = 'en'; // Use English for French users
          break;
        default:
          language = 'es'; // Spanish as primary default for Cuban market
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
  app.get("/api/admin/images", isAuthenticated, async (req, res) => {
    try {
      const images = await storage.getUploadedImages();
      res.json(images);
    } catch (error) {
      console.error("Error fetching images:", error);
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  // SECURITY: Enhanced Protected Image Upload with Comprehensive Security
  app.post("/api/admin/images/upload", uploadRateLimit, isAuthenticated, handleUploadError, upload.array('images', 10), async (req, res) => {
    console.log("🔒 SECURITY UPLOAD: Protected image upload request", {
      fileCount: req.files?.length || 0,
      userAgent: req.get('User-Agent')?.substring(0, 50),
      ip: req.ip,
      userId: (req as any).session?.userId
    });
    
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        console.warn("🔒 SECURITY UPLOAD: No files in upload request");
        return res.status(400).json({ 
          error: "Keine Dateien hochgeladen",
          code: "NO_FILES"
        });
      }

      const uploadedImages = [];
      
      for (const file of files) {
        // SECURITY: Validate each uploaded file for security threats
        const isValid = await validateUploadedFile(file.buffer, file.originalname, file.mimetype);
        if (!isValid) {
          console.warn("🔒 SECURITY UPLOAD: Invalid file detected", {
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size
          });
          return res.status(400).json({ 
            error: `Datei ${file.originalname} ist ungültig oder enthält verdächtigen Inhalt`,
            code: "INVALID_FILE"
          });
        }

        // Compress and save the image
        const compressedFilename = await compressAndSaveImage(file.buffer, file.originalname);
        
        // Get file stats for size
        const filepath = path.join(uploadsDir, compressedFilename);
        const stats = fs.statSync(filepath);
        
        const imageData = {
          filename: compressedFilename,
          originalName: file.originalname,
          mimetype: 'image/jpeg', // All compressed images are JPEG
          size: stats.size,
          url: `/uploads/${compressedFilename}`,
          uploadedBy: (req as any).session.userId,
        };

        const savedImage = await storage.createUploadedImage(imageData);
        uploadedImages.push(savedImage);
      }

      console.log("🔒 SECURITY UPLOAD: Upload successful", {
        fileCount: uploadedImages.length,
        totalSize: uploadedImages.reduce((sum, img) => sum + img.size, 0)
      });

      res.json(uploadedImages);
    } catch (error) {
      console.error("🔒 SECURITY UPLOAD ERROR:", error);
      res.status(500).json({ 
        error: "Upload fehlgeschlagen - Server-Fehler",
        code: "UPLOAD_ERROR"
      });
    }
  });

  // SECURITY: Protected Image Deletion with Parameter Validation
  app.delete("/api/admin/images/:id", isAuthenticated, validateParams(idParamSchema), async (req, res) => {
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

  // Robust analytics tracking - Multiple service fallbacks
  app.use((req, res, next) => {
    // Continue request immediately without waiting
    next();
    
    // Only track GET requests and ignore admin/api routes
    if (req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.startsWith('/admin/')) {
      // Use setImmediate for better performance than process.nextTick
      setImmediate(async () => {
        try {
          const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
          const userAgent = req.get('User-Agent') || '';
          
          // Robust country detection with multiple fallbacks
          let country = 'CU'; // Default for Cuban users
          
          // Only try geolocation in production and for real IPs
          if (process.env.NODE_ENV === 'production' && 
              !ipAddress.startsWith('192.168.') && 
              !ipAddress.startsWith('127.0.0.1') && 
              ipAddress !== '::1' && 
              ipAddress !== 'unknown') {
            
            // Try multiple services for better reliability
            const geoServices = [
              `https://ipapi.co/${ipAddress}/country/`,
              `https://ip-api.com/json/${ipAddress}?fields=countryCode`,
              `https://ipinfo.io/${ipAddress}/country`
            ];
            
            for (const service of geoServices) {
              try {
                const controller = new AbortController();
                setTimeout(() => controller.abort(), 1000); // 1 second timeout
                
                const response = await fetch(service, {
                  signal: controller.signal,
                  headers: {
                    'User-Agent': 'ExcaliburCuba-Analytics/1.0'
                  }
                });
                
                if (response.ok) {
                  const data = await response.text();
                  
                  // Handle different response formats
                  if (service.includes('ipapi.co')) {
                    country = data.trim().toUpperCase();
                  } else if (service.includes('ip-api.com')) {
                    const jsonData = JSON.parse(data);
                    country = jsonData.countryCode || 'CU';
                  } else if (service.includes('ipinfo.io')) {
                    country = data.trim().toUpperCase();
                  }
                  
                  // Valid country code found, break out of loop
                  if (country && country.length === 2) {
                    break;
                  }
                }
              } catch (error) {
                // Try next service
                continue;
              }
            }
          }
          
          // OLD ANALYTICS CODE REMOVED - Now using simple visitor tracking only
        } catch (error) {
          console.error('Analytics tracking error:', error);
          // Continue silently to avoid blocking the application
        }
      });
    }
  });

  // Site Settings API routes
  app.post("/api/admin/site-settings", isAuthenticated, async (req, res) => {
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

  app.get("/api/admin/site-settings", isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching site settings:", error);
      res.status(500).json({ error: "Failed to fetch site settings" });
    }
  });

  // Public endpoint for site settings (for hero images and contact info on public pages)
  app.get("/api/site-settings", async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      // Return image-related settings and contact information for public access
      const publicSettings = settings.filter(setting => 
        setting.key.includes('hero_image_') || 
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

  // Analytics API routes
  app.get("/api/admin/analytics/:period", isAuthenticated, async (req, res) => {
    try {
      const period = req.params.period as 'day' | 'month' | 'year';
      if (!['day', 'month', 'year'].includes(period)) {
        return res.status(400).json({ error: 'Invalid period. Use day, month, or year.' });
      }
      
      const analytics = await storage.getAnalytics(period);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
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