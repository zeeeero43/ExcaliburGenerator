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
      resave: true,
      saveUninitialized: true,
      name: 'excalibur-session',
      cookie: {
        secure: false, // Works for both HTTP and HTTPS
        httpOnly: false, // Allow JavaScript access for debugging
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax',
      },
    })
  );
  
  // Debug middleware to log all session activity (DISABLED for production performance)
  if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
      // Only log in development
      if (req.path.startsWith('/api/admin') || req.path.includes('delete')) {
        console.log('🔍 SESSION DEBUG:', {
          path: req.path,
          method: req.method,
          sessionId: req.sessionID,
          userId: req.session.userId,
          hasSession: !!req.session,
          cookies: Object.keys(req.cookies || {})
        });
      }
      next();
    });
  }
}

export async function isAuthenticated(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  // Only log auth checks in development or for deletion operations
  if (process.env.NODE_ENV === 'development' || req.path.includes('delete')) {
    console.log('🔍 AUTH CHECK:', {
      sessionId: req.sessionID,
      userId: req.session.userId,
      hasUser: !!req.session.user,
      path: req.path,
      cookies: req.headers.cookie ? 'present' : 'missing'
    });
  }
  
  if (req.session.userId && req.session.user) {
    try {
      const user = await storage.getAdminUser(req.session.userId);
      if (user && user.isActive) {
        req.session.user = user;
        console.log('🔍 AUTH SUCCESS:', user.username);
        return next();
      } else {
        console.log('🔍 AUTH FAILED: User not found or inactive');
      }
    } catch (error) {
      console.log('🔍 AUTH ERROR:', error.message);
    }
  }
  
  console.log('🔍 AUTH REJECTED: No valid session');
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