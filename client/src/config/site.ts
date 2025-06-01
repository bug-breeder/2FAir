export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "2FAir",
  description: "Lock down your logins with ease! Secure 2FA management made simple.",
  navItems: [
    // Main navigation items - keeping minimal for 2FA app
  ],
  navMenuItems: [
    {
      label: "Dashboard",
      href: "/",
    },
    {
      label: "Settings",
      href: "/settings",
    },
    {
      label: "Security",
      href: "/security",
    },
    {
      label: "Export Data",
      href: "/export",
    },
    {
      label: "Help & Support",
      href: "/help",
    },
    {
      label: "About",
      href: "/about",
    },
  ],
  links: {
    github: "https://github.com/anh-ngn/2FAir",
    email: "mailto:anhngzv@gmail.com",
    sponsor: "https://www.buymeacoffee.com/battle_beast",
    docs: "https://github.com/anh-ngn/2FAir/wiki",
    discord: "https://discord.gg/2fair",
  },
};
