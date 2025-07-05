# COOLIFY DEPLOYMENT GUIDE - SUPER EINFACH

## Was ist Coolify?
Coolify ist ein selbst-gehostetes Deployment-Tool das komplizierte Server-Setups automatisiert. Perfekt für dich!

---

## SCHRITT 1: COOLIFY INSTALLIEREN

```bash
# VPS verbinden
ssh root@DEINE_VPS_IP

# Coolify installieren (dauert 2-3 Minuten)
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

**Das war's! Coolify läuft jetzt auf: `http://DEINE_VPS_IP:8000`**

---

## SCHRITT 2: PROJEKT ZU GITHUB

### Option A: Von Replit
1. Gehe zu deinem Replit-Projekt
2. Klicke "Version Control" → "Connect to GitHub"
3. Neues Repository erstellen

### Option B: Manuell
1. Neues GitHub Repository erstellen
2. Projekt-Dateien hochladen
3. Repository-URL notieren

---

## SCHRITT 3: IN COOLIFY DEPLOYEN

### 3.1 Coolify Setup
```bash
# Im Browser öffnen
http://DEINE_VPS_IP:8000
```

1. **Account erstellen** (Email + Passwort)
2. **Server Setup** (automatisch erkannt)

### 3.2 Projekt deployen
1. **"New Resource"** klicken
2. **"GitHub App"** auswählen
3. **GitHub verbinden** (OAuth)
4. **Repository auswählen**
5. **Deploy klicken**

---

## SCHRITT 4: ENVIRONMENT VARIABLES

In Coolify Web-Interface:
1. Gehe zu deinem Projekt
2. **"Environment Variables"** Tab
3. Folgende Variablen hinzufügen:

```
NODE_ENV=production
DATABASE_URL=postgresql://coolify_user:SecurePass2025@localhost:5432/excalibur_cuba
SESSION_SECRET=ExcaliburCuba2025SecureSessionKeyVeryLongAndSecure
PORT=5000
```

---

## SCHRITT 5: DATENBANK SETUP

### 5.1 PostgreSQL in Coolify
1. **"New Resource"** → **"Database"**
2. **"PostgreSQL"** auswählen
3. **Database Name:** `excalibur_cuba`
4. **Username:** `coolify_user`
5. **Password:** `SecurePass2025`
6. **Deploy**

### 5.2 Admin-User erstellen
Nach dem ersten Deployment:
1. Coolify Console öffnen
2. Ins App-Container wechseln
3. Admin-User-Script ausführen:

```bash
# In Coolify Console
npx tsx server/seed.ts
```

---

## SCHRITT 6: DOMAIN SETUP (Optional)

### 6.1 Domain hinzufügen
1. **"Domains"** Tab in Coolify
2. **"Add Domain"** klicken
3. **Domain eingeben:** `excalibur-cuba.com`
4. **SSL aktivieren** (automatisch)

### 6.2 DNS-Einstellungen
Bei deinem Domain-Provider:
- **A-Record:** `excalibur-cuba.com` → `DEINE_VPS_IP`
- **CNAME:** `www.excalibur-cuba.com` → `excalibur-cuba.com`

---

## VORTEILE VON COOLIFY

✅ **Automatische Deployments** bei GitHub-Updates  
✅ **SSL-Zertifikate** automatisch  
✅ **Reverse Proxy** integriert  
✅ **Database-Management** im Web-Interface  
✅ **Monitoring** und Logs  
✅ **Rollback** mit einem Klick  
✅ **Kein nginx/systemd-Konfiguration** nötig

---

## TROUBLESHOOTING

### Build-Fehler:
1. Coolify Logs ansehen
2. Environment Variables prüfen
3. GitHub Repository prüfen

### Datenbank-Probleme:
1. Coolify Database-Status prüfen
2. Environment Variables prüfen
3. Database-Logs ansehen

### Domain-Probleme:
1. DNS-Propagation warten (24h)
2. SSL-Status in Coolify prüfen
3. Domain-Konfiguration prüfen

---

## WARUM COOLIFY BESSER IST

**Manueller Deployment:**
- 20+ Kommandos
- nginx-Konfiguration
- SSL-Setup
- Service-Management
- Viele Fehlerquellen

**Coolify:**
- 3 Schritte im Web-Interface
- Alles automatisch
- Ein Klick-Deployments
- Integrierte Überwachung

**Coolify ist die professionelle Lösung für dein Projekt!**