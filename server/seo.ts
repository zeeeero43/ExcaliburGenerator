import type { Express } from "express";
import { storage } from "./storage";

export function setupSEO(app: Express) {
  // Robots.txt
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(`
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://${req.get('host')}/sitemap.xml
    `.trim());
  });

  // XML Sitemap
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const baseUrl = `https://${req.get('host')}`;
      
      // Get all active categories and products
      const categories = await storage.getCategories();
      const products = await storage.getProducts({ isActive: true });
      
      const urls = [
        // Static pages
        { loc: baseUrl, priority: '1.0', changefreq: 'daily' },
        { loc: `${baseUrl}/products`, priority: '0.9', changefreq: 'weekly' },
        { loc: `${baseUrl}/cuba-energia-solar`, priority: '0.95', changefreq: 'weekly' },
        { loc: `${baseUrl}/about`, priority: '0.8', changefreq: 'monthly' },
        { loc: `${baseUrl}/contact`, priority: '0.8', changefreq: 'monthly' },
        
        // Category pages
        ...categories
          .filter(cat => cat.isActive)
          .map(category => ({
            loc: `${baseUrl}/products?category=${category.slug}`,
            priority: '0.7',
            changefreq: 'weekly'
          })),
        
        // Product pages
        ...products.map(product => ({
          loc: `${baseUrl}/products/${product.slug}`,
          priority: '0.6',
          changefreq: 'weekly',
          lastmod: product.updatedAt ? new Date(product.updatedAt).toISOString().split('T')[0] : undefined
        }))
      ];

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <priority>${url.priority}</priority>
    <changefreq>${url.changefreq}</changefreq>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;

      res.type('application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Structured Data for Organization
  app.get('/api/structured-data/organization', (req, res) => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Excalibur Cuba",
      "description": "Importador y distribuidor oficial de componentes solares y generadores en Cuba",
      "url": `https://${req.get('host')}`,
      "logo": `https://${req.get('host')}/logo.png`,
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "telephone": "+53-58781416",
          "contactType": "customer service",
          "areaServed": "CU"
        },
        {
          "@type": "ContactPoint", 
          "telephone": "+49-157-53417178",
          "contactType": "international sales",
          "areaServed": "DE"
        }
      ],
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Havanna del Este",
        "addressLocality": "Havanna",
        "addressCountry": "CU"
      },
      "sameAs": [
        "https://wa.me/5358781416",
        "mailto:info@excalibur-cuba.com"
      ],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Solar Components and Generators",
        "itemListElement": [
          {
            "@type": "OfferCatalog",
            "name": "Solar Systems",
            "description": "Complete solar systems 1KW-20KW"
          },
          {
            "@type": "OfferCatalog", 
            "name": "Solar Panels",
            "description": "Monocrystalline and polycrystalline panels 300W-550W"
          },
          {
            "@type": "OfferCatalog",
            "name": "Generators",
            "description": "Silent diesel and gas generators 2KVA-10KVA"
          }
        ]
      }
    };
    
    res.json(structuredData);
  });
}