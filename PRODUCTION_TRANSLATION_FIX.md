# 🔧 LibreTranslate Connection Fix

## Problem: Container läuft, aber Connection Reset

Das ist normal beim ersten Start - LibreTranslate braucht Zeit zum Initialisieren.

## SOFORT-LÖSUNG:

```bash
# 1. Container Status prüfen
docker ps -a

# 2. Logs anschauen
docker logs libretranslate

# 3. Container neu starten (falls nötig)
docker restart libretranslate

# 4. 30-60 Sekunden warten, dann testen
sleep 30
curl -X POST "http://localhost:5001/translate" -H "Content-Type: application/json" -d '{"q": "Hallo", "source": "de", "target": "es"}'
```

## Falls weiterhin Problems:

### Option A: Container mit mehr Memory starten
```bash
# Alten Container stoppen und löschen
docker stop libretranslate
docker rm libretranslate

# Neu starten mit mehr Ressourcen
docker run -d \
  --name libretranslate \
  --restart unless-stopped \
  -p 5001:5000 \
  --memory=1g \
  libretranslate/libretranslate
```

### Option B: Spezifische Konfiguration
```bash
# Container mit CPU Architektur Fix
docker stop libretranslate
docker rm libretranslate

docker run -d \
  --name libretranslate \
  --restart unless-stopped \
  -p 5001:5000 \
  -e LT_API_KEYS=true \
  libretranslate/libretranslate
```

### Option C: Web Interface testen
```bash
# Browser Test - sollte funktionieren:
curl http://localhost:5001/
```

## Container Monitoring:
```bash
# Kontinuierlich Logs anschauen
docker logs -f libretranslate

# Container Ressourcen prüfen
docker stats libretranslate

# Port Status prüfen  
netstat -tulpn | grep 5001
```

## Typische Startup-Zeit:
- **Normal**: 30-60 Sekunden
- **Erster Start**: 1-2 Minuten (Downloads models)
- **Schwacher Server**: bis zu 5 Minuten

## Test-Sequence:
```bash
# 1. Warten
sleep 60

# 2. Simple GET test
curl http://localhost:5001/languages

# 3. Translation test
curl -X POST "http://localhost:5001/translate" \
     -H "Content-Type: application/json" \
     -d '{"q": "test", "source": "en", "target": "es"}'
```

**Sobald LibreTranslate antwortet: Website neu starten und unbegrenzte Übersetzungen genießen!**