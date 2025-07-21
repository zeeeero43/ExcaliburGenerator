# VPS PostgreSQL Admin Commands

## 1. SOFORTIGE LÖSUNG - Zweiten Admin erstellen

```bash
# Mit sicherem vorbereiteten Passwort-Hash
psql "postgresql://excalibur_user:SecurePass2025@localhost/excalibur_cuba" -c "
INSERT INTO admin_users (username, email, password, role, is_active, created_at, updated_at)
VALUES ('admin2', 'admin2@excalibur-cuba.com', '\$2a\$12\$vK8H3mP9nL2qR5wE7tY1Xu6gFj4K8mZ7pL5nV9rS2tU3wQ9xC6aD8', 'admin', true, NOW(), NOW())
ON CONFLICT (username) DO NOTHING;
"
```

**Login-Daten nach Erstellung:**
- Username: `admin2`
- Password: `ExcaliburSecure2024!Admin#7829`

## 2. ÜBERPRÜFUNG - Alle Admins anzeigen

```bash
psql "postgresql://excalibur_user:SecurePass2025@localhost/excalibur_cuba" -c "
SELECT id, username, email, role, is_active, created_at 
FROM admin_users 
ORDER BY id;
"
```

## 3. ALTERNATIVE - Eigenes Passwort setzen

```bash
# Schritt 1: Node.js Passwort-Hash generieren
node -e "
const bcrypt = require('bcryptjs');
const password = 'IhrSicheresPasswort123!';
const hash = bcrypt.hashSync(password, 12);
console.log('Hash:', hash);
"

# Schritt 2: Hash in PostgreSQL einfügen (ersetzen Sie HASH_HIER)
psql "postgresql://excalibur_user:SecurePass2025@localhost/excalibur_cuba" -c "
INSERT INTO admin_users (username, email, password, role, is_active, created_at, updated_at)
VALUES ('admin2', 'admin2@excalibur-cuba.com', 'HASH_HIER', 'admin', true, NOW(), NOW())
ON CONFLICT (username) DO NOTHING;
"
```

## 4. PROBLEMLÖSUNG - Admin löschen und neu erstellen

```bash
# Admin löschen falls Probleme
psql "postgresql://excalibur_user:SecurePass2025@localhost/excalibur_cuba" -c "
DELETE FROM admin_users WHERE username = 'admin2';
"

# Neu erstellen
psql "postgresql://excalibur_user:SecurePass2025@localhost/excalibur_cuba" -c "
INSERT INTO admin_users (username, email, password, role, is_active, created_at, updated_at)
VALUES ('admin2', 'admin2@excalibur-cuba.com', '\$2a\$12\$vK8H3mP9nL2qR5wE7tY1Xu6gFj4K8mZ7pL5nV9rS2tU3wQ9xC6aD8', 'admin', true, NOW(), NOW());
"
```

## 5. DATENBANK-STATUS prüfen

```bash
# Verbindung testen
psql "postgresql://excalibur_user:SecurePass2025@localhost/excalibur_cuba" -c "SELECT version();"

# Tabellen prüfen
psql "postgresql://excalibur_user:SecurePass2025@localhost/excalibur_cuba" -c "\dt"

# Admin-Tabelle Struktur prüfen
psql "postgresql://excalibur_user:SecurePass2025@localhost/excalibur_cuba" -c "\d admin_users"
```

## 6. SESSION-PROBLEME beheben

```bash
# Alle Sessions löschen (bei Problemen)
psql "postgresql://excalibur_user:SecurePass2025@localhost/excalibur_cuba" -c "
DELETE FROM sessions;
"

# Service neu starten nach Session-Reset
sudo systemctl restart excalibur-cuba
```

## WICHTIGE LOGIN-DATEN

Nach erfolgreicher Erstellung:

**Admin 1 (Original):**
- Username: `admin`
- Password: `admin123`

**Admin 2 (Neu):**
- Username: `admin2`
- Password: `ExcaliburSecure2024!Admin#7829`

## TESTING - Login testen

```bash
# Nach Admin-Erstellung Service neu starten
sudo systemctl restart excalibur-cuba

# Status prüfen
sudo systemctl status excalibur-cuba
```