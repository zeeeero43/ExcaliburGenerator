import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupSession, isAuthenticated, loginUser, logoutUser } from "./auth";
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image uploads with memory storage (for sharp processing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for faster uploads
    files: 5, // Max 5 files per upload
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.') as any, false);
    }
  }
});

// Function to compress and save image
async function compressAndSaveImage(buffer: Buffer, originalName: string): Promise<string> {
  const fileId = uuidv4();
  const extension = path.extname(originalName);
  const filename = `${Date.now()}-${fileId}.jpg`; // Always save as jpg for better compression
  const filepath = path.join(uploadsDir, filename);

  // Compress image with sharp - optimized for speed
  await sharp(buffer)
    .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 78, progressive: true })
    .toFile(filepath);

  return filename;
}

// Simple IP to country mapping (in production, use a proper geolocation service)
async function getCountryFromIP(ip: string): Promise<string | null> {
  // In development, always return Cuba without network calls for fast loading
  if (process.env.NODE_ENV === 'development') {
    return 'CU';
  }
  
  try {
    // For local development - quick return without network calls
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip === 'unknown') {
      return 'CU'; // Default to Cuba for local testing
    }
    
    // Fast timeout to prevent blocking page loads
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 500); // 500ms timeout
    
    try {
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        return data.countryCode || 'CU';
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      return 'CU'; // Default fallback
    }
  } catch (error) {
    // Silent fail to avoid console spam
    return 'CU';
  }
  return 'CU';
}

