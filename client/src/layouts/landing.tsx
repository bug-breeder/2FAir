import { Link, Button } from "@heroui/react";
import { useNavigate } from "react-router-dom";

import { FAir } from "@/components/icons";
import { useAuth } from "@/providers/auth-provider";
import { ThemeSwitch } from "@/components/theme-switch";

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
  const { isAuthenticated, isLoading, user } = useAuth();

  const handleSignIn = () => {
    if (isAuthenticated) {
      navigate("/app");
    } else {
      navigate("/login");
    }
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/app");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen">
      {/* SEO Meta Tags */}
      <head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://2fair.app" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
      </head>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-divider bg-background/70 backdrop-blur-md">
        <div className="container mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <FAir className="text-primary" size={32} />
              <span className="text-xl font-bold">2FAir</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link 
                href="/"
                className="text-foreground hover:text-primary transition-colors"
              >
                Home
              </Link>
              <Link 
                href="/about"
                className="text-foreground hover:text-primary transition-colors"
              >
                About
              </Link>
              <Link 
                href="/pricing"
                className="text-foreground hover:text-primary transition-colors"
              >
                Pricing
              </Link>
            </div>

            {/* Right side: Theme Switcher + Auth Buttons */}
            <div className="flex items-center gap-3">
              {/* Theme Switcher */}
              <ThemeSwitch />
              
              {/* Auth Buttons */}
              {isAuthenticated ? (
                <>
                  {/* <span className="text-sm text-default-600">
                    Welcome, {user?.username}
                  </span> */}
                  <Button
                    color="primary"
                    variant="solid"
                    isLoading={isLoading}
                    onPress={() => navigate("/app")}
                  >
                    Go to App
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="light"
                    isLoading={isLoading}
                    onPress={handleSignIn}
                  >
                    Sign In
                  </Button>
                  <Button
                    color="primary"
                    variant="solid"
                    isLoading={isLoading}
                    onPress={handleGetStarted}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-divider bg-content1">
        <div className="container mx-auto max-w-7xl px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FAir className="text-primary" size={32} />
                <span className="text-xl font-bold">2FAir</span>
              </div>
              <p className="text-default-500 text-sm">
                Zero-knowledge TOTP management with WebAuthn security.
                Your secrets, encrypted client-side.
              </p>
            </div>

            {/* Product */}
            <div className="space-y-4">
              <h4 className="font-semibold">Product</h4>
              <div className="space-y-2">
                <Link href="/about" className="block text-sm text-default-600 hover:text-primary">
                  About
                </Link>
                <Link href="/pricing" className="block text-sm text-default-600 hover:text-primary">
                  Pricing
                </Link>
                <Link 
                  href={isAuthenticated ? "/app" : "/login"} 
                  className="block text-sm text-default-600 hover:text-primary"
                >
                  {isAuthenticated ? "Go to App" : "Sign In"}
                </Link>
              </div>
            </div>

            {/* Security */}
            <div className="space-y-4">
              <h4 className="font-semibold">Security</h4>
              <div className="space-y-2">
                <p className="text-sm text-default-600">WebAuthn Authentication</p>
                <p className="text-sm text-default-600">Client-Side Encryption</p>
                <p className="text-sm text-default-600">Zero-Knowledge Architecture</p>
              </div>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <div className="space-y-2">
                <Link href="/privacy" className="block text-sm text-default-600 hover:text-primary">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="block text-sm text-default-600 hover:text-primary">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-divider mt-8 pt-8 text-center text-sm text-default-500">
            <p>&copy; 2024 2FAir. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 