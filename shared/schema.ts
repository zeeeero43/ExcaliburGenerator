import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  serial,
  boolean,
  decimal,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Admin Users
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }),
  role: varchar("role", { length: 20 }).default("admin"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product Categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameEs: varchar("name_es", { length: 100 }).notNull(),
  nameDe: varchar("name_de", { length: 100 }).notNull(),
  nameEn: varchar("name_en", { length: 100 }).notNull(),
  description: text("description"),
  descriptionEs: text("description_es"),
  descriptionDe: text("description_de"),
  descriptionEn: text("description_en"),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  image: varchar("image", { length: 500 }),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subcategories
export const subcategories = pgTable("subcategories", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => categories.id),
  name: varchar("name", { length: 100 }).notNull(),
  nameEs: varchar("name_es", { length: 100 }).notNull(),
  nameDe: varchar("name_de", { length: 100 }).notNull(),
  nameEn: varchar("name_en", { length: 100 }).notNull(),
  description: text("description"),
  descriptionEs: text("description_es"),
  descriptionDe: text("description_de"),
  descriptionEn: text("description_en"),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  image: varchar("image", { length: 500 }),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => categories.id),
  subcategoryId: integer("subcategory_id").references(() => subcategories.id),
  name: varchar("name", { length: 200 }).notNull(),
  nameEs: varchar("name_es", { length: 200 }).notNull(),
  nameDe: varchar("name_de", { length: 200 }).notNull(),
  nameEn: varchar("name_en", { length: 200 }).notNull(),
  description: text("description"),
  descriptionEs: text("description_es"),
  descriptionDe: text("description_de"),
  descriptionEn: text("description_en"),
  shortDescription: text("short_description"),
  shortDescriptionEs: text("short_description_es"),
  shortDescriptionDe: text("short_description_de"),
  shortDescriptionEn: text("short_description_en"),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  sku: varchar("sku", { length: 100 }),
  price: decimal("price", { precision: 10, scale: 2 }),
  priceNote: varchar("price_note", { length: 200 }),
  specifications: jsonb("specifications"),
  specificationsEs: jsonb("specifications_es"),
  specificationsEn: jsonb("specifications_en"),
  specificationsValuesEs: jsonb("specifications_values_es"),
  specificationsValuesEn: jsonb("specifications_values_en"),
  images: jsonb("images").default([]),
  mainImage: varchar("main_image", { length: 500 }),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  stockStatus: varchar("stock_status", { length: 20 }).default("in_stock"),
  inStock: boolean("in_stock").default(true),
  availabilityTextEs: varchar("availability_text_es", { length: 200 }),
  availabilityTextDe: varchar("availability_text_de", { length: 200 }),
  availabilityTextEn: varchar("availability_text_en", { length: 200 }),
  sortOrder: integer("sort_order").default(0),
  metaTitle: varchar("meta_title", { length: 200 }),
  metaDescription: varchar("meta_description", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer Inquiries
export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  company: varchar("company", { length: 100 }),
  subject: varchar("subject", { length: 200 }),
  message: text("message").notNull(),
  productId: integer("product_id").references(() => products.id),
  status: varchar("status", { length: 20 }).default("new"),
  adminNotes: text("admin_notes"),
  language: text("language").default("es"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Site Settings
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  type: varchar("type", { length: 20 }).default("text"),
  label: varchar("label", { length: 200 }),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Uploaded Images
export const uploadedImages = pgTable("uploaded_images", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimetype: varchar("mimetype", { length: 100 }).notNull(),
  size: integer("size").notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  uploadedBy: integer("uploaded_by").references(() => adminUsers.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Analytics tracking table
export const pageViews = pgTable("page_views", {
  id: serial("id").primaryKey(),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(), // IPv6 compatible
  userAgent: text("user_agent"),
  country: varchar("country", { length: 2 }), // ISO country code
  city: varchar("city", { length: 100 }),
  page: varchar("page", { length: 500 }).notNull(),
  referrer: varchar("referrer", { length: 1000 }),
  language: varchar("language", { length: 10 }),
  viewedAt: timestamp("viewed_at").defaultNow(),
});

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  subcategories: many(subcategories),
  products: many(products),
}));

export const subcategoriesRelations = relations(subcategories, ({ one, many }) => ({
  category: one(categories, {
    fields: [subcategories.categoryId],
    references: [categories.id],
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  subcategory: one(subcategories, {
    fields: [products.subcategoryId],
    references: [subcategories.id],
  }),
  inquiries: many(inquiries),
}));

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  product: one(products, {
    fields: [inquiries.productId],
    references: [products.id],
  }),
}));

// Insert Schemas
export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubcategorySchema = createInsertSchema(subcategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({
  id: true,
  updatedAt: true,
});

// Types
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Subcategory = typeof subcategories.$inferSelect;
export type InsertSubcategory = z.infer<typeof insertSubcategorySchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;

export type UploadedImage = typeof uploadedImages.$inferSelect;
export type InsertUploadedImage = typeof uploadedImages.$inferInsert;

export type PageView = typeof pageViews.$inferSelect;
export type InsertPageView = typeof pageViews.$inferInsert;
