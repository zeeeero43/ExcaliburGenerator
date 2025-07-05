import express from "express";
import session from "express-session";
import { storage } from "./storage";
import type { AdminUser } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    user?: AdminUser;
  }
}

export function setupSession(app: express.Application) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // set to true only for HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );
}

export async function isAuthenticated(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (req.session.userId && req.session.user) {
    // Verify user still exists and is active
    const user = await storage.getAdminUser(req.session.userId);
    if (user && user.isActive) {
      req.session.user = user; // Update session with fresh user data
      return next();
    }
  }
  
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