#!/bin/bash

echo "🚨 FIXING MISSING DEPENDENCIES ERROR - EXCALIBUR CUBA"
echo "===================================================="

echo "1. Stopping the failing service first..."
sudo systemctl stop excalibur-cuba

echo -e "\n2. Finding project directory..."
cd /var/www/excalibur-cuba

# Check if we're in the right directory
if [ -f "package.json" ]; then
    echo "✅ Found package.json in current directory"
    PROJECT_DIR=$(pwd)
elif [ -f "ExcaliburGenerator/package.json" ]; then
    echo "✅ Found package.json in ExcaliburGenerator subdirectory"
    cd ExcaliburGenerator
    PROJECT_DIR=$(pwd)
else
    echo "❌ Cannot find package.json!"
    find . -name "package.json" -type f | head -3
    exit 1
fi

echo "Working in: $PROJECT_DIR"

echo -e "\n3. Installing missing dependencies..."
npm install cors helmet express-rate-limit

echo -e "\n4. Running full dependency install to be safe..."
npm install

echo -e "\n5. Building the project..."
npm run build

echo -e "\n6. Checking if dist/index.js was created..."
if [ -f "dist/index.js" ]; then
    echo "✅ Build successful - dist/index.js exists"
    ls -la dist/index.js
else
    echo "❌ Build failed - dist/index.js not found"
    ls -la dist/ || echo "dist directory doesn't exist"
fi

echo -e "\n7. Starting the service..."
sudo systemctl start excalibur-cuba

echo -e "\n8. Checking service status..."
sleep 3
sudo systemctl status excalibur-cuba --no-pager -l

echo -e "\n9. Testing if port 5000 is now active..."
netstat -tlnp | grep :5000 && echo "✅ Port 5000 is active!" || echo "❌ Port 5000 still not active"

echo -e "\n===================================================="
echo "🎯 DEPENDENCY FIX COMPLETE!"
echo "Your website should now be working."