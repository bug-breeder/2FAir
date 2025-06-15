# 2FAir Client Testing Guide

This guide covers the testing setup and patterns for the 2FAir React frontend application.

## Testing Stack

- **Test Runner**: Vitest (fast Vite-native test runner)
- **Testing Library**: React Testing Library (component testing)
- **Mocking**: Vitest `vi` functions
- **Assertions**: Vitest built-in matchers + @testing-library/jest-dom
- **Coverage**: Built-in Vitest coverage

## Setup

### Dependencies Installed

```json
{
  "@testing-library/react": "^16.3.0",
  "@testing-library/jest-dom": "^6.6.3",
  "@testing-library/user-event": "^14.6.1",
  "@testing-library/dom": "^10.4.0",
  "vitest": "^3.2.3",
  "jsdom": "^26.1.0",
  "msw": "^2.10.2",
  "happy-dom": "^18.0.1"
}
```

### Configuration

- **Vitest Config**: `vite.config.ts` with test environment setup
- **Test Setup**: `src/test/setup.ts` with global mocks and utilities
- **Test Utilities**: `src/test/utils.tsx` with custom render and mocks

## Test Scripts

```bash
# Run tests in watch mode
yarn test

# Run tests once
yarn test:run

# Run tests with UI
yarn test:ui

# Run tests with coverage
yarn test:coverage
```

## Test Structure

### Directory Organization

```
src/
├── test/
│   ├── setup.ts          # Global test setup
│   ├── utils.tsx          # Test utilities and mocks
│   └── README.md          # This file
├── components/
│   └── __tests__/         # Component tests
├── hooks/
│   └── __tests__/         # Hook tests
├── lib/
│   └── __tests__/         # Utility function tests
├── providers/
│   └── __tests__/         # Context provider tests
└── pages/
    └── __tests__/         # Page component tests
```

## Testing Patterns

### 1. Utility Function Tests

**Example**: `src/lib/__tests__/search.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { searchOTPs, getSearchStats } from "../search";

describe("search utilities", () => {
  it("should filter by issuer (case insensitive)", () => {
    const result = searchOTPs(mockData, "github");
    expect(result).toHaveLength(1);
    expect(result[0].otp.Issuer).toBe("GitHub");
  });
});
```

**Best Practices**:
- Test pure functions thoroughly
- Use descriptive test names
- Test edge cases (empty strings, null values)
- Test both positive and negative cases

### 2. Component Tests

**Example Structure**:

```typescript
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "../../test/utils";
import { ComponentName } from "../component-name";

// Mock external dependencies
vi.mock("external-library", () => ({
  useHook: () => ({ data: "mock" }),
}));

describe("ComponentName", () => {
  it("should render correctly", () => {
    render(<ComponentName />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });

  it("should handle user interactions", async () => {
    const mockFn = vi.fn();
    render(<ComponentName onAction={mockFn} />);
    
    await user.click(screen.getByRole("button"));
    expect(mockFn).toHaveBeenCalled();
  });
});
```

**Testing Priorities for Components**:
1. **Rendering**: Component renders without crashing
2. **Props**: Component handles different prop combinations
3. **User Interactions**: Click, input, form submissions
4. **State Changes**: Component responds to state updates
5. **Accessibility**: ARIA labels, keyboard navigation
6. **Error States**: Component handles errors gracefully

### 3. Hook Tests

**Example Structure** (when mocking is resolved):

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCustomHook } from "../hooks";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe("useCustomHook", () => {
  it("should return expected data", async () => {
    const { result } = renderHook(() => useCustomHook(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
```

### 4. Integration Tests

**Testing Components with Providers**:

```typescript
import { render } from "../../test/utils"; // Uses AllTheProviders wrapper

describe("Integration Test", () => {
  it("should work with all providers", () => {
    render(<ComplexComponent />);
    // Test component with React Query, Router, etc.
  });
});
```

## Mocking Strategies

### 1. External Libraries

```typescript
// Mock QR Scanner
vi.mock("qr-scanner", () => ({
  default: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    destroy: vi.fn(),
  })),
}));

// Mock React Router
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});
```

### 2. API Calls

```typescript
// Mock API functions
vi.mock("../lib/api/otp", () => ({
  addOtp: vi.fn(),
  listOtps: vi.fn(),
  editOtp: vi.fn(),
}));
```

### 3. Browser APIs

```typescript
// Mock clipboard API
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: vi.fn().mockImplementation(() => Promise.resolve()),
  },
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

