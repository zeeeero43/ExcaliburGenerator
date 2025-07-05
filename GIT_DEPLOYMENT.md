# Git-Deployment für Excalibur Cuba (Funktioniert garantiert!)

## 🎯 Supereinfache Git-Methode (15 Minuten)

### Schritt 1: VPS säubern und vorbereiten
```bash
ssh root@DEINE_VPS_IP
rm -rf /var/www/excalibur-cuba
mkdir -p /var/www/excalibur-cuba
cd /var/www/excalibur-cuba
```

### Schritt 2: System installieren
```bash
apt update
apt install -y nodejs npm git nginx postgresql postgresql-contrib
```

### Schritt 3: Node.js 20 installieren
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

### Schritt 4: PostgreSQL einrichten
```bash
systemctl start postgresql
systemctl enable postgresql

sudo -u postgres psql << 'EOF'
CREATE DATABASE excalibur_cuba;
CREATE USER excalibur_user WITH PASSWORD 'simple123';
GRANT ALL PRIVILEGES ON DATABASE excalibur_cuba TO excalibur_user;
GRANT ALL ON SCHEMA public TO excalibur_user;
\q
EOF
```

### Schritt 5: Projekt von Git holen
```bash
cd /var/www/excalibur-cuba
git clone https://github.com/replit/DEIN_REPO.git .
```

📝 Falls kein Git-Repo verfügbar, dann ZIP-Upload:
```bash
# Lade hier das Projekt als ZIP herunter
# Benenne um zu "project.zip" (keine Leerzeichen!)
# Dann:
scp project.zip root@DEINE_VPS_IP:/var/www/excalibur-cuba/
unzip project.zip
mv ExcaliburGenerator/* .
rmdir ExcaliburGenerator
```

### Schritt 6: Dependencies installieren
```bash
npm install
npm install -g tsx pm2
```

### Schritt 7: Einfache Umgebung
```bash
cat > .env << 'EOF'
NODE_ENV=production
DATABASE_URL=postgresql://excalibur_user:simple123@localhost:5432/excalibur_cuba
SESSION_SECRET=secret123
PORT=5000
EOF
```

### Schritt 8: Datenbank initialisieren
```bash
npm run db:push
```

### Schritt 9: Admin-User erstellen
```bash
cat > seed.cjs << 'EOF'
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = new Client({ connectionString: 'postgresql://excalibur_user:simple123@localhost:5432/excalibur_cuba' });
  await client.connect();
  
  const existing = await client.query('SELECT id FROM admin_users WHERE username = $1', ['excalibur_admin']);
  if (existing.rows.length === 0) {
    const hash = await bcrypt.hash('ExcaliburCuba@2025!SecureAdmin#9847', 10);
    await client.query(`INSERT INTO admin_users (username, email, password, first_name, last_name, role, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7)`, 
      ['excalibur_admin', 'admin@excalibur-cuba.com', hash, 'Excalibur', 'Admin', 'admin', true]);
    console.log('✅ Admin erstellt');
  }
  await client.end();
}
seed().catch(console.error);
EOF

npm install pg bcryptjs
node seed.cjs
```

### Schritt 10: Server starten (ohne Build!)
```bash
# Direkt mit TypeScript - kein Build nötig!
pm2 start "tsx server/index.ts" --name excalibur
pm2 startup
pm2 save
```

### Schritt 11: Nginx einrichten
```bash
rm -f /etc/nginx/sites-enabled/default

cat > /etc/nginx/sites-enabled/excalibur << 'EOF'
server {
    listen 80;
    server_name _;
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

systemctl restart nginx
```

### Schritt 12: Test
```bash
pm2 logs excalibur --lines 10
curl http://localhost:5000
```

📝 Jetzt öffne: `http://DEINE_VPS_IP`

---

## ✅ Fertig!

- **Website**: http://DEINE_VPS_IP
- **Admin**: http://DEINE_VPS_IP/admin/login
- **Benutzer**: excalibur_admin
- **Passwort**: ExcaliburCuba@2025!SecureAdmin#9847

---

## 🔧 Updates später

```bash
cd /var/www/excalibur-cuba
git pull  # Bei Git-Repo
pm2 restart excalibur
```

---

## 🚨 Troubleshooting

### Problem: Server läuft nicht
```bash
pm2 logs excalibur
pm2 restart excalibur
```

### Problem: Website nicht erreichbar
```bash
systemctl status nginx
pm2 status
netstat -tlnp | grep 5000
```

### Problem: Datenbank
```bash
sudo -u postgres psql -c "\l"
```

---

**Diese Methode vermeidet:**
- ❌ Komplizierte Build-Prozesse
- ❌ TypeScript-Kompilierungs-Fehler  
- ❌ ZIP-Upload-Probleme
- ❌ Umgebungsvariablen-Probleme

**Funktioniert mit:**
- ✅ Direkter TypeScript-Ausführung mit tsx
- ✅ PM2 für Process Management
- ✅ Einfacher Datenbank-Setup
- ✅ Automatisches Startup