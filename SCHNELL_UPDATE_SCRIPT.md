# Schnelles Update-System für Änderungen

## 🔄 Für zukünftige Updates deiner Website

### 1. Einfaches Update-Script erstellen

Auf deinem VPS erstelle diese Datei:

```bash
# Auf dem VPS:
cd /var/www/excalibur-cuba
nano quick-update.sh

# Script-Inhalt:
#!/bin/bash
echo "🔄 Starte Update..."

# Service stoppen
systemctl stop excalibur-cuba

# Backup erstellen (nur bei größeren Änderungen)
# cp -r . ../backup-$(date +%Y%m%d_%H%M) 

# Hier kommt deine neue ZIP-Datei rein
if [ -f "new-update.zip" ]; then
    echo "📦 Entpacke neue Version..."
    
    # Wichtige Dateien sichern
    cp .env .env.backup
    cp -r uploads uploads.backup 2>/dev/null || true
    
    # Neue Dateien entpacken (überschreibt alles)
    unzip -o new-update.zip
    
    # Gesicherte Dateien zurückkopieren
    cp .env.backup .env
    cp -r uploads.backup/* uploads/ 2>/dev/null || true
    
    # Dependencies aktualisieren
    npm install
    
    # Projekt neu bauen
    npm run build
    
    # Datenbank aktualisieren
    npm run db:push
    
    # Aufräumen
    rm new-update.zip
    rm .env.backup
    rm -rf uploads.backup
    
    echo "✅ Update abgeschlossen!"
else
    echo "❌ Keine new-update.zip gefunden"
fi

# Service starten
systemctl start excalibur-cuba

# Status prüfen
systemctl status excalibur-cuba --no-pager

echo "🎉 Fertig! Website läuft wieder."

# Script ausführbar machen:
chmod +x quick-update.sh
```

### 2. Update durchführen

Wenn du Änderungen gemacht hast:

```bash
# 1. Neue ZIP-Datei hochladen (umbenennen!)
scp deine-neue-version.zip root@VPS_IP:/var/www/excalibur-cuba/new-update.zip

# 2. Auf VPS einloggen und Update ausführen
ssh root@VPS_IP
cd /var/www/excalibur-cuba
./quick-update.sh
```

### 3. Nur kleine Änderungen (z.B. nur Bilder)

```bash
# Nur für einzelne Dateien:
scp neue-datei.jpg root@VPS_IP:/var/www/excalibur-cuba/client/public/
ssh root@VPS_IP "systemctl restart excalibur-cuba"
```

### 4. Notfall-Rollback

Falls etwas schief geht:

```bash
# Letztes Backup wiederherstellen
cd /var/www
rm -rf excalibur-cuba
mv backup-DATUM excalibur-cuba
systemctl restart excalibur-cuba
```

## 💡 Praktische Tipps

- **Immer** ZIP-Datei vor Upload umbenennen (keine Leerzeichen!)
- **Immer** zuerst testen ob Service läuft: `systemctl status excalibur-cuba`
- Bei Problemen: Logs checken mit `journalctl -u excalibur-cuba -f`
- **Nie** .env oder uploads-Ordner überschreiben (Script macht das automatisch)

## 🎯 Dein Standard-Workflow

1. Hier auf Replit Änderungen machen
2. Projekt als ZIP herunterladen → **umbenennen zu "update.zip"**
3. Auf VPS hochladen: `scp update.zip root@VPS_IP:/var/www/excalibur-cuba/new-update.zip`
4. Update ausführen: `ssh root@VPS_IP "cd /var/www/excalibur-cuba && ./quick-update.sh"`
5. Website testen: `http://deine-vps-ip`

**Fertig in 2 Minuten statt 30 Minuten!**