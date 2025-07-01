import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";

import LandingLayout from "../layouts/landing";
import { useAuth } from "../hooks/auth";
import { FAir } from "../components/icons";

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // Refs for scroll-linked animations
  const containerRef = useRef(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  // Interactive states
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  // Scroll-linked animations
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const { scrollYProgress: featuresScroll } = useScroll({
    target: featuresRef,
    offset: ["start end", "end start"],
  });

  // Transform values based on scroll
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
  const heroScale = useTransform(heroScroll, [0, 1], [1, 0.8]);

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/app");
    } else {
      navigate("/login");
    }
  };

  const features = [
    {
      icon: "mdi:shield-lock",
      title: "End-to-End Encrypted",
      description:
        "Your 2FA codes are encrypted from your device to our servers. Even if hackers break in, they can't read your data.",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: "mdi:fingerprint",
      title: "No Passwords Needed",
      description:
        "Login using your fingerprint, face ID, or security key. It&apos;s faster and much more secure than passwords.",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: "mdi:qrcode-scan",
      title: "Easy Setup",
      description:
        "Just scan the QR codes from your favorite apps or upload screenshots. We'll take care of the rest!",
      gradient: "from-green-500 to-teal-500",
    },
    {
      icon: "mdi:devices",
      title: "Works Everywhere",
      description:
        "Access your codes on your phone, tablet, or computer. Everything stays in sync automatically.",
      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: "mdi:backup-restore",
      title: "Never Lose Access",
      description:
        "Your codes are safely backed up with end-to-end encryption. Even if you lose your phone, you'll never be locked out.",
      gradient: "from-indigo-500 to-blue-500",
    },
    {
      icon: "mdi:enterprise",
      title: "Enterprise Ready",
      description:
        "Bank-level security with consumer simplicity. Trusted by individuals and teams worldwide for their most important accounts.",
      gradient: "from-emerald-500 to-green-500",
    },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: {
      y: 60,
      opacity: 0,
      scale: 0.8,
      rotateX: -15,
    },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      rotateX: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
        duration: 0.8,
      },
    },
  };

  const floatingVariants = {
    animate: {
      y: [-20, 20, -20],
      rotate: [0, 5, -5, 0],
      scale: [1, 1.05, 1],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div ref={containerRef}>
      <LandingLayout
        description="The easiest way to manage your 2FA codes. Secure, simple, and works everywhere you need it."
        title="2FAir - Keep Your Accounts Safe & Simple"
      >
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-30 dark:opacity-5">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                scale: [0.8, 1.2, 0.8],
                opacity: [0.2, 0.4, 0.2],
              }}
              className="absolute w-1 h-1 bg-primary/10 rounded-full"
              style={{
                left: `${25 + i * 20}%`,
                top: `${30 + i * 15}%`,
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 1.5,
              }}
            />
          ))}
        </div>

        {/* Enhanced Hero Section */}
        <section
          ref={heroRef}
          className="relative bg-gradient-to-b from-primary-50/50 via-secondary-50/30 to-background dark:from-primary-950/30 dark:via-secondary-950/20 py-20 sm:py-32 overflow-hidden"
        >
          <motion.div
            className="container mx-auto max-w-7xl px-6 text-center relative z-10"
            style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
          >
            <motion.div
              animate={{ y: 0, opacity: 1, scale: 1 }}
              className="flex justify-center mb-8"
              initial={{ y: -100, opacity: 0, scale: 0.5 }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
                duration: 1.2,
              }}
            >
              <motion.div
                animate="animate"
                className="relative"
                variants={floatingVariants}
                whileHover={{
                  scale: 1.2,
                  transition: { duration: 0.5 },
                }}
              >
                <FAir className="text-primary" size={80} />
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    boxShadow: [
                      "0 0 0 0 rgba(34, 197, 94, 0.4)",
                      "0 0 0 8px rgba(34, 197, 94, 0)",
                      "0 0 0 0 rgba(34, 197, 94, 0)",
                    ],
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white"
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            </motion.div>

            <motion.h1
              animate={{ y: 0, opacity: 1 }}
              className="text-4xl sm:text-6xl font-bold text-foreground mb-6"
              initial={{ y: 50, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 80,
                damping: 12,
                delay: 0.3,
              }}
            >
              Keep Your Accounts{" "}
              <motion.span
                className="text-primary"
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                whileInView={{
                  scale: [1, 1.02, 1],
                }}
              >
                Safe & Simple
              </motion.span>
            </motion.h1>

            <motion.p
              animate={{ y: 0, opacity: 1 }}
              className="text-xl text-default-600 mb-8 max-w-3xl mx-auto leading-relaxed"
              initial={{ y: 30, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 70,
                damping: 12,
                delay: 0.5,
              }}
            >
              Tired of switching between apps for 2FA codes? 2FAir puts all your
              authentication codes in one safe, easy-to-use place. Setup takes 2
              minutes, and you'll wonder how you lived without it.
            </motion.p>

            <motion.div
              animate={{ y: 0, opacity: 1 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
              initial={{ y: 40, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 60,
                damping: 12,
                delay: 0.7,
              }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 4px 20px rgba(59, 130, 246, 0.3)",
                      "0 8px 40px rgba(59, 130, 246, 0.4)",
                      "0 4px 20px rgba(59, 130, 246, 0.3)",
                    ],
                  }}
                  className="rounded-lg"
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Button
                    className="w-full sm:w-auto px-8 py-3 text-lg font-semibold"
                    color="primary"
                    isLoading={isLoading}
                    size="lg"
                    onPress={handleGetStarted}
                  >
                    {isAuthenticated ? "Open My Codes" : "Get Started Free"}
                  </Button>
                </motion.div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  className="w-full sm:w-auto px-8 py-3 text-lg"
                  size="lg"
                  variant="bordered"
                  onPress={() => navigate("/about")}
                >
                  How It Works
                </Button>
              </motion.div>
            </motion.div>

            {/* Enhanced Trust Badge */}
            <motion.div
              animate={{ y: 0, opacity: 1 }}
              className="inline-flex items-center gap-3 bg-background/80 backdrop-blur-sm border border-divider rounded-full px-6 py-3"
              initial={{ y: 20, opacity: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 8px 25px rgba(34, 197, 94, 0.2)",
              }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Icon
                  className="text-green-600"
                  icon="mdi:shield-check"
                  width={24}
                />
              </motion.div>
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                Trusted by thousands • Always free to start • No credit card
                required
              </span>
            </motion.div>
          </motion.div>

          {/* Hero Background Effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-5">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.1, 0.2, 0.1],
                }}
                className="absolute w-32 h-32 border border-primary/10 rounded-full"
                style={{
                  left: `${30 + i * 20}%`,
                  top: `${40 + i * 10}%`,
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

        {/* Enhanced Features Section */}
        <section ref={featuresRef} className="py-20 bg-background relative">
          <div className="container mx-auto max-w-7xl px-6">
            <motion.div
              className="text-center mb-16"
              initial={{ y: 50, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 80,
                damping: 15,
              }}
              viewport={{ once: true }}
              whileInView={{ y: 0, opacity: 1 }}
            >
              <motion.h2
                className="text-3xl sm:text-4xl font-bold text-foreground mb-4"
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear",
                }}
                whileInView={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
              >
                Why People Love 2FAir
              </motion.h2>
              <p className="text-lg text-default-600 max-w-2xl mx-auto">
                Finally, 2FA that doesn&apos;t get in your way. Here&apos;s what
                makes 2FAir special.
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial="hidden"
              variants={containerVariants}
              viewport={{ once: true, margin: "-100px" }}
              whileInView="visible"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="h-full"
                  variants={itemVariants}
                  onHoverEnd={() => setHoveredFeature(null)}
                  onHoverStart={() => setHoveredFeature(index)}
                >
                  <motion.div
                    className="h-full"
                    style={{
                      transformStyle: "preserve-3d",
                      perspective: 1000,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                    whileHover={{
                      scale: 1.05,
                      y: -10,
                      rotateY: 5,
                      z: 50,
                    }}
                  >
                    <Card className="border border-divider hover:shadow-2xl transition-all duration-500 h-full overflow-hidden">
                      <motion.div
                        animate={{
                          opacity: hoveredFeature === index ? 0.1 : 0,
                        }}
                        className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0`}
                        transition={{ duration: 0.3 }}
                      />
                      <CardBody className="p-8 text-center relative z-10 flex flex-col h-full">
                        <motion.div
                          className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6"
                          transition={{
                            rotate: { duration: 0.5 },
                            scale: { duration: 0.2 },
                          }}
                          whileHover={{
                            rotate: [0, -10, 10, -10, 0],
                            scale: 1.2,
                          }}
                        >
                          <motion.div
                            animate={
                              hoveredFeature === index
                                ? {
                                    scale: [1, 1.2, 1],
                                  }
                                : {}
                            }
                            transition={{ duration: 0.6 }}
                          >
                            <Icon
                              className="text-primary"
                              icon={feature.icon}
                              width={32}
                            />
                          </motion.div>
                        </motion.div>
                        <motion.h3
                          animate={
                            hoveredFeature === index
                              ? {
                                  scale: [1, 1.05, 1],
                                }
                              : {}
                          }
                          className="text-xl font-semibold mb-4"
                          transition={{ duration: 0.3 }}
                        >
                          {feature.title}
                        </motion.h3>
                        <motion.p
                          animate={
                            hoveredFeature === index
                              ? {
                                  y: [0, -2, 0],
                                }
                              : {}
                          }
                          className="text-default-600 leading-relaxed flex-1"
                          transition={{ duration: 0.3 }}
                        >
                          {feature.description}
                        </motion.p>
                      </CardBody>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Enhanced How It Works Section */}
        <section className="py-20 bg-gradient-to-b from-default-50 to-background">
          <div className="container mx-auto max-w-7xl px-6">
            <motion.div
              className="text-center mb-16"
              initial={{ y: 50, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 80,
                damping: 15,
              }}
              viewport={{ once: true }}
              whileInView={{ y: 0, opacity: 1 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Get Started in 3 Easy Steps
              </h2>
              <p className="text-lg text-default-600">
                No technical knowledge required. We&apos;ll guide you through
                everything.
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-12"
              initial="hidden"
              variants={containerVariants}
              viewport={{ once: true }}
              whileInView="visible"
            >
              {[
                {
                  step: 1,
                  title: "Sign Up",
                  description:
                    "Create your account using Google or GitHub. No passwords to remember - just use what you already have!",
                  gradient: "from-primary to-primary-600",
                  badge: { icon: "mdi:star", color: "bg-yellow-400" },
                },
                {
                  step: 2,
                  title: "Add Your Codes",
                  description:
                    "Scan QR codes from your apps or upload screenshots. Works with Google, Facebook, Twitter, and hundreds more!",
                  gradient: "from-secondary to-secondary-600",
                  badge: { icon: "mdi:check", color: "bg-green-400" },
                },
                {
                  step: 3,
                  title: "You're All Set!",
                  description:
                    "Access your codes anywhere, anytime. Your accounts are now more secure and easier to manage than ever before.",
                  gradient: "from-success to-success-600",
                  badge: { icon: "mdi:heart", color: "bg-purple-400" },
                },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  variants={itemVariants}
                  whileHover={{ y: -10 }}
                  onHoverEnd={() => setHoveredStep(null)}
                  onHoverStart={() => setHoveredStep(index)}
                >
                  <motion.div
                    animate={
                      hoveredStep === index
                        ? {
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0],
                          }
                        : {}
                    }
                    className="relative mb-6"
                    transition={{ duration: 0.8 }}
                  >
                    <motion.div
                      className={`w-20 h-20 bg-gradient-to-br ${step.gradient} rounded-full flex items-center justify-center mx-auto shadow-lg`}
                      whileHover={{
                        scale: 1.2,
                        boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                      }}
                    >
                      <span className="text-3xl font-bold text-white">
                        {step.step}
                      </span>
                    </motion.div>
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      className={`absolute -top-2 -right-2 w-8 h-8 ${step.badge.color} rounded-full border-2 border-white flex items-center justify-center`}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.5,
                      }}
                    >
                      <Icon
                        className="text-white"
                        height={16}
                        icon={step.badge.icon}
                        width={16}
                      />
                    </motion.div>
                  </motion.div>
                  <motion.h3
                    animate={
                      hoveredStep === index
                        ? {
                            y: [0, -2, 0],
                          }
                        : {}
                    }
                    className="text-xl font-semibold mb-3"
                    transition={{ duration: 0.5 }}
                  >
                    {step.title}
                  </motion.h3>
                  <motion.p
                    animate={
                      hoveredStep === index
                        ? {
                            y: [0, -2, 0],
                          }
                        : {}
                    }
                    className="text-default-600 leading-relaxed"
                    transition={{ duration: 0.3 }}
                  >
                    {step.description}
                  </motion.p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Enhanced Social Proof */}
        <section className="py-16 bg-background">
          <div className="container mx-auto max-w-4xl px-6 text-center">
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              initial="hidden"
              variants={containerVariants}
              viewport={{ once: true }}
              whileInView="visible"
            >
              {[
                {
                  value: "500+",
                  label: "Happy Users",
                  icon: "mdi:account-group",
                },
                { value: "99.9%", label: "Uptime", icon: "mdi:server" },
                { value: "24/7", label: "Support", icon: "mdi:headset" },
              ].map((stat, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <motion.div
                    className="p-6 rounded-lg bg-gradient-to-br from-primary-50 to-secondary-50 border border-primary-100"
                    whileHover={{ scale: 1.1, y: -5 }}
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      className="mb-4"
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.5,
                      }}
                    >
                      <Icon
                        className="text-primary mx-auto"
                        icon={stat.icon}
                        width={32}
                      />
                    </motion.div>
                    <motion.div
                      animate={{
                        scale: [1, 1.05, 1],
                      }}
                      className="text-3xl font-bold text-primary mb-2"
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.3,
                      }}
                    >
                      {stat.value}
                    </motion.div>
                    <p className="text-default-600">{stat.label}</p>
                  </motion.div>
                </motion.div>
              ))}
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
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.1, 0.2, 0.1],
                }}
                className="absolute w-24 h-24 border border-primary/10 rounded-full"
                style={{
                  left: `${30 + i * 40}%`,
                  top: `${50}%`,
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
              transition={{
                type: "spring",
                stiffness: 80,
                damping: 15,
              }}
              viewport={{ once: true }}
              whileInView={{ y: 0, opacity: 1 }}
            >
              <motion.h2
                className="text-3xl sm:text-4xl font-bold text-foreground mb-6"
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
                whileInView={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
              >
                Ready to Make Your Life Easier?
              </motion.h2>
              <motion.p
                className="text-lg text-default-600 mb-8 max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                whileInView={{ opacity: 1 }}
              >
                Join thousands of people who&apos;ve simplified their digital
                life with 2FAir. It&apos;s free to start and takes just 2
                minutes to set up.
              </motion.p>

              <motion.div
                className="mb-4"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 8px 30px rgba(59, 130, 246, 0.3)",
                      "0 15px 60px rgba(59, 130, 246, 0.4)",
                      "0 8px 30px rgba(59, 130, 246, 0.3)",
                    ],
                  }}
                  className="inline-block rounded-lg"
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Button
                    className="px-8 py-3 text-lg font-semibold"
                    color="primary"
                    isLoading={isLoading}
                    size="lg"
                    onPress={handleGetStarted}
                  >
                    {isAuthenticated ? "Open My Codes" : "Start Free Today"}
                  </Button>
                </motion.div>
              </motion.div>

              <motion.p
                className="text-sm text-default-500"
                initial={{ opacity: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                whileInView={{ opacity: 1 }}
              >
                No spam, no hidden fees, no complicated setup. Just security
                made simple.
              </motion.p>
            </motion.div>
          </div>
        </section>
      </LandingLayout>
    </div>
  );
}
