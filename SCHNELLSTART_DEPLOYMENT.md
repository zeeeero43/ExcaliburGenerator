# Schnellstart: Deployment auf Ubuntu VPS

## 📋 Was du brauchst:
- Ubuntu VPS bei Hostinger (aktiviert)
- SSH-Zugang zur IP-Adresse
- Heruntergeladene Projekt-ZIP-Datei

## 🚀 Schritt-für-Schritt (für Anfänger):

### 1. Mit deinem VPS verbinden
```bash
# Ersetze 123.456.789.0 mit deiner echten VPS-IP
ssh root@123.456.789.0
```

### 2. Basis-Setup
```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Wichtige Tools installieren
sudo apt install -y curl wget unzip git nginx
```

### 3. Node.js installieren
```bash
# Node.js Repository hinzufügen
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Node.js installieren
sudo apt install -y nodejs

# Prüfen
node --version
```

### 4. PostgreSQL installieren
```bash
# PostgreSQL installieren
sudo apt install -y postgresql postgresql-contrib

# Starten
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 5. Datenbank erstellen
```bash
# PostgreSQL öffnen
sudo -u postgres psql

# Diese Befehle IN PostgreSQL eingeben:
CREATE DATABASE excalibur_cuba;
CREATE USER excalibur_user WITH PASSWORD 'ExcaliburCuba@2025!SecureDB#9847';
GRANT ALL PRIVILEGES ON DATABASE excalibur_cuba TO excalibur_user;
GRANT ALL ON SCHEMA public TO excalibur_user;
\q
```

### 6. Projekt hochladen
```bash
# Verzeichnis erstellen
mkdir -p /var/www/excalibur-cuba
cd /var/www/excalibur-cuba

# ZIP-Datei von deinem Computer hochladen:
# (Diesen Befehl auf DEINEM Computer ausführen, nicht auf dem VPS!)
# scp /pfad/zu/deiner/projekt.zip root@123.456.789.0:/var/www/excalibur-cuba/

# ZIP entpacken (auf dem VPS)
unzip projekt.zip
```

### 7. Projekt konfigurieren
```bash
# Abhängigkeiten installieren
npm install

# .env Datei erstellen
nano .env

# Folgendes in .env einfügen:
NODE_ENV=production
DATABASE_URL=postgresql://excalibur_user:ExcaliburCuba@2025!SecureDB#9847@localhost:5432/excalibur_cuba
SESSION_SECRET=ExcaliburCuba@2025!SecureSession#9847VeryLongSecretKey
PORT=5000

# Speichern mit Strg+X, dann Y, dann Enter
```

### 8. Datenbank einrichten
```bash
# Schema erstellen
npm run db:push

# Erstelle Admin-Benutzer
node -e "
const { seedDatabase } = require('./server/seed.ts');
seedDatabase().then(() => console.log('Seeding completed'));
"
```

### 9. Anwendung starten
```bash
# Projekt bauen
npm run build

# Starten
npm run start
```

### 10. Nginx konfigurieren
```bash
# Nginx-Konfiguration erstellen
sudo nano /etc/nginx/sites-available/excalibur-cuba

# Folgendes einfügen:
server {
    listen 80;
    server_name deine-domain.com www.deine-domain.com;

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

# Site aktivieren
sudo ln -s /etc/nginx/sites-available/excalibur-cuba /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## ✅ Fertig!

Deine Website sollte jetzt unter `http://deine-vps-ip` erreichbar sein.

**Admin-Zugang:**
- URL: `http://deine-vps-ip/admin/login`
- Benutzer: `excalibur_admin`
- Passwort: `ExcaliburCuba@2025!SecureAdmin#9847`

## 🔧 Probleme?

### Website lädt nicht:
```bash
# Service-Status prüfen
sudo systemctl status excalibur-cuba

# Logs anzeigen
sudo journalctl -u excalibur-cuba -f
```

### Datenbank-Probleme:
```bash
# PostgreSQL-Status prüfen
sudo systemctl status postgresql

# Datenbank-Verbindung testen
psql -h localhost -U excalibur_user -d excalibur_cuba
```

### Nginx-Probleme:
```bash
# Nginx-Status prüfen
sudo systemctl status nginx

# Nginx-Logs anzeigen
sudo tail -f /var/log/nginx/error.log
```

## 📞 Letzte Schritte:
1. Domain auf VPS-IP zeigen lassen
2. SSL-Zertifikat installieren: `sudo certbot --nginx`
3. Firewall konfigurieren: `sudo ufw allow 80,443/tcp`

**Wichtig:** Ändere alle Passwörter nach dem ersten Login!