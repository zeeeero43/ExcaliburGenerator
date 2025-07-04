# EXCALIBUR CUBA - Vollständige Projektspezifikation

## 1. PROJEKTÜBERSICHT

### Geschäftsziel
EXCALIBUR-CUBA.COM ist eine moderne, mehrsprachige Präsentationswebsite für den Import und Vertrieb von Solarkomponenten und Generatoren in Kuba. Die Website dient als Produktpräsentation (OHNE E-Commerce-Funktionalität) und zielt auf den kubanischen Markt ab, unterstützt aber Spanisch, Deutsch und Englisch.

### Zielgruppe
- **Primär**: Kubanische Hausbesitzer und kleine Unternehmen (Spanisch)
- **Sekundär**: Deutsche Geschäftspartner und Administratoren (Deutsch)
- **Tertiär**: Internationale Kunden (Englisch)

### Kerngeschäft
- Monatliche Container-Importe von Solarkomponenten aus Deutschland
- Direkter Vertrieb ohne Zwischenhändler
- Technische Beratung und Support
- Generatorenlösungen als Backup-Systeme

## 2. TECHNISCHE ARCHITEKTUR

### Frontend
```
Framework: React 18 mit TypeScript
Routing: Wouter (client-side routing)
Styling: Tailwind CSS + shadcn/ui Komponenten
State Management: 
  - React Query für Server-State
  - React Hooks für lokalen State
Build Tool: Vite
```

### Backend
```
Runtime: Node.js mit Express.js
Sprache: TypeScript mit ES Modules
Datenbank: PostgreSQL mit Drizzle ORM
Session Storage: PostgreSQL mit connect-pg-simple
Authentifizierung: Session-basiert mit bcrypt
```

### Entwicklungsumgebung
```
Hosting: Replit
Port: 5000 (Express + Vite auf demselben Port)
Database: Neon PostgreSQL (Serverless)
Environment: NODE_ENV=development
```

## 3. DATENBANKSCHEMA

### Admin Users (adminUsers)
```sql
- id: serial PRIMARY KEY
- username: varchar(50) UNIQUE NOT NULL
- email: varchar(100) UNIQUE NOT NULL
- password: varchar(255) NOT NULL (bcrypt hashed)
- firstName: varchar(50)
- lastName: varchar(50)
- role: varchar(20) DEFAULT 'admin'
- isActive: boolean DEFAULT true
- createdAt/updatedAt: timestamp
```

### Categories (categories)
```sql
- id: serial PRIMARY KEY
- name: varchar(100) NOT NULL (fallback)
- nameEs: varchar(100) NOT NULL (Spanish)
- nameDe: varchar(100) NOT NULL (German)
- nameEn: varchar(100) NOT NULL (English)
- description/descriptionEs/descriptionDe/descriptionEn: text
- slug: varchar(100) UNIQUE NOT NULL
- image: varchar(500)
- isActive: boolean DEFAULT true
- sortOrder: integer DEFAULT 0
- createdAt/updatedAt: timestamp
```

### Subcategories (subcategories)
```sql
- id: serial PRIMARY KEY
- categoryId: integer REFERENCES categories(id)
- name/nameEs/nameDe/nameEn: varchar(100) NOT NULL
- description/descriptionEs/descriptionDe/descriptionEn: text
- slug: varchar(100) UNIQUE NOT NULL
- image: varchar(500)
- isActive: boolean DEFAULT true
- sortOrder: integer DEFAULT 0
- createdAt/updatedAt: timestamp
```

