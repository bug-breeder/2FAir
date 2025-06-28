import { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Divider,
} from "@heroui/react";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { SiWebauthn } from "react-icons/si";

interface OAuthProvider {
  name: string;
  provider: string;
  description: string;
  login_url: string;
}

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available OAuth providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch("/api/v1/auth/providers");

        if (!response.ok) {
          throw new Error("Failed to fetch OAuth providers");
        }
        const data = await response.json();

        setProviders(data.providers || []);
      } catch (err) {
        console.error("Failed to fetch providers:", err);
        setError("Failed to load authentication providers");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProviders();
  }, []);

  // Handle OAuth callback when returning from provider
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const error = urlParams.get("error");

    if (token) {
      // Store token and redirect to main app
      localStorage.setItem("authToken", token);
      onLoginSuccess(token);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      setError(`Authentication failed: ${error}`);
      setIsLoggingIn(false);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [onLoginSuccess]);

  const handleOAuthLogin = (provider: OAuthProvider) => {
    setIsLoggingIn(true);
    setError(null);

    // Redirect to OAuth provider
    window.location.href = provider.login_url;
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "google":
        return <FaGoogle className="w-5 h-5" />;
      case "github":
        return <FaGithub className="w-5 h-5" />;
      default:
        return <SiWebauthn className="w-5 h-5" />;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "google":
        return "bg-red-500 hover:bg-red-600 text-white";
      case "github":
        return "bg-gray-800 hover:bg-gray-900 text-white";
      default:
        return "bg-blue-500 hover:bg-blue-600 text-white";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="w-full">
            <h1 className="text-3xl font-bold text-primary mb-2">2FAir</h1>
            <p className="text-default-500">Secure E2E Encrypted TOTP Vault</p>
          </div>
        </CardHeader>

        <CardBody className="gap-4">
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold mb-2">Welcome Back</h2>
            <p className="text-sm text-default-500">
              Sign in to access your encrypted TOTP vault
            </p>
          </div>

          {error && (
            <div className="p-3 bg-danger-50 border border-danger-200 rounded-md">
              <p className="text-sm text-danger-600">{error}</p>
            </div>
          )}

          {/* OAuth Providers */}
          <div className="space-y-3">
            {providers.map((provider) => (
              <Button
                key={provider.provider}
                className={`w-full h-12 ${getProviderColor(provider.provider)}`}
                isDisabled={isLoggingIn}
                startContent={getProviderIcon(provider.provider)}
                onPress={() => handleOAuthLogin(provider)}
              >
                {isLoggingIn ? "Redirecting..." : provider.description}
              </Button>
            ))}
          </div>

          <Divider className="my-4" />

          {/* Future: Linking Codes */}
          <div className="text-center">
            <p className="text-sm text-default-500 mb-2">
              Already have an account on another device?
            </p>
            <Button
              className="text-default-400"
              isDisabled={true}
              size="sm"
              variant="ghost"
            >
              Link Device (Coming Soon)
            </Button>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-3 bg-primary-50 border border-primary-200 rounded-md">
            <div className="flex items-start gap-2">
              <SiWebauthn className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-primary-700">
                <p className="font-medium mb-1">Zero-Knowledge Security</p>
                <p>
                  Your TOTP secrets are encrypted client-side with
                  WebAuthn-derived keys. We never have access to your
                  unencrypted data.
                </p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
