import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ReactElement, ReactNode } from "react";
import { vi } from "vitest";
import { HeroUIProvider } from "@heroui/react";

// Mock data for tests
export const mockOtpData = {
  id: "1",
  issuer: "GitHub",
  label: "test@example.com",
  secret: "JBSWY3DPEHPK3PXP",
  algorithm: "SHA1" as const,
  digits: 6,
  period: 30,
  method: "TOTP" as const,
  active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

export const mockUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  picture: "https://example.com/picture.jpg",
  provider: "google" as const,
};

export const mockOtpCodes = {
  current: {
    code: "123456",
    expires_at: new Date(Date.now() + 30000).toISOString(),
  },
  next: {
    code: "789012",
    expires_at: new Date(Date.now() + 60000).toISOString(),
  },
};

// Create a wrapper component for tests
interface AllTheProvidersProps {
  children: ReactNode;
}

export function AllTheProviders({ children }: AllTheProvidersProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <HeroUIProvider>{children}</HeroUIProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

// Custom render function
export const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from React Testing Library
export * from "@testing-library/react";
export { customRender as render };

// Mock API client functions
export const mockAddOtp = vi.fn();
export const mockInactivateOtp = vi.fn();
export const mockEditOtp = vi.fn();
export const mockListOtps = vi.fn();
// mockGenerateOtpCodes removed - now using client-side generation

// Mock the API functions
vi.mock("../lib/api/otp", () => ({
  addOtp: mockAddOtp,
  inactivateOtp: mockInactivateOtp,
  editOtp: mockEditOtp,
  listOtps: mockListOtps,
  // generateOtpCodes removed - now using client-side generation
}));

// Mock react-router-dom hooks
export const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock QR Scanner
vi.mock("qr-scanner", () => ({
  default: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    destroy: vi.fn(),
    setCamera: vi.fn(),
    turnFlashOn: vi.fn(),
    turnFlashOff: vi.fn(),
  })),
  scanImage: vi.fn(),
}));

// Mock OTPAuth
vi.mock("otpauth", () => ({
  TOTP: vi.fn().mockImplementation(() => ({
    generate: vi.fn().mockReturnValue("123456"),
  })),
  URI: {
    parse: vi.fn().mockReturnValue({
      issuer: "GitHub",
      label: "test@example.com",
      secret: { base32: "JBSWY3DPEHPK3PXP" },
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    }),
  },
}));

// Helper function to wait for async operations
export const waitForNextTick = () =>
  new Promise((resolve) => setTimeout(resolve, 0));
