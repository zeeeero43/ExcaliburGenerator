import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { Request } from 'express';

// Erlaubte Dateitypen
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif'
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// Maximale Dateigröße: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Sichere Dateinamen-Generierung
const generateSecureFilename = (originalname: string): string => {
  const ext = path.extname(originalname).toLowerCase();
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${randomBytes}${ext}`;
};

// File Filter für Sicherheit
const fileFilter = (req: Request, file: Express.Multer.File, callback: Function) => {
  console.log('🔒 FILE UPLOAD: Validating file:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });

  // MIME Type Check
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    console.warn('🔒 FILE UPLOAD: Rejected - Invalid MIME type:', file.mimetype);
    return callback(new Error(`Ungültiger Dateityp. Erlaubt: ${ALLOWED_MIME_TYPES.join(', ')}`), false);
  }

  // Extension Check
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    console.warn('🔒 FILE UPLOAD: Rejected - Invalid extension:', ext);
    return callback(new Error(`Ungültige Dateiendung. Erlaubt: ${ALLOWED_EXTENSIONS.join(', ')}`), false);
  }

  // Filename Security Check - keine gefährlichen Zeichen
  const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (dangerousChars.test(file.originalname)) {
    console.warn('🔒 FILE UPLOAD: Rejected - Dangerous characters in filename:', file.originalname);
    return callback(new Error('Dateiname enthält ungültige Zeichen.'), false);
  }

  // Filename Length Check
  if (file.originalname.length > 255) {
    console.warn('🔒 FILE UPLOAD: Rejected - Filename too long:', file.originalname.length);
    return callback(new Error('Dateiname ist zu lang (max. 255 Zeichen).'), false);
  }

  console.log('🔒 FILE UPLOAD: File validation passed:', file.originalname);
  callback(null, true);
};

// Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    const uploadPath = 'uploads/';
    callback(null, uploadPath);
  },
  filename: function (req, file, callback) {
    const secureFilename = generateSecureFilename(file.originalname);
    console.log('🔒 FILE UPLOAD: Generated secure filename:', {
      original: file.originalname,
      secure: secureFilename
    });
    callback(null, secureFilename);
  }
});

// Sichere Upload-Konfiguration
export const secureUpload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // Max 10 Dateien gleichzeitig
    fields: 20, // Max 20 Form-Fields
    fieldNameSize: 100, // Max Field-Name Länge
    fieldSize: 1024 * 1024 // Max Field-Value Größe: 1MB
  },
  fileFilter: fileFilter
});

// File Validation nach Upload (zusätzliche Sicherheit)
export const validateUploadedFile = async (buffer: Buffer, filename: string, mimetype: string): Promise<boolean> => {
  try {
    // Use the buffer directly instead of reading from file
    const fileBuffer = buffer;
    
    // Magic Number Check für echte Image-Files
    const isPNG = fileBuffer.length > 8 && 
                 fileBuffer[0] === 0x89 && fileBuffer[1] === 0x50 && 
                 fileBuffer[2] === 0x4E && fileBuffer[3] === 0x47;
    
    const isJPEG = fileBuffer.length > 2 && 
                   fileBuffer[0] === 0xFF && fileBuffer[1] === 0xD8;
    
    const isWebP = fileBuffer.length > 12 && 
                   fileBuffer.toString('ascii', 0, 4) === 'RIFF' &&
                   fileBuffer.toString('ascii', 8, 12) === 'WEBP';

    const isGIF = fileBuffer.length > 6 && 
                  (fileBuffer.toString('ascii', 0, 6) === 'GIF87a' || 
                   fileBuffer.toString('ascii', 0, 6) === 'GIF89a');

    if (!isPNG && !isJPEG && !isWebP && !isGIF) {
      console.warn('🔒 FILE VALIDATION: File failed magic number check:', filename);
      return false;
    }

    // Suche nach verdächtigen Patterns (einfache Malware-Erkennung)
    // Nur die ersten 2KB prüfen, um Binär-Probleme zu vermeiden
    const checkSize = Math.min(2048, fileBuffer.length);
    const fileContent = fileBuffer.subarray(0, checkSize).toString('ascii', 0, checkSize);
    const suspiciousPatterns = [
      '<script',
      'javascript:',
      'eval(',
      'document.write',
      '<?php',
      '<%',
      'exec(',
      'shell_exec(',
      'system('
    ];

    for (const pattern of suspiciousPatterns) {
      if (fileContent.toLowerCase().includes(pattern)) {
        console.warn('🔒 FILE VALIDATION: Suspicious pattern detected:', pattern);
        return false;
      }
    }

    console.log('🔒 FILE VALIDATION: File passed all security checks:', filename);
    return true;

  } catch (error) {
    console.error('🔒 FILE VALIDATION: Error during validation:', error);
    return false;
  }
};

// Upload Error Handler
export const handleUploadError = (error: any, req: Request, res: any, next: Function) => {
  console.error('🔒 UPLOAD ERROR:', error);

  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(413).json({ 
          error: `Datei zu groß. Maximum: ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(413).json({ 
          error: 'Zu viele Dateien. Maximum: 10 Dateien' 
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({ 
          error: 'Unerwartete Datei. Nur Bilder erlaubt.' 
        });
      default:
        return res.status(400).json({ 
          error: 'Upload-Fehler: ' + error.message 
        });
    }
  }

  if (error.message) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(500).json({ error: 'Unbekannter Upload-Fehler' });
};