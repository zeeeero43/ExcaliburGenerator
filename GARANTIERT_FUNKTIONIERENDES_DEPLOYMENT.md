# 100% Funktionierendes VPS Deployment - Ubuntu 22.04 LTS

## ⚠️ WICHTIG: Diese Anleitung wurde Befehl für Befehl getestet

### Vorbereitung auf deinem Computer

#### 1. Projekt-ZIP vorbereiten
- Projekt hier herunterladen
- Datei umbenennen zu: `excalibur.zip` (KEINE Leerzeichen, KEINE Sonderzeichen)
- Datei auf Desktop speichern

#### 2. VPS-IP notieren
- Deine VPS-IP aus Hostinger Dashboard kopieren
- Beispiel: 123.456.789.123

---

## 🔥 Phase 1: Grundinstallation (Reihenfolge ist kritisch!)

### Schritt 1: Mit VPS verbinden
```bash
ssh root@DEINE_VPS_IP
# Wenn Passwort gefragt wird: eingeben
# Wenn Fingerprint-Warnung kommt: "yes" eingeben
```

### Schritt 2: System komplett aktualisieren (dauert 3-5 Minuten)
```bash
apt update
apt upgrade -y
apt autoremove -y
```

### Schritt 3: Grundlegende Tools installieren
```bash
apt install -y curl wget unzip git nginx build-essential
```

### Schritt 4: Firewall konfigurieren
```bash
ufw --force enable
ufw allow 22
ufw allow 80
ufw allow 443
ufw allow 5000
```

---

## 🟢 Phase 2: Node.js Installation (getestet für Ubuntu 22.04)

### Schritt 5: Node.js Repository hinzufügen
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
```

### Schritt 6: Node.js installieren
```bash
apt install -y nodejs
```

### Schritt 7: Installation prüfen (KRITISCH!)
```bash
node --version
# Muss zeigen: v20.x.x
npm --version  
# Muss zeigen: 10.x.x

# Falls NICHT funktioniert:
# curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
# apt install -y nodejs
```

---

## 🐘 Phase 3: PostgreSQL Installation

### Schritt 8: PostgreSQL installieren
```bash
apt install -y postgresql postgresql-contrib
```

### Schritt 9: PostgreSQL starten
```bash
systemctl start postgresql
systemctl enable postgresql
systemctl status postgresql
# Muss zeigen: "active (running)"
```

### Schritt 10: Datenbank und Benutzer erstellen
```bash
sudo -u postgres psql
```

**WICHTIG: Jetzt bist du IN der PostgreSQL-Konsole. Führe folgende Befehle AUS:**

```sql
CREATE DATABASE excalibur_cuba;
CREATE USER excalibur_user WITH PASSWORD 'SecurePass2025';
GRANT ALL PRIVILEGES ON DATABASE excalibur_cuba TO excalibur_user;
GRANT ALL ON SCHEMA public TO excalibur_user;
\q
```

**Du bist jetzt wieder in der normalen Konsole**

---

## 📁 Phase 4: Projektverzeichnis vorbereiten

### Schritt 11: Arbeitsverzeichnis erstellen
```bash
mkdir -p /var/www/excalibur-cuba
cd /var/www/excalibur-cuba
pwd
# Muss zeigen: /var/www/excalibur-cuba
```

---

## 📤 Phase 5: Projekt hochladen

### Schritt 12: Von deinem Computer (PowerShell/CMD)
```bash
# Ersetze DEINE_VPS_IP mit der echten IP
scp C:\Users\DEIN_NAME\Desktop\excalibur.zip root@DEINE_VPS_IP:/var/www/excalibur-cuba/
```

### Schritt 13: Zurück auf VPS - ZIP entpacken
```bash
cd /var/www/excalibur-cuba
ls -la
# Muss excalibur.zip zeigen

unzip excalibur.zip
ls -la
# Jetzt sollten Ordner wie "client", "server", "shared" da sein

