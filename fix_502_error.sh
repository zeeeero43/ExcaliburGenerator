#!/bin/bash

echo "🚨 FIXING 502 BAD GATEWAY ERROR - EXCALIBUR CUBA"
echo "=================================================="

# 1. SERVICE STATUS PRÜFEN
echo "1. Checking service status..."
sudo systemctl status excalibur-cuba --no-pager -l

echo -e "\n2. Checking if Express server is running on port 5000..."
netstat -tlnp | grep :5000 || echo "❌ Port 5000 not active"

echo -e "\n3. Checking nginx configuration..."
sudo nginx -t

echo -e "\n4. Stopping services for clean restart..."
sudo systemctl stop excalibur-cuba
sudo systemctl stop nginx

echo -e "\n5. Starting Express server first..."
cd /var/www/excalibur-cuba/ExcaliburGenerator
sudo systemctl start excalibur-cuba

# Wait for server to start
sleep 3

echo -e "\n6. Checking if server started correctly..."
netstat -tlnp | grep :5000 && echo "✅ Express server running on port 5000" || echo "❌ Express server not running"

echo -e "\n7. Starting nginx..."
sudo systemctl start nginx

echo -e "\n8. Final status check..."
echo "Express Service:"
sudo systemctl status excalibur-cuba --no-pager -l | head -5

echo -e "\nNginx Service:"
sudo systemctl status nginx --no-pager -l | head -5

echo -e "\n9. Testing connection..."
curl -I http://localhost:5000 && echo -e "\n✅ Express server responding" || echo -e "\n❌ Express server not responding"

echo -e "\n=================================================="
echo "🎯 FIX COMPLETE - Test your website now!"
echo "If still not working, run: sudo journalctl -u excalibur-cuba -f"