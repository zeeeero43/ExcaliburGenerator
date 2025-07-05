import { storage } from "./storage";
import type { InsertAdminUser, InsertCategory, InsertSubcategory, InsertProduct } from "@shared/schema";

export async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Check for existing admin user by username or email
    const existingAdminByUsername = await storage.getAdminUserByUsername("excalibur_admin");
    const existingAdminByEmail = await storage.getAdminUserByUsername("admin"); // Check old username
    
    if (!existingAdminByUsername && !existingAdminByEmail) {
      const adminUser: InsertAdminUser = {
        username: "excalibur_admin",
        email: "admin@excalibur-cuba.com",
        password: "ExcaliburCuba@2025!",
        firstName: "Excalibur",
        lastName: "Admin",
        role: "admin",
        isActive: true,
      };
      
      await storage.createAdminUser(adminUser);
      console.log("✅ Admin user created for Excalibur Cuba");
    } else {
      console.log("✅ Admin user already exists");
    }

    // Create categories based on PDF requirements
    const categories = [
      {
        name: "Complete Solar Systems",
        nameEs: "Sistemas Solares Completos",
        nameDe: "Komplette Solarsysteme", 
        nameEn: "Complete Solar Systems",
        description: "Complete solar system packages",
        descriptionEs: "Paquetes completos de sistemas solares",
        descriptionDe: "Komplette Solarsystem-Pakete",
        descriptionEn: "Complete solar system packages",
        slug: "sistemas-solares-completos",
        image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        isActive: true,
        sortOrder: 1,
      },
      {
        name: "Solar Components",
        nameEs: "Componentes Solares",
        nameDe: "Solar-Komponenten",
        nameEn: "Solar Components", 
        description: "Individual solar components",
        descriptionEs: "Componentes solares individuales",
        descriptionDe: "Einzelne Solarkomponenten",
        descriptionEn: "Individual solar components",
        slug: "componentes-solares",
        image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        isActive: true,
        sortOrder: 2,
      },
      {
        name: "Generators",
        nameEs: "Generadores",
        nameDe: "Generatoren",
        nameEn: "Generators",
        description: "Diesel and gasoline generators",
        descriptionEs: "Generadores diesel y gasolina",
        descriptionDe: "Diesel- und Benzingeneratoren",
        descriptionEn: "Diesel and gasoline generators",
        slug: "generadores",
        image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        isActive: true,
        sortOrder: 3,
      }
    ];

    for (const categoryData of categories) {
      const existing = await storage.getCategoryBySlug(categoryData.slug);
      if (!existing) {
        await storage.createCategory(categoryData as InsertCategory);
        console.log(`✅ Category created: ${categoryData.nameEs}`);
      }
    }

    // Create subcategories
    const solarSystemsCategory = await storage.getCategoryBySlug("sistemas-solares-completos");
    const componentsCategory = await storage.getCategoryBySlug("componentes-solares");
    const generatorsCategory = await storage.getCategoryBySlug("generadores");

    if (solarSystemsCategory) {
      const subcategories = [
        {
          categoryId: solarSystemsCategory.id,
          name: "Without Battery Storage",
          nameEs: "Sin Almacenamiento",
          nameDe: "Ohne Batteriespeicher",
          nameEn: "Without Battery Storage",
          description: "Solar systems without battery storage",
          descriptionEs: "Sistemas solares sin almacenamiento de batería",
          descriptionDe: "Solarsysteme ohne Batteriespeicher",
          descriptionEn: "Solar systems without battery storage",
          slug: "sin-almacenamiento",
          isActive: true,
          sortOrder: 1,
        },
        {
          categoryId: solarSystemsCategory.id,
          name: "With Battery Storage",
          nameEs: "Con Almacenamiento",
          nameDe: "Mit Batteriespeicher",
          nameEn: "With Battery Storage",
          description: "Solar systems with battery storage",
          descriptionEs: "Sistemas solares con almacenamiento de batería",
          descriptionDe: "Solarsysteme mit Batteriespeicher",
          descriptionEn: "Solar systems with battery storage",
          slug: "con-almacenamiento",
          isActive: true,
          sortOrder: 2,
        }
      ];

      for (const subCat of subcategories) {
        const existing = await storage.getSubcategoryBySlug(subCat.slug);
        if (!existing) {
          await storage.createSubcategory(subCat as InsertSubcategory);
          console.log(`✅ Subcategory created: ${subCat.nameEs}`);
        }
      }
    }

    if (componentsCategory) {
      const componentSubcategories = [
        {
          categoryId: componentsCategory.id,
          name: "Solar Panels",
          nameEs: "Paneles Solares",
          nameDe: "Solarpaneele",
          nameEn: "Solar Panels",
          slug: "paneles-solares",
          isActive: true,
          sortOrder: 1,
        },
        {
          categoryId: componentsCategory.id,
          name: "Inverters",
          nameEs: "Inversores",
          nameDe: "Wechselrichter",
          nameEn: "Inverters",
          slug: "inversores",
          isActive: true,
          sortOrder: 2,
        },
        {
          categoryId: componentsCategory.id,
          name: "Batteries",
          nameEs: "Baterías",
          nameDe: "Batterien",
          nameEn: "Batteries",
          slug: "baterias",
          isActive: true,
          sortOrder: 3,
        },
        {
          categoryId: componentsCategory.id,
          name: "Accessories",
          nameEs: "Accesorios",
          nameDe: "Zubehör",
          nameEn: "Accessories",
          slug: "accesorios",
          isActive: true,
          sortOrder: 4,
        }
      ];

      for (const subCat of componentSubcategories) {
        const existing = await storage.getSubcategoryBySlug(subCat.slug);
        if (!existing) {
          await storage.createSubcategory(subCat as InsertSubcategory);
          console.log(`✅ Component subcategory created: ${subCat.nameEs}`);
        }
      }
    }

    console.log("🎉 Database seeding completed successfully!");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}