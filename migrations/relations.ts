import { relations } from "drizzle-orm/relations";
import { products, inquiries, categories, subcategories, adminUsers, uploadedImages, productViews } from "./schema";

export const inquiriesRelations = relations(inquiries, ({one}) => ({
	product: one(products, {
		fields: [inquiries.productId],
		references: [products.id]
	}),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	inquiries: many(inquiries),
	productViews: many(productViews),
	category: one(categories, {
		fields: [products.categoryId],
		references: [categories.id]
	}),
	subcategory: one(subcategories, {
		fields: [products.subcategoryId],
		references: [subcategories.id]
	}),
}));

export const subcategoriesRelations = relations(subcategories, ({one, many}) => ({
	category: one(categories, {
		fields: [subcategories.categoryId],
		references: [categories.id]
	}),
	products: many(products),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	subcategories: many(subcategories),
	products: many(products),
}));

export const uploadedImagesRelations = relations(uploadedImages, ({one}) => ({
	adminUser: one(adminUsers, {
		fields: [uploadedImages.uploadedBy],
		references: [adminUsers.id]
	}),
}));

export const adminUsersRelations = relations(adminUsers, ({many}) => ({
	uploadedImages: many(uploadedImages),
}));

export const productViewsRelations = relations(productViews, ({one}) => ({
	product: one(products, {
		fields: [productViews.productId],
		references: [products.id]
	}),
}));