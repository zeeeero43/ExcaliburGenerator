-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(100) NOT NULL,
	"password" varchar(255) NOT NULL,
	"first_name" varchar(50),
	"last_name" varchar(50),
	"role" varchar(20) DEFAULT 'admin',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "admin_users_username_unique" UNIQUE("username"),
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_es" varchar(100) NOT NULL,
	"name_de" varchar(100) NOT NULL,
	"name_en" varchar(100) NOT NULL,
	"description" text,
	"description_es" text,
	"description_de" text,
	"description_en" text,
	"slug" varchar(100) NOT NULL,
	"image" varchar(500),
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(100) NOT NULL,
	"phone" varchar(20),
	"company" varchar(100),
	"subject" varchar(200),
	"message" text NOT NULL,
	"product_id" integer,
	"status" varchar(20) DEFAULT 'new',
	"admin_notes" text,
	"language" text DEFAULT 'es',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"type" varchar(20) DEFAULT 'text',
	"label" varchar(200),
	"description" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "site_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "subcategories" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer,
	"name" varchar(100) NOT NULL,
	"name_es" varchar(100) NOT NULL,
	"name_de" varchar(100) NOT NULL,
	"name_en" varchar(100) NOT NULL,
	"description" text,
	"description_es" text,
	"description_de" text,
	"description_en" text,
	"slug" varchar(100) NOT NULL,
	"image" varchar(500),
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subcategories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "uploaded_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" varchar(255) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"mimetype" varchar(100) NOT NULL,
	"size" integer NOT NULL,
	"url" varchar(500) NOT NULL,
	"uploaded_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "page_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip_address" varchar(45) NOT NULL,
	"user_agent" text,
	"country" varchar(2),
	"city" varchar(100),
	"page" varchar(500) NOT NULL,
	"referrer" varchar(1000),
	"language" varchar(10),
	"viewed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"ip_address" varchar(45) NOT NULL,
	"user_agent" text,
	"country" varchar(2),
	"city" varchar(100),
	"referrer" varchar(1000),
	"language" varchar(10),
	"viewed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer,
	"subcategory_id" integer,
	"name" varchar(200) NOT NULL,
	"name_es" varchar(200) NOT NULL,
	"name_de" varchar(200) NOT NULL,
	"name_en" varchar(200) NOT NULL,
	"description" text,
	"description_es" text,
	"description_de" text,
	"description_en" text,
	"short_description" text,
	"short_description_es" text,
	"short_description_de" text,
	"short_description_en" text,
	"slug" varchar(200) NOT NULL,
	"sku" varchar(100),
	"old_price" numeric(10, 2),
	"images" jsonb DEFAULT '[]'::jsonb,
	"main_image" varchar(500),
	"is_active" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"stock_status" varchar(20) DEFAULT 'in_stock',
	"sort_order" integer DEFAULT 0,
	"meta_title" varchar(200),
	"meta_description" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"in_stock" boolean DEFAULT true,
	"availability_text_es" varchar(200),
	"availability_text_de" varchar(200),
	"availability_text_en" varchar(200),
	"price_on_request" boolean DEFAULT false,
	"price_on_request_text_es" varchar(100),
	"price_on_request_text_de" varchar(100),
	"price_on_request_text_en" varchar(100),
	"new_price" numeric(10, 2),
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploaded_images" ADD CONSTRAINT "uploaded_images_uploaded_by_admin_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_views" ADD CONSTRAINT "product_views_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_subcategory_id_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("id") ON DELETE no action ON UPDATE no action;
*/