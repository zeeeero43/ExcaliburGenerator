# Excalibur Cuba - Solar and Generator Solutions

## Overview
Excalibur Cuba is a modern, multilingual presentation website for importing and distributing solar components and generators in Cuba. The application serves as a product showcase (without e-commerce functionality) targeting the Cuban market while supporting Spanish, German, and English languages. The business vision is to provide high-quality solar and generator solutions to illuminate Cuba for a brighter future, emphasizing energy independence and self-production. The project aims to provide an enterprise-grade platform to manage product imports, sales inquiries, and customer interactions, with a strong focus on the Cuban market and a strategic partnership with a German supplier.

## User Preferences
Preferred communication style: Simple, everyday language.
Project pricing: Final negotiated price €1500 (originally €500 scope, proposed €2000, settled at €1500)

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library, featuring a professional grey color scheme.
- **State Management**: React Query for server state, React hooks for local state
- **Build Tool**: Vite for fast development and optimized production builds
- **UI/UX Design Philosophy**: Mobile-first responsive design, fast loading optimized for low bandwidth connections, modern and clean aesthetic with smooth animations, accessibility-focused design with proper ARIA labels and semantic HTML. Product images are optimized for mobile and can be viewed in a collapsible gallery.
- **Internationalization**: Supports Spanish (primary), German, and English with automatic language detection based on IP location and browser language fallback. Real-time translation is implemented for admin input fields.
- **Image Handling**: Optimized for performance with image compression (Sharp), lazy loading, and dynamic sizing.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe schema management.
- **Session Management**: Express sessions with `connect-pg-simple`.
- **API**: RESTful API structure with Zod schema validation for all endpoints.
- **Core Features**:
    - **Product Catalog**: Management of categories, subcategories, and products without e-commerce. Includes comprehensive CRUD operations, product duplication, and sorting capabilities.
    - **Contact & Inquiry System**: Form validation, structured inquiry storage, WhatsApp and email integration.
    - **Admin Panel**: Secure login, user-friendly dashboard for product, category, subcategory, and image management. Supports dynamic image URLs and site settings.
    - **Analytics System**: Tracks unique visitors by IP and top products, with country detection and mobile device tracking, optimized for offline functionality using `geoip-lite`.
    - **Security**: Enterprise-grade security implemented with rate limiting, brute force protection, session security, MIME and magic number validation for uploads, input sanitization, security headers (Helmet), Zod schema validation, OWASP compliance, and region blocking (China & Singapore). **CRITICAL FIXES (Jan 2025)**: Cuban users have COMPLETE exemption from ALL bot protection measures. Admin login areas completely exempted from bot protection. Panama and all Latin American countries added to safe countries list. Bot blocking thresholds increased dramatically (20→50, 8→25) to prevent legitimate user blocks.

## External Dependencies

- **@neondatabase/serverless**: PostgreSQL connection for serverless environments.
- **@tanstack/react-query**: Server state management and caching.
- **@radix-ui/***: Headless UI components for accessibility.
- **drizzle-orm**: Type-safe database ORM.
- **react-hook-form**: Form handling with validation.
- **Sharp**: Image processing and optimization.
- **geoip-lite**: Local IP-to-country database for offline geolocation analytics.
- **Unsplash**: CDN for high-quality product images (used as source).
- **Google Fonts**: Web font delivery (Inter font family).
- **WhatsApp Business API**: Customer communication integration.
- **DeepL API**: Primary translation service for highest quality translations (500,000 chars/month free tier). **CRITICAL FIX**: Auto-translation useEffect loops disabled to prevent quota exhaustion - manual translation only.
- **MyMemory**: Fallback translation service for when DeepL is unavailable.
- **Dictionary**: Final fallback for basic translations when all APIs fail.
```