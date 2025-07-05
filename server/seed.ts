import { storage } from "./storage";
import type { InsertAdminUser, InsertCategory, InsertSubcategory, InsertProduct } from "@shared/schema";

export async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Deactivate old demo admin user if it exists
    const oldAdminUser = await storage.getAdminUserByUsername("admin");
    if (oldAdminUser) {
      await storage.updateAdminUser(oldAdminUser.id, { isActive: false });
      console.log("🔒 Old demo admin user deactivated");
    }

    // Check for existing secure admin user
    let existingAdminByUsername = await storage.getAdminUserByUsername("excalibur_admin");
    
    if (!existingAdminByUsername) {
      // Try to find admin by email in case username was different
      const existingUsers = await storage.getAdminUserByEmail("admin@excalibur-cuba.com");
      
      if (!existingUsers) {
        const adminUser: InsertAdminUser = {
          username: "excalibur_admin",
          email: "admin@excalibur-cuba.com",
          password: "ExcaliburCuba@2025!SecureAdmin#9847",
          firstName: "Excalibur",
          lastName: "Admin",
          role: "admin",
          isActive: true,
        };
        
        await storage.createAdminUser(adminUser);
        console.log("✅ Secure admin user created for Excalibur Cuba");
      } else {
        // Update existing user to secure credentials
        await storage.updateAdminUser(existingUsers.id, {
          username: "excalibur_admin",
          password: "ExcaliburCuba@2025!SecureAdmin#9847",
          isActive: true
        });
        console.log("✅ Existing admin user updated with secure credentials");
      }
    } else {
      console.log("✅ Secure admin user already exists");
    }

    // All categories and subcategories are now managed manually through the admin interface
    // Automatic seeding has been disabled per user request

    console.log("🎉 Database seeding completed successfully!");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}