### Products (products)
```sql
- id: serial PRIMARY KEY
- categoryId: integer REFERENCES categories(id)
- subcategoryId: integer REFERENCES subcategories(id)
- name/nameEs/nameDe/nameEn: varchar(200) NOT NULL
- description/descriptionEs/descriptionDe/descriptionEn: text
- shortDescription/shortDescriptionEs/shortDescriptionDe/shortDescriptionEn: varchar(500)
- slug: varchar(200) UNIQUE NOT NULL
- sku: varchar(100)
- price: decimal(10,2)
- priceNote: varchar(200)
- specifications: jsonb (key-value pairs)
- images: jsonb DEFAULT [] (array of image URLs)
- mainImage: varchar(500)
- isActive: boolean DEFAULT true
- isFeatured: boolean DEFAULT false (für Homepage)
- stockStatus: varchar(20) DEFAULT 'in_stock' ('in_stock'|'out_of_stock'|'limited')
- sortOrder: integer DEFAULT 0
- metaTitle/metaDescription: varchar für SEO
- createdAt/updatedAt: timestamp
```

### Inquiries (inquiries)
```sql
- id: serial PRIMARY KEY
- productId: integer REFERENCES products(id) NULLABLE
- name: varchar(100) NOT NULL
- email: varchar(100) NOT NULL
- phone: varchar(20)
- systemType: varchar(50)
- message: text NOT NULL
- status: varchar(20) DEFAULT 'new'
- createdAt/updatedAt: timestamp
```

### Site Settings (siteSettings)
```sql
- id: serial PRIMARY KEY
- key: varchar(100) UNIQUE NOT NULL
- value: text NOT NULL
- description: varchar(500)
- createdAt/updatedAt: timestamp
```

### Uploaded Images (uploadedImages)
```sql
- id: serial PRIMARY KEY
- filename: varchar(255) NOT NULL
- originalName: varchar(255) NOT NULL
- mimetype: varchar(100) NOT NULL
- size: integer NOT NULL
- url: varchar(500) NOT NULL
- createdAt: timestamp
```

## 4. API-ENDPUNKTE

### Öffentliche API
```
GET /api/geolocation - IP-basierte Spracherkennung
GET /api/categories - Aktive Kategorien
GET /api/subcategories?categoryId=X - Unterkategorien
GET /api/products - Alle aktiven Produkte
GET /api/products/featured - Nur featured Produkte (Homepage)
GET /api/products/:slug - Einzelprodukt nach Slug
POST /api/inquiries - Kundenanfrage erstellen
```

### Admin API (Authentication Required)
```
POST /api/admin/login - Admin Login
GET /api/admin/user - Aktueller Admin User
POST /api/admin/logout - Admin Logout

GET /api/admin/categories - Alle Kategorien
POST /api/admin/categories - Kategorie erstellen
PUT /api/admin/categories/:id - Kategorie bearbeiten
DELETE /api/admin/categories/:id - Kategorie löschen

GET /api/admin/subcategories - Alle Unterkategorien
POST /api/admin/subcategories - Unterkategorie erstellen
PUT /api/admin/subcategories/:id - Unterkategorie bearbeiten
DELETE /api/admin/subcategories/:id - Unterkategorie löschen

GET /api/admin/products - Alle Produkte (auch inaktive)
GET /api/admin/products/:id - Einzelprodukt für Bearbeitung
POST /api/admin/products - Produkt erstellen
PUT /api/admin/products/:id - Produkt bearbeiten
DELETE /api/admin/products/:id - Produkt löschen

GET /api/admin/inquiries - Alle Kundenanfragen
PUT /api/admin/inquiries/:id - Anfrage-Status bearbeiten

GET /api/admin/images - Alle hochgeladenen Bilder
POST /api/admin/images/upload - Bilder hochladen
DELETE /api/admin/images/:id - Bild löschen
```

## 5. AUTHENTIFIZIERUNG & SICHERHEIT

### Session Management
```javascript
- Express Session mit PostgreSQL Store
- Session Secret: process.env.SESSION_SECRET
- Cookie: httpOnly, secure, maxAge: 7 Tage
- Bcrypt für Passwort-Hashing (12 rounds)
```

### Admin-Zugang
```
Standard Admin:
- Username: admin
- Password: admin123
- Vollzugriff auf alle Admin-Funktionen
```

