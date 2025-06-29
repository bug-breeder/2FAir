import { Card, CardBody, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { useRef, useState } from "react";

import LandingLayout from "@/layouts/landing";

export default function AboutPage() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const constellationRef = useRef(null);
  
  // Scroll-linked animations
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const { scrollYProgress: constellationScroll } = useScroll({
    target: constellationRef,
    offset: ["start end", "end start"]
  });

  // Transform values
  const heroY = useTransform(heroScroll, [0, 1], [0, -100]);
  const heroOpacity = useTransform(heroScroll, [0, 0.8], [1, 0]);
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  
  const constellationY = useTransform(constellationScroll, [0, 1], ["0%", "50%"]);
  const constellationOpacity = useTransform(constellationScroll, [0, 0.8], [1, 0.2]);

  // Interactive states
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const values = [
    {
      icon: "mdi:shield-lock",
      title: "End-to-End Encryption",
      description: "Your codes are encrypted from your device to our servers. We built 2FAir so that nobody - not even us - can see your codes.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: "mdi:heart-handshake",
      title: "Honest & Transparent",
      description: "Our code is open for everyone to see. No hidden tricks, no secret backdoors. What you see is what you get.",
      color: "from-pink-500 to-rose-500"
    },
    {
      icon: "mdi:shield-crown",
      title: "Military-Grade Protection",
      description: "We use the same security standards as banks and governments to keep your codes safe from hackers.",
      color: "from-purple-500 to-indigo-500"
    }
  ];

  const howItWorks = [
    {
      title: "Your Codes Stay On Your Device",
      description: "When you add a code to 2FAir, it gets encrypted on your device before anything is sent to our servers. Think of it like putting your codes in a locked box that only you have the key to.",
      icon: "mdi:cellphone-lock"
    },
    {
      title: "No Passwords Required",
      description: "Instead of remembering another password, you use your fingerprint, face ID, or a security key to unlock your codes. It's like having a personal bodyguard for your digital life.",
      icon: "mdi:fingerprint"
    },
    {
      title: "Automatic Backup",
      description: "Your encrypted codes are safely stored in the cloud, but we can't read them. If you lose your phone, you can restore everything on a new device.",
      icon: "mdi:cloud-sync"
    },
    {
      title: "Works Everywhere",
      description: "Whether you're on your phone, tablet, or computer, your codes sync automatically. No manual copying or typing required.",
      icon: "mdi:devices"
    }
  ];

  // Enhanced animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { 
      y: 60, 
      opacity: 0,
      scale: 0.8,
      rotateX: -15
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
        duration: 0.8
      }
    }
  };

  const floatingIconVariants = {
    animate: {
      y: [-20, 20, -20],
      x: [-10, 10, -10],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
        times: [0, 0.5, 1]
      }
    }
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.8, 1],
      opacity: [0.3, 0.8, 0.3],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div ref={containerRef}>
      <LandingLayout 
        title="About 2FAir - Security Made Simple"
        description="Learn how 2FAir makes your digital life more secure without the complexity. Privacy-first, user-friendly, and built with love."
      >
        {/* Hero Section with Parallax */}
        <section ref={heroRef} className="py-20 sm:py-32 bg-gradient-to-b from-primary-50/50 via-secondary-50/30 to-background dark:from-primary-950/30 dark:via-secondary-950/20 overflow-hidden">
          <motion.div 
            className="container mx-auto max-w-4xl px-6 text-center"
            style={{ y: heroY, opacity: heroOpacity }}
          >
            <motion.h1 
              className="text-4xl sm:text-5xl font-bold text-foreground mb-6"
              initial={{ y: -80, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 100,
                damping: 15,
                duration: 1.2
              }}
            >
              <motion.span
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="bg-gradient-to-r from-primary via-secondary to-primary bg-300% bg-clip-text text-transparent"
              >
                Security Shouldn't Be Complicated
              </motion.span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-default-600 mb-8 leading-relaxed"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 80,
                damping: 12,
                delay: 0.3,
                duration: 1
              }}
            >
              We believe everyone deserves simple, secure access to their digital accounts. 
              That's why we built 2FAir - to make strong security as easy as using any other app.
            </motion.p>

            {/* Floating background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-primary/20 rounded-full"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${30 + (i % 3) * 20}%`,
                  }}
                  animate={{
                    y: [-20, 20, -20],
                    opacity: [0.2, 0.8, 0.2],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 4 + i * 0.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.3,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </section>

        {/* Mission Section with Enhanced Constellation */}
        <section className="py-20 bg-background">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 60,
                  damping: 15,
                  duration: 1
                }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <motion.h2 
                  className="text-3xl font-bold text-foreground mb-6"
                  whileInView={{
                    backgroundPosition: ["0% 50%", "100% 50%"],
                  }}
                  transition={{
                    duration: 2,
                    ease: "easeInOut"
                  }}
                >
                  Why We Built 2FAir
                </motion.h2>
                
                <motion.div 
                  className="space-y-4 text-lg text-default-600 leading-relaxed"
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {[
                    "We got tired of juggling multiple apps for our 2FA codes. Every time we needed to log in somewhere, it was a hunt through different apps, sometimes across different devices.",
                    "Other solutions either weren't secure enough or were so complicated that only tech experts could use them. We wanted something different - maximum security with minimum hassle.",
                    "So we built 2FAir: a place where all your codes live safely, work everywhere, and are always just a tap away. No PhD in computer science required."
                  ].map((text, index) => (
                    <motion.p key={index} variants={itemVariants}>
                      {text}
                    </motion.p>
                  ))}
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-6"
                >
                  <motion.div
                    animate={{
                      boxShadow: [
                        "0 4px 20px rgba(59, 130, 246, 0.3)",
                        "0 8px 40px rgba(59, 130, 246, 0.4)",
                        "0 4px 20px rgba(59, 130, 246, 0.3)"
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="inline-block rounded-lg"
                  >
                    <Button
                      color="primary"
                      size="lg"
                      onPress={() => navigate("/login")}
                    >
                      Try It Yourself
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Enhanced Security Constellation */}
              <motion.div 
                ref={constellationRef}
                className="flex justify-center"
                initial={{ x: 100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 60,
                  damping: 15,
                  duration: 1
                }}
                viewport={{ once: true }}
              >
                <motion.div 
                  className="relative w-96 h-96 rounded-full flex items-center justify-center"
                  style={{ 
                    background: "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 50%, rgba(236, 72, 153, 0.1) 100%)"
                  }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Orbital rings */}
                  {[60, 100, 140].map((radius, i) => (
                    <motion.div
                      key={i}
                      className="absolute border border-primary/20 rounded-full"
                      style={{
                        width: radius * 2,
                        height: radius * 2,
                      }}
                    />
                  ))}

                  {/* Central lock icon with enhanced effects */}
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center"
                    variants={floatingIconVariants}
                    animate="animate"
                  >
                    <motion.div
                      whileHover={{ 
                        scale: 1.2,
                        filter: "drop-shadow(0 0 20px rgba(59, 130, 246, 0.6))"
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <Icon icon="mdi:lock-check" className="text-primary" width={80} />
                    </motion.div>
                  </motion.div>
                  
                  {/* Surrounding security icons with orbital motion */}
                  {[
                    { icon: "mdi:shield-outline", color: "text-secondary", angle: 0 },
                    { icon: "mdi:key-variant", color: "text-success", angle: 90 },
                    { icon: "mdi:fingerprint", color: "text-warning", angle: 180 },
                    { icon: "mdi:eye-off", color: "text-danger", angle: 270 }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      className="absolute"
                      style={{
                        x: Math.cos((item.angle * Math.PI) / 180) * 100,
                        y: Math.sin((item.angle * Math.PI) / 180) * 100,
                      }}
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        scale: {
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: index * 0.5
                        }
                      }}
                      whileHover={{ 
                        scale: 1.5,
                        zIndex: 10,
                        filter: "drop-shadow(0 0 15px currentColor)"
                      }}
                    >
                      <Icon icon={item.icon} className={item.color} width={32} />
                    </motion.div>
                  ))}
                  
                  {/* Enhanced animated particles */}
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-primary rounded-full"
                      style={{
                        x: Math.cos((i * 45 * Math.PI) / 180) * (120 + i * 10),
                        y: Math.sin((i * 45 * Math.PI) / 180) * (120 + i * 10),
                      }}
                      variants={pulseVariants}
                      animate="animate"
                      transition={{
                        delay: i * 0.2,
                        duration: 2 + i * 0.3,
                        repeat: Infinity,
                      }}
                    />
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Enhanced Values Section */}
        <section className="py-20 bg-gradient-to-b from-default-50 to-background">
          <div className="container mx-auto max-w-7xl px-6">
            <motion.div 
              className="text-center mb-16"
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
                className="text-3xl font-bold text-foreground mb-4"
                whileInView={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  ease: "easeInOut"
                }}
              >
                What We Stand For
              </motion.h2>
              <p className="text-lg text-default-600">
                These aren't just words on a website. They guide every decision we make.
              </p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              {values.map((value, index) => (
                <motion.div 
                  key={index} 
                  variants={itemVariants}
                  layout
                  onHoverStart={() => setHoveredValue(index)}
                  onHoverEnd={() => setHoveredValue(null)}
                >
                  <motion.div
                    whileHover={{ 
                      scale: 1.08,
                      y: -15,
                      rotateY: 5,
                      z: 50
                    }}
                    transition={{ 
                      type: "spring",
                      stiffness: 300,
                      damping: 20
                    }}
                    style={{
                      transformStyle: "preserve-3d",
                      perspective: 1000
                    }}
                  >
                    <Card className="border border-divider hover:shadow-2xl transition-all duration-500 h-full overflow-hidden">
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-br ${value.color} opacity-0`}
                        animate={{
                          opacity: hoveredValue === index ? 0.1 : 0
                        }}
                        transition={{ duration: 0.3 }}
                      />
                      <CardBody className="p-8 text-center relative z-10">
                        <motion.div 
                          className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6"
                          whileHover={{ 
                            rotate: [0, -10, 10, -10, 0],
                            scale: 1.2
                          }}
                          transition={{ 
                            rotate: { duration: 0.5 },
                            scale: { duration: 0.2 }
                          }}
                        >
                          <motion.div
                            animate={hoveredValue === index ? {
                              scale: [1, 1.2, 1]
                            } : {}}
                            transition={{ duration: 0.6 }}
                          >
                            <Icon 
                              icon={value.icon} 
                              className="text-primary" 
                              width={32} 
                            />
                          </motion.div>
                        </motion.div>
                        <motion.h3 
                          className="text-xl font-semibold mb-4"
                          animate={hoveredValue === index ? {
                            scale: [1, 1.05, 1]
                          } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          {value.title}
                        </motion.h3>
                        <motion.p 
                          className="text-default-600 leading-relaxed"
                          animate={hoveredValue === index ? {
                            y: [0, -2, 0]
                          } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          {value.description}
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
        <section className="py-20 bg-background">
          <div className="container mx-auto max-w-4xl px-6">
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
              <h2 className="text-3xl font-bold text-foreground mb-8 text-center">How We Keep You Safe</h2>
              <p className="text-lg text-default-600 mb-12 text-center">
                Security doesn't have to be scary. Here's how 2FAir protects you in simple terms:
              </p>
            </motion.div>
            
            <motion.div 
              className="space-y-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              {howItWorks.map((item, index) => (
                <motion.div 
                  key={index} 
                  variants={itemVariants}
                  layout
                  onHoverStart={() => setHoveredStep(index)}
                  onHoverEnd={() => setHoveredStep(null)}
                >
                  <motion.div
                    whileHover={{ 
                      x: 15,
                      scale: 1.02,
                      boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
                    }}
                    transition={{ 
                      type: "spring",
                      stiffness: 400,
                      damping: 25
                    }}
                  >
                    <Card className="border border-divider hover:border-primary/50 transition-all duration-300">
                      <CardBody className="p-8">
                        <div className="flex items-start gap-6">
                          <motion.div 
                            className="flex-shrink-0"
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <motion.div 
                              className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4"
                              animate={hoveredStep === index ? {
                                scale: [1, 1.2, 1]
                              } : {}}
                              transition={{ duration: 0.6 }}
                            >
                              <span className="text-white font-bold text-sm">{index + 1}</span>
                            </motion.div>
                            <motion.div
                              className="w-12 h-12 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center"
                              animate={hoveredStep === index ? {
                                y: [0, -10, 0],
                                rotate: [0, 10, -10, 0]
                              } : {}}
                              transition={{ duration: 0.8 }}
                            >
                              <Icon 
                                icon={item.icon} 
                                className="text-primary" 
                                width={24} 
                              />
                            </motion.div>
                          </motion.div>
                          <div className="flex-1">
                            <motion.h3 
                              className="text-xl font-semibold mb-3"
                              animate={hoveredStep === index ? {
                                x: [0, 5, 0]
                              } : {}}
                              transition={{ duration: 0.5 }}
                            >
                              {item.title}
                            </motion.h3>
                            <motion.p 
                              className="text-default-600 leading-relaxed"
                              animate={hoveredStep === index ? {
                                y: [0, -2, 0]
                              } : {}}
                              transition={{ duration: 0.3 }}
                            >
                              {item.description}
                            </motion.p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Enhanced Trust Section */}
        <section className="py-20 bg-gradient-to-r from-primary-50/40 via-secondary-50/30 to-primary-50/40 dark:from-primary-950/20 dark:via-secondary-950/15 dark:to-primary-950/20 overflow-hidden">
          <div className="container mx-auto max-w-4xl px-6 relative">
            {/* Background animated elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-5">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-24 h-24 border border-primary/10 rounded-full"
                  style={{
                    left: `${20 + i * 30}%`,
                    top: `${40 + (i % 2) * 20}%`,
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

            <motion.div 
              className="text-center relative z-10"
              initial={{ y: 100, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 60,
                damping: 15,
                duration: 1
              }}
              viewport={{ once: true }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  y: [0, -5, 0]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                whileHover={{
                  scale: 1.3,
                  filter: "drop-shadow(0 0 30px rgba(34, 197, 94, 0.6))"
                }}
                className="inline-block"
              >
                <Icon icon="mdi:shield-star" className="text-green-600 mx-auto mb-6" width={64} />
              </motion.div>
              
              <motion.h2 
                className="text-3xl font-bold text-foreground mb-6"
                whileInView={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                Trusted by Thousands
              </motion.h2>
              
              <motion.p 
                className="text-lg text-default-600 mb-8 max-w-2xl mx-auto leading-relaxed"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                Join thousands of users who've already made the switch to safer, simpler 2FA. 
                Our enterprise-grade security meets consumer-friendly design, protecting what matters most to you.
              </motion.p>
              
              {/* Trust badges */}
              <motion.div 
                className="flex flex-wrap justify-center gap-6 mb-8"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {[
                  { icon: "mdi:bank", text: "Bank-Level Security", color: "text-blue-600" },
                  { icon: "mdi:flash", text: "Lightning Fast", color: "text-yellow-600" },
                  { icon: "mdi:devices", text: "Cross-Platform", color: "text-green-600" },
                  { icon: "mdi:heart-pulse", text: "99.9% Uptime", color: "text-red-600" }
                ].map((badge, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    whileHover={{ scale: 1.1, y: -5 }}
                    className="flex items-center gap-2 bg-background/80 backdrop-blur-sm border border-divider rounded-full px-4 py-2 shadow-sm dark:bg-content1/80"
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 4, 
                        repeat: Infinity, 
                        ease: "easeInOut", 
                        delay: index * 0.5 
                      }}
                    >
                      <Icon icon={badge.icon} className={badge.color} width={20} />
                    </motion.div>
                    <span className="text-sm font-medium text-foreground">{badge.text}</span>
                  </motion.div>
                ))}
              </motion.div>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {[
                  {
                    variant: "bordered" as const,
                    href: "/pricing",
                    icon: "mdi:credit-card",
                    text: "View Pricing"
                  },
                  {
                    variant: "solid" as const,
                    color: "primary" as const,
                    onClick: () => navigate("/login"),
                    text: "Get Started Now"
                  }
                ].map((button, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    whileHover={{ 
                      scale: 1.08,
                      y: -5
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      animate={{
                        boxShadow: [
                          "0 4px 20px rgba(59, 130, 246, 0.0)",
                          "0 8px 40px rgba(59, 130, 246, 0.3)",
                          "0 4px 20px rgba(59, 130, 246, 0.0)"
                        ]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 1.5
                      }}
                      className="inline-block rounded-lg"
                    >
                      <Button
                        variant={button.variant}
                        color={button.color}
                        size="lg"
                        as={button.href ? "a" : "button"}
                        href={button.href}
                        onPress={button.onClick}
                        startContent={button.icon ? <Icon icon={button.icon} width={20} /> : undefined}
                      >
                        {button.text}
                      </Button>
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>
      </LandingLayout>
    </div>
  );
}
