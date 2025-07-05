# VPS Deployment Guide für Excalibur Cuba Website

## Voraussetzungen
- Ubuntu VPS bei Hostinger
- Heruntergeladenes Projekt als ZIP-Datei
- SSH-Zugang zum VPS

## 1. Erste Schritte - Verbindung zum VPS

### SSH-Verbindung herstellen
```bash
# Ersetze DEINE_VPS_IP mit der tatsächlichen IP-Adresse
ssh root@DEINE_VPS_IP
```

## 2. System aktualisieren und vorbereiten

### Pakete aktualisieren
```bash
# System-Pakete aktualisieren
sudo apt update && sudo apt upgrade -y

# Wichtige Tools installieren
sudo apt install -y curl wget unzip git nginx
```

### Firewall konfigurieren
```bash
# Firewall aktivieren
sudo ufw enable

# Wichtige Ports freigeben
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 5000  # Deine App (temporär)

# Status prüfen
sudo ufw status
```

## 3. Node.js installieren

### Node.js 20 installieren
```bash
# Node.js Repository hinzufügen
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Node.js installieren
sudo apt install -y nodejs

# Prüfen ob installiert
node --version
npm --version
```

## 4. PostgreSQL installieren

### PostgreSQL Setup
```bash
# PostgreSQL installieren
sudo apt install -y postgresql postgresql-contrib

# PostgreSQL starten
sudo systemctl start postgresql
sudo systemctl enable postgresql

# PostgreSQL Status prüfen
sudo systemctl status postgresql
```

### Datenbank und Benutzer erstellen
```bash
# Als postgres Benutzer anmelden
sudo -u postgres psql

# In PostgreSQL (diese Befehle IN der PostgreSQL-Konsole ausführen):
CREATE DATABASE excalibur_cuba;
CREATE USER excalibur_user WITH PASSWORD 'ExcaliburCuba@2025!SecureDB#9847';
GRANT ALL PRIVILEGES ON DATABASE excalibur_cuba TO excalibur_user;
GRANT ALL ON SCHEMA public TO excalibur_user;
\q

# PostgreSQL-Konsole verlassen
```

## 5. Projekt auf VPS hochladen

### Projektverzeichnis erstellen
```bash
# Arbeitsverzeichnis erstellen
mkdir -p /var/www/excalibur-cuba
cd /var/www/excalibur-cuba
```

### Projekt hochladen (wähle eine Option):

#### Option A: Mit scp (von deinem Computer)
```bash
# Auf deinem Computer (nicht auf dem VPS):
scp pfad/zu/deinem/projekt.zip root@DEINE_VPS_IP:/var/www/excalibur-cuba/
```

#### Option B: Mit curl/wget (wenn du die Datei online hast)
```bash
# Auf dem VPS:
wget URL_ZUR_ZIP_DATEI
```

### Projekt entpacken
```bash
# ZIP-Datei entpacken
unzip projekt.zip

# Rechte setzen
sudo chown -R www-data:www-data /var/www/excalibur-cuba
sudo chmod -R 755 /var/www/excalibur-cuba
```

## 6. Projekt konfigurieren

### Abhängigkeiten installieren
```bash
# In das Projektverzeichnis wechseln
cd /var/www/excalibur-cuba

# NPM-Abhängigkeiten installieren
npm install

# TypeScript global installieren
npm install -g typescript tsx
```

### Umgebungsvariablen setzen
```bash
# .env Datei erstellen
nano .env

# Folgendes in die .env Datei einfügen:
NODE_ENV=production
DATABASE_URL=postgresql://excalibur_user:ExcaliburCuba@2025!SecureDB#9847@localhost:5432/excalibur_cuba
SESSION_SECRET=ExcaliburCuba@2025!SecureSession#9847VeryLongSecretKey
PORT=5000
```

### Database Schema erstellen
```bash
# Datenbank-Schema pushen
npm run db:push

# Datenbank mit Anfangsdaten füllen
npm run db:seed
```

## 7. Anwendung als Service einrichten

### Systemd Service erstellen
```bash
# Service-Datei erstellen
sudo nano /etc/systemd/system/excalibur-cuba.service

# Folgendes in die Service-Datei einfügen:
[Unit]
Description=Excalibur Cuba Website
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/excalibur-cuba
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run build:production
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

### Production Build Script hinzufügen
```bash
# package.json öffnen
nano package.json

