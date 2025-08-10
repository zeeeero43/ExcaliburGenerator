export interface GeolocationResult {
  country: string;
  language: string;
}

export async function detectLanguageFromLocation(): Promise<string> {
  try {
    const response = await fetch('/api/geolocation');
    const data: GeolocationResult = await response.json();
    return data.language || 'es'; // Default to Spanish for Cuban market
  } catch (error) {
    console.error('Geolocation detection failed:', error);
    
    // Fallback to Spanish as global default
    const browserLang = navigator.language.split('-')[0];
    console.log('Browser language detected:', browserLang);
    
    // NO German for regular users - only Spanish or English
    // German is reserved for logged-in admins only
    if (browserLang === 'en') return 'en';
    return 'es'; // Spanish as global default (including for German users)
  }
}
