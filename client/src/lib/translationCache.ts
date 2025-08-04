// Translation Cache to avoid re-translating same texts
// Saves DeepL character usage massively

interface CachedTranslation {
  text: string;
  fromLang: string;
  toLang: string;
  result: string;
  timestamp: number;
}

class TranslationCache {
  private cache = new Map<string, CachedTranslation>();
  private maxAge = 24 * 60 * 60 * 1000; // 24 hours

  private getCacheKey(text: string, fromLang: string, toLang: string): string {
    return `${text}|${fromLang}|${toLang}`;
  }

  get(text: string, fromLang: string, toLang: string): string | null {
    const key = this.getCacheKey(text, fromLang, toLang);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    console.log(`🔄 CACHE HIT: "${text.substring(0, 30)}..." (${fromLang}->${toLang})`);
    return cached.result;
  }

  set(text: string, fromLang: string, toLang: string, result: string): void {
    const key = this.getCacheKey(text, fromLang, toLang);
    this.cache.set(key, {
      text,
      fromLang,
      toLang,
      result,
      timestamp: Date.now()
    });
    
    // Cleanup old entries if cache gets too large
    if (this.cache.size > 1000) {
      const entries = Array.from(this.cache.entries());
      const sortedEntries = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest 200 entries
      for (let i = 0; i < 200; i++) {
        this.cache.delete(sortedEntries[i][0]);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // Could implement hit rate tracking
    };
  }
}

// Hardcoded translations for common phrases to save API calls
const HARDCODED_TRANSLATIONS: Record<string, Record<string, string>> = {
  'de': {
    'es': {
      'Preis auf Anfrage': 'Precio a consultar',
      'Auf Lager': 'En stock',
      'Nicht auf Lager': 'Sin stock',
      'Begrenzt verfügbar': 'Disponibilidad limitada',
      'Aktiv': 'Activo',
      'Inaktiv': 'Inactivo',
      'Hervorgehoben': 'Destacado',
      'Neu': 'Nuevo',
      'Gebraucht': 'Usado',
      'Verfügbar': 'Disponible',
      'Nicht verfügbar': 'No disponible'
    },
    'en': {
      'Preis auf Anfrage': 'Price on request',
      'Auf Lager': 'In stock',
      'Nicht auf Lager': 'Out of stock', 
      'Begrenzt verfügbar': 'Limited availability',
      'Aktiv': 'Active',
      'Inaktiv': 'Inactive',
      'Hervorgehoben': 'Featured',
      'Neu': 'New',
      'Gebraucht': 'Used',
      'Verfügbar': 'Available',
      'Nicht verfügbar': 'Unavailable'
    }
  }
};

export const translationCache = new TranslationCache();

export function getHardcodedTranslation(text: string, fromLang: string, toLang: string): string | null {
  const translations = HARDCODED_TRANSLATIONS[fromLang]?.[toLang];
  return translations?.[text] || null;
}

// Smart translation function that checks cache and hardcoded translations first
export async function smartTranslate(text: string, fromLang: string, toLang: string): Promise<string> {
  if (!text || text.trim() === '') return '';
  
  const trimmedText = text.trim();
  
  // 1. Check hardcoded translations first
  const hardcoded = getHardcodedTranslation(trimmedText, fromLang, toLang);
  if (hardcoded) {
    console.log(`🔄 HARDCODED: "${trimmedText}" -> "${hardcoded}"`);
    return hardcoded;
  }
  
  // 2. Check cache
  const cached = translationCache.get(trimmedText, fromLang, toLang);
  if (cached) {
    return cached;
  }
  
  // 3. Call API only if needed - LOG MASSIVE TEXTS
  console.log(`🚨 API CALL NEEDED: "${trimmedText.substring(0, 50)}..." (${text.length} chars)`);
  
  if (text.length > 1000) {
    console.error(`⚠️⚠️⚠️ MASSIVE TEXT DETECTED: ${text.length} characters!`);
    console.error(`📄 HUGE TEXT PREVIEW: "${text.substring(0, 200)}..."`);
    console.error(`🎯 THIS IS LIKELY THE QUOTA KILLER!`);
  }
  
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmedText, fromLang, toLang })
    });
    
    if (response.ok) {
      const data = await response.json();
      const result = data.translatedText || trimmedText;
      
      // Cache the result
      translationCache.set(trimmedText, fromLang, toLang, result);
      
      return result;
    }
  } catch (error) {
    console.error('Translation failed:', error);
  }
  
  return trimmedText; // Fallback to original
}