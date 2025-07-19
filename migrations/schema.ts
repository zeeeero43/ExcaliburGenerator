import { pgTable, unique, serial, varchar, boolean, timestamp, text, integer, foreignKey, numeric, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const adminUsers = pgTable("admin_users", {
	id: serial().primaryKey().notNull(),
	username: varchar({ length: 50 }).notNull(),
	email: varchar({ length: 100 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	firstName: varchar("first_name", { length: 50 }),
	lastName: varchar("last_name", { length: 50 }),
	role: varchar({ length: 20 }).default('admin'),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("admin_users_username_unique").on(table.username),
	unique("admin_users_email_unique").on(table.email),
]);

export const categories = pgTable("categories", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	nameEs: varchar("name_es", { length: 100 }).notNull(),
	nameDe: varchar("name_de", { length: 100 }).notNull(),
	nameEn: varchar("name_en", { length: 100 }).notNull(),
	description: text(),
	descriptionEs: text("description_es"),
	descriptionDe: text("description_de"),
	descriptionEn: text("description_en"),
	slug: varchar({ length: 100 }).notNull(),
	image: varchar({ length: 500 }),
	isActive: boolean("is_active").default(true),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("categories_slug_unique").on(table.slug),
]);

export const inquiries = pgTable("inquiries", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 100 }).notNull(),
	phone: varchar({ length: 20 }),
	company: varchar({ length: 100 }),
	subject: varchar({ length: 200 }),
	message: text().notNull(),
	productId: integer("product_id"),
	status: varchar({ length: 20 }).default('new'),
	adminNotes: text("admin_notes"),
	language: text().default('es'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "inquiries_product_id_products_id_fk"
		}),
]);

export const siteSettings = pgTable("site_settings", {
	id: serial().primaryKey().notNull(),
	key: varchar({ length: 100 }).notNull(),
	value: text(),
	type: varchar({ length: 20 }).default('text'),
	label: varchar({ length: 200 }),
	description: text(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("site_settings_key_unique").on(table.key),
]);

export const subcategories = pgTable("subcategories", {
	id: serial().primaryKey().notNull(),
	categoryId: integer("category_id"),
	name: varchar({ length: 100 }).notNull(),
	nameEs: varchar("name_es", { length: 100 }).notNull(),
	nameDe: varchar("name_de", { length: 100 }).notNull(),
	nameEn: varchar("name_en", { length: 100 }).notNull(),
	description: text(),
	descriptionEs: text("description_es"),
	descriptionDe: text("description_de"),
	descriptionEn: text("description_en"),
	slug: varchar({ length: 100 }).notNull(),
	image: varchar({ length: 500 }),
	isActive: boolean("is_active").default(true),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "subcategories_category_id_categories_id_fk"
		}),
	unique("subcategories_slug_unique").on(table.slug),
]);

export const uploadedImages = pgTable("uploaded_images", {
	id: serial().primaryKey().notNull(),
	filename: varchar({ length: 255 }).notNull(),
	originalName: varchar("original_name", { length: 255 }).notNull(),
	mimetype: varchar({ length: 100 }).notNull(),
	size: integer().notNull(),
	url: varchar({ length: 500 }).notNull(),
	uploadedBy: integer("uploaded_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [adminUsers.id],
			name: "uploaded_images_uploaded_by_admin_users_id_fk"
		}),
]);

export const pageViews = pgTable("page_views", {
	id: serial().primaryKey().notNull(),
	ipAddress: varchar("ip_address", { length: 45 }).notNull(),
	userAgent: text("user_agent"),
	country: varchar({ length: 2 }),
	city: varchar({ length: 100 }),
	page: varchar({ length: 500 }).notNull(),
	referrer: varchar({ length: 1000 }),
	language: varchar({ length: 10 }),
	viewedAt: timestamp("viewed_at", { mode: 'string' }).defaultNow(),
});

export const productViews = pgTable("product_views", {
	id: serial().primaryKey().notNull(),
	productId: integer("product_id").notNull(),
	ipAddress: varchar("ip_address", { length: 45 }).notNull(),
	userAgent: text("user_agent"),
	country: varchar({ length: 2 }),
	city: varchar({ length: 100 }),
	referrer: varchar({ length: 1000 }),
	language: varchar({ length: 10 }),
	viewedAt: timestamp("viewed_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_views_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const products = pgTable("products", {
	id: serial().primaryKey().notNull(),
	categoryId: integer("category_id"),
	subcategoryId: integer("subcategory_id"),
	name: varchar({ length: 200 }).notNull(),
	nameEs: varchar("name_es", { length: 200 }).notNull(),
	nameDe: varchar("name_de", { length: 200 }).notNull(),
	nameEn: varchar("name_en", { length: 200 }).notNull(),
	description: text(),
	descriptionEs: text("description_es"),
	descriptionDe: text("description_de"),
	descriptionEn: text("description_en"),
	shortDescription: text("short_description"),
	shortDescriptionEs: text("short_description_es"),
	shortDescriptionDe: text("short_description_de"),
	shortDescriptionEn: text("short_description_en"),
	slug: varchar({ length: 200 }).notNull(),
	sku: varchar({ length: 100 }),
	oldPrice: numeric("old_price", { precision: 10, scale:  2 }),
	images: jsonb().default([]),
	mainImage: varchar("main_image", { length: 500 }),
	isActive: boolean("is_active").default(true),
	isFeatured: boolean("is_featured").default(false),
	stockStatus: varchar("stock_status", { length: 20 }).default('in_stock'),
	sortOrder: integer("sort_order").default(0),
	metaTitle: varchar("meta_title", { length: 200 }),
	metaDescription: varchar("meta_description", { length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	inStock: boolean("in_stock").default(true),
	availabilityTextEs: varchar("availability_text_es", { length: 200 }),
	availabilityTextDe: varchar("availability_text_de", { length: 200 }),
	availabilityTextEn: varchar("availability_text_en", { length: 200 }),
	priceOnRequest: boolean("price_on_request").default(false),
	priceOnRequestTextEs: varchar("price_on_request_text_es", { length: 100 }),
	priceOnRequestTextDe: varchar("price_on_request_text_de", { length: 100 }),
	priceOnRequestTextEn: varchar("price_on_request_text_en", { length: 100 }),
	newPrice: numeric("new_price", { precision: 10, scale:  2 }),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "products_category_id_categories_id_fk"
		}),
	foreignKey({
			columns: [table.subcategoryId],
			foreignColumns: [subcategories.id],
			name: "products_subcategory_id_subcategories_id_fk"
		}),
	unique("products_slug_unique").on(table.slug),
]);
