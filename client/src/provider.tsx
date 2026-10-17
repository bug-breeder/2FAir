import React from "react";
import { HeroUIProvider } from "@heroui/system";
import { ToastProvider } from "@heroui/toast";
import { useHref, useNavigate } from "react-router-dom";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { VaultProvider } from "./providers/vault-provider";

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <HeroUIProvider navigate={navigate} useHref={useHref}>
      <NextThemesProvider enableSystem attribute="class" defaultTheme="system">
        <VaultProvider>{children}</VaultProvider>
      </NextThemesProvider>
      <ToastProvider placement="top-center" toastOffset={8} />
    </HeroUIProvider>
  );
}
