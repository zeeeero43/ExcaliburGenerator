# 🚀 Update Deployment Guide - Excalibur Cuba Website

## Übersicht
Diese Anleitung zeigt Ihnen, wie Sie Updates auf der bereits laufenden Excalibur Cuba Website deployen.

## Voraussetzungen
- Website läuft bereits auf dem Ubuntu 22.04 LTS Server
- SSH-Zugang zum Server ist verfügbar
- Git Repository ist bereits eingerichtet

## 📋 Schritt-für-Schritt Update-Anleitung

### Schritt 1: SSH-Verbindung zum Server herstellen
```bash
ssh root@[YOUR_SERVER_IP]
```

### Schritt 2: Zum Projektverzeichnis navigieren
```bash
cd /var/www/excalibur-cuba/ExcaliburGenerator
```

### Schritt 3: Aktuelle Änderungen sichern (falls vorhanden)
```bash
# Prüfen, ob es lokale Änderungen gibt
git status

# Falls es lokale Änderungen gibt, diese sichern
git stash
```

### Schritt 4: Updates vom Repository holen
```bash
# Neueste Änderungen herunterladen
git pull origin main

# Falls es Konflikte gibt, diese lösen
git stash pop  # Nur wenn Sie in Schritt 3 gestashed haben
```

### Schritt 5: Dependencies aktualisieren
```bash
# Node.js Dependencies aktualisieren
npm install

# Prüfen, ob neue Dependencies installiert wurden
npm list --depth=0
```

### Schritt 6: Datenbank-Updates ausführen
```bash
# Schema-Updates anwenden
npm run db:push

# Prüfen, ob Updates erfolgreich waren
echo "Database update completed"
```

### Schritt 7: Website neu bauen
```bash
# Frontend und Backend bauen
npm run build

# Prüfen, ob der Build erfolgreich war
ls -la dist/
```

### Schritt 8: Service neu starten
```bash
# Excalibur Cuba Service neu starten
sudo systemctl restart excalibur-cuba

# Status prüfen
sudo systemctl status excalibur-cuba
```

### Schritt 9: Nginx neu laden (falls Konfiguration geändert)
```bash
# Nginx Konfiguration prüfen
sudo nginx -t

# Nginx neu laden
sudo systemctl reload nginx
```

### Schritt 10: Website testen
```bash
# Prüfen, ob die Website läuft
curl -I http://localhost:3000

# Oder im Browser öffnen
# http://[YOUR_DOMAIN]
```

## 🔧 Troubleshooting

### Problem: Service startet nicht
```bash
# Logs prüfen
sudo journalctl -u excalibur-cuba -f

# Häufige Lösungen:
# - Port bereits in Verwendung: sudo systemctl restart excalibur-cuba
# - Umgebungsvariablen fehlen: nano /etc/systemd/system/excalibur-cuba.service
# - Node.js Version: node --version (sollte v20.x sein)
```

### Problem: Database Connection Error
```bash
# Prüfen, ob PostgreSQL läuft
sudo systemctl status postgresql

# PostgreSQL neu starten
sudo systemctl restart postgresql

# Datenbankverbindung testen
psql -U excalibur_user -d excalibur_db -h localhost
```

### Problem: Build Fehler
```bash
# Cache leeren
npm cache clean --force

# node_modules neu installieren
rm -rf node_modules
npm install

# Erneut bauen
npm run build
```

### Problem: Permission Denied
```bash
# Ownership prüfen und korrigieren
sudo chown -R root:root /var/www/excalibur-cuba/
sudo chmod -R 755 /var/www/excalibur-cuba/
```

## 📊 Monitoring nach dem Update

### Log-Dateien überwachen
```bash
# Service Logs in Echtzeit
sudo journalctl -u excalibur-cuba -f

# Nginx Logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Performance prüfen
```bash
# Speicher und CPU Nutzung
htop

# Festplattenplatz
df -h

# Aktive Verbindungen
netstat -tuln | grep 3000
```

## 🔄 Automatisches Update-Script

Erstellen Sie ein Script für regelmäßige Updates:

```bash
# Update-Script erstellen
sudo nano /opt/update-excalibur.sh
```

Script-Inhalt:
```bash
#!/bin/bash
set -e

echo "🚀 Starting Excalibur Cuba Website Update..."

# Zum Projektverzeichnis
cd /var/www/excalibur-cuba/ExcaliburGenerator

# Änderungen sichern
git stash

# Updates holen
echo "📥 Pulling latest changes..."
git pull origin main

# Dependencies aktualisieren
echo "📦 Updating dependencies..."
npm install

# Datenbank aktualisieren
echo "🗄️ Updating database..."
npm run db:push

# Website bauen
echo "🏗️ Building website..."
npm run build

# Service neu starten
echo "🔄 Restarting service..."
sudo systemctl restart excalibur-cuba

# Status prüfen
echo "✅ Checking service status..."
sudo systemctl status excalibur-cuba --no-pager

echo "🎉 Update completed successfully!"
```

Script ausführbar machen:
```bash
sudo chmod +x /opt/update-excalibur.sh
```

## 📋 Schnell-Update Checklist

- [ ] SSH-Verbindung hergestellt
- [ ] Git Pull durchgeführt
- [ ] Dependencies aktualisiert
- [ ] Database Schema aktualisiert
- [ ] Build erfolgreich
- [ ] Service neu gestartet
- [ ] Website funktioniert
- [ ] Logs geprüft

## 🆘 Notfall-Rollback

Falls das Update Probleme verursacht:

```bash
# Zum letzten funktionierenden Commit zurückkehren
git log --oneline -10  # Letzten Commit finden
git checkout [COMMIT_HASH]

# Service neu starten
sudo systemctl restart excalibur-cuba
```

---

**Wichtig:** Testen Sie Updates immer erst auf einer Staging-Umgebung, bevor Sie sie auf die Produktionsumgebung anwenden.

**Support:** Bei Problemen prüfen Sie die Logs und kontaktieren Sie den technischen Support.