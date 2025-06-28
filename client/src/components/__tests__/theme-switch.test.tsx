import { describe, it, expect, vi, beforeEach } from "vitest";

import { render, screen, fireEvent } from "../../test/utils";
import { ThemeSwitch } from "../theme-switch";

// Mock next-themes
const mockSetTheme = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: mockSetTheme,
    resolvedTheme: "light",
  }),
}));

describe("ThemeSwitch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render theme switch", () => {
    render(<ThemeSwitch />);

    // The switch is visually hidden but accessible to screen readers
    const themeSwitch = screen.getByRole("switch", { hidden: true });

    expect(themeSwitch).toBeInTheDocument();
  });

  it("should be accessible with correct attributes", () => {
    render(<ThemeSwitch />);

    const themeSwitch = screen.getByRole("switch", { hidden: true });

    expect(themeSwitch).toHaveAttribute("type", "checkbox");
    expect(themeSwitch).toHaveAttribute("role", "switch");
  });

  it("should call setTheme when clicked", () => {
    render(<ThemeSwitch />);

    // Click on the label which contains the hidden switch
    const label = screen.getByRole("switch", { hidden: true }).closest("label");

    expect(label).toBeInTheDocument();

    if (label) {
      fireEvent.click(label);
      expect(mockSetTheme).toHaveBeenCalled();
    }
  });

  it("should display moon icon for light theme", () => {
    render(<ThemeSwitch />);

    // Check for the presence of the moon icon SVG (it has aria-hidden="true")
    const moonIcon = screen.getByRole("presentation", { hidden: true });

    expect(moonIcon).toBeInTheDocument();

    // Verify it's an SVG element
    expect(moonIcon.tagName).toBe("svg");
  });
});
