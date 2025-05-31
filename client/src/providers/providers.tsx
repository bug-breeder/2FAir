import React from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { AuthProvider } from "./auth-provider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <HeroUIProvider>
          <NextThemesProvider attribute="class" defaultTheme="dark">
            <AuthProvider>{children}</AuthProvider>
          </NextThemesProvider>
        </HeroUIProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
} 