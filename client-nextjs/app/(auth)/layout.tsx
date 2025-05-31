"use client";

import { Providers } from "../providers";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers
      themeProps={{
        attribute: "class",
        defaultTheme: "system",
        enableSystem: true,
        disableTransitionOnChange: true,
      }}
    >
      {children}
    </Providers>
  );
} 