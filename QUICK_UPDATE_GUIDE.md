# 🚀 Schnell-Update Guide - Excalibur Cuba

## 1-Minuten Update-Prozess

### Schritt 1: Server verbinden
```bash
ssh root@[YOUR_SERVER_IP]
cd /var/www/excalibur-cuba/ExcaliburGenerator
```

### Schritt 2: Updates holen
```bash
git pull origin main
npm install
```

### Schritt 3: Datenbank & Build
```bash
npm run db:push
npm run build
```

### Schritt 4: Service neu starten
```bash
sudo systemctl restart excalibur-cuba
sudo systemctl status excalibur-cuba
```

### Schritt 5: Testen
```bash
curl -I http://localhost:3000
```

## ⚡ Ein-Befehl-Update (Automatisch)

Erstellen Sie `/opt/quick-update.sh`:

```bash
#!/bin/bash
cd /var/www/excalibur-cuba/ExcaliburGenerator
git stash && git pull origin main && npm install && npm run db:push && npm run build && sudo systemctl restart excalibur-cuba
echo "✅ Update completed!"
```

Dann:
```bash
sudo chmod +x /opt/quick-update.sh
sudo /opt/quick-update.sh
```

## 🔧 Sofort-Fehlerbehandlung

### Service läuft nicht?
```bash
sudo journalctl -u excalibur-cuba -f
```

### Build-Fehler?
```bash
rm -rf node_modules && npm install && npm run build
```

### Database-Fehler?
```bash
sudo systemctl restart postgresql
npm run db:push
```

## 📱 Admin-Login nach Update

1. Website aufrufen: `http://[YOUR_DOMAIN]/admin/login`
2. Login: `admin` / `admin123`
3. Testen: Produkt duplizieren und aktivieren

---

**Vollständiger Guide:** Siehe `UPDATE_DEPLOYMENT_GUIDE.md`