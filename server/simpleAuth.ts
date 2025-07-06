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
      secret: process.env.SESSION_SECRET || "excalibur-cuba-secret-2025",
      resave: false,
      saveUninitialized: false,
      name: 'excalibur-session',
      cookie: {
        secure: false, // Works for both HTTP and HTTPS
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
  console.log('Session check:', req.session.userId, !!req.session.user);
  
  if (req.session.userId && req.session.user) {
    const user = await storage.getAdminUser(req.session.userId);
    if (user && user.isActive) {
      req.session.user = user;
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
    console.log('User logged in:', user.id, user.username);
    return user;
  }
  return null;
}

export function logoutUser(req: express.Request): Promise<void> {
  return new Promise((resolve) => {
    req.session.destroy((err) => {
      resolve();
    });
  });
}