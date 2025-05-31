import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import Link from "next/link";
import clsx from "clsx";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/providers/auth-provider";
import { ThemeProvider } from "next-themes";
import { fontSans } from "@/config/fonts";
import { ErrorBoundary } from "@/components/error-boundary";

import { siteConfig } from "@/config/site";
import { FAir, GithubIcon, HeartFilledIcon } from "@/components/icons";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "2FAir - Secure 2FA Management",
  description: "A secure and modern way to manage your 2FA tokens",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`bg-background font-sans antialiased ${fontSans.variable} ${inter.className}`}
      >
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <div className="relative flex min-h-screen flex-col">
                {children}
              </div>
              <Toaster
                toastOptions={{
                  duration: 5000,
                }}
              />
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
