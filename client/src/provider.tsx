import React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ToastProvider } from "@heroui/toast";

import { AuthProvider } from "./providers/auth-provider";
import { SearchProvider } from "./providers/search-provider";

export interface ProviderProps {
  children: React.ReactNode;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

export function Provider({ children }: ProviderProps) {
  const navigate = useNavigate();

  return (
    <HeroUIProvider navigate={navigate}>
      <NextThemesProvider enableSystem attribute="class" defaultTheme="system">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SearchProvider>{children}</SearchProvider>
          </AuthProvider>
        </QueryClientProvider>
      </NextThemesProvider>
      <ToastProvider placement="bottom-center" />
    </HeroUIProvider>
  );
}
