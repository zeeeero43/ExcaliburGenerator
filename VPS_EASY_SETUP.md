# 🚀 VPS EINFACHE DEEPL SETUP

## Das Problem
.env Dateien sind kompliziert auf VPS. Hier ist die einfachste Lösung.

## ⚡ SUPER EINFACHE LÖSUNG

**1. Script herunterladen und ausführen:**
```bash
# Zum Projektverzeichnis
cd /var/www/excalibur-cuba

# Script ausführen
./vps_simple_env_fix.sh
```

**2. Deinen DeepL API Key eingeben wenn gefragt**

**3. Fertig!** 

Das Script macht alles automatisch:
- ✅ API Key direkt in systemd Service setzen
- ✅ Service neu starten  
- ✅ Logs anzeigen
- ✅ Funktionstest

## 🔍 Was das Script macht

Es setzt den API Key direkt in die systemd Service-Datei:
```ini
[Service]
Environment=DEEPL_API_KEY=dein-api-key
```

Das ist viel zuverlässiger als .env Dateien.

## 🆘 FALLBACK: Manuell

Falls das Script nicht funktioniert:

```bash
# 1. Service-Datei bearbeiten
sudo nano /etc/systemd/system/excalibur-cuba.service

# 2. Diese Zeile hinzufügen (unter [Service]):
Environment=DEEPL_API_KEY=dein-deepl-api-key-hier

# 3. Service neu starten
sudo systemctl daemon-reload
sudo systemctl restart excalibur-cuba
```

## ✅ ERFOLG PRÜFEN

In den Logs sollte stehen:
```
✅ DeepL SUCCESS: "Hallo..." -> "Hola..."
```

Statt:
```
❌ DeepL Error: Authorization failure
```

Das war's! Übersetzungen funktionieren sofort.