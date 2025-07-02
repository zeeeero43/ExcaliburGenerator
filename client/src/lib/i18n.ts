import { translations } from '../data/translations';

export type Language = 'es' | 'de' | 'en';

export class I18n {
  private currentLanguage: Language = 'es';
  private translations = translations;

  setLanguage(lang: Language) {
    this.currentLanguage = lang;
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  t(key: string): string {
    const keys = key.split('.');
    let value: any = this.translations[this.currentLanguage];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  }
}

export const i18n = new I18n();
