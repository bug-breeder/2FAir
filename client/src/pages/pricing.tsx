import { Button, Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";

import LandingLayout from "@/layouts/landing";

export default function PricingPage() {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for personal use",
      features: [
        "Up to 20 TOTP codes",
        "WebAuthn authentication",
        "Client-side encryption",
        "Cross-device sync",
        "QR code import",
        "Backup & restore"
      ],
      limitations: [
        "20 code limit"
      ],
      cta: "Get Started Free",
      popular: false
    },
    {
      name: "Pro",
      price: "$4.99",
      period: "per month",
      description: "For power users and teams",
      features: [
        "Unlimited TOTP codes",
        "WebAuthn authentication",
        "Client-side encryption",
        "Cross-device sync",
        "QR code import",
        "Backup & restore",
        "Priority support",
        "Advanced organization",
        "Bulk import/export",
        "Custom labels & icons"
      ],
      limitations: [],
      cta: "Start Pro Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "For organizations with specific needs",
      features: [
        "Everything in Pro",
        "SSO integration",
        "Team management",
        "Audit logs",
        "On-premise deployment",
        "Custom branding",
        "24/7 support",
        "SLA guarantees",
        "Compliance certifications"
      ],
      limitations: [],
      cta: "Contact Sales",
      popular: false
    }
  ];

  const faqs = [
    {
      question: "Is my data really secure?",
      answer: "Yes! All your TOTP secrets are encrypted on your device using WebAuthn-derived keys. We never have access to your unencrypted data."
    },
    {
      question: "Can I migrate from other 2FA apps?",
      answer: "Absolutely! You can import your codes by scanning QR codes or uploading screenshots from other 2FA apps."
    },
    {
      question: "What happens if I lose my device?",
      answer: "Your encrypted data is safely stored in our cloud. You can restore it on a new device using your WebAuthn credential."
    },
    {
      question: "Do you offer refunds?",
      answer: "Yes, we offer a 30-day money-back guarantee on all paid plans. No questions asked."
    },
    {
      question: "Is there a family plan?",
      answer: "Currently, each user needs their own account for security reasons. However, we're exploring family sharing options for the future."
    }
  ];

  return (
    <LandingLayout 
      title="2FAir Pricing - Secure TOTP Management Plans"
      description="Choose the perfect plan for your 2FA security needs. Free forever plan available with pro features for power users."
    >
      {/* Hero Section */}
      <section className="py-20 sm:py-32 bg-gradient-to-b from-primary-50 to-background">
        <div className="container mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-default-600 mb-8">
            Choose the plan that fits your needs. Always with zero-knowledge encryption and WebAuthn security.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-background">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`border-2 ${
                  plan.popular 
                    ? 'border-primary bg-primary-50' 
                    : 'border-divider'
                } relative`}
              >
                {plan.popular && (
                  <Chip 
                    color="primary" 
                    className="absolute -top-3 left-1/2 transform -translate-x-1/2"
                  >
                    Most Popular
                  </Chip>
                )}
                
                <CardHeader className="pb-4">
                  <div className="text-center w-full">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="mb-2">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.period && (
                        <span className="text-default-500">/{plan.period}</span>
                      )}
                    </div>
                    <p className="text-sm text-default-600">{plan.description}</p>
                  </div>
                </CardHeader>

                <CardBody className="pt-0">
                  <Button
                    color={plan.popular ? "primary" : "default"}
                    variant={plan.popular ? "solid" : "bordered"}
                    className="w-full mb-6"
                    onPress={() => navigate("/login")}
                  >
                    {plan.cta}
                  </Button>

                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <Icon 
                          icon="mdi:check" 
                          className="text-success flex-shrink-0" 
                          width={20} 
                        />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                    
                    {plan.limitations.map((limitation, limitIndex) => (
                      <div key={limitIndex} className="flex items-center gap-3">
                        <Icon 
                          icon="mdi:minus" 
                          className="text-warning flex-shrink-0" 
                          width={20} 
                        />
                        <span className="text-sm text-default-500">{limitation}</span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-20 bg-content1">
        <div className="container mx-auto max-w-4xl px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose 2FAir?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-success-100 rounded-lg">
                  <Icon icon="mdi:shield-check" className="text-success" width={24} />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Zero-Knowledge Security</h3>
                  <p className="text-sm text-default-600">
                    Your data is encrypted on your device. We never see your TOTP secrets.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Icon icon="mdi:fingerprint" className="text-primary" width={24} />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">WebAuthn Authentication</h3>
                  <p className="text-sm text-default-600">
                    No passwords. Use biometrics, hardware keys, or device authentication.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-secondary-100 rounded-lg">
                  <Icon icon="mdi:sync" className="text-secondary" width={24} />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Cross-Device Sync</h3>
                  <p className="text-sm text-default-600">
                    Access your codes on all devices with end-to-end encryption.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-warning-100 rounded-lg">
                  <Icon icon="mdi:backup-restore" className="text-warning" width={24} />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Secure Backup</h3>
                  <p className="text-sm text-default-600">
                    Encrypted backups ensure you never lose access to your accounts.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-danger-100 rounded-lg">
                  <Icon icon="mdi:open-source-initiative" className="text-danger" width={24} />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Open Source</h3>
                  <p className="text-sm text-default-600">
                    Transparent, auditable code that you can trust.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-default-100 rounded-lg">
                  <Icon icon="mdi:qrcode-scan" className="text-default-600" width={24} />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Easy Import</h3>
                  <p className="text-sm text-default-600">
                    Scan QR codes or upload screenshots to import existing codes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 bg-background">
        <div className="container mx-auto max-w-4xl px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="border border-divider">
                <CardBody className="p-6">
                  <h3 className="font-semibold mb-3 text-lg">{faq.question}</h3>
                  <p className="text-default-600">{faq.answer}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-50">
        <div className="container mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Ready to Secure Your 2FA Codes?
          </h2>
          <p className="text-lg text-default-600 mb-8">
            Start with our free plan and upgrade anytime. No credit card required.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              color="primary"
              size="lg"
              onPress={() => navigate("/login")}
            >
              Start Free Today
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
    </LandingLayout>
  );
}
