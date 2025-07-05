# Komplette Deployment-Checkliste

## 📋 Vor dem Start

### ✅ Was du brauchst:
- [ ] Ubuntu 22.04 LTS VPS bei Hostinger (aktiviert)
- [ ] VPS IP-Adresse notiert
- [ ] SSH-Zugang funktioniert (`ssh root@VPS_IP`)
- [ ] Projekt als ZIP heruntergeladen
- [ ] ZIP-Datei umbenannt (keine Leerzeichen/Sonderzeichen)

---

## 🎯 PHASE 1: VPS Grundsetup

### Schritt 1: SSH-Verbindung
```bash
ssh root@DEINE_VPS_IP
# Bei erster Verbindung: "yes" eingeben
```

### Schritt 2: System aktualisieren
```bash
apt update && apt upgrade -y
apt install -y curl wget unzip git nginx
```

### Schritt 3: Arbeitsverzeichnis erstellen
```bash
mkdir -p /var/www/excalibur-cuba
cd /var/www/excalibur-cuba
pwd  # sollte /var/www/excalibur-cuba zeigen
```

---

## 🎯 PHASE 2: Node.js & PostgreSQL

### Schritt 4: Node.js 20 installieren
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Prüfen:
node --version  # sollte v20.x.x zeigen
npm --version   # sollte 10.x.x zeigen
```

### Schritt 5: PostgreSQL installieren
```bash
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Status prüfen:
systemctl status postgresql  # sollte "active (running)" zeigen
```

### Schritt 6: Datenbank erstellen
```bash
sudo -u postgres psql << EOF
CREATE DATABASE excalibur_cuba;
CREATE USER excalibur_user WITH PASSWORD 'SecurePass2025DB';
GRANT ALL PRIVILEGES ON DATABASE excalibur_cuba TO excalibur_user;
GRANT ALL ON SCHEMA public TO excalibur_user;
\q
EOF

# Prüfen:
sudo -u postgres psql -c "\l" | grep excalibur  # sollte Datenbank zeigen
```

---

## 🎯 PHASE 3: Projekt hochladen

### Schritt 7: ZIP-Datei vorbereiten (auf deinem Computer)
```bash
# 1. Projekt hier als ZIP herunterladen
# 2. ZIP-Datei umbenennen:
#    Von: "rest-express (2).zip" 
#    Zu:   "excalibur-project.zip"
# 3. In Downloads-Ordner verschieben
```

### Schritt 8: ZIP hochladen (von deinem Computer)
```bash
# Windows PowerShell:
scp C:\Users\DEIN_NAME\Downloads\excalibur-project.zip root@DEINE_VPS_IP:/var/www/excalibur-cuba/

# Mac/Linux:
scp ~/Downloads/excalibur-project.zip root@DEINE_VPS_IP:/var/www/excalibur-cuba/

# Bei Fehlern: Prüfe Dateinamen und Pfad!
```

### Schritt 9: ZIP entpacken (auf VPS)
```bash
# Zurück zum VPS
ssh root@DEINE_VPS_IP  # falls getrennt
cd /var/www/excalibur-cuba

# ZIP-Datei da?
ls -la *.zip  # sollte excalibur-project.zip zeigen

# Entpacken
unzip excalibur-project.zip

# Was wurde entpackt?
ls -la
# Du siehst entweder:
# - Einen Ordner (z.B. "rest-express") → cd rest-express
# - Oder direkte Dateien (package.json sichtbar) → bleibe hier
```

### Schritt 10: Ins richtige Verzeichnis wechseln
```bash
# Falls ein Unterordner erstellt wurde:
cd rest-express  # oder wie der Ordner heißt

# Prüfen ob package.json da ist:
ls package.json  # MUSS existieren!
cat package.json | head -5  # sollte Projekt-Info zeigen
```

---

## 🎯 PHASE 4: Projekt konfigurieren

### Schritt 11: Dependencies installieren
```bash
# Sicherstellen dass package.json da ist
pwd && ls package.json

# NPM installieren
npm install
# Das kann 2-5 Minuten dauern...

# TypeScript global
npm install -g typescript tsx
```

### Schritt 12: Umgebungsvariablen erstellen
```bash
# .env Datei erstellen (OHNE Sonderzeichen-Probleme)
cat > .env << 'EOF'
NODE_ENV=production
DATABASE_URL=postgresql://excalibur_user:SecurePass2025DB@localhost:5432/excalibur_cuba
SESSION_SECRET=ExcaliburCuba2025SecureSessionKeyVeryLong
PORT=5000
EOF

# Prüfen:
cat .env  # sollte die 4 Zeilen zeigen
```

### Schritt 13: Projekt bauen
```bash
# Build ausführen
npm run build
# Das kann 1-3 Minuten dauern...

# Prüfen ob dist/ Ordner erstellt wurde:
ls -la dist/  # sollte server/ und andere Ordner zeigen
```

### Schritt 14: Datenbank initialisieren
```bash
# Schema erstellen
npm run db:push

# Seeding (Admin-Benutzer anlegen)
node dist/server/seed.js
# Sollte "Database seeding completed successfully!" zeigen
```

---

## 🎯 PHASE 5: Service & Nginx

### Schritt 15: Systemd Service erstellen
```bash
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

# Status prüfen - WICHTIG!
systemctl status excalibur-cuba
# MUSS "active (running)" zeigen!
```

### Schritt 16: Nginx konfigurieren
```bash
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

# Nginx aktivieren
ln -sf /etc/nginx/sites-available/excalibur-cuba /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t  # MUSS "syntax is ok" zeigen
systemctl restart nginx
```

---

## 🎯 PHASE 6: Testen

### Schritt 17: Alle Tests durchführen
```bash
# 1. Service läuft?
systemctl status excalibur-cuba  # "active (running)"

# 2. Port 5000 antwortet?
curl -I http://localhost:5000  # sollte "HTTP/1.1 200 OK" oder ähnlich zeigen

# 3. Nginx funktioniert?
curl -I http://localhost  # sollte "HTTP/1.1 200 OK" zeigen

# 4. Von außen erreichbar? (auf deinem Computer testen)
# http://DEINE_VPS_IP
```

### Schritt 18: Admin-Panel testen
```bash
# URL: http://DEINE_VPS_IP/admin/login
# Benutzer: excalibur_admin
# Passwort: ExcaliburCuba@2025!SecureAdmin#9847
```

---

## 🚨 Troubleshooting

### Problem: "package.json not found"
```bash
find /var/www -name "package.json" -type f
cd [richtiges-verzeichnis]
```

### Problem: Service startet nicht
```bash
journalctl -u excalibur-cuba --no-pager -n 20
# Zeigt die letzten 20 Log-Einträge
```

### Problem: Database connection failed
```bash
systemctl status postgresql
sudo -u postgres psql -c "\l"
```

### Problem: Website nicht erreichbar
```bash
# Firewall prüfen
ufw status
ufw allow 80
ufw allow 443

# Nginx-Logs prüfen
tail -f /var/log/nginx/error.log
```

---

## ✅ Erfolgreich? Dann hast du:

- [ ] Website läuft unter http://DEINE_VPS_IP
- [ ] Admin-Panel erreichbar unter /admin/login
- [ ] Service startet automatisch nach Neustart
- [ ] Nginx leitet korrekt weiter

**🎉 Glückwunsch! Deine Excalibur Cuba Website ist online!**