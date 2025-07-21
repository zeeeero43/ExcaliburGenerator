import express from "express";
import { storage } from "./storage";
import type { AdminUser } from "@shared/schema";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "excalibur-cuba-jwt-secret-2025";

export interface AuthRequest extends express.Request {
  user?: AdminUser;
}

export async function isAuthenticated(
  req: AuthRequest,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const token = req.cookies?.['excalibur-auth'] || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getAdminUser(decoded.userId);
    
    if (user && user.isActive) {
      req.user = user;
      return next();
    } else {
      return res.status(401).json({ message: "Unauthorized" });
    }
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

export async function loginUser(username: string, password: string): Promise<{ user: AdminUser, token: string } | null> {
  const user = await storage.validateAdminUser(username, password);
  if (user) {
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    return { user, token };
  }
  return null;
}

export function logoutUser(res: express.Response): void {
  res.clearCookie('excalibur-auth');
}