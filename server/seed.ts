import { storage } from "./storage";
import type { InsertAdminUser, InsertCategory, InsertSubcategory, InsertProduct } from "@shared/schema";

export async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // FOOLPROOF Admin Creation - Always ensure working admin user
    try {
      // Try to create new admin user - if it exists, it will be updated
      const adminUser: InsertAdminUser = {
        username: "admin",
        email: "admin@excalibur-cuba.com",
        password: "admin123",
        firstName: "Admin",
        lastName: "User", 
        role: "admin",
        isActive: true,
      };

      const existingUser = await storage.getAdminUserByUsername("admin");
      
      if (!existingUser) {
        await storage.createAdminUser(adminUser);
        console.log("✅ Admin user created successfully");
      } else {
        // Update existing user with fresh password
        await storage.updateAdminUser(existingUser.id, {
          password: "admin123",
          isActive: true
        });
        console.log("✅ Admin user password updated successfully");
      }

      // Also ensure any old excalibur_admin user gets the correct password
      const oldUser = await storage.getAdminUserByUsername("excalibur_admin");
      if (oldUser) {
        await storage.updateAdminUser(oldUser.id, {
          password: "admin123",
          isActive: true
        });
        console.log("✅ Legacy admin user updated");
      }

    } catch (error) {
      console.error("❌ Admin user creation failed:", error);
    }

    // All categories and subcategories are now managed manually through the admin interface
    // Automatic seeding has been disabled per user request

    console.log("🎉 Database seeding completed successfully!");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}