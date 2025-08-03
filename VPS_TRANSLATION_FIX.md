# 🔧 VPS Übersetzungsproblem - Lösung

## Das Problem
Übersetzungen funktionieren in Replit, aber nicht auf dem VPS.

## 🚀 SOFORTIGE LÖSUNGSSCHRITTE

### 1. DEEPL API KEY PRÜFEN
```bash
# SSH zum VPS
ssh root@[YOUR_SERVER_IP]

# Prüfen ob DEEPL_API_KEY gesetzt ist
echo $DEEPL_API_KEY

# Falls leer, API Key setzen
export DEEPL_API_KEY="deine_deepl_api_key_hier"

# PERMANENT speichern in .env oder systemd
sudo nano /etc/systemd/system/excalibur-cuba.service
# Hinzufügen: Environment=DEEPL_API_KEY=deine_api_key
```

### 2. NEUESTEN CODE DEPLOYEN
```bash
# Zum Projektverzeichnis
cd /var/www/excalibur-cuba/ExcaliburGenerator

# Git Status prüfen
git status

# Neuesten Code holen
git pull origin main

# Dependencies aktualisieren
npm install
```

### 3. SERVICE NEU STARTEN
```bash
# Service stoppen
sudo systemctl stop excalibur-cuba

# Service starten
sudo systemctl start excalibur-cuba

# Status prüfen
sudo systemctl status excalibur-cuba

# Logs anschauen
sudo journalctl -u excalibur-cuba -f
```

### 4. ÜBERSETZUNG TESTEN
```bash
# Test-API-Aufruf (ersetze API_KEY)
curl -X POST "https://api-free.deepl.com/v2/translate" \
  -H "Authorization: DeepL-Auth-Key YOUR_API_KEY" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "text=Hallo&source_lang=DE&target_lang=ES"
```

## 🔍 DIAGNOSE-HILFE

### Logs prüfen
```bash
# Website-Logs in Echtzeit
sudo journalctl -u excalibur-cuba -f

# Nach Übersetzungsfehlern suchen
sudo journalctl -u excalibur-cuba | grep -i "translation\|deepl\|error"
```

### Netzwerk testen
```bash
# DeepL API erreichbar?
curl -I https://api-free.deepl.com/v2/translate

# DNS funktioniert?
nslookup api-free.deepl.com
```

## ⚠️ HÄUFIGE URSACHEN

1. **DEEPL_API_KEY fehlt** → Schritt 1 durchführen
2. **Alter Code auf VPS** → Schritt 2 durchführen  
3. **Service läuft mit altem Code** → Schritt 3 durchführen
4. **Firewall blockiert APIs** → Mit Hoster prüfen
5. **Rate Limit erreicht** → DeepL-Dashboard prüfen

## ✅ ERFOLG PRÜFEN

Die Übersetzung funktioniert wenn:
- Service läuft: `sudo systemctl status excalibur-cuba`
- API Key gesetzt: `echo $DEEPL_API_KEY`
- Logs zeigen: "✅ DeepL SUCCESS: ..."
- Admin-Panel Übersetzung funktioniert

## 🆘 FALLS NICHTS HILFT

1. Kompletten Service neu installieren
2. Environment-Variablen komplett neu setzen
3. Firewall-Regeln prüfen
4. Mit Hosting-Provider über API-Zugriff sprechen