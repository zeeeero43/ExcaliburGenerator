# 🚨 CRITICAL PRODUCTION FIX - WorkingDirectory Error

## Problem: 
```
excalibur-cuba.service: Changing to the requested working directory failed: No such file or directory
```

## ✅ SOFORT-LÖSUNG (3 Befehle):

```bash
# 1. Service stoppen
sudo systemctl stop excalibur-cuba

# 2. Service-Datei korrigieren
sudo nano /etc/systemd/system/excalibur-cuba.service

# 3. Diese Zeile ändern:
# WorkingDirectory=/var/www/excalibur-cuba/ExcaliburGenerator
# ZU:
WorkingDirectory=/var/www/excalibur-cuba
```

**Komplette korrekte Service-Datei:**
```ini
[Unit]
Description=Excalibur Cuba Website
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/excalibur-cuba
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=DATABASE_URL=postgresql://excalibur_user:SecurePass2025@localhost:5432/excalibur_db
Environment=SESSION_SECRET=your-super-secret-session-key-here-change-this-in-production

[Install]
WantedBy=multi-user.target
```

## ✅ Nach der Korrektur:
```bash
# Service neu laden und starten
sudo systemctl daemon-reload
sudo systemctl start excalibur-cuba
sudo systemctl status excalibur-cuba

# Falls Build fehlt:
cd /var/www/excalibur-cuba
npm run build
sudo systemctl restart excalibur-cuba
```

## ✅ Testen:
```bash
# Website sollte wieder funktionieren
curl http://localhost:3000
curl https://excalibur-cuba.com
```

**Das Problem:** Der Service suchte das Verzeichnis `/var/www/excalibur-cuba/ExcaliburGenerator` aber das Projekt ist in `/var/www/excalibur-cuba` entpackt.

**Nach der Korrektur:** Website läuft wieder normal!