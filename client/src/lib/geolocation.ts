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
    
    // Fallback to browser language
    const browserLang = navigator.language.split('-')[0];
    console.log('Browser language detected:', browserLang);
    const supportedLangs = ['es', 'de', 'en'];
    
    // Priority: Spanish for Cuban market, then browser language if supported
    if (browserLang === 'de') return 'de';
    return supportedLangs.includes(browserLang) ? browserLang : 'es';
  }
}
