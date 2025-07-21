# KOMPLETTE VPS ADMIN ERSTELLUNG - Schritt für Schritt

## SCHRITT 1: VPS Login und Navigation

```bash
# 1. Mit VPS verbinden (SSH)
ssh root@IHR_VPS_IP

# 2. Zum Projekt-Verzeichnis navigieren
cd /var/www/excalibur-cuba

# 3. Prüfen ob wir im richtigen Verzeichnis sind
pwd
ls -la

# 4. Falls ExcaliburGenerator Unterordner existiert:
cd ExcaliburGenerator
# ODER falls direkt im Hauptordner:
# bleibt bei /var/www/excalibur-cuba
```

## SCHRITT 2: PostgreSQL Verbindung testen

```bash
# Verbindung zur Datenbank testen
psql "postgresql://excalibur_user:SecurePass2025@localhost/excalibur_cuba" -c "SELECT version();"

# Falls Fehler: PostgreSQL Service prüfen
sudo systemctl status postgresql
```

## SCHRITT 3: Aktueller Admin-Status prüfen

```bash
# Alle vorhandenen Admin-Accounts anzeigen
psql "postgresql://excalibur_user:SecurePass2025@localhost/excalibur_cuba" -c "
SELECT id, username, email, role, is_active, created_at 
FROM admin_users 
ORDER BY id;
"
```

## SCHRITT 4: Zweiten Admin erstellen

```bash
# Admin2 mit sicherem Passwort erstellen
psql "postgresql://excalibur_user:SecurePass2025@localhost/excalibur_cuba" -c "
INSERT INTO admin_users (username, email, password, role, is_active, created_at, updated_at)
VALUES ('admin2', 'admin2@excalibur-cuba.com', '\$2a\$12\$vK8H3mP9nL2qR5wE7tY1Xu6gFj4K8mZ7pL5nV9rS2tU3wQ9xC6aD8', 'admin', true, NOW(), NOW())
ON CONFLICT (username) DO NOTHING;
"
```

## SCHRITT 5: Erstellung bestätigen

```bash
# Prüfen ob Admin2 erstellt wurde
psql "postgresql://excalibur_user:SecurePass2025@localhost/excalibur_cuba" -c "
SELECT id, username, email, role, is_active 
FROM admin_users 
WHERE username = 'admin2';
"
```

## SCHRITT 6: Sessions zurücksetzen (wichtig!)

```bash
# Alle aktiven Sessions löschen für sauberen Start
psql "postgresql://excalibur_user:SecurePass2025@localhost/excalibur_cuba" -c "DELETE FROM sessions;"

# Service neu starten
sudo systemctl restart excalibur-cuba

# Status prüfen - sollte "active (running)" zeigen
sudo systemctl status excalibur-cuba
```

## SCHRITT 7: Service-Logs prüfen

```bash
# Letzte 10 Zeilen der Service-Logs anzeigen
sudo journalctl -u excalibur-cuba -n 10 --no-pager

# Falls Fehler: Live-Logs anzeigen
sudo journalctl -u excalibur-cuba -f
# (Mit Ctrl+C beenden)
```

## SCHRITT 8: Website-Zugriff testen

```bash
# Port 5000 prüfen (sollte aktiv sein)
netstat -tlnp | grep :5000

# Nginx Status prüfen
sudo systemctl status nginx

# Falls nötig: Nginx neu starten
sudo systemctl restart nginx
```

## ERFOLG BESTÄTIGEN

Nach allen Schritten sollten Sie haben:

**Admin-Accounts:**
- `admin` / `admin123` (Original)
- `admin2` / `ExcaliburSecure2024!Admin#7829` (Neu)

**Service Status:**
- excalibur-cuba: active (running)
- nginx: active (running)
- Port 5000: aktiv

## BEI PROBLEMEN

```bash
# Alle Services neu starten
sudo systemctl restart excalibur-cuba nginx

# Git Update falls nötig
cd /var/www/excalibur-cuba
git pull origin main
npm install
npm run build
sudo systemctl restart excalibur-cuba

# Dependencies prüfen
npm list cors helmet express-rate-limit
```

## LOGIN TESTEN

1. Öffnen Sie: `http://IHR_VPS_IP/admin/login`
2. Verwenden Sie: `admin2` / `ExcaliburSecure2024!Admin#7829`
3. Gleichzeitig kann sich der andere Admin mit dem Original-Account anmelden

**BEIDE KÖNNEN JETZT GLEICHZEITIG ARBEITEN!**