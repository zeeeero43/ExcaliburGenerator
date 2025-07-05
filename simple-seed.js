// Einfaches JavaScript-Seed-Script (ohne TypeScript)
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  const client = new Client({
    connectionString: 'postgresql://excalibur_user:simple123@localhost:5432/excalibur_cuba'
  });

  try {
    await client.connect();
    console.log('🌱 Starting database seeding...');

    // Erstelle admin_users Tabelle
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        role VARCHAR(20) DEFAULT 'admin',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Erstelle andere nötige Tabellen
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(200) UNIQUE NOT NULL,
        description TEXT,
        specifications JSONB,
        images JSONB,
        price VARCHAR(50),
        category_id INTEGER REFERENCES categories(id),
        is_active BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(50),
        message TEXT NOT NULL,
        product_id INTEGER REFERENCES products(id),
        status VARCHAR(20) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Prüfe ob Admin-User existiert
    const existingAdmin = await client.query(
      'SELECT id FROM admin_users WHERE username = $1',
      ['excalibur_admin']
    );

    if (existingAdmin.rows.length === 0) {
      // Erstelle Admin-User
      const hashedPassword = await bcrypt.hash('ExcaliburCuba@2025!SecureAdmin#9847', 10);
      
      await client.query(`
        INSERT INTO admin_users (username, email, password, first_name, last_name, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        'excalibur_admin',
        'admin@excalibur-cuba.com',
        hashedPassword,
        'Excalibur',
        'Admin',
        'admin',
        true
      ]);

      console.log('✅ Admin-User erstellt: excalibur_admin');
    } else {
      console.log('✅ Admin-User existiert bereits');
    }

    console.log('🎉 Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

seedDatabase().catch(console.error);