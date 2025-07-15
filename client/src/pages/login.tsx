import { useState, useEffect } from "react";
import { Button, Divider, Link, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";

import { toast } from "../lib/toast";
import { FAir } from "../components/icons";
import { useAuth } from "../providers/auth-provider";
import { apiClient } from "../lib/api/client";

interface OAuthProvider {
  name: string;
  provider: string;
  description: string;
  login_url: string;
}

function LoginPage() {
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to app if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/app");
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const data = await apiClient.get<{ providers: OAuthProvider[] }>(
          "/api/v1/auth/providers",
        );
        setProviders(data.providers || []);
      } catch (error) {
        console.error("Error fetching providers:", error);
        toast.error("Failed to load authentication providers");
      }
    };

    fetchProviders();
  }, []);

  const handleLogin = async (provider: OAuthProvider) => {
    try {
      setLoadingProvider(provider.provider);

      // Use the login_url directly from the provider response
      console.log("Attempting login with URL:", provider.login_url);

      // Redirect to the OAuth provider
      window.location.href = provider.login_url;
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
      setLoadingProvider(null);
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

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-4 text-default-500">Checking authentication...</p>
      </div>
    );
  }

  // Don't render login form if user is authenticated (redirect is happening)
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-4 text-default-500">Redirecting to app...</p>
      </div>
    );
  }

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
              disabled={loadingProvider !== null}
              isLoading={loadingProvider === provider.provider}
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
