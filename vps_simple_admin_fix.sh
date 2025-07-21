#!/bin/bash

echo "🔐 VPS ADMIN FIX - BEIDE MIT EINEM ACCOUNT"
echo "=========================================="

echo "1. Navigating to project directory..."
cd /var/www/excalibur-cuba

echo "2. Installing missing authentication packages..."
npm install jsonwebtoken @types/jsonwebtoken cookie-parser @types/cookie-parser

echo "3. Building updated project..."
npm run build

echo "4. Restarting service without session requirements..."
sudo systemctl restart excalibur-cuba

echo "5. Checking service status..."
sudo systemctl status excalibur-cuba --no-pager -l

echo "6. Testing if port 5000 is active..."
sleep 3
netstat -tlnp | grep :5000

echo "7. Checking nginx status..."
sudo systemctl status nginx --no-pager

echo ""
echo "=========================================="
echo "🎯 SIMPLE FIX COMPLETE!"
echo ""
echo "✅ KEIN SESSION-SYSTEM MEHR!"
echo "✅ Cookie-basierte Authentifizierung"
echo "✅ BEIDE KÖNNEN MIT EINEM ACCOUNT ARBEITEN:"
echo ""
echo "👥 SHARED LOGIN:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "🔧 WIE ES FUNKTIONIERT:"
echo "   - Jeder Browser hat eigene Cookies"
echo "   - Keine Session-Konflikte mehr"
echo "   - Beide können gleichzeitig arbeiten"
echo ""
echo "🌐 Admin Panel: http://YOUR_VPS_IP/admin/login"
echo ""
echo "BEIDE LOGGEN SICH MIT DEMSELBEN ACCOUNT EIN!"