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
  title = "2FAir - Secure 2FA Made Simple",
  description = "The most secure and user-friendly 2FA vault. End-to-end encrypted, works everywhere, no passwords needed.",
}: LandingLayoutProps) {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user: _user } = useAuth();

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
        <meta content={description} name="description" />
        <meta content={title} property="og:title" />
        <meta content={description} property="og:description" />
        <meta content="website" property="og:type" />
        <meta content="https://2fair.app" property="og:url" />
        <meta content="summary_large_image" name="twitter:card" />
        <meta content={title} name="twitter:title" />
        <meta content={description} name="twitter:description" />
      </head>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-divider bg-background/70 backdrop-blur-md">
        <div className="container mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link className="flex items-center gap-2" href="/">
              <FAir className="text-primary" size={32} />
              <span className="text-xl font-bold">2FAir</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                className="text-foreground hover:text-primary transition-colors"
                href="/"
              >
                Home
              </Link>
              <Link
                className="text-foreground hover:text-primary transition-colors"
                href="/about"
              >
                About
              </Link>
              <Link
                className="text-foreground hover:text-primary transition-colors"
                href="/pricing"
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
                    Welcome, {_user?.username}
                  </span> */}
                  <Button
                    color="primary"
                    isLoading={isLoading}
                    variant="solid"
                    onPress={() => navigate("/app")}
                  >
                    Go to App
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    isLoading={isLoading}
                    variant="light"
                    onPress={handleSignIn}
                  >
                    Sign In
                  </Button>
                  <Button
                    color="primary"
                    isLoading={isLoading}
                    variant="solid"
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
      <main className="flex-grow">{children}</main>

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
                Zero-knowledge TOTP management with WebAuthn security. Your
                secrets, encrypted client-side.
              </p>
            </div>

            {/* Product */}
            <div className="space-y-4">
              <h4 className="font-semibold">Product</h4>
              <div className="space-y-2">
                <Link
                  className="block text-sm text-default-600 hover:text-primary"
                  href="/about"
                >
                  About
                </Link>
                <Link
                  className="block text-sm text-default-600 hover:text-primary"
                  href="/pricing"
                >
                  Pricing
                </Link>
                <Link
                  className="block text-sm text-default-600 hover:text-primary"
                  href={isAuthenticated ? "/app" : "/login"}
                >
                  {isAuthenticated ? "Go to App" : "Sign In"}
                </Link>
              </div>
            </div>

            {/* Security */}
            <div className="space-y-4">
              <h4 className="font-semibold">Security</h4>
              <div className="space-y-2">
                <p className="text-sm text-default-600">
                  WebAuthn Authentication
                </p>
                <p className="text-sm text-default-600">
                  Client-Side Encryption
                </p>
                <p className="text-sm text-default-600">
                  Zero-Knowledge Architecture
                </p>
              </div>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <div className="space-y-2">
                <Link
                  className="block text-sm text-default-600 hover:text-primary"
                  href="/privacy"
                >
                  Privacy Policy
                </Link>
                <Link
                  className="block text-sm text-default-600 hover:text-primary"
                  href="/terms"
                >
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
