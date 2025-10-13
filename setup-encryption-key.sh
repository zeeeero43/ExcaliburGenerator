#!/bin/bash

# Excalibur Cuba - Encryption Key Setup Script
# This script generates and configures the encryption key for Google Analytics credentials

set -e

echo "🔐 Excalibur Cuba - Encryption Key Setup"
echo "========================================"
echo ""

# Check if running on VPS
if [ "$NODE_ENV" != "production" ]; then
    echo "⚠️  Warning: This appears to be a development environment"
    echo "   Set NODE_ENV=production for production setup"
    echo ""
fi

# Generate secure encryption key
echo "🔑 Generating secure encryption key..."
ENCRYPTION_KEY=$(openssl rand -base64 32)

if [ -z "$ENCRYPTION_KEY" ]; then
    echo "❌ Failed to generate encryption key"
    exit 1
fi

echo "✅ Encryption key generated successfully"
echo ""

# Determine the project directory
if [ -d "/var/www/excalibur-cuba" ]; then
    PROJECT_DIR="/var/www/excalibur-cuba"
else
    PROJECT_DIR=$(pwd)
fi

echo "📁 Project directory: $PROJECT_DIR"
echo ""

# Create or update .env file
ENV_FILE="$PROJECT_DIR/.env"

# Backup existing .env if it exists
if [ -f "$ENV_FILE" ]; then
    BACKUP_FILE="$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "💾 Backing up existing .env to: $BACKUP_FILE"
    cp "$ENV_FILE" "$BACKUP_FILE"
fi

# Remove old ENCRYPTION_KEY if exists
if [ -f "$ENV_FILE" ]; then
    sed -i '/^ENCRYPTION_KEY=/d' "$ENV_FILE"
fi

# Add new ENCRYPTION_KEY
echo "ENCRYPTION_KEY=\"$ENCRYPTION_KEY\"" >> "$ENV_FILE"
echo "✅ Encryption key added to .env file"
echo ""

# Set proper permissions
chmod 600 "$ENV_FILE"
echo "🔒 Set .env permissions to 600 (owner read/write only)"
echo ""

# Display the key (one time only - save it securely!)
echo "⚠️  IMPORTANT: Save this encryption key securely!"
echo "================================================"
echo "$ENCRYPTION_KEY"
echo "================================================"
echo ""
echo "⚠️  This key will NOT be shown again. Store it safely!"
echo "   If you lose it, you'll need to reconfigure Google Analytics credentials."
echo ""

# Ask about restarting the service
echo "🔄 Restarting application..."
echo ""

# Try different restart methods
if command -v pm2 &> /dev/null; then
    echo "   Using PM2..."
    pm2 restart all
    echo "✅ Application restarted with PM2"
elif systemctl is-active --quiet excalibur-cuba; then
    echo "   Using systemd..."
    sudo systemctl restart excalibur-cuba
    echo "✅ Application restarted with systemd"
else
    echo "⚠️  Could not detect PM2 or systemd service"
    echo "   Please restart your application manually:"
    echo "   - PM2: pm2 restart all"
    echo "   - systemd: sudo systemctl restart excalibur-cuba"
    echo "   - Manual: cd $PROJECT_DIR && npm start"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Open your admin analytics page"
echo "   2. Click the Settings (⚙️) button"
echo "   3. Paste your Google Analytics credentials JSON"
echo "   4. Click Save"
echo ""
echo "🔐 The credentials will be encrypted and stored securely in the database."
