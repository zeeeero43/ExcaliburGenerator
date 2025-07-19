# PREIS-MIGRATION FÜR VPS

## Problem
- Neue old_price / new_price Spalten sind leer
- Kunden müssen alle Preise neu eingeben

## LÖSUNG: Automatische Preis-Migration

**1. Mit Datenbank verbinden:**
```bash
sudo -u postgres psql excalibur_cuba
```

**2. Bestehende Preise zu old_price kopieren:**
```sql
-- Copy existing prices to old_price
UPDATE products 
SET old_price = CASE 
  WHEN price IS NOT NULL AND price > 0 THEN price
  ELSE NULL
END
WHERE old_price IS NULL;

-- Check results
SELECT id, name, price, old_price, new_price FROM products LIMIT 10;
```

**3. Falls "price" Spalte nicht existiert, schaue verfügbare Spalten:**
```sql
\d products
```

**4. Migration basierend auf verfügbaren Spalten:**
```sql
-- Falls andere Preisspalte existiert, ersetze "price" mit dem richtigen Namen
-- Beispiel falls es "current_price" oder ähnlich heißt:
-- UPDATE products SET old_price = current_price WHERE old_price IS NULL;
```

**5. Exit PostgreSQL:**
```sql
\q
```

## ERWARTETES ERGEBNIS
- Alle bestehenden Preise sind jetzt in old_price gespeichert
- Kunden müssen nur new_price eingeben für Rabatte
- Bestehende Produktdaten bleiben erhalten

**Dauer:** 1-2 Minuten