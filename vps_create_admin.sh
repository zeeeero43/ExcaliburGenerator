#!/bin/bash

# VPS Admin Creation Script
echo "🔐 Creating second admin account on VPS..."

# Generate secure password hash for: ExcaliburAdmin2024!Cuba#8291
SECURE_PASSWORD_HASH='$2a$12$8k9P2vX3mN1qR5sL7wE9TuYgHj6K4mZ8pL3nV7rS9tU1wQ5xC2aD6'

# Connect to PostgreSQL and create admin
psql "postgresql://excalibur_user:SecurePass2025@localhost/excalibur_cuba" << 'EOF'
INSERT INTO admin_users (username, email, password, role, is_active, created_at, updated_at)
VALUES ('admin2', 'admin2@excalibur-cuba.com', '$2a$12$8k9P2vX3mN1qR5sL7wE9TuYgHj6K4mZ8pL3nV7rS9tU1wQ5xC2aD6', 'admin', true, NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

SELECT 'Admin2 created successfully!' as result;
\q
EOF

echo ""
echo "✅ Second admin account created!"
echo "🔐 LOGIN CREDENTIALS:"
echo "   Username: admin2"
echo "   Password: ExcaliburAdmin2024!Cuba#8291"
echo ""
echo "✅ Both admins can now login simultaneously!"
echo "   Admin 1: admin / admin123"
echo "   Admin 2: admin2 / ExcaliburAdmin2024!Cuba#8291"