# Vollständige Excalibur Cuba Website - VPS Deployment

## 📋 Befehle sind so markiert:

```bash
# 👆 Das ist ein Befehl - kopiere und führe aus
```

**📝 Das ist eine Erklärung oder Information**

---

## 🎯 PHASE 1: VPS Setup

### Schritt 1: SSH-Verbindung
```bash
ssh root@DEINE_VPS_IP
```
📝 Ersetze DEINE_VPS_IP mit deiner echten IP-Adresse

### Schritt 2: System vorbereiten
```bash
apt update && apt upgrade -y
```

```bash
apt install -y curl wget unzip git nginx
```

### Schritt 3: Arbeitsverzeichnis erstellen
```bash
mkdir -p /var/www/excalibur-cuba
```

```bash
cd /var/www/excalibur-cuba
```

```bash
pwd
```
📝 Sollte zeigen: /var/www/excalibur-cuba

---

## 🎯 PHASE 2: Node.js Installation

### Schritt 4: Node.js 20 installieren
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
```

```bash
apt install -y nodejs
```

### Schritt 5: Versionen prüfen
```bash
node --version
```
📝 Sollte zeigen: v20.x.x

```bash
npm --version
```
📝 Sollte zeigen: 10.x.x

---

## 🎯 PHASE 3: PostgreSQL Setup

### Schritt 6: PostgreSQL installieren
```bash
apt install -y postgresql postgresql-contrib
```

### Schritt 7: PostgreSQL starten
```bash
systemctl start postgresql
```

```bash
systemctl enable postgresql
```

### Schritt 8: Status prüfen
```bash
systemctl status postgresql
```
📝 Sollte zeigen: "active (running)"

### Schritt 9: Datenbank erstellen
```bash
sudo -u postgres psql << 'EOF'
CREATE DATABASE excalibur_cuba;
CREATE USER excalibur_user WITH PASSWORD 'SecurePass2025DB';
GRANT ALL PRIVILEGES ON DATABASE excalibur_cuba TO excalibur_user;
GRANT ALL ON SCHEMA public TO excalibur_user;
\q
EOF
```

### Schritt 10: Datenbank prüfen
```bash
sudo -u postgres psql -c "\l" | grep excalibur
```
📝 Sollte die Datenbank "excalibur_cuba" zeigen

---

## 🎯 PHASE 4: Projekt hochladen

### Schritt 11: ZIP-Datei vorbereiten
📝 Auf deinem Computer:
1. Lade das Projekt hier als ZIP herunter
2. Benenne die ZIP-Datei um (wichtig: keine Leerzeichen!)
3. Von: "rest-express (2).zip" 
4. Zu: "excalibur-project.zip"

### Schritt 12: ZIP hochladen
📝 Auf deinem Computer (PowerShell/CMD):
```bash
scp C:\Users\DEIN_NAME\Downloads\excalibur-project.zip root@DEINE_VPS_IP:/var/www/excalibur-cuba/
```

📝 Für Mac/Linux:
```bash
scp ~/Downloads/excalibur-project.zip root@DEINE_VPS_IP:/var/www/excalibur-cuba/
```

### Schritt 13: Zurück zum VPS
```bash
ssh root@DEINE_VPS_IP
```

```bash
cd /var/www/excalibur-cuba
```

### Schritt 14: ZIP-Datei prüfen
```bash
ls -la *.zip
```
📝 Sollte zeigen: excalibur-project.zip

### Schritt 15: ZIP entpacken
```bash
unzip excalibur-project.zip
```

### Schritt 16: Entpackte Inhalte prüfen
```bash
ls -la
```
📝 Du siehst entweder:
- Einen Ordner (z.B. "ExcaliburGenerator" oder "rest-express")
- Oder direkte Dateien (package.json sichtbar)

### Schritt 17: Ins richtige Verzeichnis wechseln
📝 Falls ein Unterordner erstellt wurde:
```bash
cd ExcaliburGenerator
```
📝 Ersetze "ExcaliburGenerator" mit dem tatsächlichen Ordnernamen

📝 Falls keine Unterordner:
```bash
# Bleibe im aktuellen Verzeichnis
```

### Schritt 18: Package.json prüfen
```bash
ls package.json
```
📝 MUSS existieren! Falls nicht, bist du im falschen Verzeichnis

```bash
cat package.json | head -10
```
📝 Sollte Projekt-Informationen zeigen

---

## 🎯 PHASE 5: Dependencies installieren

### Schritt 19: NPM install
```bash
npm install
```
📝 Das kann 2-5 Minuten dauern

### Schritt 20: TypeScript global installieren
```bash
npm install -g typescript tsx
```

---

## 🎯 PHASE 6: Umgebungsvariablen

### Schritt 21: .env erstellen
```bash
cat > .env << 'EOF'
NODE_ENV=production
DATABASE_URL=postgresql://excalibur_user:SecurePass2025DB@localhost:5432/excalibur_cuba
SESSION_SECRET=ExcaliburCuba2025SecureSessionKeyVeryLong
PORT=5000
EOF
```

### Schritt 22: .env prüfen
```bash
cat .env
```
📝 Sollte die 4 Zeilen zeigen

---

## 🎯 PHASE 7: Datenbank initialisieren

### Schritt 23: Database Schema erstellen
```bash
npm run db:push
```
📝 Sollte erfolgreich laufen ohne Fehler

### Schritt 24: Admin-User erstellen (einfache Methode)
```bash
cat > simple-seed.js << 'EOF'
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  const client = new Client({
    connectionString: 'postgresql://excalibur_user:SecurePass2025DB@localhost:5432/excalibur_cuba'
  });

  try {
    await client.connect();
    console.log('🌱 Starting database seeding...');

    // Prüfe ob Admin-User existiert
    const existingAdmin = await client.query(
      'SELECT id FROM admin_users WHERE username = $1',
      ['excalibur_admin']
    );

    if (existingAdmin.rows.length === 0) {
      // Erstelle Admin-User
      const hashedPassword = await bcrypt.hash('ExcaliburCuba@2025!SecureAdmin#9847', 10);
      
      await client.query(`
        INSERT INTO admin_users (username, email, password, first_name, last_name, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        'excalibur_admin',
        'admin@excalibur-cuba.com',
        hashedPassword,
        'Excalibur',
        'Admin',
        'admin',
        true
      ]);

      console.log('✅ Admin-User erstellt: excalibur_admin');
    } else {
      console.log('✅ Admin-User existiert bereits');
    }

    console.log('🎉 Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

seedDatabase().catch(console.error);
EOF
```

### Schritt 25: Zusätzliche Dependencies
```bash
npm install pg bcryptjs
```

### Schritt 26: Seeding ausführen
```bash
node simple-seed.js
```
📝 Sollte zeigen: "Database seeding completed successfully!"

---

## 🎯 PHASE 8: Projekt bauen

### Schritt 27: Build ausführen
```bash
npm run build
```
📝 Das kann 1-3 Minuten dauern

### Schritt 28: Build prüfen
```bash
ls -la dist/
```
📝 Sollte zeigen: client/ und server/ Ordner

---

## 🎯 PHASE 9: Server starten

### Schritt 29: Test-Start
```bash
npm run start
```
📝 Sollte zeigen: "Server läuft auf Port 5000"

📝 Drücke Ctrl+C um zu stoppen

### Schritt 30: Funktionstest
```bash
curl http://localhost:5000
```
📝 Sollte HTML-Code zeigen

---

## 🎯 PHASE 10: Systemd Service

### Schritt 31: Service erstellen
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
```

### Schritt 32: Service aktivieren
```bash
systemctl daemon-reload
```

```bash
systemctl enable excalibur-cuba
```

```bash
systemctl start excalibur-cuba
```

### Schritt 33: Service Status prüfen
```bash
systemctl status excalibur-cuba
```
📝 MUSS zeigen: "active (running)"

---

## 🎯 PHASE 11: Nginx Setup

### Schritt 34: Nginx konfigurieren
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

### Schritt 35: Nginx aktivieren
```bash
ln -sf /etc/nginx/sites-available/excalibur-cuba /etc/nginx/sites-enabled/
```

```bash
rm -f /etc/nginx/sites-enabled/default
```

### Schritt 36: Nginx testen
```bash
nginx -t
```
📝 MUSS zeigen: "syntax is ok"

### Schritt 37: Nginx neustarten
```bash
systemctl restart nginx
```

---

## 🎯 PHASE 12: Finaler Test

### Schritt 38: Alle Services prüfen
```bash
systemctl status excalibur-cuba
```
📝 Sollte zeigen: "active (running)"

```bash
systemctl status nginx
```
📝 Sollte zeigen: "active (running)"

### Schritt 39: Lokaler Test
```bash
curl -I http://localhost:5000
```
📝 Sollte zeigen: "HTTP/1.1 200 OK"

```bash
curl -I http://localhost
```
📝 Sollte zeigen: "HTTP/1.1 200 OK"

### Schritt 40: Externer Test
📝 Öffne in deinem Browser: http://DEINE_VPS_IP

### Schritt 41: Admin-Panel Test
📝 Öffne in deinem Browser: http://DEINE_VPS_IP/admin/login
📝 Benutzer: excalibur_admin
📝 Passwort: ExcaliburCuba@2025!SecureAdmin#9847

---

## 🎉 Fertig!

### Deine Website läuft jetzt unter:
- **Hauptseite**: http://DEINE_VPS_IP
- **Admin-Panel**: http://DEINE_VPS_IP/admin/login

### Nützliche Befehle für später:
```bash
# Service neustarten
systemctl restart excalibur-cuba
```

```bash
# Logs anzeigen
journalctl -u excalibur-cuba -f
```

```bash
# Nginx neustarten
systemctl restart nginx
```

```bash
# Ins Projektverzeichnis
cd /var/www/excalibur-cuba/ExcaliburGenerator
```

---

## 🚨 Falls etwas nicht funktioniert:

### Service läuft nicht:
```bash
journalctl -u excalibur-cuba --no-pager -n 20
```

### Website nicht erreichbar:
```bash
netstat -tlnp | grep 5000
```

### Datenbank-Probleme:
```bash
sudo -u postgres psql -c "\l"
```

Diese Anleitung berücksichtigt alle deine vorherigen Probleme und markiert jeden Befehl klar!