# Dieses Script zu "scripts" hinzufügen:
"build:production": "tsc && node dist/server/index.js"
```

### Service aktivieren
```bash
# Service neu laden
sudo systemctl daemon-reload

# Service aktivieren
sudo systemctl enable excalibur-cuba

# Service starten
sudo systemctl start excalibur-cuba

# Status prüfen
sudo systemctl status excalibur-cuba
```

## 8. Nginx als Reverse Proxy einrichten

### Nginx konfigurieren
```bash
# Nginx-Konfiguration erstellen
sudo nano /etc/nginx/sites-available/excalibur-cuba

# Folgendes in die Konfiguration einfügen:
server {
    listen 80;
    server_name excalibur-cuba.com www.excalibur-cuba.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Site aktivieren
```bash
# Symbolischen Link erstellen
sudo ln -s /etc/nginx/sites-available/excalibur-cuba /etc/nginx/sites-enabled/

# Standard-Site deaktivieren
sudo rm /etc/nginx/sites-enabled/default

# Nginx-Konfiguration testen
sudo nginx -t

# Nginx neustarten
sudo systemctl restart nginx
```

## 9. SSL-Zertifikat mit Let's Encrypt einrichten

### Certbot installieren
```bash
# Certbot installieren
sudo apt install -y certbot python3-certbot-nginx

# SSL-Zertifikat erstellen
sudo certbot --nginx -d excalibur-cuba.com -d www.excalibur-cuba.com

# Automatische Erneuerung testen
sudo certbot renew --dry-run
```

## 10. PM2 für bessere Prozess-Verwaltung (optional aber empfohlen)

### PM2 installieren
```bash
# PM2 installieren
npm install -g pm2

# Anwendung mit PM2 starten
pm2 start npm --name "excalibur-cuba" -- run build:production

# PM2 bei Systemstart automatisch starten
pm2 startup
pm2 save
```

## 11. Monitoring und Logs

### Logs überprüfen
```bash
# Anwendungs-Logs
sudo journalctl -u excalibur-cuba -f

# Nginx-Logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PM2-Logs (wenn verwendet)
pm2 logs excalibur-cuba
```

### System-Monitoring
```bash
# Systemressourcen prüfen
htop
df -h
free -h
```

## 12. Wartung und Updates

### Anwendung aktualisieren
```bash
# Neuen Code hochladen
# Service stoppen
sudo systemctl stop excalibur-cuba

# Code aktualisieren
# Abhängigkeiten installieren
npm install

# Datenbank-Schema aktualisieren
npm run db:push

# Service starten
sudo systemctl start excalibur-cuba
```

### Backup erstellen
```bash
# Datenbank-Backup
pg_dump -h localhost -U excalibur_user excalibur_cuba > backup_$(date +%Y%m%d).sql

# Dateien-Backup
tar -czf backup_files_$(date +%Y%m%d).tar.gz /var/www/excalibur-cuba
```

## 13. Troubleshooting

### Häufige Probleme
```bash
# Port bereits in Verwendung
sudo netstat -tulpn | grep :5000

# Berechtigungen prüfen
ls -la /var/www/excalibur-cuba

# Datenbank-Verbindung testen
psql -h localhost -U excalibur_user -d excalibur_cuba
```

### Nützliche Befehle
```bash
# Service-Status
sudo systemctl status excalibur-cuba

# Service neustarten
sudo systemctl restart excalibur-cuba

# Logs in Echtzeit
sudo journalctl -u excalibur-cuba -f
```

## Admin-Zugang

Nach dem Deployment ist das Admin-Panel erreichbar unter:
- **URL**: https://excalibur-cuba.com/admin/login
- **Benutzername**: excalibur_admin
- **Passwort**: ExcaliburCuba@2025!SecureAdmin#9847

## Wichtige Hinweise

1. **Sicherheit**: Ändere alle Passwörter nach dem ersten Login
2. **Backup**: Erstelle regelmäßig Backups der Datenbank
3. **Updates**: Halte das System und die Abhängigkeiten aktuell
4. **Monitoring**: Überwache die Logs regelmäßig
5. **SSL**: Das SSL-Zertifikat erneuert sich automatisch

Bei Problemen prüfe die Logs mit `sudo journalctl -u excalibur-cuba -f` oder `pm2 logs excalibur-cuba`.