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
  onLoginSuccess: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch("/api/v1/auth/providers");

        if (!response.ok) {
          throw new Error("Failed to fetch providers");
        }

        const data = await response.json();

        setProviders(data.providers || []);
      } catch (error) {
        console.error("Error fetching providers:", error);
        // Fallback providers for development
        setProviders([
          {
            name: "Google",
            provider: "google",
            description: "Sign in with Google",
            login_url: "/api/v1/auth/google",
          },
          {
            name: "GitHub",
            provider: "github",
            description: "Sign in with GitHub",
            login_url: "/api/v1/auth/github",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const handleLogin = async (provider: OAuthProvider) => {
    try {
      setIsLoading(true);

      // Redirect to the OAuth provider
      window.location.href = provider.login_url;
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
    }
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
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-3 text-center">
          <h1 className="text-2xl font-bold">Welcome to 2FAir</h1>
          <p className="text-default-500">Sign in to access your 2FA tokens</p>
        </CardHeader>
        <CardBody>
          <div className="flex flex-col gap-3">
            {providers.map((provider) => (
              <Button
                key={provider.provider}
                className={getProviderColor(provider.provider)}
                startContent={getProviderIcon(provider.provider)}
                onPress={() => handleLogin(provider)}
              >
                {provider.description}
              </Button>
            ))}

            <Divider className="my-2" />

            <div className="text-center text-small text-default-500">
              <p>Secure • Zero-Knowledge • WebAuthn Protected</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