### Sicherheitsmaßnahmen
```
- Passwort-Hashing mit bcrypt
- Session-basierte Authentifizierung
- CORS-konfiguriert für Replit
- Input-Validierung mit Zod
- SQL-Injection-Schutz durch Drizzle ORM
```

## 6. INTERNATIONALISIERUNG (i18n)

### Sprachsystem
```javascript
Unterstützte Sprachen:
- es: Spanisch (Standard/Primär)
- de: Deutsch (Admin/Partner)
- en: Englisch (International)

Automatische Spracherkennung:
1. IP-Geolokation (/api/geolocation)
2. Browser-Sprache (navigator.language)
3. Fallback: Spanisch

Sprachspeicherung:
- localStorage: 'language'
- Manuelle Umschaltung über LanguageSwitcher
```

### Übersetzungsstruktur
```javascript
translations = {
  es: { ... },
  de: { ... },
  en: { ... }
}

Verwendung:
const { t } = useLanguage();
{t('key')} // Automatische Sprachauswahl
```

### Datenbank-Lokalisierung
```
Alle Content-Tabellen haben mehrsprachige Felder:
- nameEs, nameDe, nameEn
- descriptionEs, descriptionDe, descriptionEn
- shortDescriptionEs, shortDescriptionDe, shortDescriptionEn
```

## 7. FRONTEND-STRUKTUR

### Seitenarchitektur
```
/ - Homepage (Layout + Home)
/products - Produktübersicht (Layout + Products)
/product/:slug - Produktdetail (Layout + ProductDetail)
/about - Über uns (Layout + About)
/contact - Kontakt (Layout + Contact)

/admin/login - Admin Login (ohne Layout)
/admin - Admin Dashboard (ohne Layout)
/admin/products/new - Produkt erstellen (ohne Layout)
/admin/products/:id/edit - Produkt bearbeiten (ohne Layout)
/admin/categories/new - Kategorie erstellen (ohne Layout)
/admin/categories/:id/edit - Kategorie bearbeiten (ohne Layout)
```

### Hauptkomponenten
```
Layout.tsx - Header, Footer, Navigation
Header.tsx - Logo, Navigation, Language Switcher
Footer.tsx - Links, Kontaktinfo, Copyright
HeroSlider.tsx - Homepage Slideshow (3 Slides)
ProductCard.tsx - Produktkarte für Homepage
LanguageSwitcher.tsx - Sprachauswahl
WhatsAppButton.tsx - Floating WhatsApp Button
ImageUpload.tsx - Admin Bild-Upload-Komponente
```

### Homepage-Aufbau
```
1. HeroSlider (3 Slides mit Call-to-Action)
2. Features Section (3 Features: Qualität, Lieferung, Support)
3. Products Section (Nur "Featured" Produkte vom Admin)
4. About Section (Firmeninfo, Partner, Warehouse)
5. SEO Content Section (Solarenergie in Kuba - mehrsprachig)
6. Contact Section (3 Kontakt-Cards: Deutschland, Kuba, Email)
```

### Admin-Panel
```
AdminDashboard.tsx:
- Übersicht: Produkte, Kategorien, Anfragen
- Schnelle Aktionen: Neues Produkt, Neue Kategorie
- Aktuelle Produkte mit Status-Badges
- Letzte Kundenanfragen

AdminProductForm.tsx:
- Mehrsprachige Felder (ES/DE/EN)
- Kategorie/Unterkategorie Auswahl
- Bild-Upload Funktion
- Spezifikationen (Key-Value Pairs)
- Featured/Active Toggles
- Stock Status Auswahl

AdminCategoryForm.tsx:
- Mehrsprachige Kategorie-Erstellung
- Automatische Slug-Generierung
- Sortierung und Aktivierung
```

## 8. DESIGN & UI/UX

