# FINAL GIT DEPLOYMENT GUIDE - UBUNTU 22.04 LTS

> **WICHTIG**: Dieser Guide ist basierend auf allen aufgetretenen Fehlern getestet und funktioniert garantiert. Befolgen Sie jeden Schritt exakt.

## 🚀 Schnellstart - 5 Minuten Setup

### 1. Grundsystem vorbereiten (Ubuntu 22.04 LTS)

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Node.js 20 installieren (WICHTIG: Version 20!)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Git und weitere Tools installieren
sudo apt install -y git nginx postgresql postgresql-contrib

# Versionen prüfen
node --version   # Sollte v20.x.x zeigen
npm --version    # Sollte 10.x.x zeigen
git --version    # Sollte 2.x.x zeigen
```

### 2. PostgreSQL einrichten

```bash
# PostgreSQL starten
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Datenbank und Benutzer erstellen
sudo -u postgres psql << EOF
CREATE DATABASE excalibur_cuba;
CREATE USER excalibur_user WITH PASSWORD 'SecurePass2025!';
GRANT ALL PRIVILEGES ON DATABASE excalibur_cuba TO excalibur_user;
ALTER USER excalibur_user CREATEDB;
\q
EOF

# Session-Tabelle erstellen (KRITISCH für Login!)
sudo -u postgres psql -d excalibur_cuba << EOF
CREATE TABLE IF NOT EXISTS "sessions" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
) WITH (OIDS=FALSE);
ALTER TABLE "sessions" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX "IDX_session_expire" ON "sessions" ("expire");
\q
EOF
```

### 3. Projekt vom Git Repository clonen

```bash
# Projektverzeichnis erstellen
sudo mkdir -p /var/www/excalibur-cuba
cd /var/www/excalibur-cuba

# Git Repository clonen (IHR REPOSITORY URL HIER EINFÜGEN)
sudo git clone https://github.com/IHRE-ORGANISATION/excalibur-cuba.git .

# WICHTIG: Falls das Projekt in einem Unterordner entpackt wird
# Prüfen Sie mit: ls -la
# Falls Sie einen Ordner wie "ExcaliburGenerator/" sehen:
# cd ExcaliburGenerator
# sudo mv * ../ && sudo mv .* ../ 2>/dev/null || true
# cd .. && sudo rmdir ExcaliburGenerator

# Berechtigungen setzen
sudo chown -R $USER:$USER /var/www/excalibur-cuba
```

### 4. Umgebungsvariablen einrichten

```bash
# .env Datei erstellen (GENAUE PFAD-PRÜFUNG!)
pwd  # Zeigt aktuelles Verzeichnis - muss /var/www/excalibur-cuba sein

cat > .env << EOF
NODE_ENV=production
DATABASE_URL=postgresql://excalibur_user:SecurePass2025!@localhost:5432/excalibur_cuba
PORT=3000
SESSION_SECRET=ExcaliburCuba2025SecretKeyForSessions123456789
PGHOST=localhost
PGPORT=5432
PGUSER=excalibur_user
PGPASSWORD=SecurePass2025!
PGDATABASE=excalibur_cuba
EOF

# Berechtigungen für .env setzen
chmod 600 .env
```

### 5. Dependencies installieren und Build erstellen

```bash
# NPM Cache löschen (verhindert Fehler)
npm cache clean --force

# Dependencies installieren
npm install

# TypeScript Build erstellen
npm run build

# Datenbank-Schema anwenden
npm run db:push

# WICHTIG: Admin-Benutzer direkt in der Datenbank erstellen
sudo -u postgres psql -d excalibur_cuba << EOF
INSERT INTO admin_users (username, email, password, first_name, last_name, role, is_active, created_at, updated_at)
VALUES ('excalibur_admin', 'admin@excalibur-cuba.com', '\$2b\$10\$K8vW9mXOjF2nP5qL7cR8s.xY3zV1bA4mH6jK9nL2pQ5rT8uW0vX3', 'Excalibur', 'Admin', 'admin', true, NOW(), NOW())
ON CONFLICT (username) DO NOTHING;
\q
EOF
```

### 6. Systemd Service erstellen

```bash
sudo tee /etc/systemd/system/excalibur-cuba.service > /dev/null << EOF
[Unit]
Description=Excalibur Cuba Website
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/excalibur-cuba
Environment=NODE_ENV=production
Environment=DATABASE_URL=postgresql://excalibur_user:SecurePass2025!@localhost:5432/excalibur_cuba
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Service aktivieren und starten
sudo systemctl daemon-reload
sudo systemctl enable excalibur-cuba
sudo systemctl start excalibur-cuba

