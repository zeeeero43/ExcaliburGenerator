import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInquirySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Contact form submission
  app.post("/api/inquiries", async (req, res) => {
    try {
      const validatedData = insertInquirySchema.parse(req.body);
      const inquiry = await storage.createInquiry(validatedData);
      
      // In a real application, you would send an email notification here
      console.log("New inquiry received:", inquiry);
      
      res.json({ success: true, inquiry });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid form data", details: error.errors });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  // Get all inquiries (for admin)
  app.get("/api/inquiries", async (req, res) => {
    try {
      const inquiries = await storage.getInquiries();
      res.json({ inquiries });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // IP geolocation for language detection
  app.get("/api/geolocation", async (req, res) => {
    try {
      const clientIP = req.headers['x-forwarded-for'] || 
                      req.headers['x-real-ip'] || 
                      req.connection.remoteAddress || 
                      req.socket.remoteAddress || 
                      '127.0.0.1';
      
      // In development, return Cuba for testing
      if (clientIP === '127.0.0.1' || clientIP === '::1') {
        res.json({ country: 'CU', language: 'es' });
        return;
      }

      // Use ip-api.com for geolocation (free tier)
      const response = await fetch(`http://ip-api.com/json/${clientIP}?fields=countryCode`);
      const data = await response.json();
      
      let language = 'es'; // default to Spanish
      if (data.countryCode === 'DE') {
        language = 'de';
      } else if (data.countryCode === 'US' || data.countryCode === 'GB' || data.countryCode === 'CA') {
        language = 'en';
      }
      
      res.json({ country: data.countryCode, language });
    } catch (error) {
      // Fallback to Spanish for Cuban market
      res.json({ country: 'CU', language: 'es' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