## Test Utilities

### Custom Render Function

```typescript
// src/test/utils.tsx
export function AllTheProviders({ children }) {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <HeroUIProvider>
          {children}
        </HeroUIProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export const customRender = (ui, options) => 
  render(ui, { wrapper: AllTheProviders, ...options });

export { customRender as render };
```

### Mock Data

```typescript
export const mockOtpData = {
  id: "1",
  issuer: "GitHub",
  label: "test@example.com",
  secret: "JBSWY3DPEHPK3PXP",
  algorithm: "SHA1",
  digits: 6,
  period: 30,
  method: "TOTP",
};
```

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### Priority Areas for Testing

1. **Critical Business Logic** (OTP operations, authentication)
2. **User Interactions** (forms, buttons, navigation)
3. **Error Handling** (network errors, validation errors)
4. **Accessibility** (keyboard navigation, screen readers)
5. **Data Transformation** (search, filtering, formatting)

## Testing Checklist

### Before Writing Tests
- [ ] Identify the component's responsibilities
- [ ] List all props and their expected behaviors
- [ ] Identify user interactions to test
- [ ] Consider error states and edge cases

### Component Test Checklist
- [ ] Renders without crashing
- [ ] Displays expected content
- [ ] Handles props correctly
- [ ] Responds to user interactions
- [ ] Shows loading states
- [ ] Handles error states
- [ ] Is accessible (ARIA labels, keyboard navigation)

### Hook Test Checklist
- [ ] Returns expected initial state
- [ ] Updates state correctly
- [ ] Handles async operations
- [ ] Cleans up resources
- [ ] Handles error cases

## Running Tests

### Local Development

```bash
# Watch mode (recommended for development)
yarn test

# Run specific test file
yarn test src/components/__tests__/component.test.tsx

# Run tests matching pattern
yarn test --grep "search"

# Run with coverage
yarn test:coverage
```

### CI/CD Pipeline

```bash
# Run all tests once
yarn test:run

# Generate coverage report
yarn test:coverage
```

## Debugging Tests

### Common Issues

1. **Mock not working**: Ensure mocks are defined before imports
2. **Async test failures**: Use `waitFor` for async operations
3. **Provider issues**: Use the custom render function with providers
4. **Type errors**: Add proper TypeScript types for mocks

### Debugging Tips

```typescript
// Debug component state
screen.debug(); // Prints current DOM

// Debug specific element
screen.debug(screen.getByTestId("element"));

// Check what's rendered
console.log(screen.getByRole("button").outerHTML);

// Async debugging
await screen.findByText("Expected text", {}, { timeout: 5000 });
```

## Best Practices

### DO ✅

- Write tests for critical user paths
- Use descriptive test names
- Test behavior, not implementation
- Mock external dependencies
- Use semantic queries (`getByRole`, `getByLabelText`)
- Test accessibility features
- Keep tests simple and focused
- Use `waitFor` for async operations

### DON'T ❌

- Test implementation details
- Over-mock internal functions
- Write overly complex tests
- Ignore accessibility in tests
- Forget to clean up mocks
- Test third-party library functionality
- Skip error state testing

## Future Improvements

1. **E2E Testing**: Add Cypress or Playwright for end-to-end tests
2. **Visual Regression**: Add visual testing for UI components
3. **Performance Testing**: Add performance benchmarks
4. **API Testing**: Add comprehensive API integration tests
5. **Accessibility Testing**: Add automated a11y testing with axe-core

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library) 