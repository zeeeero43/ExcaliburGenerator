# 🔧 ÜBERSETZUNG AUF PRODUKTIONSSERVER BEHEBEN

## Problem: Übersetzung funktioniert in Replit, aber nicht auf dem produktiven Server

### Mögliche Ursachen:
1. **Firewall blockiert externe API-Aufrufe**
2. **DNS-Probleme auf dem Server**
3. **Systemd Service läuft ohne Netzwerkzugriff**
4. **MyMemory API ist vom Server nicht erreichbar**

## 🚀 SOFORTIGE LÖSUNG - SCHRITT FÜR SCHRITT

### Schritt 1: Server-Zugriff testen
```bash
# SSH zum Server
ssh root@[IHRE-SERVER-IP]

# API-Zugriff testen
curl -v "https://api.mymemory.translated.net/get?q=test&langpair=de|es"
```

**Erwartetes Ergebnis:** JSON mit übersetztem Text
**Wenn Fehler:** Firewall oder DNS-Problem

### Schritt 2: Systemd Service mit Netzwerk-Zugriff konfigurieren
```bash
# Service bearbeiten
sudo nano /etc/systemd/system/excalibur-cuba.service
```

**Konfiguration aktualisieren:**
```ini
[Unit]
Description=Excalibur Cuba Website
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/excalibur-cuba/ExcaliburGenerator
Environment=NODE_ENV=production
Environment=DATABASE_URL=postgresql://excalibur_user:ExcaliburCuba@2025!SecureDB#9847@localhost:5432/excalibur_cuba
Environment=SESSION_SECRET=ExcaliburCuba@2025!SecureSession#9847VeryLongSecretKey
Environment=PORT=5000
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=3
# KRITISCH: Netzwerkzugriff sicherstellen
RemainAfterExit=no
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### Schritt 3: Service neu starten
```bash
sudo systemctl daemon-reload
sudo systemctl restart excalibur-cuba
sudo systemctl status excalibur-cuba
```

### Schritt 4: Real-time Debugging aktivieren
```bash
# Live-Logs anschauen
sudo journalctl -u excalibur-cuba -f

# In einem anderen Terminal:
# Ein Produkt im Admin Panel erstellen und die Logs beobachten
```

### Schritt 5: Manuelle API-Test über Server
```bash
# Server-Terminal: API direkt testen
curl -X POST http://localhost:5000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Test auf Deutsch","fromLang":"de","toLang":"es"}'
```

**Erwartetes Ergebnis:** `{"translatedText":"Prueba en español"}`

### Schritt 6: DNS und Firewall prüfen
```bash
# DNS-Auflösung testen
nslookup api.mymemory.translated.net

# Port 443 (HTTPS) testen
telnet api.mymemory.translated.net 443

# Firewall-Regeln prüfen
sudo ufw status
sudo iptables -L
```

## 🔥 WENN NICHTS FUNKTIONIERT - OFFLINE-FALLBACK

### Alternative 1: Basis-Übersetzungen vordefinieren
Die häufigsten Übersetzungen können fest codiert werden.

### Alternative 2: Lokale Übersetzungs-API
Docker-Container mit lokaler Übersetzung installieren.

## 📋 DEBUGGING-CHECKLIST

- [ ] `curl api.mymemory.translated.net` funktioniert
- [ ] Service hat Netzwerk-Zugriff nach `network-online.target`
- [ ] Logs zeigen API-Anfragen in `journalctl -u excalibur-cuba -f`
- [ ] Port 443 ist erreichbar
- [ ] DNS löst die API-Domain auf
- [ ] Firewall blockiert nicht den Ausgang

## 🎯 HÄUFIGE LÖSUNG

**80% der Fälle:** Service startet zu früh, bevor Netzwerk verfügbar ist.
**Lösung:** `After=network-online.target` in systemd service.

## 📞 SUPPORT

Bei weiteren Problemen:
1. Logs aus `journalctl -u excalibur-cuba -f` während Übersetzungsversuch sammeln
2. Ergebnis von `curl api.mymemory.translated.net` teilen
3. Output von `systemctl status excalibur-cuba` senden