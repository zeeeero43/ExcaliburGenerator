# VPS DATABASE SCHEMA FIX

## PROBLEM
VPS-Datenbank fehlt `old_price` Column:
```
error: column "old_price" does not exist
```

## SOFORT-LÖSUNG

### 1. SSH zur VPS:
```bash
ssh root@deine-server-ip
cd /var/www/excalibur-cuba/ExcaliburGenerator
```

### 2. Database Schema Update:
```bash
npm run db:push
```

**ODER falls das nicht funktioniert:**

### 3. Manuelle SQL-Lösung:
```bash
sudo -u postgres psql excalibur_db
```

Dann diese SQL-Befehle:
```sql
-- Add missing old_price column
ALTER TABLE products ADD COLUMN IF NOT EXISTS old_price decimal(10,2);

-- Check if column was added
\d products

-- Exit PostgreSQL
\q
```

### 4. Service neu starten:
```bash
sudo systemctl restart excalibur-cuba
```

### 5. Test:
Admin Dashboard sollte jetzt alle 47 Produkte zeigen!

## WAS PASSIERT IST
- Development-Datenbank hat `old_price` Column
- VPS-Datenbank hat sie nicht
- Code versucht `old_price` zu lesen → Fehler

## ERWARTETES ERGEBNIS
✅ Database Schema synchronisiert
✅ Admin Dashboard zeigt alle Produkte
✅ Keine "column does not exist" Fehler mehr

**Dauer:** 1-2 Minuten