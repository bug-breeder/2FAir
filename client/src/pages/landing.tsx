import { Button, Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";

import LandingLayout from "@/layouts/landing";
import { FAir } from "@/components/icons";

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: "mdi:shield-lock",
      title: "Zero-Knowledge Security",
      description: "Your TOTP secrets are encrypted client-side with WebAuthn-derived keys. We never see your data."
    },
    {
      icon: "mdi:fingerprint",
      title: "WebAuthn Authentication",
      description: "Secure authentication using biometrics, hardware keys, or device authentication."
    },
    {
      icon: "mdi:qrcode-scan",
      title: "Easy Setup",
      description: "Import your 2FA codes by scanning QR codes or uploading screenshots."
    },
    {
      icon: "mdi:sync",
      title: "Cross-Device Sync",
      description: "Access your TOTP codes securely across all your devices with end-to-end encryption."
    },
    {
      icon: "mdi:backup-restore",
      title: "Secure Backup",
      description: "Encrypted backups ensure you never lose access to your accounts."
    },
    {
      icon: "mdi:open-source-initiative",
      title: "Open Source",
      description: "Transparent, auditable code that you can trust with your security."
    }
  ];

  return (
    <LandingLayout 
      title="2FAir - Secure Zero-Knowledge TOTP Management"
      description="Manage your 2FA codes with zero-knowledge security. WebAuthn authentication, client-side encryption, and cross-device sync."
    >
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary-50 to-background py-20 sm:py-32">
        <div className="container mx-auto max-w-7xl px-6 text-center">
          <div className="flex justify-center mb-8">
            <FAir className="text-primary" size={80} />
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-bold text-foreground mb-6">
            Secure Your <span className="text-primary">2FA Codes</span>
            <br />
            with Zero-Knowledge Encryption
          </h1>
          
          <p className="text-xl text-default-600 mb-8 max-w-3xl mx-auto">
            2FAir provides military-grade security for your TOTP codes using WebAuthn 
            authentication and client-side encryption. Your secrets never leave your device unencrypted.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              color="primary"
              size="lg"
              className="w-full sm:w-auto"
              onPress={() => navigate("/login")}
            >
              Get Started Free
            </Button>
            <Button
              variant="bordered"
              size="lg"
              className="w-full sm:w-auto"
              onPress={() => navigate("/about")}
            >
              Learn More
            </Button>
          </div>

          {/* Security Badge */}
          <div className="mt-12 inline-flex items-center gap-2 bg-success-50 border border-success-200 rounded-full px-4 py-2">
            <Icon icon="mdi:shield-check" className="text-success-600" width={20} />
            <span className="text-sm font-medium text-success-700">
              Zero-Knowledge • WebAuthn • Open Source
            </span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Why Choose 2FAir?
            </h2>
            <p className="text-lg text-default-600 max-w-2xl mx-auto">
              Built with security-first principles and modern cryptographic standards
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border border-divider">
                <CardBody className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Icon 
                        icon={feature.icon} 
                        className="text-primary" 
                        width={24} 
                      />
                    </div>
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                  </div>
                  <p className="text-default-600">{feature.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-content1">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-default-600">
              Get started in just three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Sign Up</h3>
              <p className="text-default-600">
                Create your account using WebAuthn authentication - no passwords required
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Import Codes</h3>
              <p className="text-default-600">
                Scan QR codes or upload screenshots to import your existing 2FA codes
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Stay Secure</h3>
              <p className="text-default-600">
                Access your codes anywhere with military-grade encryption and sync
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-50">
        <div className="container mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to Secure Your 2FA?
          </h2>
          <p className="text-lg text-default-600 mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust 2FAir with their most sensitive authentication codes
          </p>
          
          <Button
            color="primary"
            size="lg"
            className="w-full sm:w-auto"
            onPress={() => navigate("/login")}
          >
            Start Free Today
          </Button>
          
          <p className="text-sm text-default-500 mt-4">
            No credit card required • Free forever plan available
          </p>
        </div>
      </section>
    </LandingLayout>
  );
} 