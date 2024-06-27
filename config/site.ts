export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "2FAir",
  description: "Lock down your logins with ease!",
  navItems: [
    // {
    //   label: "Home",
    //   href: "/",
    // },
    {
      label: "Docs",
      href: "/docs",
    },
    {
      label: "About",
      href: "/about",
    },
  ],
  navMenuItems: [
    {
      label: "Profile",
      href: "/profile",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Projects",
      href: "/projects",
    },
    {
      label: "Team",
      href: "/team",
    },
    {
      label: "Calendar",
      href: "/calendar",
    },
    {
      label: "Settings",
      href: "/settings",
    },
    {
      label: "Help & Feedback",
      href: "/help-feedback",
    },
    {
      label: "Logout",
      href: "/logout",
    },
  ],
  links: {
    github: "https://github.com/anh-ngn/2FAir-UI",
    email: "mailto://anhngzv@gmail.com",
    sponsor: "https://www.buymeacoffee.com/battle_beast",
  },
};
