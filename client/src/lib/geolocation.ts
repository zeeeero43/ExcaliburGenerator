export interface GeolocationResult {
  country: string;
  language: string;
}

export async function detectLanguageFromLocation(): Promise<string> {
  try {
    const response = await fetch('/api/geolocation');
    const data: GeolocationResult = await response.json();
    return data.language || 'es';
  } catch (error) {
    console.error('Geolocation detection failed:', error);
    
    // Fallback to browser language
    const browserLang = navigator.language.split('-')[0];
    const supportedLangs = ['es', 'de', 'en'];
    
    return supportedLangs.includes(browserLang) ? browserLang : 'es';
  }
}
