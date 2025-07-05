# REPLIT → GITHUB → COOLIFY DEPLOYMENT GUIDE

## SCHRITT 1: REPLIT PROJEKT ZU GITHUB VERBINDEN

### 1.1 GitHub-Account vorbereiten
1. Gehe zu **github.com**
2. **Login** oder **neuen Account erstellen**
3. **Verifiziere deine Email-Adresse**

### 1.2 Replit mit GitHub verbinden
1. **In deinem Replit-Projekt:**
   - Klicke auf das **Git-Icon** in der linken Seitenleiste
   - Oder gehe zu **Tools → Version Control**

2. **GitHub-Verbindung herstellen:**
   - Klicke **"Connect to GitHub"**
   - **"Authorize Replit"** klicken
   - **GitHub-Login** eingeben
   - **Berechtigung erteilen**

### 1.3 Repository erstellen
1. **Repository-Name:** `excalibur-cuba-website`
2. **Description:** "Excalibur Cuba - Solar and Generator Solutions"
3. **Visibility:** Public oder Private (deine Wahl)
4. **"Create Repository"** klicken

### 1.4 Projekt hochladen
1. **Alle Dateien werden automatisch synchronisiert**
2. **Commit-Message:** "Initial commit - Complete website"
3. **"Commit and Push"** klicken

**✅ Fertig! Projekt ist jetzt auf GitHub**

---

## SCHRITT 2: VPS VORBEREITEN

### 2.1 VPS-Verbindung
```bash
# VPS verbinden
ssh root@DEINE_VPS_IP

# System aktualisieren
apt update && apt upgrade -y
```

### 2.2 Coolify installieren
```bash
# Coolify installieren (dauert 2-3 Minuten)
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# Warten bis Installation fertig ist
# Zeigt: "Coolify is now available at http://YOUR_IP:8000"
```

**✅ Coolify läuft jetzt auf: `http://DEINE_VPS_IP:8000`**

---

## SCHRITT 3: COOLIFY SETUP

### 3.1 Coolify Web-Interface öffnen
```bash
# Im Browser öffnen
http://DEINE_VPS_IP:8000
```

### 3.2 Account erstellen
1. **Email:** deine-email@example.com
2. **Passwort:** sicheres Passwort wählen
3. **"Register"** klicken

### 3.3 Server Setup
- **Server wird automatisch erkannt**
- **"Continue"** klicken

---

## SCHRITT 4: GITHUB MIT COOLIFY VERBINDEN

### 4.1 GitHub App erstellen
1. **"New Resource"** klicken
2. **"GitHub App"** auswählen
3. **"Connect to GitHub"** klicken

### 4.2 GitHub-Berechtigung
1. **GitHub-Login** eingeben
2. **"Install & Authorize"** klicken
3. **Repository auswählen:** `excalibur-cuba-website`
4. **"Install"** klicken

### 4.3 Repository konfigurieren
1. **Repository auswählen:** `excalibur-cuba-website`
2. **Branch:** `main` (oder `master`)
3. **"Continue"** klicken

---

## SCHRITT 5: DEPLOYMENT KONFIGURATION

### 5.1 Build-Konfiguration
```yaml
# Coolify erkennt automatisch:
Build Command: npm run build
Start Command: npm run start
Port: 5000
```

### 5.2 Environment Variables hinzufügen
**In Coolify → Environment Variables Tab:**

```
NODE_ENV=production
SESSION_SECRET=ExcaliburCuba2025SecureSessionKeyVeryLongAndSecure
PORT=5000
```

**Database URL kommt im nächsten Schritt**

---

## SCHRITT 6: DATENBANK SETUP

### 6.1 PostgreSQL in Coolify erstellen
1. **"New Resource"** → **"Database"**
2. **"PostgreSQL"** auswählen
3. **Konfiguration:**
   - **Name:** `excalibur-cuba-db`
   - **Database Name:** `excalibur_cuba`
   - **Username:** `coolify_user`
   - **Password:** `SecurePass2025`
4. **"Deploy"** klicken

