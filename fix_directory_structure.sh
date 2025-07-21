#!/bin/bash

echo "🚨 FIXING DIRECTORY STRUCTURE & 502 ERROR - EXCALIBUR CUBA"
echo "============================================================="

echo "1. Finding correct project directory..."
cd /var/www/excalibur-cuba/

# Check current directory structure
echo "Current directory contents:"
ls -la

echo -e "\n2. Looking for package.json to find project root..."
find . -name "package.json" -type f

echo -e "\n3. Looking for server files..."
find . -name "index.ts" -o -name "index.js" -type f | head -5

echo -e "\n4. Current systemd service configuration:"
sudo systemctl cat excalibur-cuba | grep -A 5 -B 5 "WorkingDirectory\|ExecStart"

echo -e "\n5. Checking if project is directly in /var/www/excalibur-cuba/..."
if [ -f "/var/www/excalibur-cuba/package.json" ]; then
    echo "✅ Found package.json in root directory"
    PROJECT_ROOT="/var/www/excalibur-cuba"
elif [ -f "/var/www/excalibur-cuba/ExcaliburGenerator/package.json" ]; then
    echo "✅ Found package.json in ExcaliburGenerator subdirectory"
    PROJECT_ROOT="/var/www/excalibur-cuba/ExcaliburGenerator"
else
    echo "❌ Cannot find package.json - checking for any Node.js project..."
    find /var/www/excalibur-cuba -name "package.json" -type f | head -1
fi

echo -e "\n6. Attempting to build/prepare project..."
if [ -f "$PROJECT_ROOT/package.json" ]; then
    cd "$PROJECT_ROOT"
    echo "Working in directory: $(pwd)"
    
    # Check if dist exists
    if [ -d "dist" ]; then
        echo "✅ dist directory exists"
    else
        echo "❌ dist directory missing - attempting build..."
        npm run build
    fi
    
    # Check for .env file
    if [ -f ".env" ]; then
        echo "✅ .env file exists"
        head -3 .env
    else
        echo "❌ .env file missing - this might be the problem!"
    fi
else
    echo "❌ Cannot proceed without finding package.json"
    echo "Listing all directories to help debug:"
    find /var/www/excalibur-cuba -type d -maxdepth 2
fi

echo -e "\n7. Checking current service status..."
sudo journalctl -u excalibur-cuba -n 10 --no-pager

echo -e "\n============================================================="
echo "🎯 DIAGNOSIS COMPLETE - Please check the output above"
echo "If PROJECT_ROOT was found, we can fix the systemd service"