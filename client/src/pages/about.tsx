import { Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";

import LandingLayout from "@/layouts/landing";

export default function AboutPage() {
  const principles = [
    {
      icon: "mdi:eye-off",
      title: "Zero-Knowledge Architecture",
      description: "We never see your data. All encryption happens on your device using WebAuthn-derived keys."
    },
    {
      icon: "mdi:open-source-initiative",
      title: "Open Source Transparency",
      description: "Our code is fully auditable. Security through transparency, not obscurity."
    },
    {
      icon: "mdi:shield-check",
      title: "Military-Grade Security",
      description: "AES-256 encryption, PBKDF2 key derivation, and secure key management."
    }
  ];

  return (
    <LandingLayout 
      title="About 2FAir - Zero-Knowledge TOTP Security"
      description="Learn about 2FAir's mission to provide secure, privacy-first 2FA management with zero-knowledge encryption."
    >
      {/* Hero Section */}
      <section className="py-20 sm:py-32 bg-gradient-to-b from-primary-50 to-background">
        <div className="container mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            About 2FAir
          </h1>
          <p className="text-xl text-default-600 mb-8">
            We believe your authentication codes should be secure, private, and accessible only to you.
            2FAir was built with zero-knowledge principles to ensure your data remains truly yours.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">Our Mission</h2>
              <p className="text-lg text-default-600 mb-4">
                Two-factor authentication is critical for security, but existing solutions often compromise 
                your privacy by storing your secrets on their servers.
              </p>
              <p className="text-lg text-default-600 mb-4">
                2FAir changes this by implementing true zero-knowledge encryption. Your TOTP secrets are 
                encrypted on your device using keys derived from WebAuthn authentication, ensuring that 
                even we cannot access your data.
              </p>
              <p className="text-lg text-default-600">
                This approach provides the convenience of cloud sync with the security of local storage.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="w-80 h-80 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center">
                <Icon icon="mdi:shield-lock" className="text-primary" width={120} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Principles Section */}
      <section className="py-20 bg-content1">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Principles</h2>
            <p className="text-lg text-default-600">
              The core values that guide every decision we make
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {principles.map((principle, index) => (
              <Card key={index} className="border border-divider">
                <CardBody className="p-6 text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon 
                      icon={principle.icon} 
                      className="text-primary" 
                      width={32} 
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{principle.title}</h3>
                  <p className="text-default-600">{principle.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Details Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto max-w-4xl px-6">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">How We Protect Your Data</h2>
          
          <div className="space-y-8">
            <Card className="border border-divider">
              <CardBody className="p-6">
                <h3 className="text-xl font-semibold mb-3">WebAuthn Authentication</h3>
                <p className="text-default-600">
                  Instead of passwords, we use WebAuthn for authentication. This leverages your device's 
                  biometric sensors, hardware security keys, or device PIN to create a secure authentication 
                  factor that generates unique cryptographic keys.
                </p>
              </CardBody>
            </Card>

            <Card className="border border-divider">
              <CardBody className="p-6">
                <h3 className="text-xl font-semibold mb-3">Client-Side Encryption</h3>
                <p className="text-default-600">
                  Your TOTP secrets are encrypted on your device using AES-256-GCM with keys derived from 
                  your WebAuthn credential. The encryption happens before any data leaves your device, 
                  ensuring we never have access to your unencrypted secrets.
                </p>
              </CardBody>
            </Card>

            <Card className="border border-divider">
              <CardBody className="p-6">
                <h3 className="text-xl font-semibold mb-3">Secure Key Derivation</h3>
                <p className="text-default-600">
                  We use PBKDF2 with a high iteration count to derive encryption keys from your WebAuthn 
                  credential. Each user has a unique salt, and the key derivation process happens entirely 
                  on your device.
                </p>
              </CardBody>
            </Card>

            <Card className="border border-divider">
              <CardBody className="p-6">
                <h3 className="text-xl font-semibold mb-3">Zero-Knowledge Sync</h3>
                <p className="text-default-600">
                  When you sync across devices, only encrypted data is transmitted. Each device must have 
                  your WebAuthn credential to decrypt and access your TOTP codes. Without the credential, 
                  the data is meaningless ciphertext.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="py-20 bg-primary-50">
        <div className="container mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">Open Source & Auditable</h2>
          <p className="text-lg text-default-600 mb-8">
            Don't just trust us - verify our claims. Our entire codebase is open source and available 
            for security audits. We believe in security through transparency.
          </p>
          <a 
            href="https://github.com/your-org/2fair" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:text-primary-600 font-medium"
          >
            <Icon icon="mdi:github" width={24} />
            View Source Code
          </a>
        </div>
      </section>
    </LandingLayout>
  );
}
