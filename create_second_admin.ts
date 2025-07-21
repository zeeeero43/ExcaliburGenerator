import { db } from "./server/db.js";
import { adminUsers } from "./shared/schema.js";
import bcrypt from "bcryptjs";

async function createSecondAdmin() {
  try {
    console.log("🔐 Creating second admin account...");
    
    const hashedPassword = await bcrypt.hash("admin123", 12);
    
    const newAdmin = await db.insert(adminUsers).values({
      username: "admin2",
      email: "admin2@excalibur-cuba.com",
      password: hashedPassword,
    }).returning();

    console.log("✅ Second admin created successfully!");
    console.log("Username: admin2");
    console.log("Password: admin123");
    console.log("Now both admins can work simultaneously without conflicts.");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    if (error.code === '23505') {
      console.log("⚠️  Admin 'admin2' already exists - using existing account");
      console.log("Username: admin2");
      console.log("Password: admin123");
    }
    process.exit(1);
  }
}

createSecondAdmin();