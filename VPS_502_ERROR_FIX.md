# VPS 502 Bad Gateway Error Fix

## Sofortige Diagnose (in dieser Reihenfolge ausführen):

### 1. NPM Update (sicher)
```bash
npm install -g npm@11.4.2
```

### 2. Service Status checken
```bash
sudo systemctl status excalibur-cuba
sudo systemctl status nginx
```

### 3. Wenn Service stopped ist - neustarten
```bash
cd /var/www/excalibur-cuba/ExcaliburGenerator
sudo systemctl restart excalibur-cuba
sudo systemctl restart nginx
```

### 4. Logs checken für Fehler
```bash
sudo journalctl -u excalibur-cuba -f
sudo journalctl -u nginx -f
```

### 5. Port checken (sollte Port 5000 aktiv sein)
```bash
sudo netstat -tlnp | grep :5000
sudo netstat -tlnp | grep :80
```

### 6. Falls Service nicht startet - manuell starten zum debuggen
```bash
cd /var/www/excalibur-cuba/ExcaliburGenerator
npm install  # Falls nach NPM update nötig
npm run start
```

## Häufige Ursachen für 502:

1. **Node.js Service gestoppt** → systemctl restart excalibur-cuba
2. **Port 5000 belegt** → sudo fuser -k 5000/tcp
3. **Dependencies fehlen** → npm install
4. **Nginx falsche Konfiguration** → systemctl restart nginx

## Nach dem Fix:
Teste: `http://your-server-ip` sollte die Website zeigen