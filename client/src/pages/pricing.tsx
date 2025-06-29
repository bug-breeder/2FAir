import { Button, Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";

import LandingLayout from "@/layouts/landing";

export default function PricingPage() {
  const navigate = useNavigate();
  
  // Refs for scroll-linked animations
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const pricingRef = useRef(null);
  
  // Interactive states
  const [hoveredPlan, setHoveredPlan] = useState<number | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [hoveredFaq, setHoveredFaq] = useState<number | null>(null);

  // Scroll-linked animations
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  // Transform values based on scroll
  const heroY = useTransform(heroScroll, [0, 1], [0, -100]);
  const heroOpacity = useTransform(heroScroll, [0, 0.8], [1, 0]);
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  const plans = [
    {
      name: "Personal",
      price: "Free",
      period: "forever",
      description: "Perfect for personal use",
      features: [
        "Up to 20 codes",
        "End-to-end encryption",
        "Works on all devices",
        "Secure cloud backup",
        "Import from screenshots",
        "24/7 support"
      ],
      limitations: [
        "Limited to 20 codes"
      ],
      cta: "Get Started Free",
      popular: false,
      color: "default",
      gradient: "from-default-100/80 to-default-200/80 dark:from-default-800/30 dark:to-default-900/30"
    },
    {
      name: "Pro",
      price: "$3",
      period: "per month",
      description: "For people who need more",
      features: [
        "Unlimited codes",
        "End-to-end encryption",
        "Works on all devices",
        "Secure cloud backup",
        "Import from screenshots",
        "Priority support",
        "Custom folders & labels",
        "Bulk import/export",
        "Advanced search"
      ],
      limitations: [],
      cta: "Try Pro Free",
      popular: false,
      color: "primary",
      gradient: "from-primary-100/50 to-secondary-100/50 dark:from-primary-900/20 dark:to-secondary-900/20"
    }
  ];

  const faqs = [
    {
      question: "Is my data really safe?",
      answer: "Absolutely! Your codes are protected with end-to-end encryption, meaning they're encrypted on your device before being stored. We use the same security standards as banks, and even we can't see your codes."
    },
    {
      question: "Can I switch from other 2FA apps?",
      answer: "Yes! You can easily import your existing codes by scanning QR codes or uploading screenshots from apps like Google Authenticator, Authy, and others."
    },
    {
      question: "What if I lose my phone?",
      answer: "No worries! Your codes are safely backed up in the cloud with end-to-end encryption. Just log in on a new device and everything will be there."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Of course! Cancel anytime with one click. No questions asked, no hidden fees. You can even downgrade to the free plan and keep using 2FAir."
    },
    {
      question: "Do you offer discounts?",
      answer: "We offer discounts for students, nonprofits, and annual payments. Contact us and we'll see what we can do!"
    }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { 
      y: 60, 
      opacity: 0,
      scale: 0.8
    },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
        duration: 0.8
      }
    }
  };

  const cardVariants = {
    hidden: {
      y: 80,
      opacity: 0,
      rotateX: -15
    },
    visible: {
      y: 0,
      opacity: 1,
      rotateX: 0,
      transition: {
        type: "spring",
        stiffness: 80,
        damping: 15,
        duration: 1
      }
    }
  };

  return (
    <div ref={containerRef}>
      <LandingLayout 
        title="2FAir Pricing - Simple Plans for Everyone"
        description="Choose the perfect plan for your needs. Always free to start, with premium features for those who need more."
      >
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary/5 rounded-full"
              style={{
                left: `${20 + i * 30}%`,
                top: `${30 + i * 20}%`,
              }}
              animate={{
                scale: [0.8, 1.2, 0.8],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 2
              }}
            />
          ))}
        </div>

        {/* Enhanced Hero Section */}
        <section ref={heroRef} className="py-20 sm:py-32 bg-gradient-to-b from-primary-50/50 via-secondary-50/30 to-background dark:from-primary-950/30 dark:via-secondary-950/20 overflow-hidden">
          <motion.div 
            className="container mx-auto max-w-4xl px-6 text-center relative z-10"
            style={{ y: heroY, opacity: heroOpacity }}
          >
            <motion.h1 
              className="text-4xl sm:text-5xl font-bold text-foreground mb-6"
              initial={{ y: -50, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 100,
                damping: 15,
                duration: 1
              }}
            >
              Simple Pricing for{" "}
              <motion.span 
                className="text-primary"
                whileInView={{
                  scale: [1, 1.02, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                Everyone
              </motion.span>
            </motion.h1>
            <motion.p 
              className="text-xl text-default-600 mb-8"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 80,
                damping: 12,
                delay: 0.3
              }}
            >
              Start free and upgrade when you need more. All plans include end-to-end encryption and enterprise-grade security.
            </motion.p>

            {/* Floating pricing badges */}
            <motion.div 
              className="flex flex-wrap justify-center gap-4 mb-8"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              {[
                { icon: "mdi:shield-check", text: "Bank-Level Security", color: "text-green-600" },
                { icon: "mdi:flash", text: "Lightning Fast", color: "text-yellow-600" },
                { icon: "mdi:heart-pulse", text: "99.9% Uptime", color: "text-red-600" }
              ].map((badge, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border border-divider"
                >
                  <Icon icon={badge.icon} className={badge.color} width={16} />
                  <span className="text-sm font-medium">{badge.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Simplified Background Effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30 dark:opacity-10">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-32 h-32 border border-primary/10 rounded-full"
                style={{
                  left: `${30 + i * 20}%`,
                  top: `${40 + i * 10}%`,
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.1, 0.2, 0.1],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 2,
                }}
              />
            ))}
          </div>
        </section>

        {/* Enhanced Pricing Cards */}
        <section ref={pricingRef} className="py-20 bg-background">
          <div className="container mx-auto max-w-4xl px-6">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              {plans.map((plan, index) => (
                <motion.div
                  key={index}
                  variants={cardVariants}
                  onHoverStart={() => setHoveredPlan(index)}
                  onHoverEnd={() => setHoveredPlan(null)}
                  whileHover={{ 
                    y: -5
                  }}
                  transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                >
                  <Card 
                    className={`${
                      plan.name === "Pro"
                        ? 'border-2 border-primary shadow-lg' 
                        : 'border border-divider hover:shadow-md'
                    } transition-all duration-300 h-full overflow-hidden relative`}
                  >
                    {/* Simplified gradient background */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-0`}
                      animate={{
                        opacity: hoveredPlan === index ? 0.05 : 0
                      }}
                      transition={{ duration: 0.3 }}
                    />
                    
                    {/* Pro badge */}
                    {plan.name === "Pro" && (
                      <motion.div
                        className="absolute -top-3 left-1/2 transform -translate-x-1/2"
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                      >
                        {/* <div className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                          Most Popular
                        </div> */}
                      </motion.div>
                    )}

                    <CardHeader className="pb-6 pt-8 relative z-10">
                      <div className="text-center w-full">
                        <h3 className="text-2xl font-bold mb-3">{plan.name}</h3>
                        <div className="mb-3">
                          <span className="text-4xl font-bold text-primary">{plan.price}</span>
                          {plan.period && (
                            <span className="text-default-500 text-lg">/{plan.period}</span>
                          )}
                        </div>
                        <p className="text-default-600">{plan.description}</p>
                      </div>
                    </CardHeader>

                    <CardBody className="pt-0 px-6 pb-8 relative z-10">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          color={plan.name === "Pro" ? "primary" : "default"}
                          variant={plan.name === "Pro" ? "solid" : "bordered"}
                          className="w-full mb-8 h-12 font-semibold text-base"
                          onPress={() => navigate("/login")}
                        >
                          {plan.cta}
                        </Button>
                      </motion.div>

                      <div className="space-y-4">
                        {plan.features.map((feature, featureIndex) => (
                          <div 
                            key={featureIndex} 
                            className="flex items-start gap-3"
                          >
                            <Icon 
                              icon="mdi:check-circle" 
                              className="text-green-500 flex-shrink-0 mt-0.5" 
                              width={20} 
                            />
                            <span className="text-sm leading-relaxed">{feature}</span>
                          </div>
                        ))}
                        
                        {plan.limitations.map((limitation, limitIndex) => (
                          <div 
                            key={limitIndex} 
                            className="flex items-start gap-3"
                          >
                            <Icon 
                              icon="mdi:information" 
                              className="text-orange-500 flex-shrink-0 mt-0.5" 
                              width={20} 
                            />
                            <span className="text-sm text-default-500 leading-relaxed">{limitation}</span>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Enhanced 30-day guarantee */}
            <motion.div 
              className="text-center mt-16"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              viewport={{ once: true }}
            >
              <motion.div 
                className="inline-flex items-center gap-3 bg-background/80 backdrop-blur-sm border border-divider rounded-full px-6 py-3"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 8px 25px rgba(34, 197, 94, 0.2)"
                }}
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  <Icon icon="mdi:shield-check" className="text-green-600" width={24} />
                </motion.div>
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  Trusted by thousands • No hidden fees • Cancel anytime
                </span>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Enhanced Feature Comparison */}
        <section className="py-20 bg-gradient-to-b from-default-50 to-background">
          <div className="container mx-auto max-w-4xl px-6">
            <motion.h2 
              className="text-3xl font-bold text-center mb-12"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 80,
                damping: 15
              }}
              viewport={{ once: true }}
            >
              Why Choose 2FAir?
            </motion.h2>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              {[
                {
                  icon: "mdi:shield-lock",
                  title: "End-to-End Encryption",
                  description: "Your codes are encrypted on your device before storage. Even if our servers are breached, your data stays safe.",
                  color: "text-green-600 dark:text-green-400",
                  bgColor: "bg-green-100 dark:bg-green-900/20"
                },
                {
                  icon: "mdi:fingerprint",
                  title: "No Passwords",
                  description: "Use your fingerprint, face, or security key. Faster and more secure than any password.",
                  color: "text-blue-600 dark:text-blue-400",
                  bgColor: "bg-blue-100 dark:bg-blue-900/20"
                },
                {
                  icon: "mdi:devices",
                  title: "Works Everywhere",
                  description: "Phone, tablet, computer - your codes sync automatically across all your devices.",
                  color: "text-purple-600 dark:text-purple-400",
                  bgColor: "bg-purple-100 dark:bg-purple-900/20"
                },
                {
                  icon: "mdi:backup-restore",
                  title: "Never Lose Access",
                  description: "Secure backup with end-to-end encryption means you'll never be locked out, even if you lose your phone.",
                  color: "text-orange-600 dark:text-orange-400",
                  bgColor: "bg-orange-100 dark:bg-orange-900/20"
                },
                {
                  icon: "mdi:enterprise",
                  title: "Enterprise Ready",
                  description: "Bank-level security meets consumer simplicity. Trusted by individuals and teams worldwide.",
                  color: "text-red-600 dark:text-red-400",
                  bgColor: "bg-red-100 dark:bg-red-900/20"
                },
                {
                  icon: "mdi:lightning-bolt",
                  title: "Lightning Fast",
                  description: "Get your codes in seconds, not minutes. No more hunting through different apps.",
                  color: "text-teal-600 dark:text-teal-400",
                  bgColor: "bg-teal-100 dark:bg-teal-900/20"
                }
              ].map((feature, index) => (
                <motion.div 
                  key={index}
                  variants={itemVariants}
                  onHoverStart={() => setHoveredFeature(index)}
                  onHoverEnd={() => setHoveredFeature(null)}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="flex items-start gap-4"
                >
                  <motion.div 
                    className={`p-3 ${feature.bgColor} rounded-lg`}
                    animate={hoveredFeature === index ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    } : {}}
                    transition={{ duration: 0.6 }}
                  >
                    <Icon icon={feature.icon} className={feature.color} width={24} />
                  </motion.div>
                  <div>
                    <motion.h3 
                      className="font-semibold mb-2"
                      animate={hoveredFeature === index ? {
                        x: [0, 5, 0]
                      } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {feature.title}
                    </motion.h3>
                    <motion.p 
                      className="text-sm text-default-600"
                      animate={hoveredFeature === index ? {
                        y: [0, -2, 0]
                      } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {feature.description}
                    </motion.p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Enhanced FAQs */}
        <section className="py-20 bg-background">
          <div className="container mx-auto max-w-4xl px-6">
            <motion.h2 
              className="text-3xl font-bold text-center mb-12"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 80,
                damping: 15
              }}
              viewport={{ once: true }}
            >
              Questions? We've Got Answers
            </motion.h2>
            
            <motion.div 
              className="space-y-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  onHoverStart={() => setHoveredFaq(index)}
                  onHoverEnd={() => setHoveredFaq(null)}
                  whileHover={{ x: 10, scale: 1.01 }}
                >
                  <Card className="border border-divider hover:shadow-lg transition-all duration-300">
                    <CardBody className="p-6">
                      <motion.h3 
                        className="font-semibold mb-3 text-lg"
                        animate={hoveredFaq === index ? {
                          x: [0, 5, 0]
                        } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        {faq.question}
                      </motion.h3>
                      <motion.p 
                        className="text-default-600 leading-relaxed"
                        animate={hoveredFaq === index ? {
                          y: [0, -2, 0]
                        } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        {faq.answer}
                      </motion.p>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            <motion.div 
              className="text-center mt-12"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              viewport={{ once: true }}
            >
              <p className="text-default-600 mb-4">Still have questions?</p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="bordered"
                  as="a"
                  href="mailto:support@2fair.app"
                >
                  Contact Support
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Enhanced CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary-50/40 via-secondary-50/30 to-primary-50/40 dark:from-primary-950/20 dark:via-secondary-950/15 dark:to-primary-950/20 relative overflow-hidden">
          {/* Minimal background animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-5">
            {[...Array(2)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-32 h-32 border border-primary/10 rounded-full"
                style={{
                  left: `${20 + i * 60}%`,
                  top: `${50}%`,
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.1, 0.2, 0.1],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 4,
                }}
              />
            ))}
          </div>

          <div className="container mx-auto max-w-4xl px-6 text-center relative z-10">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 80,
                damping: 15
              }}
              viewport={{ once: true }}
            >
              <motion.h2 
                className="text-3xl sm:text-4xl font-bold text-foreground mb-6"
                whileInView={{
                  scale: [1, 1.02, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                Ready to Simplify Your Digital Life?
              </motion.h2>
              <motion.p 
                className="text-lg text-default-600 mb-8 max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                Join thousands of people who've made their accounts more secure and easier to manage with end-to-end encrypted 2FAir.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {[
                  {
                    text: "Start Free Today",
                    color: "primary" as const,
                    variant: "solid" as const,
                    onClick: () => navigate("/login")
                  },
                  {
                    text: "Learn More",
                    variant: "bordered" as const,
                    onClick: () => navigate("/about")
                  }
                ].map((button, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      color={button.color}
                      variant={button.variant}
                      size="lg"
                      className="px-8 py-3 text-lg font-semibold"
                      onPress={button.onClick}
                    >
                      {button.text}
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
              
              <motion.p 
                className="text-sm text-default-500 mt-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                Free forever plan available • No credit card required • Cancel anytime
              </motion.p>
            </motion.div>
          </div>
        </section>
      </LandingLayout>
    </div>
  );
}
