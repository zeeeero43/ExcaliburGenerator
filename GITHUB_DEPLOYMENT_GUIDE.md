# GitHub Deployment Guide - Excalibur Cuba

## Schritt 1: Repository erstellen und Code hochladen

### A. Neues GitHub Repository erstellen
1. Gehen Sie zu https://github.com
2. Klicken Sie auf "New repository"
3. Repository Name: `excalibur-cuba`
4. Setzen Sie es auf **Public** (für einfacheren Zugriff)
5. Klicken Sie auf "Create repository"

### B. Code von Replit zu GitHub hochladen
```bash
# Auf Replit (lokal)
git init
git add .
git commit -m "Initial commit: Excalibur Cuba website"
git branch -M main
git remote add origin https://github.com/IHR-USERNAME/excalibur-cuba.git
git push -u origin main
```

## Schritt 2: Server-Deployment via GitHub

### A. Auf dem Server - Repository klonen
```bash
# 1. Alte Installation entfernen (falls vorhanden)
sudo systemctl stop excalibur-cuba
sudo rm -rf /var/www/excalibur-cuba

# 2. Repository klonen
cd /var/www
sudo git clone https://github.com/IHR-USERNAME/excalibur-cuba.git
sudo chown -R root:root excalibur-cuba
cd excalibur-cuba

# 3. Node.js Dependencies installieren
npm install

# 4. Build ausführen
npm run build
```

### B. Umgebungsvariablen einrichten
```bash
# .env Datei erstellen
sudo nano .env
```

**Inhalt der .env Datei:**
```env
NODE_ENV=production
DATABASE_URL=postgresql://excalibur_user:SecurePass2025@localhost:5432/excalibur_cuba
SESSION_SECRET=your-super-secret-session-key-here-min-32-chars
```

### C. Datenbank-Schema aktualisieren
```bash
# Datenbank-Schema erstellen/aktualisieren
npm run db:push

# Admin-Benutzer erstellen
node -e "
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://excalibur_user:SecurePass2025@localhost:5432/excalibur_cuba'
});

async function createAdmin() {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  
  await pool.query(\`
    INSERT INTO admin_users (username, email, password, is_active)
    VALUES ('admin', 'admin@excalibur-cuba.com', \$1, true)
    ON CONFLICT (username) DO UPDATE SET
      password = \$1,
      is_active = true,
      updated_at = NOW()
  \`, [hashedPassword]);
  
  console.log('✅ Admin user created: admin / admin123');
  process.exit(0);
}

createAdmin().catch(console.error);
"
```

### D. Systemd Service aktualisieren
```bash
# Service-Datei bearbeiten
sudo nano /etc/systemd/system/excalibur-cuba.service
```

**Inhalt der Service-Datei:**
```ini
[Unit]
Description=Excalibur Cuba Website
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/excalibur-cuba
Environment=NODE_ENV=production
Environment=DATABASE_URL=postgresql://excalibur_user:SecurePass2025@localhost:5432/excalibur_cuba
Environment=SESSION_SECRET=your-super-secret-session-key-here-min-32-chars
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### E. Service starten
```bash
# Service neu laden und starten
sudo systemctl daemon-reload
sudo systemctl enable excalibur-cuba
sudo systemctl start excalibur-cuba
sudo systemctl status excalibur-cuba
```

## Schritt 3: Updates über GitHub

### A. Lokale Änderungen zu GitHub pushen
```bash
# Auf Replit (nach Änderungen)
git add .
git commit -m "Update: Beschreibung der Änderungen"
git push origin main
```

### B. Server Updates
```bash
# Auf dem Server
cd /var/www/excalibur-cuba
git pull origin main
npm install # falls neue Dependencies
npm run build
npm run db:push # falls Schema-Änderungen
sudo systemctl restart excalibur-cuba
```

## Schritt 4: Automatisches Update-Script

### A. Update-Script erstellen
```bash
# Script erstellen
sudo nano /var/www/excalibur-cuba/update.sh
```

**Inhalt des Scripts:**
```bash
#!/bin/bash
echo "🔄 Updating Excalibur Cuba..."

cd /var/www/excalibur-cuba

# Git pull
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build application
echo "🏗️ Building application..."
npm run build

# Update database schema
echo "🗄️ Updating database schema..."
npm run db:push

# Restart service
echo "🔄 Restarting service..."
sudo systemctl restart excalibur-cuba

# Check status
echo "✅ Update completed!"
sudo systemctl status excalibur-cuba --no-pager
```

### B. Script ausführbar machen
```bash
sudo chmod +x /var/www/excalibur-cuba/update.sh
```

### C. Script verwenden
```bash
# Für Updates einfach ausführen:
cd /var/www/excalibur-cuba
./update.sh
```

## Schritt 5: Nginx Konfiguration (falls noch nicht vorhanden)

```bash
# Nginx Config erstellen
sudo nano /etc/nginx/sites-available/excalibur-cuba
```

**Inhalt:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

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

```bash
# Config aktivieren
sudo ln -s /etc/nginx/sites-available/excalibur-cuba /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Zusammenfassung

**Login-Daten:**
- URL: `http://IHR-SERVER-IP/admin/login`
- Benutzername: `admin`
- Passwort: `admin123`

**Für Updates:**
1. Änderungen auf Replit machen
2. `git push origin main`
3. Auf Server: `./update.sh`

**Troubleshooting:**
- Logs: `sudo journalctl -u excalibur-cuba -f`
- Service Status: `sudo systemctl status excalibur-cuba`
- Nginx Logs: `sudo tail -f /var/log/nginx/error.log`