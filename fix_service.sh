#!/bin/bash

# Backup der originalen Service-Datei
sudo cp /etc/systemd/system/excalibur-cuba.service /etc/systemd/system/excalibur-cuba.service.backup

# Neue Service-Datei mit URL-encoded Password erstellen
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
Environment=DATABASE_URL=postgresql://excalibur_user:ExcaliburCuba%402025%21SecureDB%239847@localhost:5432/excalibur_cuba
Environment=SESSION_SECRET=ExcaliburCuba@2025!SecureSession#9847VeryLongSecretKey
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

# Service neu laden und starten
sudo systemctl daemon-reload
sudo systemctl restart excalibur-cuba

echo "✅ Service wurde repariert!"
echo "🔍 Status prüfen:"
sudo systemctl status excalibur-cuba --no-pager -l