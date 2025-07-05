#!/bin/bash
# Deployment Script für Excalibur Cuba Website

echo "🚀 Starte Deployment von Excalibur Cuba Website..."

# Farben für bessere Lesbarkeit
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funktion für Erfolgsmeldungen
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Funktion für Warnungen
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Funktion für Fehler
error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Prüfen ob wir im richtigen Verzeichnis sind
if [ ! -f "package.json" ]; then
    error "package.json nicht gefunden. Bitte führe das Script im Projekt-Verzeichnis aus."
fi

# System-Update
echo "📦 Aktualisiere System-Pakete..."
sudo apt update && sudo apt upgrade -y || error "System-Update fehlgeschlagen"
success "System-Pakete aktualisiert"

# Node.js Installation prüfen
if ! command -v node &> /dev/null; then
    echo "📦 Installiere Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs || error "Node.js Installation fehlgeschlagen"
    success "Node.js installiert"
else
    success "Node.js bereits installiert ($(node --version))"
fi

# PostgreSQL Installation prüfen
if ! command -v psql &> /dev/null; then
    echo "🐘 Installiere PostgreSQL..."
    sudo apt install -y postgresql postgresql-contrib || error "PostgreSQL Installation fehlgeschlagen"
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    success "PostgreSQL installiert"
else
    success "PostgreSQL bereits installiert"
fi

# Nginx Installation prüfen
if ! command -v nginx &> /dev/null; then
    echo "🌐 Installiere Nginx..."
    sudo apt install -y nginx || error "Nginx Installation fehlgeschlagen"
    success "Nginx installiert"
else
    success "Nginx bereits installiert"
fi

# NPM Abhängigkeiten installieren
echo "📦 Installiere NPM Abhängigkeiten..."
npm install || error "NPM Installation fehlgeschlagen"
success "NPM Abhängigkeiten installiert"

# TypeScript global installieren
echo "📦 Installiere TypeScript..."
npm install -g typescript tsx || warning "TypeScript Installation fehlgeschlagen (möglicherweise bereits installiert)"

# Projekt builden
echo "🔨 Baue Projekt..."
npm run build || error "Build fehlgeschlagen"
success "Projekt erfolgreich gebaut"

# Umgebungsvariablen prüfen
if [ ! -f ".env" ]; then
    warning ".env Datei nicht gefunden. Erstelle Beispiel-Datei..."
    cat > .env << EOF
NODE_ENV=production
DATABASE_URL=postgresql://excalibur_user:ExcaliburCuba@2025!SecureDB#9847@localhost:5432/excalibur_cuba
SESSION_SECRET=ExcaliburCuba@2025!SecureSession#9847VeryLongSecretKey
PORT=5000
EOF
    warning "Bitte bearbeite die .env Datei mit den korrekten Werten"
else
    success ".env Datei gefunden"
fi

# Datenbank-Schema pushen
echo "🏗️  Aktualisiere Datenbank-Schema..."
npm run db:push || error "Datenbank-Schema Update fehlgeschlagen"
success "Datenbank-Schema aktualisiert"

# Systemd Service erstellen
echo "🔧 Erstelle Systemd Service..."
sudo cat > /etc/systemd/system/excalibur-cuba.service << EOF
[Unit]
Description=Excalibur Cuba Website
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable excalibur-cuba || error "Service-Aktivierung fehlgeschlagen"
success "Systemd Service erstellt"

# Nginx konfigurieren
echo "🌐 Konfiguriere Nginx..."
sudo cat > /etc/nginx/sites-available/excalibur-cuba << EOF
server {
    listen 80;
    server_name excalibur-cuba.com www.excalibur-cuba.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Nginx Site aktivieren
sudo ln -sf /etc/nginx/sites-available/excalibur-cuba /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t || error "Nginx Konfiguration fehlerhaft"
sudo systemctl restart nginx || error "Nginx Neustart fehlgeschlagen"
success "Nginx konfiguriert"

# Rechte setzen
echo "🔒 Setze Dateiberechtigungen..."
sudo chown -R www-data:www-data $(pwd)
sudo chmod -R 755 $(pwd)
success "Dateiberechtigungen gesetzt"

# Service starten
echo "🚀 Starte Anwendung..."
sudo systemctl start excalibur-cuba || error "Service-Start fehlgeschlagen"
success "Anwendung gestartet"

# Status prüfen
echo "🔍 Prüfe Service-Status..."
sudo systemctl status excalibur-cuba --no-pager || error "Service läuft nicht korrekt"
success "Service läuft erfolgreich"

echo ""
echo "🎉 Deployment erfolgreich abgeschlossen!"
echo ""
echo "📋 Nächste Schritte:"
echo "1. Prüfe die Anwendung: http://$(hostname -I | awk '{print $1}'):5000"
echo "2. Konfiguriere deine Domain in der DNS"
echo "3. Installiere SSL-Zertifikat mit: sudo certbot --nginx"
echo "4. Admin-Panel: http://DEINE_DOMAIN/admin/login"
echo "5. Admin-Zugang: excalibur_admin / ExcaliburCuba@2025!SecureAdmin#9847"
echo ""
echo "📊 Nützliche Befehle:"
echo "- Service-Status: sudo systemctl status excalibur-cuba"
echo "- Logs anzeigen: sudo journalctl -u excalibur-cuba -f"
echo "- Service neustarten: sudo systemctl restart excalibur-cuba"