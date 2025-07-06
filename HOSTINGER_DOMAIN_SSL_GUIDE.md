# Hostinger Domain + SSL Setup Guide

## Schritt 1: Domain mit VPS verbinden

### 1.1 VPS IP-Adresse finden
```bash
# Auf der VPS ausführen:
curl -4 icanhazip.com
```
Notieren Sie diese IP-Adresse.

### 1.2 DNS-Einstellungen in Hostinger
1. Gehen Sie zu **Hostinger Control Panel**
2. Klicken Sie auf **Domains**
3. Wählen Sie Ihre Domain aus
4. Klicken Sie auf **DNS Zone**
5. Bearbeiten Sie die A-Records:

```
Type: A
Name: @ (für excalibur-cuba.com)
Value: [IHRE_VPS_IP]
TTL: 3600

Type: A  
Name: www (für www.excalibur-cuba.com)
Value: [IHRE_VPS_IP]
TTL: 3600
```

### 1.3 Warten auf DNS-Propagation
- Warten Sie 5-30 Minuten
- Testen Sie mit: `nslookup excalibur-cuba.com`

## Schritt 2: Nginx für Domain konfigurieren

### 2.1 Nginx-Konfiguration erstellen
```bash
sudo nano /etc/nginx/sites-available/excalibur-cuba.com
```

### 2.2 Basis-Konfiguration einfügen:
```nginx
server {
    listen 80;
    server_name excalibur-cuba.com www.excalibur-cuba.com;
    
    location / {
        proxy_pass http://localhost:3000;
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

### 2.3 Site aktivieren:
```bash
sudo ln -s /etc/nginx/sites-available/excalibur-cuba.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Schritt 3: SSL-Zertifikat mit Let's Encrypt

### 3.1 Certbot installieren:
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

### 3.2 SSL-Zertifikat erstellen:
```bash
sudo certbot --nginx -d excalibur-cuba.com -d www.excalibur-cuba.com
```

### 3.3 Automatische Erneuerung testen:
```bash
sudo certbot renew --dry-run
```

## Schritt 4: Application für Domain anpassen

### 4.1 Systemd-Service für Port 3000 ändern:
```bash
sudo nano /etc/systemd/system/excalibur-cuba.service
```

Ändern Sie die Environment-Variable:
```ini
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=DATABASE_URL=postgresql://excalibur_user:SecurePass2025@localhost/excalibur_cuba
```

### 4.2 Service neu starten:
```bash
sudo systemctl daemon-reload
sudo systemctl restart excalibur-cuba
sudo systemctl status excalibur-cuba
```

## Schritt 5: Test und Verifikation

### 5.1 SSL-Test:
```bash
# Testen Sie diese URLs:
curl -I https://excalibur-cuba.com
curl -I https://www.excalibur-cuba.com
```

### 5.2 Browser-Test:
- Öffnen Sie `https://excalibur-cuba.com`
- Überprüfen Sie das SSL-Zertifikat (grünes Schloss)
- Testen Sie die Admin-Anmeldung: `https://excalibur-cuba.com/admin/login`

## Schritt 6: Firewall konfigurieren

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable
sudo ufw status
```

## Troubleshooting

### Problem: Domain zeigt nicht zur VPS
- Überprüfen Sie DNS: `nslookup excalibur-cuba.com`
- Warten Sie bis zu 48h für DNS-Propagation

### Problem: SSL-Zertifikat funktioniert nicht
```bash
sudo certbot certificates
sudo nginx -t
sudo systemctl status nginx
```

### Problem: 502 Bad Gateway
```bash
sudo systemctl status excalibur-cuba
sudo journalctl -u excalibur-cuba -f
```

## Finale Nginx-Konfiguration (nach SSL)

Ihre finale `/etc/nginx/sites-available/excalibur-cuba.com` sollte so aussehen:

```nginx
server {
    listen 80;
    server_name excalibur-cuba.com www.excalibur-cuba.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name excalibur-cuba.com www.excalibur-cuba.com;
    
    ssl_certificate /etc/letsencrypt/live/excalibur-cuba.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/excalibur-cuba.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
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

## Erfolgskriterien

✅ Domain zeigt zur VPS
✅ HTTPS funktioniert mit grünem Schloss
✅ HTTP wird automatisch zu HTTPS umgeleitet
✅ Admin-Panel funktioniert unter https://excalibur-cuba.com/admin/login
✅ SSL-Zertifikat erneuert sich automatisch

Nach diesem Setup ist Ihre Website unter https://excalibur-cuba.com erreichbar!