// Free translation service using MyMemory API
const TRANSLATION_API_BASE = 'https://api.mymemory.translated.net/get';

export async function translateText(text: string, fromLang: string, toLang: string): Promise<string> {
  if (!text || text.trim() === '') {
    return '';
  }

  try {
    const response = await fetch(
      `${TRANSLATION_API_BASE}?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`
    );
    
    if (!response.ok) {
      throw new Error('Translation API request failed');
    }
    
    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData) {
      return data.responseData.translatedText;
    } else {
      throw new Error('Translation failed');
    }
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text if translation fails
  }
}

export async function translateProductData(germanData: {
  name?: string;
  shortDescription?: string;
  description?: string;
  features?: string;
  specifications?: string;
  installation?: string;
  maintenance?: string;
  warranty?: string;
  support?: string;
}): Promise<{
  spanish: typeof germanData;
  english: typeof germanData;
}> {
  const translateObject = async (data: typeof germanData, targetLang: string) => {
    const translated: typeof germanData = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'string') {
        translated[key as keyof typeof germanData] = await translateText(value, 'de', targetLang);
      }
    }
    
    return translated;
  };

  try {
    const [spanish, english] = await Promise.all([
      translateObject(germanData, 'es'),
      translateObject(germanData, 'en')
    ]);

    return { spanish, english };
  } catch (error) {
    console.error('Batch translation error:', error);
    // Return original data if translation fails
    return {
      spanish: germanData,
      english: germanData
    };
  }
}