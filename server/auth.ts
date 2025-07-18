import express from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import type { AdminUser } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    user?: AdminUser;
  }
}

export function setupSession(app: express.Application) {
  const pgSession = connectPg(session);
  
  app.use(
    session({
      store: new pgSession({
        conString: process.env.DATABASE_URL,
        tableName: 'sessions',
        createTableIfMissing: false,
      }),
      secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      name: 'excalibur-session',
      cookie: {
        secure: false, // TEMP FIX: Disable secure cookies for debugging
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax',
      },
    })
  );
}

export async function isAuthenticated(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  console.log("🔍 AUTH CHECK: Session exists:", !!req.session);
  console.log("🔍 AUTH CHECK: Session ID:", req.sessionID);
  console.log("🔍 AUTH CHECK: Session userId:", req.session?.userId);
  console.log("🔍 AUTH CHECK: Session user:", !!req.session?.user);
  
  if (req.session.userId && req.session.user) {
    // Verify user still exists and is active
    const user = await storage.getAdminUser(req.session.userId);
    console.log("🔍 AUTH CHECK: User from DB:", !!user);
    console.log("🔍 AUTH CHECK: User active:", user?.isActive);
    if (user && user.isActive) {
      req.session.user = user; // Update session with fresh user data
      return next();
    }
  }
  
  console.log("🔍 AUTH CHECK: UNAUTHORIZED - returning 401");
  return res.status(401).json({ message: "Unauthorized" });
}

export async function loginUser(req: express.Request, username: string, password: string): Promise<AdminUser | null> {
  const user = await storage.validateAdminUser(username, password);
  if (user) {
    req.session.userId = user.id;
    req.session.user = user;
    return user;
  }
  return null;
}

export function logoutUser(req: express.Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}