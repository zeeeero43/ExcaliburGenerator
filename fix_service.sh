#!/bin/bash

echo "🔧 KRITISCHE REPARATUR: Database Connection Fix"
echo "================================================"

# 1. Service stoppen
echo "1. Service stoppen..."
sudo systemctl stop excalibur-cuba

# 2. Database-Passwort zu einfachem Wert ändern
echo "2. Database-Passwort vereinfachen..."
sudo -u postgres psql -c "ALTER USER excalibur_user PASSWORD 'SecurePass2025';"

# 3. Service-Datei komplett neu erstellen
echo "3. Service-Datei neu erstellen..."
sudo tee /etc/systemd/system/excalibur-cuba.service > /dev/null <<EOF
[Unit]
Description=Excalibur Cuba Website
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/excalibur-cuba
Environment=NODE_ENV=production
Environment=DATABASE_URL=postgresql://excalibur_user:SecurePass2025@localhost:5432/excalibur_cuba
Environment=SESSION_SECRET=ExcaliburCubaSecureSession2025
Environment=PORT=5000
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=3
RemainAfterExit=no
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 4. SystemD neu laden
echo "4. SystemD neu laden..."
sudo systemctl daemon-reload

# 5. Service starten
echo "5. Service starten..."
sudo systemctl start excalibur-cuba

# 6. Status prüfen
echo "6. Status prüfen..."
sleep 3
sudo systemctl status excalibur-cuba --no-pager -l

# 7. Datenbankverbindung testen
echo "7. Datenbankverbindung testen..."
psql "postgresql://excalibur_user:SecurePass2025@localhost:5432/excalibur_cuba" -c "SELECT 'Database connection successful!' as result;"

# 8. Admin-User erstellen
echo "8. Admin-User erstellen..."
psql "postgresql://excalibur_user:SecurePass2025@localhost:5432/excalibur_cuba" -c "INSERT INTO admin_users (username, password, email, created_at, updated_at) VALUES ('admin', '\$2b\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@excalibur-cuba.com', NOW(), NOW()) ON CONFLICT (username) DO NOTHING;"

echo "✅ REPARATUR ABGESCHLOSSEN!"
echo "Website sollte jetzt unter https://excalibur-cuba.com funktionieren"
echo "Admin-Login: https://excalibur-cuba.com/admin/login"
echo "Benutzername: admin"
echo "Passwort: password"