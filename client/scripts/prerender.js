const fs = require('fs');
const path = require('path');

// Static routes to prerender for SEO
const routes = [
  '/',
  '/about',
  '/pricing'
];

// HTML template for static pages
const generateStaticHTML = (route, title, description) => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://2fair.app${route}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="https://2fair.app/og-image.png" />
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="https://2fair.app${route}" />
    <meta property="twitter:title" content="${title}" />
    <meta property="twitter:description" content="${description}" />
    <meta property="twitter:image" content="https://2fair.app/og-image.png" />
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    
    <!-- Preload critical resources -->
    <link rel="preload" href="/assets/main.css" as="style" />
    <link rel="preload" href="/assets/main.js" as="script" />
    
    <!-- Stylesheets -->
    <link rel="stylesheet" href="/assets/main.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/main.js"></script>
    
    <!-- Schema.org markup for SEO -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "2FAir",
      "description": "Zero-knowledge TOTP management with WebAuthn security",
      "url": "https://2fair.app",
      "applicationCategory": "SecurityApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    }
    </script>
  </body>
</html>`;
};

// Route metadata
const routeMetadata = {
  '/': {
    title: '2FAir - Secure Zero-Knowledge TOTP Management',
    description: 'Manage your 2FA codes with zero-knowledge security. WebAuthn authentication, client-side encryption, and cross-device sync.'
  },
  '/about': {
    title: 'About 2FAir - Zero-Knowledge TOTP Security',
    description: 'Learn about 2FAir\'s mission to provide secure, privacy-first 2FA management with zero-knowledge encryption.'
  },
  '/pricing': {
    title: '2FAir Pricing - Secure TOTP Management Plans',
    description: 'Choose the perfect plan for your 2FA security needs. Free forever plan available with pro features for power users.'
  }
};

// Generate static files
const distDir = path.join(__dirname, '../dist');

console.log('🚀 Starting prerendering process...');

routes.forEach(route => {
  const metadata = routeMetadata[route];
  const html = generateStaticHTML(route, metadata.title, metadata.description);
  
  const filePath = route === '/' 
    ? path.join(distDir, 'index.html')
    : path.join(distDir, route.substring(1), 'index.html');
    
  // Create directory if it doesn't exist
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, html);
  console.log(`✅ Generated: ${filePath}`);
});

console.log('🎉 Prerendering complete!');

// Generate sitemap.xml
const generateSitemap = () => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${routes.map(route => `
  <url>
    <loc>https://2fair.app${route}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('')}
</urlset>`;

  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);
  console.log('✅ Generated: sitemap.xml');
};

generateSitemap();

// Generate robots.txt
const generateRobots = () => {
  const robots = `User-agent: *
Allow: /

Sitemap: https://2fair.app/sitemap.xml`;

  fs.writeFileSync(path.join(distDir, 'robots.txt'), robots);
  console.log('✅ Generated: robots.txt');
};

generateRobots(); 