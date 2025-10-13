import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { 
  generalRateLimit, 
  securityHeaders, 
  sanitizeInput, 
  secureErrorHandler
} from "./security/middleware";
import { setSecurityHeaders } from "./security/auth";
import { botProtection, aggressiveBotRateLimit } from "./security/botProtection";

const app = express();

console.log('🔒 SECURITY: Aktiviere Sicherheitsmaßnahmen...');
console.log('🤖 BOT-PROTECTION: Aktiviere erweiterten Bot-Schutz...');

// SECURITY: Trust proxy für sichere IP-Erkennung
app.set('trust proxy', 1);

// SECURITY: Bot Protection (vor Rate Limiting)
app.use(botProtection);

// SECURITY: Aggressive Rate Limiting für verdächtige IPs
app.use(aggressiveBotRateLimit);

// SECURITY: General Rate Limiting
app.use(generalRateLimit);

// SECURITY: Helmet Security Headers
app.use(securityHeaders);

// SECURITY: Custom Security Headers
app.use(setSecurityHeaders);

// SECURITY: CORS Configuration
app.use(cors({
  origin: ['http://localhost:5000', 'https://excalibur-cuba.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'X-CSRF-Token']
}));

// SECURITY: Input Sanitization
app.use(sanitizeInput);

// SECURITY: Enhanced JSON parsing with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // SECURITY: Global Error Handler (must be last)
  app.use(secureErrorHandler);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
