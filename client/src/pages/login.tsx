import { useState, useEffect } from "react";
import { Button, Divider, Link } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";

import { toast } from "../lib/toast";
import { FAir } from "../components/icons";

interface OAuthProvider {
  name: string;
  provider: string;
  description: string;
  login_url: string;
}

function LoginPage() {
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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
        toast.error("Failed to load authentication providers");
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
      toast.success("Login successful!");
      navigate("/");
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      toast.error(`Authentication failed: ${error}`);
      setIsLoading(false);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [navigate]);

  const handleLogin = async (provider: OAuthProvider) => {
    try {
      setIsLoading(true);
      // Redirect to OAuth provider
      window.location.href = provider.login_url;
    } catch (error) {
      toast.error("Failed to initiate login. Please try again.");
      setIsLoading(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "google":
        return <Icon icon="logos:google-icon" width={24} />;
      case "github":
        return <Icon icon="logos:github-icon" width={24} />;
      case "microsoft":
        return (
          <Icon
            className="text-default-500"
            icon="logos:microsoft-icon"
            width={24}
          />
        );
      default:
        return <Icon icon="mdi:login" width={24} />;
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center px-6 sm:px-0">
      <div className="mt-2 flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-4 sm:px-8 py-6 shadow-small">
        <div className="flex flex-col items-center pb-1">
          <FAir className="text-foreground" size={60} />
          <h1 className="text-xl font-medium mt-4">Welcome Back</h1>
          <p className="text-small text-default-500">
            Log in to your account to continue
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {providers.map((provider) => (
            <Button
              key={provider.provider}
              disabled={isLoading}
              isLoading={isLoading}
              startContent={getProviderIcon(provider.provider)}
              variant="bordered"
              onPress={() => handleLogin(provider)}
            >
              {provider.description}
            </Button>
          ))}

          {/* Fallback buttons if providers haven't loaded yet */}
          {providers.length === 0 && (
            <>
              <Button
                disabled={true}
                startContent={
                  <Icon
                    className="animate-spin"
                    icon="mdi:loading"
                    width={24}
                  />
                }
                variant="bordered"
              >
                Loading providers...
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 py-2">
          <Divider className="flex-1" />
          <p className="shrink-0 text-tiny text-default-500">OR</p>
          <Divider className="flex-1" />
        </div>

        <p className="text-center text-small">
          Can not access your account?&nbsp;
          <Link href="/recovery" size="sm">
            Recovery
          </Link>
        </p>

        {/* Zero-Knowledge Security Notice */}
        <div className="mt-2 p-3 bg-primary-50 border border-primary-200 rounded-medium">
          <p className="text-tiny text-primary-700 text-center">
            <strong>Zero-Knowledge Security:</strong> Your TOTP secrets are
            encrypted client-side with WebAuthn-derived keys.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
