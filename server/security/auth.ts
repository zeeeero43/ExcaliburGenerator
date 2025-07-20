import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Session Security Configuration
export const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS in production
    httpOnly: true, // Prevent XSS
    maxAge: 24 * 60 * 60 * 1000, // 24 Stunden
    sameSite: 'strict' as const // CSRF Protection
  },
  name: 'sessionId', // Custom session name (security by obscurity)
};

// Password Security Requirements
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REQUIREMENTS = {
  minLength: PASSWORD_MIN_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: false // Optional für bessere UX
};

// Strong Password Validation
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Passwort muss mindestens ${PASSWORD_REQUIREMENTS.minLength} Zeichen lang sein`);
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Passwort muss mindestens einen Großbuchstaben enthalten');
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Passwort muss mindestens einen Kleinbuchstaben enthalten');
  }

  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push('Passwort muss mindestens eine Zahl enthalten');
  }

  if (PASSWORD_REQUIREMENTS.requireSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Passwort muss mindestens ein Sonderzeichen enthalten');
  }

  // Common passwords check
  const commonPasswords = [
    'password', '123456', 'password123', 'admin', 'qwerty',
    'letmein', 'welcome', 'monkey', '1234567890', 'admin123'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Passwort ist zu häufig verwendet. Wählen Sie ein sichereres Passwort.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Secure Password Hashing
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12; // Hohe Sicherheit
  return await bcrypt.hash(password, saltRounds);
};

// Secure Password Verification
export const verifyPassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Enhanced Authentication Middleware
export const enhancedAuth = (req: Request, res: Response, next: NextFunction) => {
  console.log('🔒 AUTH: Enhanced authentication check', {
    sessionId: req.sessionID,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  if (!req.session || !req.session.userId) {
    console.warn('🔒 AUTH: No valid session found');
    return res.status(401).json({ 
      error: 'Authentifizierung erforderlich',
      code: 'AUTH_REQUIRED'
    });
  }

  // Session Fixation Protection - regenerate session ID
  if (!req.session.regenerated) {
    req.session.regenerate((err) => {
      if (err) {
        console.error('🔒 AUTH: Session regeneration failed:', err);
        return res.status(500).json({ error: 'Session-Fehler' });
      }
      req.session.regenerated = true;
      req.session.userId = req.session.userId; // Restore user ID
      next();
    });
  } else {
    next();
  }
};

// Brute Force Protection für Login - Fixed IPv6 issue
export const loginBruteForceProtection = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 5, // Max 5 Versuche pro IP
  message: {
    error: 'Zu viele Login-Versuche. Konto vorübergehend gesperrt.',
    lockTime: '15 Minuten',
    code: 'LOGIN_RATE_LIMITED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Reset counter bei erfolgreichem Login
});

// Login Attempt Logging
export const logLoginAttempt = (req: Request, success: boolean, username?: string) => {
  const logData = {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    success,
    username: username || 'unknown',
    sessionId: req.sessionID
  };

  if (success) {
    console.log('🔒 LOGIN SUCCESS:', logData);
  } else {
    console.warn('🔒 LOGIN FAILURE:', logData);
  }

  // In production: Diese Logs in separate Security-Log-Datei schreiben
  if (process.env.NODE_ENV === 'production') {
    // TODO: Write to security log file
  }
};

// Admin Role Check
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.userId) {
    return res.status(401).json({ 
      error: 'Authentifizierung erforderlich',
      code: 'AUTH_REQUIRED'
    });
  }

  if (!req.session?.isAdmin) {
    console.warn('🔒 ADMIN ACCESS DENIED:', {
      userId: req.session.userId,
      ip: req.ip,
      path: req.path
    });
    return res.status(403).json({ 
      error: 'Administrator-Berechtigung erforderlich',
      code: 'ADMIN_REQUIRED'
    });
  }

  next();
};

// Session Security Headers
export const setSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Feature Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
};

// CSRF Token Generation (Simple Implementation)
export const generateCSRFToken = (): string => {
  return require('crypto').randomBytes(32).toString('hex');
};

// CSRF Token Validation
export const validateCSRFToken = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF für GET requests
  if (req.method === 'GET') {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    console.warn('🔒 CSRF: Invalid token detected', {
      hasToken: !!token,
      hasSessionToken: !!sessionToken,
      ip: req.ip,
      path: req.path
    });
    return res.status(403).json({ 
      error: 'Ungültiger CSRF-Token',
      code: 'CSRF_INVALID'
    });
  }

  next();
};