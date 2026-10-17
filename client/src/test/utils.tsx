import { ReactElement, ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { HeroUIProvider } from "@heroui/react";

export function AllTheProviders({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <HeroUIProvider>{children}</HeroUIProvider>
    </BrowserRouter>
  );
}

export const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };
