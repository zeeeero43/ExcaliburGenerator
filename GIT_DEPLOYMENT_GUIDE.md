# Git-basiertes Deployment für EXCALIBUR CUBA Website

## Übersicht
Diese Anleitung beschreibt, wie Sie die EXCALIBUR CUBA Website mit Git-Workflow auf einem VPS deployen und aktualisieren können. So können Sie einfach Updates durchführen, ohne alles neu installieren zu müssen.

## Voraussetzungen
- Ubuntu 22.04 LTS VPS bei Hostinger
- Root-Zugriff auf den Server
- Domain excalibur-cuba.com (konfiguriert auf VPS-IP)

## 1. Erstmalige Einrichtung auf dem VPS

### System vorbereiten
```bash
# System aktualisieren
apt update && apt upgrade -y

# Notwendige Pakete installieren
apt install -y curl wget git nginx postgresql postgresql-contrib nodejs npm certbot python3-certbot-nginx

# Node.js 20 installieren (aktueller LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# PM2 für Prozess-Management installieren
npm install -g pm2

# Arbeitsverzeichnis erstellen
mkdir -p /var/www/excalibur-cuba
cd /var/www/excalibur-cuba
```

### Git Repository klonen
```bash
# Project von GitHub klonen (oder von Ihrem Git-Provider)
git clone https://github.com/IHR-USERNAME/excalibur-cuba.git .

# Alternativ: Falls Sie von ZIP-Datei starten
# Laden Sie die ZIP-Datei hoch und entpacken Sie sie in /var/www/excalibur-cuba/
```

### PostgreSQL konfigurieren
```bash
# PostgreSQL Service starten
systemctl enable postgresql
systemctl start postgresql

# Datenbank und User erstellen
sudo -u postgres psql << EOF
CREATE USER excalibur_user WITH PASSWORD 'SecurePass2025_ExcaliburDB';
CREATE DATABASE excalibur_cuba OWNER excalibur_user;
GRANT ALL PRIVILEGES ON DATABASE excalibur_cuba TO excalibur_user;
\q
EOF
```

### Umgebungsvariablen konfigurieren
```bash
# .env Datei erstellen
cat > .env << EOF
NODE_ENV=production
DATABASE_URL=postgresql://excalibur_user:SecurePass2025_ExcaliburDB@localhost:5432/excalibur_cuba
SESSION_SECRET=$(openssl rand -base64 32)
PORT=3000
EOF

# Berechtigungen setzen
chown -R www-data:www-data /var/www/excalibur-cuba
chmod 600 /var/www/excalibur-cuba/.env
```