### 6.2 Database URL zur App hinzufügen
1. **Zurück zu deiner App**
2. **Environment Variables** Tab
3. **Neue Variable hinzufügen:**
```
DATABASE_URL=postgresql://coolify_user:SecurePass2025@[DB_HOST]:5432/excalibur_cuba
```
*(DB_HOST findest du in der Database-Übersicht)*

---

## SCHRITT 7: DEPLOYMENT STARTEN

### 7.1 Erste Deployment
1. **"Deploy"** Button klicken
2. **Build-Logs ansehen**
3. **Warten bis "Deployment successful"**

### 7.2 Admin-User erstellen
**Nach erfolgreichem Deployment:**

1. **"Console"** Tab öffnen
2. **Container-Terminal öffnen**
3. **Admin-User erstellen:**
```bash
# In Coolify Console
npx tsx server/seed.ts
```

**Oder direkt SQL:**
```bash
# PostgreSQL direkt
psql $DATABASE_URL << 'EOF'
INSERT INTO admin_users (id, username, email, password_hash, first_name, last_name, created_at, updated_at) 
VALUES (1, 'excalibur_admin', 'admin@excalibur-cuba.com', '$2b$10$K8pF9Z7oL4N6wM2Q3R8tV.8JzL9M0N1P2Q3R4S5T6U7V8W9X0Y1Z2', 'Admin', 'User', NOW(), NOW());
EOF
```

---

## SCHRITT 8: DOMAIN SETUP (Optional)

### 8.1 Domain in Coolify hinzufügen
1. **"Domains"** Tab
2. **"Add Domain"**
3. **Domain eingeben:** `excalibur-cuba.com`
4. **SSL aktivieren** (automatisch)

### 8.2 DNS-Einstellungen
**Bei deinem Domain-Provider:**
- **A-Record:** `excalibur-cuba.com` → `DEINE_VPS_IP`
- **CNAME:** `www.excalibur-cuba.com` → `excalibur-cuba.com`

---

## SCHRITT 9: TESTEN

### 9.1 Website testen
```bash
# Über IP
http://DEINE_VPS_IP

# Über Domain (falls konfiguriert)
http://excalibur-cuba.com
```

### 9.2 Admin-Panel testen
```bash
# Admin-Login
http://DEINE_VPS_IP/admin/login

# Credentials:
Username: excalibur_admin
Password: ExcaliburCuba@2025!SecureAdmin#9847
```

---

## AUTOMATISCHE UPDATES

### Bei Code-Änderungen:
1. **Änderungen in Replit machen**
2. **"Commit and Push"** in Replit
3. **Coolify deployed automatisch!**

### Rollback bei Problemen:
1. **Coolify → "Deployments"** Tab
2. **Vorherige Version auswählen**
3. **"Rollback"** klicken

---

## VORTEILE DIESER LÖSUNG

✅ **Automatische Deployments** bei GitHub-Updates  
✅ **SSL-Zertifikate** automatisch  
✅ **Database-Management** im Web-Interface  
✅ **Monitoring und Logs** integriert  
✅ **Rollback** mit einem Klick  
✅ **Kein kompliziertes Server-Setup**  
✅ **Professionelle Lösung**

---

## TROUBLESHOOTING

### Replit-GitHub-Verbindung:
- **Berechtigung prüfen:** GitHub → Settings → Applications
- **Repository-Zugriff:** Replit muss auf Repository zugreifen können

### Coolify-Build-Fehler:
- **Logs ansehen:** Coolify → Deployments → Build Logs
- **Environment Variables prüfen**
- **Database-Verbindung testen**

### Database-Probleme:
- **Connection String prüfen**
- **Database-Status in Coolify ansehen**
- **Schema mit `npm run db:push` erstellen**

---

## DIESER WORKFLOW IST PERFEKT FÜR DICH

**Warum:**
- **Einfach:** Web-Interface statt Kommandozeile
- **Automatisch:** Updates ohne manuellen Aufwand
- **Professionell:** Wie echte Entwickler arbeiten
- **Skalierbar:** Für zukünftige Projekte verwendbar

**Folge diesem Guide und du hast eine professionelle Deployment-Pipeline!**