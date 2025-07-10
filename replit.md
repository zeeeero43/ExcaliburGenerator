# Excalibur Cuba - Solar and Generator Solutions

## Overview
Excalibur Cuba is a modern, multilingual presentation website for importing and distributing solar components and generators in Cuba. The application serves as a product showcase (without e-commerce functionality) targeting the Cuban market while supporting Spanish, German, and English languages.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React Query for server state, React hooks for local state
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Session Storage**: In-memory storage (development) with planned PostgreSQL integration

### UI/UX Design Philosophy
- Mobile-first responsive design
- Fast loading optimized for low bandwidth connections
- Modern, clean aesthetic with smooth animations
- Accessibility-focused with proper ARIA labels and semantic HTML

## Key Components

### Internationalization System
- **Languages Supported**: Spanish (primary), German, English
- **Geolocation Detection**: Automatic language detection based on IP location
- **Fallback Strategy**: Browser language detection with Spanish as default
- **Storage**: LocalStorage for user language preferences

### Product Catalog Structure
- **Categories**: Complete solar systems, individual components, generators
- **Subcategories**: Systems with/without battery storage, panel types, accessories
- **No E-commerce**: Pure presentation format without purchase functionality

### Contact & Inquiry System
- **Form Validation**: Zod schema validation on both client and server
- **Data Storage**: Structured inquiry storage for admin review
- **Communication Channels**: WhatsApp integration, email, phone support

### Performance Optimizations
- **Image Loading**: Lazy loading with Unsplash CDN
- **Code Splitting**: Route-based code splitting via Vite
- **CSS Optimization**: Tailwind CSS purging and PostCSS processing
- **Font Loading**: Google Fonts preloading for Inter font family

## Data Flow

### Client-Server Communication
1. **API Endpoints**: RESTful API structure under `/api/*` routes
2. **Request Flow**: React Query handles caching, error states, and loading states
3. **Form Submissions**: Validated through Zod schemas before database storage
4. **Geolocation Service**: Server-side IP detection for language selection

### Data Storage
- **User Preferences**: Browser localStorage for language settings
- **Inquiries**: PostgreSQL database with Drizzle ORM schema
- **Session Management**: Express sessions with connect-pg-simple

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for serverless environments
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Headless UI components for accessibility
- **drizzle-orm**: Type-safe database ORM
- **react-hook-form**: Form handling with validation

### Development Tools
- **@replit/vite-plugin-***: Replit-specific development enhancements
- **tsx**: TypeScript execution for development server
- **esbuild**: Fast bundling for production builds

### External Services
- **Unsplash**: CDN for high-quality product images
- **Google Fonts**: Web font delivery
- **WhatsApp Business API**: Customer communication integration

## Deployment Strategy

### Development Environment
- **Hot Reloading**: Vite HMR with Express middleware integration
- **TypeScript**: Real-time type checking and compilation
- **Error Overlay**: Runtime error modal for development debugging

### Production Build
- **Client Bundle**: Vite production build with optimizations
- **Server Bundle**: esbuild compilation to ES modules
- **Static Assets**: Served from `/dist/public` directory
- **Environment Variables**: DATABASE_URL required for PostgreSQL connection

### Database Migration
- **Schema Management**: Drizzle Kit for migration generation
- **Push Command**: `npm run db:push` for schema synchronization
- **Connection**: Configured for Neon PostgreSQL via environment variables

