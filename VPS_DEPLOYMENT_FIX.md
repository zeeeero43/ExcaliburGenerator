# 🚨 VPS DEPLOYMENT FIX - 502 Bad Gateway

## PROBLEM: nginx 502 Bad Gateway Error

**Symptom:** nginx/1.18.0 (Ubuntu) zeigt 502 Bad Gateway  
**Ursache:** nginx Reverse Proxy kann nicht zu Express-Server (Port 5000) verbinden  
**Status:** KRITISCHER DEPLOYMENT-FEHLER  

## 🔧 SOFORTIGE LÖSUNG

### **1. NGINX KONFIGURATION PRÜFEN**

```bash
# Nginx-Konfiguration prüfen
sudo nano /etc/nginx/sites-available/excalibur-cuba

# Sollte so aussehen:
server {
    listen 80;
    server_name excalibur-cuba.com www.excalibur-cuba.com;

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
```

### **2. NGINX NEUSTARTEN**

```bash
# Nginx-Konfiguration testen
sudo nginx -t

# Nginx neustarten
sudo systemctl reload nginx
sudo systemctl restart nginx

# Status prüfen
sudo systemctl status nginx
```

### **3. EXPRESS-SERVER STATUS PRÜFEN**

```bash
# Service-Status prüfen
sudo systemctl status excalibur-cuba

# Läuft der Server auf Port 5000?
netstat -tlnp | grep :5000

# Oder mit ss
ss -tlnp | grep :5000
```

### **4. FIREWALL PRÜFEN**

```bash
# UFW Status
sudo ufw status

# Port 5000 für localhost freigeben (falls nötig)
sudo ufw allow from 127.0.0.1 to any port 5000
```

## 🚀 ALTERNATIVE LÖSUNGEN

### **Option A: Port-Binding ändern**

```bash
# In server/index.ts ändern von:
const PORT = process.env.PORT || 5000;

# Zu:
const PORT = process.env.PORT || 3000;

# Dann nginx auf Port 3000 umkonfigurieren
```

### **Option B: Direkt auf Port 80 laufen lassen**

```bash
# Service stoppen
sudo systemctl stop excalibur-cuba

# Port 80 in Environment setzen
echo "PORT=80" >> /var/www/excalibur-cuba/ExcaliburGenerator/.env

# Mit sudo starten (für Port 80)
sudo systemctl start excalibur-cuba
```

## 🔍 DEBUGGING BEFEHLE

```bash
# 1. Prüfen ob Express läuft
curl http://localhost:5000

# 2. Nginx-Error-Log prüfen
sudo tail -f /var/log/nginx/error.log

# 3. Service-Logs prüfen
sudo journalctl -u excalibur-cuba -f

# 4. Port-Binding prüfen
sudo lsof -i :5000
sudo lsof -i :80
```

## ⚡ SCHNELLE TEMPORARY FIX

```bash
# Nginx temporär stoppen und direkt auf Port 80
sudo systemctl stop nginx
sudo systemctl stop excalibur-cuba

# Port 80 für Service setzen
sudo bash -c 'echo "PORT=80" >> /var/www/excalibur-cuba/ExcaliburGenerator/.env'

# Service als root starten (für Port 80)
sudo systemctl start excalibur-cuba

# Website sollte jetzt direkt funktionieren
```

## 🎯 LANGFRISTIGE LÖSUNG

Die beste Lösung ist die korrekte nginx-Konfiguration zu fixen:

1. **nginx proxy_pass auf korrekte Port zeigen lassen**
2. **Express-Server auf festem Port laufen lassen**  
3. **Beide Services koordiniert starten**

**Status:** Bereit für sofortige Reparatur ✅