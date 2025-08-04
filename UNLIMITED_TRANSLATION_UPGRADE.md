# 🚀 DEEPL API VERBRAUCH OPTIMIERUNG

## ❌ DAS PROBLEM
DeepL API Limit ist **viel zu schnell** aufgebraucht, weil:

1. **Jeder Tastendruck** löst Übersetzungen aus (nach 1.5-2s)
2. **3 Felder** werden gleichzeitig übersetzt (Name, Kurzbeschreibung, Beschreibung)
3. **2 Sprachen** pro Feld (Spanisch + Englisch)
4. **Lange Texte** werden in **mehrere Chunks** aufgeteilt = **mehrere API-Calls**

**Beispiel:** Ein Produktname mit 10 Zeichen = **2 API-Calls** (ES + EN)  
**Lange Beschreibung** = **6-10 API-Calls** (3-5 Chunks × 2 Sprachen)

## ✅ SOFORTIGE LÖSUNG - IMPLEMENTIERT

### 1. Debounce-Zeit ERHÖHT:
- **Name**: 1.5s → **5s**
- **Kurzbeschreibung**: 1.5s → **5s**  
- **Beschreibung**: 2s → **8s** (wegen Chunks)

### 2. Übersetzungen erst nach **kompletter Eingabe**

## 🔧 WEITERE OPTIMIERUNGEN NÖTIG

### A) TRANSLATION CACHING
```js
// Cache bereits übersetzte Texte
const translationCache = new Map();

function getCachedTranslation(text, fromLang, toLang) {
  const key = `${text}|${fromLang}|${toLang}`;
  return translationCache.get(key);
}
```

### B) API-VERBRAUCH WARNUNG
```js
// Zähler für API-Calls
let dailyApiCalls = 0;
const MAX_DAILY_CALLS = 100; // DeepL Free = 500.000 chars/month

if (dailyApiCalls > MAX_DAILY_CALLS) {
  // Nur MyMemory/Dictionary verwenden
}
```

### C) INTELLIGENTE ÜBERSETZUNG
```js
// Nur bei "echten" Änderungen übersetzen
if (originalText !== newText && newText.length > 3) {
  // Übersetzen
}
```

## 🎯 KURZFRISTIGE LÖSUNG

**DeepL API Key temporär entfernen** = Nur MyMemory + Dictionary verwenden:
```bash
# Auf VPS
cd /var/www/excalibur-cuba
sudo nano /etc/systemd/system/excalibur-cuba.service

# Diese Zeile auskommentieren:
# Environment=DEEPL_API_KEY=...

sudo systemctl daemon-reload
sudo systemctl restart excalibur-cuba
```

**Vorteil:** Übersetzungen funktionieren weiter, aber **kostenlos**.  
**Nachteil:** Etwas schlechtere Qualität (aber immer noch gut).

## 📊 MONATS-BUDGET BERECHNUNG

**DeepL Free:** 500.000 Zeichen/Monat  
**Geschätzter Verbrauch pro Produkt:** ~2.000 Zeichen  
**Maximale Produkte pro Monat:** ~250

**Bei höherem Bedarf:**
- DeepL Pro: €5.99/Monat (1 Million Zeichen)
- DeepL Pro Advanced: €22.99/Monat (unbegrenzt)

## ✅ AKTUELLE STATUS
- ✅ Debounce-Zeit erhöht (weniger API-Calls)
- ⚠️ DeepL Limit erreicht 
- ✅ MyMemory + Dictionary funktioniert als Fallback

**Empfehlung:** Für Entwicklung/Tests MyMemory verwenden, DeepL nur für finale Produkte.