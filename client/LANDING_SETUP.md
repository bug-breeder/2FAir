# 2FAir Landing Page Setup Guide

This guide will help you implement a static landing page with SEO optimization while keeping your main app as CSR.

## Architecture Overview

```
Domain: 2fair.app
├── / (Landing Page - SSG)
├── /about (About Page - SSG)  
├── /pricing (Pricing Page - SSG)
├── /login (Login Page - CSR)
└── /app (Main App - CSR, Protected)
```

## Implementation Steps

### 1. Create Landing Layout

Create `src/layouts/landing.tsx` with the landing-specific navigation and SEO structure:

```tsx
import { Link, Button } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { FAir } from "@/components/icons";

interface LandingLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function LandingLayout({ 
  children, 
  title = "2FAir - Secure TOTP Management",
  description = "Zero-knowledge TOTP management with WebAuthn security"
}: LandingLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="relative flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-divider bg-background/70 backdrop-blur-md">
        <div className="container mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <FAir className="text-primary" size={32} />
              <span className="text-xl font-bold">2FAir</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link href="/">Home</Link>
              <Link href="/about">About</Link>
              <Link href="/pricing">Pricing</Link>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="light" onPress={() => navigate("/login")}>
                Sign In
              </Button>
              <Button color="primary" onPress={() => navigate("/login")}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">{children}</main>
      
      {/* Footer */}
      <footer className="border-t border-divider bg-content1">
        {/* Footer content */}
      </footer>
    </div>
  );
}
```

### 2. Update Routing Structure

Update `src/App.tsx`:

```tsx
import { Route, Routes } from "react-router-dom";

import LandingPage from "./pages/landing.tsx";
import AboutPage from "./pages/about.tsx";
import PricingPage from "./pages/pricing.tsx";
import LoginPage from "./pages/login.tsx";
import HomePage from "./pages/home.tsx";
import ProtectedRoute from "./components/protected-route.tsx";

function App() {
  return (
    <Routes>
      {/* Public Landing Pages */}
      <Route element={<LandingPage />} path="/" />
      <Route element={<AboutPage />} path="/about" />
      <Route element={<PricingPage />} path="/pricing" />
      <Route element={<LoginPage />} path="/login" />
      
      {/* Protected App Routes */}
      <Route
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
        path="/app"
      />
    </Routes>
  );
}

export default App;
```

### 3. Create Landing Pages

#### Landing Page (`src/pages/landing.tsx`)
```tsx
import { Button, Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import LandingLayout from "@/layouts/landing";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <LandingLayout 
      title="2FAir - Secure Zero-Knowledge TOTP Management"
      description="Manage your 2FA codes with zero-knowledge security. WebAuthn authentication, client-side encryption, and cross-device sync."
    >
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary-50 to-background py-20 sm:py-32">
        <div className="container mx-auto max-w-7xl px-6 text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-foreground mb-6">
            Secure Your <span className="text-primary">2FA Codes</span>
            <br />
            with Zero-Knowledge Encryption
          </h1>
          
          <p className="text-xl text-default-600 mb-8 max-w-3xl mx-auto">
            2FAir provides military-grade security for your TOTP codes using WebAuthn 
            authentication and client-side encryption.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              color="primary"
              size="lg"
              onPress={() => navigate("/login")}
            >
              Get Started Free
            </Button>
            <Button
              variant="bordered"
              size="lg"
              onPress={() => navigate("/about")}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features, How It Works, etc. */}
    </LandingLayout>
  );
}
```

### 4. Update Protected Route Redirect

Update `src/components/protected-route.tsx` to redirect to `/app` instead of `/`:

```tsx
// In the redirect logic, change from:
navigate("/login");

// To:
navigate("/login", { state: { from: "/app" } });
```

### 5. Update Login Page Redirect

Update `src/pages/login.tsx` to redirect to `/app` after successful login:

```tsx
// In the login success handler, change:
const redirectUrl = sessionStorage.getItem("redirectAfterLogin") || "/";

// To:
const redirectUrl = sessionStorage.getItem("redirectAfterLogin") || "/app";
```

### 6. Configure Build for Static Generation

Update `package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:ssg": "yarn build && yarn prerender",
    "prerender": "node scripts/prerender.js",
    "preview": "vite preview"
  }
}
```

### 7. SEO Configuration

Create `public/robots.txt`:
```
User-agent: *
Allow: /

Sitemap: https://2fair.app/sitemap.xml
```

Create `public/sitemap.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://2fair.app/</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://2fair.app/about</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://2fair.app/pricing</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

## Deployment Strategy

### Option 1: Single Deployment (Recommended)
Deploy everything as one app but with different rendering strategies:
- Landing pages (`/`, `/about`, `/pricing`) - Pre-rendered at build time
- Auth pages (`/login`) - Client-side rendered
- App pages (`/app`) - Client-side rendered with protection

### Option 2: Split Deployment
- **Landing site**: Deploy static files to CDN (Vercel, Netlify, CloudFlare Pages)
- **App**: Deploy SPA to the same domain under `/app`

## Build Commands

```bash
# Development
yarn dev

# Build for production with static generation
yarn build:ssg

# Preview built site
yarn preview
```

## Benefits of This Architecture

1. **SEO Optimized**: Landing pages are pre-rendered with proper meta tags
2. **Fast Loading**: Static pages load instantly
3. **Secure**: Main app remains client-side with zero-knowledge encryption
4. **Scalable**: Easy to add more landing pages
5. **Cost Effective**: Landing pages can be served from CDN

## Next Steps

1. Implement the landing layout and pages
2. Update routing structure
3. Configure build process
4. Add analytics (Google Analytics, Plausible, etc.)
5. Set up monitoring and performance tracking
6. Configure proper caching headers
7. Add structured data for rich snippets

This architecture gives you the best of both worlds: SEO-friendly landing pages and a secure, private main application. 