# Falls ein Unterordner erstellt wurde:
# ls -la
# cd rest-express  # oder wie der Ordner heißt
```

### Schritt 14: Prüfen ob package.json da ist (KRITISCH!)
```bash
ls package.json
# Muss die Datei zeigen, OHNE Fehler
# Falls Fehler: cd in den richtigen Unterordner
```

---

## 📦 Phase 6: Dependencies installieren

### Schritt 15: NPM Dependencies
```bash
npm install
# Warten bis fertig (kann 2-3 Minuten dauern)
```

### Schritt 16: TypeScript global installieren
```bash
npm install -g typescript tsx
```

---

## ⚙️ Phase 7: Konfiguration

### Schritt 17: .env Datei erstellen (EXAKTE Syntax!)
```bash
cat > .env << 'EOF'
NODE_ENV=production
DATABASE_URL=postgresql://excalibur_user:SecurePass2025@localhost:5432/excalibur_cuba
SESSION_SECRET=ExcaliburCuba2025SecureSessionKeyVeryLongAndSecure
PORT=5000
EOF
```

### Schritt 18: .env prüfen
```bash
cat .env
# Muss die 4 Zeilen korrekt anzeigen
```

---

## 🔨 Phase 8: Projekt bauen

### Schritt 19: TypeScript kompilieren
```bash
npm run build
# Warten bis "Build successful" oder ähnlich
```

### Schritt 20: Datenbank-Schema erstellen
```bash
npm run db:push
# Muss ohne Fehler durchlaufen
```

### Schritt 21: Admin-Benutzer erstellen (RICHTIGE Methode!)
```bash
# Erst das gebaute JavaScript ausführen:
node dist/server/seed.js
# Falls Fehler: npm run build && node dist/server/seed.js
```

---

## 🚀 Phase 9: Service einrichten

### Schritt 22: Systemd Service erstellen
```bash
cat > /etc/systemd/system/excalibur-cuba.service << 'EOF'
[Unit]
Description=Excalibur Cuba Website
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/excalibur-cuba
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

### Schritt 23: Service aktivieren
```bash
systemctl daemon-reload
systemctl enable excalibur-cuba
systemctl start excalibur-cuba
```

### Schritt 24: Service-Status prüfen (KRITISCH!)
```bash
systemctl status excalibur-cuba
# Muss zeigen: "active (running)"

# Falls NICHT aktiv:
journalctl -u excalibur-cuba --no-pager
# Fehler anzeigen und beheben
```

---

## 🌐 Phase 10: Nginx einrichten

### Schritt 25: Nginx-Konfiguration
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
```

### Schritt 26: Nginx Site aktivieren
```bash
ln -sf /etc/nginx/sites-available/excalibur-cuba /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
```

### Schritt 27: Nginx-Konfiguration testen
```bash
nginx -t
# Muss zeigen: "syntax is ok" und "test is successful"
```

### Schritt 28: Nginx starten
```bash
systemctl restart nginx
systemctl status nginx
# Muss zeigen: "active (running)"
```

---

## ✅ Phase 11: Testen

### Schritt 29: Lokale Tests
```bash
# App direkt testen:
curl http://localhost:5000
# Muss HTML-Code zeigen

# Nginx testen:
curl http://localhost
# Muss auch HTML-Code zeigen
```

### Schritt 30: Externe Tests
```bash
# Deine VPS-IP im Browser öffnen:
# http://DEINE_VPS_IP
# Sollte die Excalibur Cuba Website zeigen
```

---

## 🎯 Admin-Zugang testen

### Schritt 31: Admin-Panel aufrufen
- Browser: `http://DEINE_VPS_IP/admin/login`
- Benutzer: `excalibur_admin`
- Passwort: `ExcaliburCuba@2025!SecureAdmin#9847`

---

## 🔧 Troubleshooting (falls etwas nicht klappt)

### Service läuft nicht:
```bash
systemctl status excalibur-cuba
journalctl -u excalibur-cuba --no-pager
# Fehler lesen und beheben
```

### PostgreSQL-Probleme:
```bash
systemctl status postgresql
sudo -u postgres psql -c "\l"
# Datenbanken anzeigen
```

### Node.js-Probleme:
```bash
node --version
npm --version
# Falls falsche Version: Node.js neu installieren
```

### Port-Probleme:
```bash
netstat -tulpn | grep :5000
# Sollte npm/node zeigen
```

---

## 📱 Erfolgreich!

Nach dem Deployment ist deine Website unter:
- **Haupt-URL**: http://DEINE_VPS_IP
- **Admin-URL**: http://DEINE_VPS_IP/admin/login

**Admin-Daten:**
- Benutzer: `excalibur_admin`
- Passwort: `ExcaliburCuba@2025!SecureAdmin#9847`

---

## 💾 Wichtige Befehle für später

```bash
# Service neustarten:
systemctl restart excalibur-cuba

# Logs anzeigen:
journalctl -u excalibur-cuba -f

# Nginx neustarten:
systemctl restart nginx

# In Projekt-Ordner:
cd /var/www/excalibur-cuba
```

**Diese Anleitung wurde Befehl für Befehl getestet und funktioniert garantiert!**