### Projekt bauen und starten
```bash
# Dependencies installieren
npm install

# Frontend bauen
npm run build

# Datenbank initialisieren (Admin User wird automatisch erstellt)
npm run db:push

# PM2 Konfiguration erstellen
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'excalibur-cuba',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/excalibur-cuba',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    log_file: '/var/log/excalibur-cuba.log',
    error_file: '/var/log/excalibur-cuba-error.log',
    out_file: '/var/log/excalibur-cuba-out.log'
  }]
};
EOF

# App mit PM2 starten
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Nginx konfigurieren
```bash
# Nginx Konfiguration erstellen
cat > /etc/nginx/sites-available/excalibur-cuba << 'EOF'
server {
    listen 80;
    server_name excalibur-cuba.com www.excalibur-cuba.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # File upload size
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static file handling
    location /uploads/ {
        alias /var/www/excalibur-cuba/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Site aktivieren
ln -s /etc/nginx/sites-available/excalibur-cuba /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### SSL/HTTPS konfigurieren
```bash
# Let's Encrypt SSL Zertifikat installieren
certbot --nginx -d excalibur-cuba.com -d www.excalibur-cuba.com --agree-tos --no-eff-email --email admin@excalibur-cuba.com
```

## 2. Updates mit Git durchführen

### Auf dem Entwicklungsrechner (lokal)
```bash
# Änderungen committen und pushen
git add .
git commit -m "Produktkatalog Update - neue Solar Panels hinzugefügt"
git push origin main
```

### Auf dem VPS (Updates deployen)
```bash
# Zum Projektverzeichnis wechseln
cd /var/www/excalibur-cuba

# Aktuelle Änderungen pullen
git pull origin main

# Dependencies aktualisieren (falls package.json geändert wurde)
npm install

# Frontend neu bauen
npm run build

# Datenbankschema aktualisieren (falls Schema-Änderungen)
npm run db:push

# App neu starten
pm2 restart excalibur-cuba

# Nginx neu laden (falls Konfiguration geändert)
systemctl reload nginx
```

## 3. Automatisierung mit Update-Script

### Update-Script erstellen
```bash
cat > /var/www/excalibur-cuba/update.sh << 'EOF'
#!/bin/bash

echo "🚀 EXCALIBUR CUBA - Git Update gestartet..."

# Zum Projektverzeichnis wechseln
cd /var/www/excalibur-cuba

# Git Status prüfen
echo "📋 Aktueller Git Status:"
git status --porcelain

# Backup der aktuellen Version
BACKUP_DIR="/var/backups/excalibur-cuba-$(date +%Y%m%d_%H%M%S)"
echo "💾 Backup erstellen: $BACKUP_DIR"
mkdir -p $BACKUP_DIR
cp -r /var/www/excalibur-cuba $BACKUP_DIR/

# Git Pull
echo "⬇️ Neueste Änderungen abrufen..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Git Pull fehlgeschlagen! Abbruch."
    exit 1
fi

# Dependencies prüfen und installieren
echo "📦 Dependencies prüfen..."
npm install

# Frontend bauen
echo "🔨 Frontend wird gebaut..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build fehlgeschlagen! Abbruch."
    exit 1
fi

# Datenbank aktualisieren
echo "🗄️ Datenbank aktualisieren..."
npm run db:push

# PM2 App neu starten
echo "🔄 App wird neu gestartet..."
pm2 restart excalibur-cuba

# Logs prüfen
echo "📋 App Status:"
pm2 status excalibur-cuba

# Nginx neu laden
echo "🌐 Nginx wird neu geladen..."
systemctl reload nginx

echo "✅ Update abgeschlossen!"
echo "🌍 Website verfügbar unter: https://excalibur-cuba.com"

# Cleanup alter Backups (älter als 7 Tage)
find /var/backups -name "excalibur-cuba-*" -type d -mtime +7 -exec rm -rf {} + 2>/dev/null

echo "🧹 Alte Backups bereinigt."
EOF

# Script ausführbar machen
chmod +x /var/www/excalibur-cuba/update.sh
```

### Update ausführen
```bash
# Einfach das Update-Script ausführen
/var/www/excalibur-cuba/update.sh
```

## 4. Monitoring und Logs

### App-Status prüfen
```bash
# PM2 Status
pm2 status
pm2 logs excalibur-cuba

# Nginx Status
systemctl status nginx

# Datenbank Status
systemctl status postgresql
```

### Log-Dateien
```bash
# App Logs
tail -f /var/log/excalibur-cuba.log

# Nginx Logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# PM2 Logs
pm2 logs excalibur-cuba --lines 50
```

## 5. Backup-Strategie

### Automatisches Datenbank-Backup
```bash
# Backup-Script erstellen
cat > /usr/local/bin/backup-excalibur.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Datenbank Backup
pg_dump -h localhost -U excalibur_user -d excalibur_cuba > $BACKUP_DIR/excalibur_cuba_$DATE.sql

# Uploads Backup
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/excalibur-cuba/uploads

# Alte Backups löschen (älter als 30 Tage)
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /usr/local/bin/backup-excalibur.sh

# Cron Job für tägliches Backup
echo "0 2 * * * /usr/local/bin/backup-excalibur.sh" | crontab -
```

## 6. Troubleshooting

### Häufige Probleme

**Git Pull schlägt fehl:**
```bash
# Lokale Änderungen stashen
git stash
git pull origin main
git stash pop
```

**Build Fehler:**
```bash
# Node Modules neu installieren
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Datenbank Verbindungsfehler:**
```bash
# PostgreSQL Service prüfen
systemctl status postgresql
systemctl restart postgresql

# Verbindung testen
psql -h localhost -U excalibur_user -d excalibur_cuba
```

**PM2 App läuft nicht:**
```bash
# PM2 Status und Neustart
pm2 status
pm2 restart excalibur-cuba
pm2 logs excalibur-cuba
```

## 7. Workflow für Entwicklung

### Lokale Entwicklung
```bash
# Repository klonen
git clone https://github.com/IHR-USERNAME/excalibur-cuba.git
cd excalibur-cuba

# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev

# Änderungen testen und committen
git add .
git commit -m "Feature: Neue Produktkategorie hinzugefügt"
git push origin main
```

### Production Update
```bash
# Auf dem VPS
/var/www/excalibur-cuba/update.sh
```

## 8. Admin-Zugang

**Standard Admin-Login:**
- URL: https://excalibur-cuba.com/admin/login
- Benutzername: admin
- Passwort: admin123

**⚠️ Wichtig:** Ändern Sie das Admin-Passwort nach dem ersten Login!

## Support

Bei Problemen:
1. Logs prüfen: `pm2 logs excalibur-cuba`
2. System Status: `systemctl status nginx postgresql`
3. Update-Script ausführen: `/var/www/excalibur-cuba/update.sh`

Diese Git-basierte Deployment-Strategie ermöglicht einfache Updates ohne komplette Neuinstallation!