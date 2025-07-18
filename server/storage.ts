import {
  adminUsers,
  categories,
  subcategories,
  products,
  inquiries,
  siteSettings,
  uploadedImages,
  pageViews,
  productViews,
  type AdminUser,
  type InsertAdminUser,
  type Category,
  type InsertCategory,
  type Subcategory,
  type InsertSubcategory,
  type Product,
  type InsertProduct,
  type Inquiry,
  type InsertInquiry,
  type SiteSetting,
  type InsertSiteSetting,
  type UploadedImage,
  type InsertUploadedImage,
  type PageView,
  type InsertPageView,
  type ProductView,
  type InsertProductView,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, count, countDistinct, sql, gte, isNotNull } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Admin Users
  getAdminUser(id: number): Promise<AdminUser | undefined>;
  getAdminUserByUsername(username: string): Promise<AdminUser | undefined>;
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  updateAdminUser(id: number, user: Partial<InsertAdminUser>): Promise<AdminUser>;
  deleteAdminUser(id: number): Promise<void>;
  validateAdminUser(username: string, password: string): Promise<AdminUser | null>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;
  
  // Subcategories
  getSubcategories(categoryId?: number): Promise<Subcategory[]>;
  getSubcategoryById(id: number): Promise<Subcategory | undefined>;
  getSubcategoryBySlug(slug: string): Promise<Subcategory | undefined>;
  createSubcategory(subcategory: InsertSubcategory): Promise<Subcategory>;
  updateSubcategory(id: number, subcategory: Partial<InsertSubcategory>): Promise<Subcategory>;
  deleteSubcategory(id: number): Promise<void>;
  
  // Products
  getProducts(filters?: { categoryId?: number; subcategoryId?: number; search?: string; isActive?: boolean }): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  getFeaturedProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  
  // Inquiries
  getInquiries(): Promise<Inquiry[]>;
  getInquiryById(id: number): Promise<Inquiry | undefined>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  updateInquiry(id: number, inquiry: Partial<InsertInquiry>): Promise<Inquiry>;
  deleteInquiry(id: number): Promise<void>;
  
  // Site Settings
  getSiteSettings(): Promise<SiteSetting[]>;
  getSiteSetting(key: string): Promise<SiteSetting | undefined>;
  updateSiteSetting(key: string, value: string): Promise<SiteSetting>;
  
  // Uploaded Images
  getUploadedImages(): Promise<UploadedImage[]>;
  getUploadedImageById(id: number): Promise<UploadedImage | undefined>;
  createUploadedImage(image: InsertUploadedImage): Promise<UploadedImage>;
  deleteUploadedImage(id: number): Promise<void>;
  
  // Analytics
  createPageView(pageView: InsertPageView): Promise<PageView>;
  createProductView(productView: InsertProductView): Promise<ProductView>;
  getAnalytics(period: 'day' | 'month' | 'year'): Promise<{
    totalViews: number;
    uniqueVisitors: number;
    topProducts: Array<{ product: string; views: number; id: number }>;
    topCountries: Array<{ country: string; views: number }>;
    viewsByPeriod: Array<{ period: string; views: number }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Admin Users
  async getAdminUser(id: number): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return user;
  }

  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return user;
  }

  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return user;
  }

  async createAdminUser(user: InsertAdminUser): Promise<AdminUser> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const [newUser] = await db
      .insert(adminUsers)
      .values({ ...user, password: hashedPassword })
      .returning();
    return newUser;
  }

  async updateAdminUser(id: number, user: Partial<InsertAdminUser>): Promise<AdminUser> {
    const updateData = { ...user };
    if (user.password) {
      updateData.password = await bcrypt.hash(user.password, 10);
    }
    const [updated] = await db
      .update(adminUsers)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(adminUsers.id, id))
      .returning();
    return updated;
  }

  async deleteAdminUser(id: number): Promise<void> {
    await db.delete(adminUsers).where(eq(adminUsers.id, id));
  }

  async validateAdminUser(username: string, password: string): Promise<AdminUser | null> {
    console.log("validateAdminUser called with username:", username);
    const user = await this.getAdminUserByUsername(username);
    console.log("User found:", user ? "YES" : "NO");
    
    if (!user || !user.isActive) {
      console.log("User not found or not active");
      return null;
    }
    
    console.log("User is active, comparing password...");
    const isValid = await bcrypt.compare(password, user.password);
    console.log("Password comparison result:", isValid);
    
    return isValid ? user : null;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.sortOrder);
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
    const [updated] = await db
      .update(categories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return updated;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Subcategories
  async getSubcategories(categoryId?: number): Promise<Subcategory[]> {
    if (categoryId) {
      return await db
        .select()
        .from(subcategories)
        .where(and(eq(subcategories.isActive, true), eq(subcategories.categoryId, categoryId)))
        .orderBy(subcategories.sortOrder);
    }
    return await db
      .select()
      .from(subcategories)
      .where(eq(subcategories.isActive, true))
      .orderBy(subcategories.sortOrder);
  }

  async getSubcategoryById(id: number): Promise<Subcategory | undefined> {
    const [subcategory] = await db.select().from(subcategories).where(eq(subcategories.id, id));
    return subcategory;
  }

  async getSubcategoryBySlug(slug: string): Promise<Subcategory | undefined> {
    const [subcategory] = await db.select().from(subcategories).where(eq(subcategories.slug, slug));
    return subcategory;
  }

  async createSubcategory(subcategory: InsertSubcategory): Promise<Subcategory> {
    const [newSubcategory] = await db.insert(subcategories).values(subcategory).returning();
    return newSubcategory;
  }

  async updateSubcategory(id: number, subcategory: Partial<InsertSubcategory>): Promise<Subcategory> {
    const [updated] = await db
      .update(subcategories)
      .set({ ...subcategory, updatedAt: new Date() })
      .where(eq(subcategories.id, id))
      .returning();
    return updated;
  }

  async deleteSubcategory(id: number): Promise<void> {
    await db.delete(subcategories).where(eq(subcategories.id, id));
  }

  // Products
  async getProducts(filters?: { categoryId?: number; subcategoryId?: number; search?: string; isActive?: boolean }): Promise<Product[]> {
    let query = db.select().from(products);
    
    const conditions = [];
    if (filters?.isActive !== undefined) {
      conditions.push(eq(products.isActive, filters.isActive));
    }
    if (filters?.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }
    if (filters?.subcategoryId) {
      conditions.push(eq(products.subcategoryId, filters.subcategoryId));
    }
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(products.name, searchTerm),
          ilike(products.nameEs, searchTerm),
          ilike(products.nameDe, searchTerm),
          ilike(products.nameEn, searchTerm),
          ilike(products.description, searchTerm),
          ilike(products.descriptionEs, searchTerm),
          ilike(products.descriptionDe, searchTerm),
          ilike(products.descriptionEn, searchTerm)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Custom sorting: Products with sortOrder > 0 first (ascending), then products without sortOrder (0 or null) by creation date
    const result = await query.orderBy(
      sql`CASE WHEN ${products.sortOrder} > 0 THEN 0 ELSE 1 END`,
      products.sortOrder,
      desc(products.createdAt)
    );
    return result;
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    return product;
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(and(eq(products.isActive, true), eq(products.isFeatured, true)))
      .orderBy(products.sortOrder)
      .limit(6);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const [updated] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Inquiries
  async getInquiries(): Promise<Inquiry[]> {
    return await db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
  }

  async getInquiryById(id: number): Promise<Inquiry | undefined> {
    const [inquiry] = await db.select().from(inquiries).where(eq(inquiries.id, id));
    return inquiry;
  }

  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const [newInquiry] = await db.insert(inquiries).values(inquiry).returning();
    return newInquiry;
  }

  async updateInquiry(id: number, inquiry: Partial<InsertInquiry>): Promise<Inquiry> {
    const [updated] = await db
      .update(inquiries)
      .set({ ...inquiry, updatedAt: new Date() })
      .where(eq(inquiries.id, id))
      .returning();
    return updated;
  }

  async deleteInquiry(id: number): Promise<void> {
    await db.delete(inquiries).where(eq(inquiries.id, id));
  }

  // Site Settings
  async getSiteSettings(): Promise<SiteSetting[]> {
    return await db.select().from(siteSettings);
  }

  async getSiteSetting(key: string): Promise<SiteSetting | undefined> {
    const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return setting;
  }

  async updateSiteSetting(key: string, value: string): Promise<SiteSetting> {
    const [updated] = await db
      .insert(siteSettings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value, updatedAt: new Date() },
      })
      .returning();
    return updated;
  }

  // Uploaded Images
  async getUploadedImages(): Promise<UploadedImage[]> {
    return await db.select().from(uploadedImages).orderBy(uploadedImages.createdAt);
  }

  async getUploadedImageById(id: number): Promise<UploadedImage | undefined> {
    const [image] = await db.select().from(uploadedImages).where(eq(uploadedImages.id, id));
    return image;
  }

  async createUploadedImage(image: InsertUploadedImage): Promise<UploadedImage> {
    const [created] = await db.insert(uploadedImages).values(image).returning();
    return created;
  }

  async deleteUploadedImage(id: number): Promise<void> {
    await db.delete(uploadedImages).where(eq(uploadedImages.id, id));
  }

  // Analytics methods
  async createPageView(pageView: InsertPageView): Promise<PageView> {
    const [created] = await db.insert(pageViews).values(pageView).returning();
    return created;
  }

  async createProductView(productView: InsertProductView): Promise<ProductView> {
    const [created] = await db.insert(productViews).values(productView).returning();
    return created;
  }

  async getAnalytics(period: 'day' | 'month' | 'year'): Promise<{
    uniqueVisitors: number;
    topProducts: Array<{ product: string; views: number; id: number }>;
    topCountries: Array<{ country: string; uniqueVisitors: number }>;
  }> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    // Unique visitors from PAGE VIEWS (based on IP)
    const [uniqueVisitorsResult] = await db
      .select({ count: countDistinct(pageViews.ipAddress) })
      .from(pageViews)
      .where(gte(pageViews.viewedAt, startDate));

    // Top products with GERMAN product names (fallback to Spanish if German not available)
    const topProductsResult = await db
      .select({
        productId: productViews.productId,
        productNameDe: products.nameDe,
        productNameEs: products.name,
        views: count()
      })
      .from(productViews)
      .leftJoin(products, eq(productViews.productId, products.id))
      .where(gte(productViews.viewedAt, startDate))
      .groupBy(productViews.productId, products.nameDe, products.name)
      .orderBy(desc(count()))
      .limit(10);

    // Top countries - Get most recent country per IP (avoid duplicate counting)
    const topCountriesResult = await db.execute(sql`
      WITH latest_country_per_ip AS (
        SELECT DISTINCT ON (ip_address) 
          ip_address, 
          country,
          viewed_at
        FROM page_views 
        WHERE viewed_at >= ${startDate} 
          AND country IS NOT NULL
        ORDER BY ip_address, viewed_at DESC
      )
      SELECT 
        country, 
        COUNT(DISTINCT ip_address) as unique_visitors
      FROM latest_country_per_ip
      GROUP BY country
      ORDER BY COUNT(DISTINCT ip_address) DESC
      LIMIT 10
    `);

    return {
      uniqueVisitors: uniqueVisitorsResult.count || 0,
      topProducts: topProductsResult.map(p => ({ 
        product: p.productNameDe || p.productNameEs || 'Unknown Product', // Prefer German, fallback to Spanish
        views: Number(p.views),
        id: p.productId || 0
      })),
      topCountries: topCountriesResult.rows.map((row: any) => ({ country: row.country || 'Unknown', uniqueVisitors: Number(row.unique_visitors) }))
    };
  }
}

export const storage = new DatabaseStorage();