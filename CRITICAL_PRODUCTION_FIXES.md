# 🚨 CRITICAL PRODUCTION FIXES - VPS 502 Error

## PROBLEM: 502 Bad Gateway nach Git Update

**Status:** CRITICAL - Website nicht erreichbar  
**Ursache:** nginx kann nicht zu Express-Server (Port 5000) verbinden  
**Solution:** Sofortige Reparatur erforderlich  

---

## ⚡ SOFORT-FIX (5 Minuten)

### **1. Fix-Script ausführen:**
```bash
cd /var/www/excalibur-cuba/ExcaliburGenerator
chmod +x fix_502_error.sh
./fix_502_error.sh
```

### **2. Manual Fix (falls Script nicht funktioniert):**

```bash
# Services stoppen
sudo systemctl stop excalibur-cuba nginx

# Express-Server starten
sudo systemctl start excalibur-cuba
sleep 3

# Prüfen ob Port 5000 aktiv
netstat -tlnp | grep :5000

# Nginx starten
sudo systemctl start nginx

# Website testen
curl -I http://localhost:5000
```

---

## 🔍 DEBUGGING (falls Problem bleibt)

### **A. Service-Logs prüfen:**
```bash
# Express-Server Logs
sudo journalctl -u excalibur-cuba -f

# Nginx Error-Logs  
sudo tail -f /var/log/nginx/error.log
```

### **B. Port-Konfiguration prüfen:**
```bash
# Welche Ports sind aktiv?
sudo ss -tlnp | grep -E ':80|:5000'

# Service-Konfiguration anzeigen
sudo systemctl cat excalibur-cuba
```

### **C. Nginx-Konfiguration prüfen:**
```bash
# Nginx-Konfiguration testen
sudo nginx -t

# Aktuelle Konfiguration anzeigen
sudo cat /etc/nginx/sites-available/excalibur-cuba
```

---

## 🎯 WAHRSCHEINLICHE URSACHEN

### **1. Express-Server läuft nicht:**
```bash
# Solution:
sudo systemctl restart excalibur-cuba
sudo systemctl enable excalibur-cuba
```

### **2. Port-Mismatch:**
```bash
# Nginx erwartet Port 5000, aber Express läuft auf anderem Port
# Solution: .env-Datei prüfen
cat /var/www/excalibur-cuba/ExcaliburGenerator/.env
```

### **3. Environment Variables fehlen:**
```bash
# Solution: .env-Datei erstellen/reparieren
echo "DATABASE_URL=postgresql://..." >> .env
echo "NODE_ENV=production" >> .env
```

---

## 🚀 PERMANENT FIX

### **Systemd-Service aktualisieren:**
```bash
sudo nano /etc/systemd/system/excalibur-cuba.service

# Sicherstellen dass:
[Unit]
Description=Excalibur Cuba Website
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/excalibur-cuba/ExcaliburGenerator
Environment=NODE_ENV=production
Environment=DATABASE_URL=your_db_url_here
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### **Service neu laden:**
```bash
sudo systemctl daemon-reload
sudo systemctl restart excalibur-cuba
sudo systemctl status excalibur-cuba
```

---

## ✅ ERFOLG VALIDIEREN

**Website sollte jetzt funktionieren:**
- ✅ Express-Server läuft auf Port 5000
- ✅ nginx proxy_pass funktioniert
- ✅ Website ist über Domain erreichbar
- ✅ Admin-Panel funktioniert (/admin/login)

**Test-Befehle:**
```bash
curl -I http://localhost:5000        # Express direkt
curl -I http://your-domain.com       # Über nginx
curl -I http://your-domain.com/admin # Admin-Panel
```

---

## 📞 NOTFALL-KONTAKT

**Falls Problem weiterhin besteht:**
1. Führen Sie das Fix-Script aus: `./fix_502_error.sh`
2. Senden Sie Output von: `sudo journalctl -u excalibur-cuba -n 50`
3. Senden Sie Output von: `sudo tail -n 50 /var/log/nginx/error.log`

**Status:** Fix verfügbar - Sofortige Reparatur möglich ⚡