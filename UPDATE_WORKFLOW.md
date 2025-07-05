# Projekt-Updates auf VPS übertragen

## 🎯 Verschiedene Methoden (von einfach bis professionell):

### 1. **Einfache Methode: ZIP-Upload (für Anfänger)**

#### **Schritt 1: Projekt herunterladen**
- Hier auf Replit: Download-Button klicken
- Neue ZIP-Datei wird erstellt

#### **Schritt 2: Backup erstellen**
```bash
# Auf dem VPS:
cd /var/www/excalibur-cuba
sudo systemctl stop excalibur-cuba
cp -r /var/www/excalibur-cuba /var/www/excalibur-cuba-backup-$(date +%Y%m%d)
```

#### **Schritt 3: Neue Version hochladen**
```bash
# PowerShell (Windows):
scp C:\Downloads\neues-projekt.zip root@DEINE_VPS_IP:/var/www/excalibur-cuba/

# Oder: Hostinger File Manager verwenden
```

#### **Schritt 4: Auf VPS entpacken**
```bash
# Auf dem VPS:
cd /var/www/excalibur-cuba
rm -rf client server shared package.json  # Alte Dateien löschen
unzip neues-projekt.zip
npm install
npm run build
npm run db:push
sudo systemctl start excalibur-cuba
```

### 2. **Professionelle Methode: Git (empfohlen)**

#### **Erstmalige Git-Einrichtung:**
```bash
# Auf dem VPS:
cd /var/www/excalibur-cuba
git init
git remote add origin https://github.com/DEIN_USERNAME/excalibur-cuba.git
```

#### **Update-Workflow:**
```bash
# Auf dem VPS:
sudo systemctl stop excalibur-cuba
git pull origin main
npm install
npm run build
npm run db:push
sudo systemctl start excalibur-cuba
```

### 3. **Automatisches Update-Script**

#### **Script erstellen:**
```bash
# Auf dem VPS:
nano /var/www/excalibur-cuba/update.sh

# Script-Inhalt:
#!/bin/bash
echo "🔄 Starte Update..."
sudo systemctl stop excalibur-cuba
cd /var/www/excalibur-cuba
git pull origin main
npm install
npm run build
npm run db:push
sudo systemctl start excalibur-cuba
echo "✅ Update abgeschlossen!"

# Script ausführbar machen:
chmod +x update.sh
```

#### **Update ausführen:**
```bash
# Einfach ausführen:
./update.sh
```

## 🛠️ **Empfohlener Workflow für dich:**

### **Kurzfristig (als Anfänger):**
1. **ZIP-Methode** verwenden
2. Immer **Backup** erstellen vor Updates
3. **Service stoppen** vor dem Update
4. **Service starten** nach dem Update

### **Langfristig (wenn du mehr Erfahrung hast):**
1. **Git Repository** erstellen
2. **Automatisches Update-Script** verwenden
3. **Staging-Umgebung** für Tests

## 🔧 **Update-Checklist:**

```bash
# Vor jedem Update:
□ Service stoppen: sudo systemctl stop excalibur-cuba
□ Backup erstellen: cp -r /var/www/excalibur-cuba /var/www/backup-$(date +%Y%m%d)
□ Neue Dateien hochladen/pullen
□ Dependencies aktualisieren: npm install
□ Projekt bauen: npm run build
□ Datenbank aktualisieren: npm run db:push
□ Service starten: sudo systemctl start excalibur-cuba
□ Testen: curl http://localhost:5000
```

## 🚨 **Notfall-Rollback:**
```bash
# Falls etwas schief geht:
sudo systemctl stop excalibur-cuba
rm -rf /var/www/excalibur-cuba
mv /var/www/excalibur-cuba-backup-DATUM /var/www/excalibur-cuba
sudo systemctl start excalibur-cuba
```

## 📱 **Schnelle Updates für kleine Änderungen:**
```bash
# Nur Frontend-Änderungen:
npm run build
sudo systemctl restart excalibur-cuba

# Nur Backend-Änderungen:
sudo systemctl restart excalibur-cuba

# Datenbank-Änderungen:
npm run db:push
sudo systemctl restart excalibur-cuba
```

## 💡 **Profi-Tipp:**
Erstelle ein kleines Script für häufige Updates:
```bash
# quick-update.sh
#!/bin/bash
echo "Schnelles Update..."
sudo systemctl stop excalibur-cuba
# Deine Änderungen hier
sudo systemctl start excalibur-cuba
echo "Fertig!"
```