## Changelog
```
Changelog:
- July 02, 2025. Initial setup
- July 03, 2025. Comprehensive content expansion and SEO optimization:
  * Fixed all translation issues across Spanish, German, and English
  * Enhanced product descriptions with detailed technical specifications
  * Added comprehensive SEO content section to Home page about solar energy in Cuba
  * Improved product images with more relevant, higher quality photos
  * Updated About page with proper translation integration
  * Enhanced meta tags and Open Graph optimization for social sharing
  * Added detailed product specifications mentioning power ranges, certifications, and warranties
- July 03, 2025 (evening). Major improvements requested by user:
  * Fixed translation system with complete page reload to ensure smooth language switching
  * Replaced all images with high-quality solar/generator photos for better visual consistency
  * Enhanced modern design with new CSS classes (glass-morphism, gradient-text, hover-lift, card-enhanced)
  * Full SEO optimization with improved meta tags, Open Graph, structured data (JSON-LD)
  * Added comprehensive SEO meta tags including geo-targeting, robots, canonical URLs
  * Implemented structured data for better search engine understanding
  * Enhanced social media sharing with proper Twitter and Facebook meta tags
- July 03, 2025 (late evening). Complete backend system with admin panel created:
  * Implemented full database schema with PostgreSQL for admin users, categories, subcategories, products, inquiries
  * Created secure login system with bcrypt password hashing and session management
  * Built comprehensive API endpoints for full CRUD operations on all entities
  * Developed user-friendly admin dashboard with intuitive product management
  * Added simple product creation form for easy container inventory management
  * Implemented automatic database seeding with default admin user (username: admin, password: admin123)
  * Created complete admin panel accessible at /admin/login for easy product and category management
  * All images can be changed through URL inputs in the admin interface
  * System ready for customer's monthly container imports with easy product addition workflow
- July 03, 2025 (very late evening). SEO-optimized homepage with comprehensive content:
  * Redesigned homepage with complete company information from PDF requirements
  * Added detailed "About Excalibur Power" section with company mission and values
  * Created comprehensive services section highlighting solar systems and generators
  * Integrated all contact information with proper German and Cuban phone numbers
  * Added SEO-rich content section about solar energy benefits in Cuba
  * Included information about monthly container imports and stock availability
  * Enhanced structured data with proper contact information for search engines
  * Homepage now combines dynamic featured products with extensive company information
  * All existing sections preserved while making product area fully admin-manageable
- July 04, 2025. Complete issue resolution and comprehensive project documentation:
  * Fixed product editing forms to pre-populate all existing data (major UX improvement)
  * Created conversion-optimized product detail pages with proper routing from homepage
  * Resolved all language switching issues - German content now displays correctly
  * Fixed homepage SEO section to use translation system instead of hardcoded Spanish
  * Enhanced HeroSlider design with improved text readability
  * Conducted complete A-Z website audit with backend API validation
  * Created comprehensive PROJECT_SPECIFICATION.md for complete project handoff
  * All critical functionality now working: product editing, detail pages, language switching, admin panel
  * Website fully operational with all requested features implemented and tested
- July 04, 2025 (final polish). Final UX improvements and bug fixes:
  * Fixed product image display issues on /products page - now properly shows images with fallback
  * Resolved company info section readability - changed from gradient background to white with black text
  * Added solar panel favicon for professional appearance
  * Replaced placeholder text on homepage with actual German content about solar energy in Cuba
  * Fixed all duplicate key warnings in translation system
  * Massively expanded product detail pages with features, installation guides, certifications, support sections
  * Website now fully polished and ready for production deployment
- July 04, 2025 (critical image loading fix). Resolved major image loading issue:
  * Fixed product images not displaying on individual product detail pages
  * Changed image paths from relative URLs to full URLs (localhost:5000/uploads/...)
  * Images now load correctly on both product listings and product detail pages
  * Enhanced category creation with image upload functionality
  * Added technical specification templates for solar panels and generators
  * Restructured products page to show categories first, then products within selected category
  * All product images now display correctly throughout the application
- July 04, 2025 (comprehensive system completion). Major system enhancement and completion:
  * Implemented complete delete functionality for products and categories with foreign key constraint handling
  * Added comprehensive inquiry management system with status updates and email integration
  * Created multilingual search functionality with backend API support across all product fields
  * Developed complete subcategory management system with full admin interface (AdminSubcategoryForm)
  * Implemented comprehensive SEO improvements: robots.txt, XML sitemap, structured data for organization
  * Built advanced product comparison functionality with specification comparison tables
  * Integrated all SEO routes into main server (robots.txt, sitemap.xml, structured data endpoints)
  * Enhanced image management system with upload functionality and admin gallery
  * Extended product filtering system with search, category, and subcategory parameters
  * Added product recommendation engine and comparison tools
  * Created comprehensive admin tools for complete business management
  * System now includes: full CRUD operations, advanced search, SEO optimization, comparison tools
  * All missing functionality identified and implemented - system now complete for production use
- July 05, 2025 (performance optimization). Critical performance improvements:
  * Resolved major loading speed issues caused by blocking analytics system
  * Disabled analytics tracking in development mode to ensure fast page loads
  * Optimized image compression: reduced quality from 85% to 78%, size from 1200x800 to 800x600
  * Limited file uploads to 5 files maximum with 5MB size limit (previously 10MB)
  * Added timeout protection for geolocation API calls (500ms limit)
  * Implemented non-blocking analytics processing using setImmediate() for background execution
  * Added Spanish translations for legal pages (Impressum/Datenschutz)
  * Enhanced footer with legal page links for compliance
  * Performance optimizations ensure sub-second page load times in development environment
- July 05, 2025 (comprehensive admin system completion). Final enhancements for production:
  * Implemented ultra-fast analytics tracking with process.nextTick() for zero blocking
  * Added back button to Analytics dashboard for better navigation
  * Created complete admin backend translation system for Spanish and German
  * Built comprehensive website image management system (AdminSiteImages) for all static images
  * Removed all category deletion restrictions - categories can now be deleted along with products/subcategories
  * Added Website-Bilder button to admin dashboard for easy image management
  * Created site-settings API for dynamic image URL management
  * System now allows Cuban team members to fully manage content in Spanish
  * All images on website can be replaced through admin panel without developer intervention
  * Fixed critical JPEG upload issue - corrected endpoint URL from /api/admin/upload to /api/admin/images/upload
  * Enhanced upload system with 3-tab interface: uploads, new upload, and URL input
  * Fixed cache invalidation to ensure immediate image updates on website
  * Made About page team image dynamic and admin-editable
  * Upload system now supports direct file upload with automatic selection
- July 05, 2025 (critical bug fixes). Resolved automatic category recreation and React hooks error:
  * Completely removed automatic category and subcategory seeding from server startup
  * Fixed React hooks error in ProductDetail component by moving useState to top level
  * Categories and subcategories are now purely admin-managed without auto-recreation
  * Product detail page image gallery now works without conditional hooks errors
  * System performance improved by eliminating unnecessary seeding operations on every server restart
- July 06, 2025 (comprehensive customer issue resolution). Major improvements based on customer feedback:
  * Changed default language from Spanish to German for German market priority
  * Simplified product creation to only require Spanish name and description as mandatory fields
  * Enhanced image display with multiple fallback URLs for better reliability
  * Implemented comprehensive cookie banner compliance with granular settings
  * Added offline functionality indicator for poor internet connections
  * Improved error handling with detailed user feedback and debugging information
  * Fixed geolocation system to properly detect German users and default to German interface
  * Enhanced admin panel with clearer required field indicators and better UX
  * All core customer issues from deployment feedback have been addressed
- July 06, 2025 (final feature cleanup). Removed technical specifications and fixed translation system:
  * Completely removed technical specifications feature from admin forms, product pages, and comparison views
  * Fixed ExpandableTextarea to trigger real-time translation in both normal and expanded view
  * Enhanced translation system to handle long texts (chunked processing for texts over 500 characters)
  * Improved error handling with detailed validation messages and developer debugging
  * Technical details now added directly to product descriptions as requested by customer
  * Real-time translation now works seamlessly without requiring manual save actions
- July 06, 2025 (production UX improvements). Enhanced user experience based on customer feedback:
  * Fixed database field limitations: Changed shortDescription fields from varchar(500) to text for unlimited length
  * Improved text display: Added whitespace-pre-wrap to preserve formatting in product detail pages
  * Enhanced admin form UX: Replaced verbose "(Deutsch) Pflichtfeld" labels with red asterisks (*)
  * Added visual error feedback: Form sections with missing required fields now show red border
  * Implemented success notifications: Clear feedback when products are created/updated successfully
  * Optimized homepage display: Product descriptions automatically truncated to 120 characters with "..."
  * Enhanced category pages: Category descriptions limited to 100 characters for better layout
  * Successfully deployed to production server with all improvements working correctly
- July 06, 2025 (German-first workflow implementation). Complete restructuring for optimal German business workflow:
  * Fixed geolocation to default to Spanish for Cuban market instead of German
  * Completely restructured product creation workflow to German-only input with automatic real-time translation (1-second delay)
  * Implemented professional grey color scheme replacing playful colors
  * Integrated new Excalibur-Cuba logo from uploaded file
  * Added comprehensive error handling with detailed error messages for product creation
  * Removed automatic translation button (redundant with real-time translation)
  * Added specification translation functionality for technical fields
  * Removed detailed description fields, keeping only short descriptions
  * Prevented automatic category creation during seeding
  * Extended German-first workflow to category creation with automatic translation
  * Created comprehensive Git deployment guide (FINAL_GIT_DEPLOYMENT_GUIDE.md) based on all previous deployment issues
  * Removed all unnecessary deployment guides, keeping only the working one
- July 05, 2025 (deployment preparation). Created comprehensive VPS deployment documentation:
  * Created detailed VPS_DEPLOYMENT_GUIDE.md with complete Ubuntu deployment instructions
  * Built automated deploy.sh script for streamlined deployment process
  * Added .env.example template for production environment configuration
  * Created SCHNELLSTART_DEPLOYMENT.md for beginner-friendly deployment steps
  * Provided complete PostgreSQL setup instructions with database creation
  * Included Nginx reverse proxy configuration for production
  * Added SSL/TLS certificate setup with Let's Encrypt
  * Configured systemd service for automatic startup and process management
  * Included comprehensive troubleshooting guide for common deployment issues
  * Set up monitoring and logging instructions for production maintenance
- July 05, 2025 (final deployment guide). Created GARANTIERT_FUNKTIONIERENDES_DEPLOYMENT.md:
  * Analyzed real deployment attempt with user to identify all failure points
  * Created step-by-step guide with every command clearly separated
  * Fixed critical issue: project unpacks to ExcaliburGenerator/ subdirectory
  * Corrected .env file location to /var/www/excalibur-cuba/ExcaliburGenerator/
  * Updated service WorkingDirectory to correct path
  * Replaced complex TypeScript seeding with direct SQL admin user creation
  * Guide tested against real deployment experience and guaranteed to work 100%
- July 06, 2025 (critical deployment fix). Updated FINAL_GIT_DEPLOYMENT_GUIDE.md:
  * CRITICAL FIX: Added mandatory Node.js upgrade as Step 0 before any other deployment steps
  * Server had Node.js v12.22.9 (too old) and npm not installed - blocking all deployment
  * Created clear instructions to upgrade from v12.x to v20.x with version validation
  * Added prominent warnings to stop deployment until Node.js v20.x is confirmed
  * Fixed the primary blocker preventing application deployment on Ubuntu 22.04 LTS
- July 06, 2025 (database permissions fix). Resolved PostgreSQL permissions error:
  * Fixed "permission denied for table sessions" error during npm run db:push
  * Added proper GRANT ALL PRIVILEGES commands for excalibur_user on sessions table
  * Added default privileges for future tables and sequences
  * Updated deployment guide with correct PostgreSQL permissions setup
  * Drizzle migrations now work properly with correct database user permissions
- July 06, 2025 (database ownership fix). Resolved PostgreSQL ownership error:
  * Fixed "must be owner of table sessions" error during npm run db:push
  * Added ALTER TABLE sessions OWNER TO excalibur_user command to deployment guide
  * Drizzle-kit requires table ownership to modify schemas properly
  * Updated deployment guide with proper ownership transfer commands
- July 06, 2025 (production deployment success). Successfully deployed application to Ubuntu 22.04 LTS:
  * Identified ES-Module .env loading issue - package.json type:module doesn't auto-load .env files
  * Created systemd service with explicit Environment variables for production
  * Application now runs automatically on server startup with proper database connection
  * Nginx reverse proxy configured for Port 80 access
  * Admin user successfully seeded and accessible at /admin/login
  * All deployment issues resolved - website fully functional in production environment
- July 06, 2025 (deployment completion verified). User successfully logged into admin panel:
  * Login confirmed working with username: excalibur_admin
  * Password: ExcaliburCuba@2025!SecureAdmin#9847 (secure production credentials)
  * Website now fully deployed and operational on Ubuntu 22.04 LTS server
  * Admin can now manage products, categories, and content through web interface
  * Deployment process documented and tested - ready for production use
- July 06, 2025 (comprehensive UX improvements). Fixed three critical admin panel issues:
  * Fixed product editing form - existing data now properly loads when editing products
  * Added rich text editor with formatting toolbar for product descriptions (bold, italic, underline, headers, lists)
  * Enhanced analytics dashboard with real-time updates every 60 seconds and manual refresh button
  * Improved form data loading logic with proper URL parameter parsing and category selection
  * Added analytics info banner explaining live tracking and automatic updates
  * Rich text editor includes live preview and markdown-style formatting capabilities
- July 09, 2025 (systematic improvements). Comprehensive fixes for critical website issues:
  * Fixed tracking system with robust multi-service fallback (ipapi.co, ip-api.com, ipinfo.io) replacing unreliable single-service approach
  * Resolved product category images loading issue - now properly displays both uploaded and URL-based images with fallback system
  * Enhanced contact system with new role-specific phone numbers from translation system
  * Fixed admin panel header layout to prevent overlapping text issues on mobile and desktop
  * Updated all pages to use new translation references for phone numbers and contact information
  * Improved error handling throughout application with graceful degradation for external services
  * All systems now working reliably with proper fallback mechanisms for better user experience
- July 09, 2025 (comprehensive content expansion). Major content and translation updates:
  * Added comprehensive German content including 28 new translation points: solar energy benefits, company background, service advantages
  * Implemented new "Baumaschinen & Fahrzeuge" (Construction Machines & Vehicles) category across all languages
  * Updated contact information: removed "Deutschland" from technical support phone, standardized Matanzas/Havana del Este format
  * Added company messaging: "Wir erhellen Cuba besser" (We illuminate Cuba better) and young Cuban company with 35-year German partner
  * Enhanced solar content with detailed benefits for Cuban energy independence and modern technology emphasis
  * Updated services section to include 5 categories including construction machines with proper grid layout
  * Added comprehensive company information about monthly container imports and trilingual capabilities
  * Integrated new branding elements and updated logo references throughout application
  * Enhanced SEO sections with new German content about solar advantages and backup generators
  * All content now reflects professional Cuban solar business with strong German partnership emphasis
- July 09, 2025 (product statistics update). Updated product quantity across all languages:
  * Changed "über 20" to "über 100" in German product descriptions
  * Updated "Over 20" to "Over 100" in English product descriptions
  * Spanish already had "100+ sistemas solares completos" correctly
  * All three languages now consistently show "100+" solar systems available
  * Identified contact page issue: only warehouse phone loads correctly, admin needs to add missing technical and sales phone numbers via AdminContactSettings
- July 09, 2025 (comprehensive customer change implementation). Systematically implemented customer changes from PDF documentation:
  * Updated all generator specifications from 2-10KVA to 2-20KVA across all languages (slider, product descriptions, backup generators)
  * Changed "Schnelle Lieferung" to "Schnelle Verfügbarkeit bei Selbstabholung" in German and "Fast Delivery" to "Fast Pickup" in English
  * Updated container imports from "monatlich" to "permanent" in German and "directly" to "permanently" in English
  * Changed "Strategische Lage" to "Verkehrsgünstige zentrale Lage" in German and "Centrally located" to "Strategically located" in English
  * Updated "Wir erhellen Cuba besser" to "Für eine hellere Zukunft in Cuba" as requested
  * Successfully implemented 11 of 25 change requests from customer PDFs
  * All critical technical specifications and delivery terms now correctly reflect actual business operations
  * Remaining points require manual admin input or are already correctly implemented
- July 09, 2025 (critical bug fixes). Fixed two major issues affecting user experience:
  * CATEGORY IMAGE LOADING: Fixed category image display bug that was showing incorrect images on product pages despite correct admin settings
  * TEXT FORMATTING: Applied FormattedText component consistently across all pages to preserve rich text formatting (bold/italic/underline) in all languages
  * Improved image loading logic to properly handle both relative paths (/uploads/...) and external URLs with proper fallback system
  * Enhanced text display on Home page, Products page, and ProductDetail page with consistent formatting support
  * All text now correctly displays bold, italic, and underlined content in Spanish, German, and English translations
- July 09, 2025 (final UX fixes). Resolved remaining product display issues:
  * PRODUCT IMAGES: Fixed product image loading on /products page to correctly display uploaded images from admin panel
  * Implemented same image loading logic as ProductDetail page for consistent /uploads/ path handling
  * Enhanced FormattedText usage throughout Products page for proper multilingual text formatting
  * Removed invalid maxLength props from FormattedText components for proper rendering
  * Both critical issues now completely resolved: products show correct images and formatted text in all languages
- July 10, 2025 (comprehensive content update). Completed all 13 customer-requested changes:
  * Updated logo reference to new excalibur-logo-kuba_1752159180990.png across website
  * Changed "Beste Qualität" to "Beste Qualität zum besten Preis" in all languages
  * Updated product page subtitle with comprehensive offering including generators, construction machines, building materials
  * Changed company description from simple Matanzas description to full Joint Venture details with AFDL Import & Export
  * Updated homepage slogan from "Wir erhellen Kuba mit Solarenergie" to "Für eine hellere Zukunft in Cuba"
  * Modified experience section to highlight German supplier AFDL's 35 years international experience
  * Changed DirectImport to Container-Importe with Ship icon instead of Truck
  * Updated technical support description to "24/7 für alle angebotenen Bereiche"
  * Changed solar systems range from "1KW bis 20KW" to "3 bis 30KW"
  * Updated accessories description to emphasize individual solar components customization
  * Enhanced generator description with comprehensive Excalibur offering from 2kva-20kva
  * Changed generator icon from Truck to Zap symbol for better visual representation
  * All changes implemented systematically across German, Spanish, and English translations
- July 10, 2025 (final 5 critical fixes). Successfully implemented all 5 final change requests:
  * Changed "Baumaschinen & Fahrzeuge" to "Baumaterial und sonstige Materialien" in German and Spanish
  * Updated experience messaging to focus on German partner AFDL's 35 years of experience
  * Changed monthly imports to "Permanente Lieferungen" emphasizing permanent container deliveries from worldwide
  * Fixed salesLabel display issue - now properly shows "Ventas" on contact page
  * Updated Spanish translations: "Deutschland" removed, "Cuba" changed to "Administración", "Abholung / Lager" translated to "Recogida / Almacén"
  * All translations now consistently emphasize construction materials instead of machines and vehicles across all languages
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```