### Design-System
```css
Farben:
- Primary Blue: #1e40af (excalibur-blue)
- Secondary Orange: #ea580c (excalibur-orange)
- Light: #f1f5f9 (excalibur-light)
- Gray: #64748b (excalibur-gray)

Schriftart:
- Inter (Google Fonts)
- Sans-serif, clean, modern

Layout:
- Mobile-first Design
- Tailwind CSS Grid/Flexbox
- Responsive Breakpoints: sm, md, lg, xl
```

### shadcn/ui Komponenten
```
- Button, Card, Form, Input, Textarea
- Select, Switch, Badge, Tabs
- Dialog, Popover, Toast
- Accordion, Separator, Avatar
```

### Besondere Design-Elemente
```css
.card-enhanced - Enhanced Card Styling
.hover-lift - Hover Animation
.glass-morphism - Glass Effect
.gradient-text - Text Gradients
```

### Responsive Verhalten
```
Mobile (sm): Single Column, Collapsed Navigation
Tablet (md): Two Columns, Expanded Navigation
Desktop (lg+): Three Columns, Full Layout
```

## 9. SEO-OPTIMIERUNG

### Meta Tags
```html
- Unique title per page
- Meta descriptions (multilingual)
- Open Graph tags (Facebook/Twitter)
- Canonical URLs
- Robots meta tags
- Geo-targeting meta tags
```

### Structured Data (JSON-LD)
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Excalibur Cuba",
  "description": "...",
  "url": "https://excalibur-cuba.com",
  "contactPoint": { ... },
  "address": { ... }
}
```

### URL-Struktur
```
/ - Homepage
/products - Alle Produkte
/product/[slug] - Einzelprodukt (SEO-freundlich)
/about - Über uns
/contact - Kontakt
```

### Content-Optimierung
```
- Mehrsprachiger Content
- Keyword-optimierte Beschreibungen
- Alt-Tags für alle Bilder
- Semantic HTML5 Structure
- Fast Loading Times (Vite optimized)
```

## 10. PERFORMANCE & OPTIMIZATION

### Frontend-Optimierung
```
- Code Splitting (Vite)
- Lazy Loading (Images)
- Tree Shaking
- Minification
- Gzip Compression
```

### Backend-Optimierung
```
- Database Indexing (Drizzle)
- Query Optimization
- Connection Pooling
- Caching Headers
```

### Image-Handling
```
- Unsplash CDN für Demo-Bilder
- Local Upload für Admin-Bilder
- Responsive Images (srcset)
- WebP Support (modern browsers)
```

## 11. ENTWICKLUNGSRICHTLINIEN

### Code-Standards
```typescript
- TypeScript für alle Dateien
- ESLint + Prettier
- Functional Components (React)
- Custom Hooks für Logic
- Zod für Validierung
```

### File-Organisation
```
client/src/
├── components/     # Wiederverwendbare Komponenten
├── pages/         # Seitenkomponenten
├── hooks/         # Custom React Hooks
├── lib/           # Utilities (queryClient, utils)
├── data/          # Statische Daten (translations)
└── main.tsx       # Entry Point

server/
├── index.ts       # Express Server
├── routes.ts      # API Routes
├── storage.ts     # Database Layer
├── auth.ts        # Authentication
├── db.ts          # Database Connection
└── seed.ts        # Database Seeding

shared/
└── schema.ts      # Drizzle Schema + Types
```

### Naming Conventions
```
- camelCase für Variablen/Funktionen
- PascalCase für Komponenten/Types
- kebab-case für URLs/Slugs
- SCREAMING_SNAKE_CASE für Konstanten
```

## 12. KONTAKT & KOMMUNIKATION

### WhatsApp Integration
```javascript
Hauptnummer: +49 157 516 91275
Automatische Nachrichten:
- "¡Hola! Estoy interesado en [Produktname]"
- Links zu wa.me mit vorgeneriertem Text
```

### Email-Integration
```javascript
Haupt-Email: info@excalibur-cuba.com
Automatische Subjects:
- "Consulta sobre: [Produktname]"
- mailto: Links mit vorgeneriertem Content
```

### Telefon-Kontakte
```
Deutschland (Technische Beratung): +49 160 323 9439
Kuba (Administration): +53 58 78 1416
```

## 13. DEPLOYMENT & HOSTING

### Replit Configuration
```javascript
.replit:
- run = "npm run dev"
- language = "nodejs-20"

