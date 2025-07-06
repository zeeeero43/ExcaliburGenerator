# 🌐 LibreTranslate Setup - Unbegrenzte kostenlose Übersetzung

## Warum LibreTranslate?
- ✅ **Komplett kostenlos** - Keine API-Kosten
- ✅ **Unbegrenzte Übersetzungen** - Keine täglichen Limits
- ✅ **46 Sprachen** - Deutsch, Spanisch, Englisch und mehr
- ✅ **Selbst gehostet** - Ihre Daten bleiben auf Ihrem Server
- ✅ **Einfaches Setup** - 5 Minuten mit Docker

## Quick Setup auf Ihrem Server

### Option 1: Docker (Empfohlen)
```bash
# LibreTranslate als Docker Container starten
docker run -d \
  --name libretranslate \
  --restart unless-stopped \
  -p 5001:5000 \
  libretranslate/libretranslate

# Status prüfen
docker ps | grep libretranslate
curl http://localhost:5001/translate
```

### Option 2: Python Installation
```bash
# Python Abhängigkeiten installieren
sudo apt update
sudo apt install python3-pip python3-venv

# LibreTranslate installieren
pip3 install libretranslate

# Starten
libretranslate --host 0.0.0.0 --port 5001
```

## API Integration Test
```bash
# Test-Übersetzung (Deutsch → Spanisch)
curl -X POST "http://localhost:5001/translate" \
     -H "Content-Type: application/json" \
     -d '{
       "q": "Hallo Welt",
       "source": "de",
       "target": "es"
     }'

# Erwartetes Ergebnis:
# {"translatedText":"Hola Mundo"}
```

## Systemd Service erstellen (für automatischen Start)
```bash
sudo tee /etc/systemd/system/libretranslate.service > /dev/null << EOF
[Unit]
Description=LibreTranslate Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root
ExecStart=/usr/local/bin/libretranslate --host 0.0.0.0 --port 5001
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Service aktivieren
sudo systemctl daemon-reload
sudo systemctl enable libretranslate
sudo systemctl start libretranslate
sudo systemctl status libretranslate
```

## Nginx Konfiguration erweitern
```bash
sudo nano /etc/nginx/sites-available/excalibur-cuba
```

**Diese Sektion hinzufügen:**
```nginx
# LibreTranslate Proxy
location /translate/ {
    proxy_pass http://localhost:5001/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

**Dann:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Vorteile für Ihr Business:
1. **Keine Kosten** - Sparen Sie Geld für Translation APIs
2. **Keine Limits** - Übersetzen Sie so viel Sie wollen
3. **Bessere Performance** - Lokaler Server = schnellere Antworten
4. **Datenschutz** - Ihre Produktdaten verlassen nie Ihren Server
5. **Offline-fähig** - Funktioniert auch ohne Internet

## Unterstützte Sprachen:
```
Deutsch (de) ↔ Spanisch (es)
Deutsch (de) ↔ Englisch (en)
Spanisch (es) ↔ Englisch (en)
+ 43 weitere Sprachen
```

**Zeit zum Setup: ~5 Minuten**  
**Kosten: $0**  
**Limits: Keine**