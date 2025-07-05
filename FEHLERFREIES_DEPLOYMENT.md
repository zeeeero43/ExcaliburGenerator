# Fehlerfreies VPS Deployment - Ubuntu 22.04 LTS

## 🎯 Getestete Anleitung ohne häufige Fehler

### Vorbereitung (auf deinem Computer)

#### 1. Projekt-ZIP vorbereiten
```bash
# WICHTIG: Datei umbenennen (keine Leerzeichen/Sonderzeichen!)
# Von: "Excalibur Generator (2).zip" 
# Zu:   "excalibur-project.zip"
```

#### 2. SSH-Verbindung testen
```bash
# Teste erst die Verbindung
ssh root@DEINE_VPS_IP
exit
```

---

## 🚀 VPS Setup (Schritt für Schritt)

### Phase 1: Grundinstallation

```bash
# 1. Mit VPS verbinden
ssh root@DEINE_VPS_IP

# 2. System aktualisieren
apt update && apt upgrade -y

# 3. Grundlegende Tools installieren
apt install -y curl wget unzip git nginx

# 4. Arbeitsverzeichnis VORAB erstellen (Fehler #2 vermeiden)
mkdir -p /var/www/excalibur-cuba
cd /var/www/excalibur-cuba
```

### Phase 2: Node.js Installation

```bash
# Node.js 20 installieren (bewährt für Ubuntu 22.04)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Versionen prüfen
node --version  # sollte v20.x.x zeigen
npm --version   # sollte 10.x.x zeigen
```

### Phase 3: PostgreSQL Setup

```bash
# PostgreSQL installieren
apt install -y postgresql postgresql-contrib

# Starten und aktivieren
systemctl start postgresql
systemctl enable postgresql

# Datenbank erstellen (OHNE Sonderzeichen-Probleme)
sudo -u postgres psql << EOF
CREATE DATABASE excalibur_cuba;
CREATE USER excalibur_user WITH PASSWORD 'SecurePass2025DB';
GRANT ALL PRIVILEGES ON DATABASE excalibur_cuba TO excalibur_user;
GRANT ALL ON SCHEMA public TO excalibur_user;
\q
EOF
```

### Phase 4: Projekt-Upload (Fehlerfreie Methode)

```bash
# Du bist jetzt in /var/www/excalibur-cuba

# Von deinem Computer (PowerShell/CMD):
# scp excalibur-project.zip root@DEINE_VPS_IP:/var/www/excalibur-cuba/

# Zurück auf VPS - ZIP entpacken
cd /var/www/excalibur-cuba
unzip excalibur-project.zip

# WICHTIG: In das entpackte Verzeichnis wechseln (Fehler #4 vermeiden)
# Schaue was entpackt wurde:
ls -la

# Meist ist es so:
cd rest-express  # oder wie der Ordnername ist

# Oder falls direkt entpackt:
# Dateien sind schon da (package.json sollte sichtbar sein)
ls package.json  # sollte die Datei zeigen
```

### Phase 5: Abhängigkeiten installieren

```bash
# Sicherstellen dass wir im richtigen Ordner sind
pwd  # sollte /var/www/excalibur-cuba/[projektordner] oder /var/www/excalibur-cuba zeigen
ls package.json  # muss existieren

# NPM installieren
npm install

# TypeScript global installieren
npm install -g typescript tsx
```

### Phase 6: Umgebungsvariablen (URL-encoded für Sonderzeichen)

```bash
# .env erstellen mit korrekten Sonderzeichen-Encoding
cat > .env << 'EOF'
NODE_ENV=production
DATABASE_URL=postgresql://excalibur_user:SecurePass2025DB@localhost:5432/excalibur_cuba
SESSION_SECRET=ExcaliburCuba2025SecureSessionKeyVeryLong
PORT=5000
EOF
```

### Phase 7: Projekt bauen und Datenbank

```bash
# Projekt bauen
npm run build

# Datenbank-Schema erstellen (Fehler #5 vermieden durch simples Passwort)
npm run db:push

# Seeding RICHTIG machen (Fehler #6 vermieden)
# NICHT: node server/seed.ts
# NICHT: ts-node server/seed.ts
# RICHTIG: Build erst, dann JS ausführen
node dist/server/seed.js
```

### Phase 8: Service einrichten

```bash
# Systemd Service
cat > /etc/systemd/system/excalibur-cuba.service << EOF
[Unit]
Description=Excalibur Cuba Website
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Service aktivieren
systemctl daemon-reload
systemctl enable excalibur-cuba
systemctl start excalibur-cuba

# Status prüfen
systemctl status excalibur-cuba
```

### Phase 9: Nginx einrichten

```bash
# Nginx-Konfiguration
cat > /etc/nginx/sites-available/excalibur-cuba << 'EOF'
server {
    listen 80;
    server_name _;

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
EOF

# Site aktivieren
ln -sf /etc/nginx/sites-available/excalibur-cuba /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

---

## ✅ Testen

```bash
# 1. Service läuft?
systemctl status excalibur-cuba

# 2. Port offen?
curl http://localhost:5000

# 3. Nginx funktioniert?
curl http://localhost

# 4. Von außen erreichbar?
# http://DEINE_VPS_IP
```

---

## 🔧 Häufige Befehle

```bash
# Logs anzeigen
journalctl -u excalibur-cuba -f

# Service neustarten
systemctl restart excalibur-cuba

# Nginx neustarten
systemctl restart nginx

# In Projekt-Verzeichnis
cd /var/www/excalibur-cuba
# oder
cd /var/www/excalibur-cuba/rest-express
```

---

## 🚨 Troubleshooting

### Problem: "package.json not found"
```bash
# Lösung: Finde das richtige Verzeichnis
find /var/www -name "package.json" -type f
cd [gefundenes-verzeichnis]
```

### Problem: "npm install failed"
```bash
# Lösung: Node.js neu installieren
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

### Problem: "Database connection failed"
```bash
# Lösung: PostgreSQL prüfen
systemctl status postgresql
sudo -u postgres psql -c "\l"  # Datenbanken anzeigen
```

### Problem: "Service won't start"
```bash
# Lösung: Logs prüfen
journalctl -u excalibur-cuba --no-pager
```

---

## 📱 Admin-Zugang

Nach erfolgreichem Deployment:
- **URL**: http://DEINE_VPS_IP/admin/login
- **Benutzer**: excalibur_admin  
- **Passwort**: ExcaliburCuba@2025!SecureAdmin#9847

---

## 💾 Backup vor Änderungen

```bash
# Vor Updates immer Backup
cp -r /var/www/excalibur-cuba /var/www/backup-$(date +%Y%m%d)
pg_dump -h localhost -U excalibur_user excalibur_cuba > db-backup-$(date +%Y%m%d).sql
```

Diese Anleitung vermeidet alle deine vorherigen Fehler!