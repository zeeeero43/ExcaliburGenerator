#!/bin/bash

echo "🔧 EINFACHE DEEPL API KEY LÖSUNG FÜR VPS"
echo "======================================"

# Prüfe ob wir im richtigen Verzeichnis sind
if [ ! -f "package.json" ]; then
    echo "❌ Fehler: package.json nicht gefunden!"
    echo "   Führe das Script im Projektverzeichnis aus:"
    echo "   cd /var/www/excalibur-cuba && ./vps_simple_env_fix.sh"
    exit 1
fi

# Frage nach API Key
echo ""
echo "Bitte gib deinen DeepL API Key ein:"
echo "(Du findest ihn auf: https://www.deepl.com/account/summary)"
read -p "DeepL API Key: " DEEPL_KEY

if [ -z "$DEEPL_KEY" ]; then
    echo "❌ Kein API Key eingegeben. Abbruch."
    exit 1
fi

echo ""
echo "🔧 Konfiguriere systemd Service..."

# Backup der originalen Service-Datei
sudo cp /etc/systemd/system/excalibur-cuba.service /etc/systemd/system/excalibur-cuba.service.backup

# Neue Service-Datei mit API Key erstellen
sudo tee /etc/systemd/system/excalibur-cuba.service > /dev/null << EOF
[Unit]
Description=Excalibur Cuba Website
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/excalibur-cuba
Environment=NODE_ENV=production
Environment=DEEPL_API_KEY=$DEEPL_KEY
Environment=DATABASE_URL=postgresql://excalibur_user:SecurePass2025@localhost:5432/excalibur_cuba
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Service-Datei aktualisiert"

# Service neu laden und starten
echo "🔄 Starte Service neu..."
sudo systemctl daemon-reload
sudo systemctl restart excalibur-cuba

# Status prüfen
echo ""
echo "📊 Service Status:"
sudo systemctl status excalibur-cuba --no-pager

echo ""
echo "📋 Live-Logs (Ctrl+C zum Beenden):"
echo "   Schaue nach '✅ DeepL SUCCESS' in den Logs"
echo ""
sudo journalctl -u excalibur-cuba -f