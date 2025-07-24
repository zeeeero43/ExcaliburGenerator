# CUBA ACCESS DIAGNOSTICS - KRITISCHES PROBLEM

## Problem: Kubaner können Website nicht öffnen

### SOFORTIGE LÖSUNGEN IMPLEMENTIERT:

#### 1. Rate Limiting Kuba-freundlich gemacht
- ✅ **General Rate Limit**: 100 → 500 requests/15min
- ✅ **API Rate Limit**: 60 → 300 requests/minute
- ✅ **KUBA-WHITELIST**: Alle kubanischen IPs (CU) sind von Rate Limiting ausgenommen

#### 2. VPS Server Diagnose (wichtigste Checks):

```bash
# Server Status prüfen
sudo systemctl status excalibur-cuba
sudo systemctl status nginx

# Logs für Errors checken
sudo journalctl -u excalibur-cuba -f | grep ERROR
sudo journalctl -u nginx -f | grep ERROR

# Port Verfügbarkeit testen
sudo netstat -tlnp | grep :5000
sudo netstat -tlnp | grep :80
```

#### 3. Domain & DNS testen (von außerhalb Kubas):
```bash
# DNS Resolution testen
nslookup your-domain.com 8.8.8.8
ping your-domain.com

# HTTP Connectivity testen
curl -I http://your-domain.com
curl -I https://your-domain.com
```

### WAHRSCHEINLICHE URSACHEN:

1. **502 Bad Gateway** → Node.js Service gestoppt
2. **Langsame kubanische Internet** → Rate Limits zu niedrig (JETZT REPARIERT)
3. **DNS Issues** → Domain nicht erreichbar aus Kuba
4. **VPS Firewall** → Ports nicht offen

### NÄCHSTE SCHRITTE:

1. **Server neustarten:**
```bash
sudo systemctl restart excalibur-cuba
sudo systemctl restart nginx
```

2. **Wenn immer noch nicht funktioniert:**
```bash
# Manuell starten für Debugging
cd /var/www/excalibur-cuba/ExcaliburGenerator
npm run start
```

3. **DNS von Kuba testen lassen:**
   - Kubaner soll `ping your-domain.com` versuchen
   - Oder `nslookup your-domain.com` ausführen

### MONITORING AKTIVIERT:
- 🇨🇺 Kubanische IPs werden in Logs markiert
- Rate Limiting für CU deaktiviert
- Erhöhte Limits für alle anderen

**KRITISCH**: Website MUSS für Kubaner funktionieren!