export interface GeolocationResult {
  country: string;
  language: string;
}

export async function detectLanguageFromLocation(): Promise<string> {
  try {
    const response = await fetch('/api/geolocation');
    const data: GeolocationResult = await response.json();
    return data.language || 'de'; // Default to German instead of Spanish
  } catch (error) {
    console.error('Geolocation detection failed:', error);
    
    // Fallback to browser language
    const browserLang = navigator.language.split('-')[0];
    console.log('Browser language detected:', browserLang);
    const supportedLangs = ['es', 'de', 'en'];
    
    // Priority: German for German speakers, then browser language, then Spanish
    if (browserLang === 'de') return 'de';
    return supportedLangs.includes(browserLang) ? browserLang : 'de';
  }
}