// Helper function to generate slug from text
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  setupSession(app);

  // Seed database on startup
  try {
    await seedDatabase();
  } catch (error) {
    console.error("Failed to seed database:", error);
  }

  // Authentication routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      const user = await loginUser(req, username, password);
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        res.json({ success: true, user: userWithoutPassword });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/admin/logout", async (req, res) => {
    try {
      await logoutUser(req);
      res.json({ success: true });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  app.get("/api/admin/user", isAuthenticated, async (req, res) => {
    const { password: _, ...userWithoutPassword } = req.session.user!;
    res.json(userWithoutPassword);
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

  app.get("/api/admin/categories", isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
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
      
      // First delete all products in this category to avoid foreign key constraints
      const products = await storage.getProducts({ categoryId });
      for (const product of products) {
        await storage.deleteProduct(product.id);
      }
      
      // Delete all subcategories in this category
      const subcategories = await storage.getSubcategories(categoryId);
      for (const subcategory of subcategories) {
        await storage.deleteSubcategory(subcategory.id);
      }
      
      // Now delete the category
      await storage.deleteCategory(categoryId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });





  // Subcategories API
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
      const subcategoryData = insertSubcategorySchema.parse(req.body);
      
      // Generate slug if not provided
      if (!subcategoryData.slug) {
        subcategoryData.slug = generateSlug(subcategoryData.nameEs || subcategoryData.name);
      }

      const subcategory = await storage.createSubcategory(subcategoryData);
      res.json(subcategory);
    } catch (error) {
      console.error("Error creating subcategory:", error);
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

  app.get("/api/admin/products", isAuthenticated, async (req, res) => {
    try {
      const filters = {
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
        subcategoryId: req.query.subcategoryId ? parseInt(req.query.subcategoryId as string) : undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined
      };
      
      const products = await storage.getProducts(filters);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/admin/products", isAuthenticated, async (req, res) => {
    try {
      // Transform the request body to match the schema
      const transformedData = {
        ...req.body,
        name: req.body.nameEs, // Use Spanish name as main name
        slug: req.body.slug || generateSlug(req.body.nameEs),
        price: req.body.price ? req.body.price.toString() : null,
        shortDescription: req.body.shortDescriptionEs,
        description: req.body.descriptionEs,
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
          details: "Ein Produkt mit diesem Namen oder SKU existiert bereits."
        });
      }
      
      if (error.code === '23502') { // PostgreSQL not null constraint violation
        return res.status(400).json({ 
          error: "Required field missing",
          details: "Ein Pflichtfeld fehlt oder ist leer."
        });
      }
      
      res.status(500).json({ 
        error: "Failed to create product",
        details: error.message || "Unbekannter Server-Fehler"
      });
    }
  });

  app.put("/api/admin/products/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Transform the request body to match the schema (same as create)
      const transformedData = {
        ...req.body,
        name: req.body.nameEs, // Use Spanish name as main name
        slug: req.body.slug || generateSlug(req.body.nameEs),
        price: req.body.price ? req.body.price.toString() : null,
        shortDescription: req.body.shortDescriptionEs,
        description: req.body.descriptionEs,
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
      
      res.status(500).json({ error: "Failed to update product" });
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

  app.get("/api/admin/inquiries", isAuthenticated, async (req, res) => {
    try {
      const inquiries = await storage.getInquiries();
      res.json(inquiries);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      res.status(500).json({ error: "Failed to fetch inquiries" });
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

  // Geolocation endpoint for language detection
  app.get("/api/geolocation", async (req, res) => {
    // Simple geolocation simulation
    // In production, you would use a real IP geolocation service
    const ip = req.ip || req.connection.remoteAddress;
    
    // Mock response for development
    // Cuba detection would be based on actual IP ranges
    const mockResponse = {
      country: "CU", // Cuba
      language: "es"
    };
    
    res.json(mockResponse);
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

  app.post("/api/admin/images/upload", isAuthenticated, upload.array('images', 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const uploadedImages = [];
      for (const file of files) {
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

      res.json(uploadedImages);
    } catch (error) {
      console.error("Error uploading images:", error);
      res.status(500).json({ error: "Failed to upload images" });
    }
  });

  app.delete("/api/admin/images/:id", isAuthenticated, async (req, res) => {
    try {
      const imageId = parseInt(req.params.id);
      const image = await storage.getUploadedImageById(imageId);
      
      if (!image) {
        return res.status(404).json({ error: "Image not found" });
      }

      // Delete file from filesystem
      const filePath = path.join(uploadsDir, image.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await storage.deleteUploadedImage(imageId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  });

  // Ultra-fast analytics tracking - works in all environments
  app.use((req, res, next) => {
    // Continue request immediately without waiting
    next();
    
    // Only track GET requests and ignore admin/api routes
    if (req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.startsWith('/admin/')) {
      // Run analytics completely asynchronously after response is sent
      process.nextTick(async () => {
        try {
          const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
          const userAgent = req.get('User-Agent') || '';
          
          // Ultra-fast country detection for Cuba
          let country = 'CU'; // Default for Cuban users
          if (process.env.NODE_ENV === 'production' && !ipAddress.startsWith('192.168.') && ipAddress !== '127.0.0.1') {
            try {
              const controller = new AbortController();
              setTimeout(() => controller.abort(), 300); // Ultra-fast 300ms timeout
              
              const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=countryCode`, {
                signal: controller.signal
              });
              
              if (response.ok) {
                const data = await response.json();
                country = data.countryCode || 'CU';
              }
            } catch {
              // Silent fail, keep default
            }
          }
          
          await storage.createPageView({
            ipAddress,
            userAgent,
            country,
            city: null,
            page: req.path,
            referrer: req.get('Referer') || null,
            language: req.get('Accept-Language')?.split(',')[0] || null,
          });
        } catch (error) {
          // Silent fail to avoid any issues
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

  // Public endpoint for site settings (for hero images on public pages)
  app.get("/api/site-settings", async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      // Only return image-related settings for public access
      const publicSettings = settings.filter(setting => 
        setting.key.includes('hero_image_') || 
        setting.key.includes('product_fallback_image') ||
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

  // Setup SEO routes (robots.txt, sitemap.xml, structured data)
  setupSEO(app);

  const httpServer = createServer(app);
  return httpServer;
}