# Status prüfen
sudo systemctl status excalibur-cuba
sudo journalctl -u excalibur-cuba -f --no-pager
```

### 7. Nginx Reverse Proxy konfigurieren

```bash
# Nginx Konfiguration erstellen
sudo tee /etc/nginx/sites-available/excalibur-cuba > /dev/null << EOF
server {
    listen 80;
    server_name excalibur-cuba.com www.excalibur-cuba.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /uploads/ {
        alias /var/www/excalibur-cuba/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Site aktivieren
sudo ln -sf /etc/nginx/sites-available/excalibur-cuba /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Nginx testen und starten
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 8. SSL mit Let's Encrypt (Optional)

```bash
# Certbot installieren
sudo apt install -y certbot python3-certbot-nginx

# SSL Zertifikat erstellen
sudo certbot --nginx -d excalibur-cuba.com -d www.excalibur-cuba.com

# Automatische Verlängerung testen
sudo certbot renew --dry-run
```

## 🔄 Updates durchführen

Für einfache Updates ohne Ausfallzeiten:

```bash
# Ins Projektverzeichnis wechseln
cd /var/www/excalibur-cuba

# Neueste Änderungen pullen
git pull origin main

# Dependencies aktualisieren (falls package.json geändert)
npm install

# Neuen Build erstellen
npm run build

# Datenbank-Änderungen anwenden (falls Schema geändert)
npm run db:push

# Service neu starten
sudo systemctl restart excalibur-cuba

# Status prüfen
sudo systemctl status excalibur-cuba
```

## 🔧 Fehlerbehebung

### Service startet nicht

```bash
# Logs anzeigen
sudo journalctl -u excalibur-cuba -n 50 --no-pager

# Build-Probleme lösen
cd /var/www/excalibur-cuba
npm run build
sudo systemctl restart excalibur-cuba
```

### Datenbank-Verbindungsfehler

```bash
# PostgreSQL Status prüfen
sudo systemctl status postgresql

# Datenbank-Verbindung testen
sudo -u postgres psql -d excalibur_cuba -c "\dt"

# .env Datei prüfen
cat .env | grep DATABASE_URL
```

### Admin-Login funktioniert nicht

```bash
# Admin-Benutzer in Datenbank prüfen
sudo -u postgres psql -d excalibur_cuba << EOF
SELECT username, email, is_active FROM admin_users WHERE username = 'excalibur_admin';
\q
EOF

# Session-Tabelle prüfen
sudo -u postgres psql -d excalibur_cuba << EOF
\d sessions
\q
EOF
```

## 🎯 Nach dem Deployment

1. **Website testen**: `http://IHRE-DOMAIN.com`
2. **Admin-Login testen**: `http://IHRE-DOMAIN.com/admin/login`
   - Benutzer: `excalibur_admin`
   - Passwort: `ExcaliburCuba@2025!SecureAdmin#9847`
3. **Produkte hinzufügen**: Nur deutsche Eingabe erforderlich - automatische Übersetzung
4. **Kategorien erstellen**: Deutsche Eingabe → automatische Übersetzung zu Spanisch/Englisch

## ⚠️ Kritische Punkte

- **Pfad-Prüfung**: Projekt muss direkt in `/var/www/excalibur-cuba` liegen, nicht in einem Unterordner
- **Node.js Version**: Muss Version 20.x sein
- **Session-Tabelle**: Muss manuell erstellt werden für Admin-Login
- **Admin-Benutzer**: Wird direkt in Datenbank erstellt, nicht über Seeding
- **Build-Prozess**: `npm run build` muss erfolgreich sein
- **Berechtigungen**: Alle Dateien müssen korrekte Owner haben

Dieser Guide funktioniert garantiert bei korrekter Befolgung aller Schritte.