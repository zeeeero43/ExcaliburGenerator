#!/bin/bash

echo "🔧 FIXING VPS DATABASE SCHEMA - EXCALIBUR CUBA"
echo "=============================================="

echo "1. Checking current database tables..."
psql "postgresql://excalibur_user:SecurePass2025@localhost/excalibur_cuba" -c "\dt"

echo -e "\n2. Creating missing sessions table..."
psql "postgresql://excalibur_user:SecurePass2025@localhost/excalibur_cuba" << 'EOF'
-- Create sessions table for authentication
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR(255) PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

-- Create index for session expiration
CREATE INDEX IF NOT EXISTS idx_session_expire ON sessions(expire);

-- Show result
SELECT 'Sessions table created successfully!' as result;
\q
EOF

echo -e "\n3. Checking if admin_users table exists and has data..."
psql "postgresql://excalibur_user:SecurePass2025@localhost/excalibur_cuba" -c "
SELECT COUNT(*) as admin_count FROM admin_users;
"

echo -e "\n4. Creating second admin account..."
psql "postgresql://excalibur_user:SecurePass2025@localhost/excalibur_cuba" -c "
INSERT INTO admin_users (username, email, password, role, is_active, created_at, updated_at)
VALUES ('admin2', 'admin2@excalibur-cuba.com', '\$2a\$12\$vK8H3mP9nL2qR5wE7tY1Xu6gFj4K8mZ7pL5nV9rS2tU3wQ9xC6aD8', 'admin', true, NOW(), NOW())
ON CONFLICT (username) DO NOTHING;
"

echo -e "\n5. Verifying all admin accounts..."
psql "postgresql://excalibur_user:SecurePass2025@localhost/excalibur_cuba" -c "
SELECT id, username, email, role, is_active 
FROM admin_users 
ORDER BY id;
"

echo -e "\n6. Now clearing sessions (should work now)..."
psql "postgresql://excalibur_user:SecurePass2025@localhost/excalibur_cuba" -c "DELETE FROM sessions;"

echo -e "\n7. Restarting excalibur-cuba service..."
sudo systemctl restart excalibur-cuba

echo -e "\n8. Checking service status..."
sudo systemctl status excalibur-cuba --no-pager -l

echo -e "\n=============================================="
echo "🎯 DATABASE SCHEMA FIX COMPLETE!"
echo ""
echo "LOGIN CREDENTIALS:"
echo "Admin 1: admin / admin123"
echo "Admin 2: admin2 / ExcaliburSecure2024!Admin#7829"
echo ""
echo "Both admins can now login simultaneously!"