Environment Variables:
- DATABASE_URL (Neon PostgreSQL)
- SESSION_SECRET (Auto-generated)
- NODE_ENV=development

Port: 5000 (Express + Vite)
```

### Build Process
```bash
Development:
npm run dev - Startet Express + Vite HMR

Production (Replit Deployments):
npm run build - Vite Build
npm start - Express Production Server
```

### Database Setup
```bash
npm run db:push - Schema zu Database pushen
npm run db:seed - Testdaten einfügen (automatisch bei Start)
```

## 14. TESTING & VALIDATION

### Manual Testing Checklist
```
□ Homepage lädt mit korrekten Sprachen
□ Sprachswitcher funktioniert (Seite reload)
□ Admin Login (admin/admin123)
□ Produkterstellung mit allen Feldern
□ Kategorieerstellung mit Mehrsprachigkeit
□ Produktbearbeitung (Felder vorausgefüllt)
□ Featured Products auf Homepage sichtbar
□ Produktdetailseiten von Homepage erreichbar
□ WhatsApp/Email Links funktionieren
□ Responsive Design (Mobile/Desktop)
□ Database Persistence nach Restart
```

### API Testing
```bash
curl http://localhost:5000/api/categories
curl http://localhost:5000/api/products/featured
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## 15. ZUKÜNFTIGE ERWEITERUNGEN

### Mögliche Features
```
- Email Newsletter Integration
- Advanced Search/Filtering
- Product Comparison
- Customer Reviews
- Inventory Management
- Multi-Currency Support
- Payment Integration (Future)
- Blog/News Section
- Technical Documentation
```

### Technische Verbesserungen
```
- Redis Caching
- CDN Integration
- Image Optimization
- Progressive Web App (PWA)
- Server-Side Rendering (SSR)
- API Rate Limiting
- Enhanced Analytics
```

## 16. WICHTIGE GESCHÄFTSLOGIK

### Monatliche Container-Importe
```
- Reguläre Lieferungen aus Deutschland
- AFDL Import & Export als Hauptpartner
- Direktkauf von Fabriken
- Lager in Havanna del Este
- Kein Zwischenhandel
```

### Produktstrategie
```
- Komplette Solarsysteme (1KW-20KW)
- Einzelkomponenten (Panels, Inverter, Batterien)
- Backup-Generatoren (2KVA-10KVA)
- Deutsche Qualitätsstandards
- Internationale Garantien
```

### Kundenberatung
```
- Kostenlose technische Beratung
- Systemkonfiguration nach Bedarf
- Installation und Support
- 24/7 Verfügbarkeit über WhatsApp
- Mehrsprachiger Support
```

---

## INSTALLATION & SETUP

### Schritt 1: Projekt Setup
```bash
# Replit: Node.js 20 Projekt erstellen
# Package.json wird automatisch erstellt
npm install # Alle Dependencies installieren
```

### Schritt 2: Database Setup
```bash
# Neon PostgreSQL Database erstellen
# DATABASE_URL in Environment Variables setzen
npm run db:push # Schema erstellen
npm run db:seed # Testdaten laden (automatisch)
```

### Schritt 3: Development Start
```bash
npm run dev # Startet Express + Vite auf Port 5000
```

### Schritt 4: Admin Access
```
URL: /admin/login
Username: admin
Password: admin123
```

### Schritt 5: Content Management
```
1. Kategorien erstellen (mehrsprachig)
2. Produkte erstellen und als "Featured" markieren
3. Homepage validieren (Featured Products sichtbar)
4. Produktdetailseiten testen
5. Sprachswitcher testen
```

**Diese Spezifikation ist vollständig und ermöglicht eine 1:1 Reproduktion der EXCALIBUR CUBA Website.**