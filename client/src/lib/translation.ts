// Free translation service using MyMemory API
const TRANSLATION_API_BASE = 'https://api.mymemory.translated.net/get';

export async function translateText(text: string, fromLang: string, toLang: string): Promise<string> {
  if (!text || text.trim() === '') {
    return '';
  }

  try {
    // Split only VERY long texts (DeepL limit is 128 KiB ≈ 130,000 chars)
    const maxChunkSize = 100000; // 100k characters per chunk (well under DeepL limit)
    if (text.length > maxChunkSize) {
      console.log(`🔄 Long text detected (${text.length} chars), splitting into chunks...`);
      
      // Split by sentences first, then by paragraphs if needed
      const sentences = text.split(/(?<=[.!?])\s+/);
      const chunks = [];
      let currentChunk = '';
      
      for (const sentence of sentences) {
        if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
      }
      
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      
      // Translate each chunk separately
      const translatedChunks = [];
      for (let i = 0; i < chunks.length; i++) {
        console.log(`🔄 Translating chunk ${i + 1}/${chunks.length}...`);
        
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: chunks[i],
            fromLang,
            toLang
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          translatedChunks.push(data.translatedText || chunks[i]);
        } else {
          translatedChunks.push(chunks[i]); // Fallback to original
        }
        
        // Small delay between requests to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      const result = translatedChunks.join(' ');
      console.log(`✅ Long text translation completed: ${text.length} → ${result.length} chars`);
      return result;
    }

    // Regular translation for shorter texts
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        fromLang,
        toLang
      })
    });
    
    if (!response.ok) {
      throw new Error('Translation API request failed');
    }
    
    const data = await response.json();
    if (data.error) {
      console.error(`❌ Translation API error: ${data.error} - ${data.details || 'Unknown'}`);
      console.error(`❌ PRODUCTION DEBUGGING: Check server logs with 'sudo journalctl -u excalibur-cuba -f'`);
      return text; // Return original text if translation fails
    }
    return data.translatedText || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text if translation fails
  }
}

// 🚨 DISABLED: This function was consuming massive API quota!
// Old function could translate up to 9 fields × 2 languages = 18 API calls per use!
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
  console.log(`🚨 BATCH TRANSLATION DISABLED to save API quota! Only translating essential fields.`);
  
  // Only translate the most essential fields to save API quota
  const essentialFields = ['name', 'shortDescription'];
  
  const translateEssentials = async (data: typeof germanData, targetLang: string) => {
    const translated: typeof germanData = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'string' && essentialFields.includes(key)) {
        console.log(`🔄 ESSENTIAL ONLY: Translating ${key} (${value.length} chars) to ${targetLang}`);
        translated[key as keyof typeof germanData] = await translateText(value, 'de', targetLang);
      } else {
        // Keep original German for non-essential fields
        translated[key as keyof typeof germanData] = value;
      }
    }
    
    return translated;
  };

  try {
    // Only translate to Spanish (Cuba market priority) - English disabled to save quota
    const spanish = await translateEssentials(germanData, 'es');
    const english = germanData; // Keep German as fallback for English to save quota
    
    console.log(`✅ ESSENTIAL TRANSLATION: Only name + shortDescription translated to save API quota`);
    return { spanish, english };
  } catch (error) {
    console.error('Essential translation error:', error);
    return {
      spanish: germanData,
      english: germanData
    };
  }
}