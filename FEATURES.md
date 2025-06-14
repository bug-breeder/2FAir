# 2FAir Features Documentation

This document provides comprehensive technical documentation for all features in the 2FAir application. It's designed to help AI agents, developers, and contributors understand the application's capabilities and implementation details.

## Table of Contents

- [Authentication System](#authentication-system)
- [OTP Management](#otp-management)
- [QR Code Features](#qr-code-features)
- [User Interface Components](#user-interface-components)
- [Data Management](#data-management)
- [Navigation & Search](#navigation--search)
- [Security Features](#security-features)
- [API Endpoints](#api-endpoints)
- [Development Patterns](#development-patterns)

---

## Authentication System

### 1. OAuth Authentication

**Description**: Multi-provider OAuth authentication system supporting Google and Microsoft.

**Technical Implementation**:
- **Frontend**: React components in `client/src/pages/login.tsx`
- **Backend**: Gin middleware with Goth library in `server/internal/adapter/http/controller/auth.go`
- **Providers**: Google OAuth 2.0, Microsoft OAuth 2.0
- **State Management**: Auth provider context in `client/src/providers/auth-provider.tsx`

**Components**:
- `LoginPage` - OAuth login interface
- `AuthController` - Backend authentication handler
- `AuthProvider` - Frontend authentication context

**API Endpoints**:
```
GET /api/v1/auth/:provider          # Initiate OAuth flow
GET /api/v1/auth/:provider/callback # Handle OAuth callback
POST /api/v1/auth/refresh           # Refresh access token
DELETE /api/v1/auth/refresh         # Logout user
GET /api/v1/auth/me                 # Get current user info
```

**Dependencies**:
- `@markbates/goth` (Go OAuth library)
- `@iconify/react` (OAuth provider icons)
- HTTP-only cookies for token storage

**Security Features**:
- CSRF protection via state parameter
- Secure HTTP-only cookies
- JWT token validation
- Session management

---

## OTP Management

### 2. Add OTP (Manual Entry)

**Description**: Manually add OTP entries with comprehensive validation.

**Technical Implementation**:
- **Component**: `AddOtpModal` in `client/src/components/add-otp-modal.tsx`
- **Backend**: `AddOTP` method in `server/internal/adapter/http/controller/otp.go`
- **Validation**: Both frontend and backend validation
- **State**: TanStack Query mutations for API calls

**Form Fields**:
- Issuer (service provider name)
- Label (account identifier)
- Secret (Base32 encoded key)
- Algorithm (SHA1, SHA256, SHA512)
- Digits (6-8 digits)
- Period (15-300 seconds for TOTP)
- Method (TOTP/HOTP)

**Validation Rules**:
- Secret: Base32 format, 16-128 characters
- Issuer/Label: No colons/semicolons, max 100 chars
- Algorithm: Must be SHA1, SHA256, or SHA512
- Digits: Between 6-8
- Period: Between 15-300 seconds

**API Endpoint**: `POST /api/v1/otp`

### 3. Edit OTP

**Description**: Modify existing OTP entries with partial update support.

**Technical Implementation**:
- **Component**: `EditOtpModal` in `client/src/components/edit-otp-modal.tsx`
- **Backend**: `EditOTP` method in `server/internal/adapter/http/controller/otp.go`
- **Validation**: `ValidateForEdit` in `server/internal/domain/models/otp.go`

**Features**:
- Partial field updates (only changed fields validated)
- Pre-populated form with existing values
- Same validation rules as Add OTP
- Real-time form validation

**API Endpoint**: `PUT /api/v1/otp/{id}`

### 4. Delete/Inactivate OTP

**Description**: Soft delete OTP entries by marking them as inactive.

**Technical Implementation**:
- **Component**: Context menu action in `client/src/components/context-menu.tsx`
- **Backend**: `InactivateOTP` method in `server/internal/adapter/http/controller/otp.go`
- **Hook**: `useInactivateOtp` in `client/src/hooks/otp.ts`

**Features**:
- Soft delete (marks as inactive)
- Confirmation via toast notification
- Automatic list refresh
- Context menu integration

**API Endpoint**: `POST /api/v1/otp/{id}/inactivate`

### 5. List OTPs

**Description**: Retrieve and display all active OTP entries for authenticated user.

**Technical Implementation**:
- **Component**: `HomePage` in `client/src/pages/home.tsx`
- **Backend**: `ListOTPs` method in `server/internal/adapter/http/controller/otp.go`
- **Hook**: `useListOtps` in `client/src/hooks/otp.ts`

**Features**:
- Real-time data fetching
- Automatic refresh on mutations
- Loading and error states
- Responsive grid layout

**API Endpoint**: `GET /api/v1/otp`

### 6. Generate OTP Codes

**Description**: Generate current and next time-based OTP codes.

**Technical Implementation**:
- **Backend**: `GenerateOTPCodes` method in `server/internal/adapter/http/controller/otp.go`
- **Hook**: `useGenerateOtpCodes` in `client/src/hooks/otp.ts`
- **Algorithm**: TOTP implementation with configurable periods

**Features**:
- Current and next code generation
- Expiration timestamp tracking
- Real-time code updates
- Support for multiple algorithms (SHA1, SHA256, SHA512)

**API Endpoint**: `GET /api/v1/otp/codes`

---

## QR Code Features

### 7. Live Camera QR Scanning

**Description**: Real-time QR code scanning using device camera.

**Technical Implementation**:
- **Component**: `QrScannerModal` in `client/src/components/qr-scanner.tsx`
- **Library**: `qr-scanner` for camera access and QR detection
- **Features**: Camera switching, flash control, scan region highlighting

**Camera Controls**:
- Front/back camera switching
- Flash toggle (if supported)
- Scan region highlighting
- Code outline detection

**QR Code Parsing**:
- Supports standard `otpauth://totp/` format
- Extracts issuer, label, secret, period
- Automatic OTP creation on successful scan
- Error handling for invalid formats

**Dependencies**:
- `qr-scanner` library
- Camera permissions
- React Icons for UI controls

### 8. QR Code Image Upload

**Description**: QR code scanning from uploaded images with drag-and-drop support.

**Technical Implementation**:
- **Component**: `QRImageUploaderModal` in `client/src/components/qr-uploader.tsx`
- **Library**: `qr-scanner` for image processing
- **Features**: Drag-and-drop, file picker, image validation

**Upload Methods**:
- Drag and drop interface
- File picker dialog
- Image format validation
- Progress feedback

**Processing**:
- Client-side QR code detection
- Same parsing logic as camera scanner
- Error handling for invalid images
- Automatic cleanup

### 9. QR Code Generation

**Description**: Generate QR codes for existing OTP entries.

**Technical Implementation**:
- **Component**: `QRModal` in `client/src/components/qr-modal.tsx`
- **Library**: `qrcode.react` for QR code generation
- **Format**: Standard `otpauth://totp/` URI format

**Features**:
- Standard TOTP URI format generation
- High-quality QR code rendering
- Modal display with proper sizing
- Compatible with other authenticator apps

**URI Format**:
```
otpauth://totp/{issuer}:{label}?secret={secret}&issuer={issuer}&algorithm={algorithm}&digits={digits}&period={period}
```

---

## User Interface Components

### 10. Smart OTP Card

**Description**: Interactive card component displaying OTP information with real-time updates.

**Technical Implementation**:
- **Component**: `SmartOTPCard` in `client/src/components/smart-otp-card.tsx`
- **Features**: Real-time countdown, progress bar, click actions, context menu

**Interactive Elements**:
- **Click**: Copy code to clipboard
- **Right-click**: Context menu (Edit, QR, Delete)
- **Progress Bar**: Visual countdown timer
- **Status Indicators**: Current/next code display

**Real-time Features**:
- 1-second interval updates
- Automatic code switching
- Expiration warnings (red progress bar at <5s)
- Copy success feedback

**Responsive Design**:
- Mobile-first approach
- Touch-friendly interactions
- Adaptive layout for different screen sizes

### 11. Floating Action Button (FAB)

**Description**: Expandable floating action button for adding new OTP entries.

**Technical Implementation**:
- **Component**: `FAB` in `client/src/components/fab.tsx`
- **Animation**: Framer Motion for smooth transitions
- **Features**: Three action modes with labels

**Action Modes**:
1. **Scan QR Code**: Opens camera scanner
2. **Read QR Image**: Opens image uploader
3. **Add Manually**: Opens manual entry form

**Animations**:
- Expansion/collapse with backdrop
- Staggered button appearance
- Smooth icon transitions
- Spring-based animations

### 12. Context Menu

**Description**: Right-click context menu for OTP card actions.

**Technical Implementation**:
- **Component**: `ContextMenu` in `client/src/components/context-menu.tsx`
- **Library**: HeroUI Dropdown components
- **Features**: Desktop/mobile adaptive behavior

**Actions**:
- **Show QR**: Display QR code for the OTP
- **Edit**: Open edit modal
- **Delete**: Inactivate the OTP entry

**Responsive Behavior**:
- Desktop: Right-click context menu
- Mobile: Touch-friendly dropdown
- Automatic positioning

### 13. Theme System

**Description**: Dark/light theme switching with system preference detection.

**Technical Implementation**:
- **Component**: `ThemeSwitch` in `client/src/components/theme-switch.tsx`
- **Library**: `next-themes` for theme management
- **Features**: System preference detection, smooth transitions

**Theme Options**:
- Light mode
- Dark mode  
- System preference (auto)

**Persistence**:
- Local storage for user preference
- System theme detection
- Smooth color transitions

### 14. Navigation Bar

**Description**: Application navigation with user profile and search functionality.

**Technical Implementation**:
- **Component**: `Navbar` in `client/src/components/navbar.tsx`
- **Features**: User avatar, search, logout, responsive design

**Components**:
- User profile dropdown
- Search input with keyboard shortcuts
- Theme toggle
- Logout functionality
- OTP count badge

**Keyboard Shortcuts**:
- `Cmd/Ctrl + K`: Focus search
- Search on Enter key

---

## Data Management

### 15. State Management

**Description**: Global state management using Zustand for client-side state.

**Technical Implementation**:
- **Library**: Zustand for lightweight state management
- **Patterns**: Slice-based organization, action creators
- **Features**: Persistence, devtools integration

**State Slices**:
- Authentication state
- UI state (modals, menus)
- Theme preferences
- User preferences

### 16. Data Fetching

**Description**: Server state management with caching and synchronization.

**Technical Implementation**:
- **Library**: TanStack Query for server state
- **Features**: Caching, background refetching, optimistic updates
- **Patterns**: Custom hooks, query invalidation

**Query Patterns**:
- `useListOtps`: Fetch OTP list with caching
- `useGenerateOtpCodes`: Real-time code generation
- `useAddOtp`: Optimistic OTP creation
- `useInactivateOtp`: Optimistic deletion

**Caching Strategy**:
- 5-minute stale time for OTP list
- 30-second stale time for OTP codes
- Automatic background refetching
- Query invalidation on mutations

### 17. Local Storage

**Description**: Client-side persistence for offline capabilities and preferences.

**Technical Implementation**:
- **Library**: `use-local-storage-state` for React integration
- **Features**: TypeScript support, SSR compatibility
- **Storage**: Browser localStorage with fallbacks

**Stored Data**:
- Theme preferences
- User interface settings
- Authentication state
- Search history

---

## Navigation & Search

### 18. Protected Routing

**Description**: Route protection based on authentication status.

**Technical Implementation**:
- **Component**: `ProtectedRoute` in `client/src/components/protected-route.tsx`
- **Library**: React Router for routing
- **Features**: Authentication checks, automatic redirects

**Routes**:
- `/login`: Public login page
- `/`: Protected main application (requires authentication)

**Protection Logic**:
- Authentication state verification
- Automatic redirect to login
- Loading states during verification

### 19. Search Functionality

**Description**: Real-time search through OTP entries with advanced filtering and keyboard shortcuts.

**Technical Implementation**:
- **Provider**: `SearchProvider` in `client/src/providers/search-provider.tsx`
- **Component**: Search input in `client/src/components/navbar.tsx`
- **Utilities**: Search functions in `client/src/lib/search.ts`
- **State Management**: React Context API for global search state
- **Filtering**: Real-time filtering in `client/src/pages/home.tsx`

**Search Features**:
- **Multi-term Search**: Supports multiple search terms (space-separated)
- **Fuzzy Matching**: Searches across issuer and label fields
- **Real-time Filtering**: Instant results as you type
- **Keyboard Shortcuts**: 
  - `Cmd/Ctrl + K`: Focus search input
  - `Enter`: Apply search
  - `Escape`: Clear search
- **Clear Button**: Visual clear button when search is active
- **Search Statistics**: Shows filtered vs total results
- **Empty States**: Different messages for no tokens vs no results

**Search Logic**:
- Case-insensitive matching
- Searches in both issuer and label fields
- Supports partial word matching
- Multiple search terms (AND logic - all terms must match)

**User Experience**:
- Search results header showing query and count
- Visual feedback with toast notifications
- Responsive design for mobile and desktop
- Accessible with proper ARIA labels
- Smooth transitions and loading states

**State Management**:
- Global search context shared between components
- Search query persistence during navigation
- Automatic state cleanup
- Optimized re-renders with useMemo

**API**: No backend API required - client-side filtering only

---

## Security Features

### 20. Input Validation

**Description**: Comprehensive input validation on both frontend and backend.

**Technical Implementation**:
- **Frontend**: Real-time validation with error messages
- **Backend**: Server-side validation in Go models
- **Patterns**: Validation functions, error handling

**Validation Rules**:
- **Secret**: Base32 format validation, length checks
- **Issuer/Label**: Character restrictions, length limits
- **Numeric Fields**: Range validation, type checking
- **Algorithm**: Whitelist validation

### 21. Token Management

**Description**: Secure JWT token handling with automatic refresh.

**Technical Implementation**:
- **Storage**: HTTP-only cookies for tokens
- **Refresh**: Automatic token refresh on expiration
- **Security**: CSRF protection, secure flags

**Token Types**:
- **Access Token**: 15-minute expiration, API access
- **Refresh Token**: 180-day expiration, token renewal
- **Session Token**: Login session tracking

---

## API Endpoints

### Authentication Endpoints
```
GET    /api/v1/auth/:provider           # OAuth login
GET    /api/v1/auth/:provider/callback  # OAuth callback
POST   /api/v1/auth/refresh             # Refresh tokens
DELETE /api/v1/auth/refresh             # Logout
GET    /api/v1/auth/me                  # Current user
GET    /api/v1/login-history            # Login history
```

### OTP Management Endpoints
```
POST   /api/v1/otp           # Add new OTP
GET    /api/v1/otp           # List user OTPs
PUT    /api/v1/otp/:id       # Edit OTP
POST   /api/v1/otp/:id/inactivate  # Delete OTP
GET    /api/v1/otp/codes     # Generate OTP codes
```

### Documentation
```
GET    /swagger/*any         # API documentation
```

---

## Development Patterns

### 22. Component Architecture

**Patterns Used**:
- Functional components with hooks
- Custom hooks for business logic
- Compound components for complex UI
- Render props for flexibility

**Component Types**:
- **Page Components**: Route-level components
- **Feature Components**: Business logic components
- **UI Components**: Reusable interface elements
- **Provider Components**: Context providers

### 23. Error Handling

**Patterns**:
- **Frontend**: Error boundaries, toast notifications
- **Backend**: Structured error responses, logging
- **Network**: Retry logic, fallback states

**Error Types**:
- Validation errors
- Network errors
- Authentication errors
- Server errors

### 24. Testing Strategy

**Frontend Testing**:
- Unit tests with Jest and React Testing Library
- Component testing with user interactions
- Hook testing with React Hooks Testing Library
- E2E testing with Cypress (planned)

**Backend Testing**:
- Unit tests with Go testing package
- Integration tests for API endpoints
- Database tests with test containers
- Performance tests for critical paths

### 25. Performance Optimization

**Frontend Optimizations**:
- Code splitting with React.lazy
- Memoization with useMemo and useCallback
- Virtual scrolling for large lists
- Image optimization and lazy loading

**Backend Optimizations**:
- Database indexing for queries
- Connection pooling
- Request caching
- Gzip compression

---

## Development Guidelines for AI Agents

### Adding New Features

1. **Component Creation**:
   - Follow naming conventions (PascalCase for components)
   - Use TypeScript interfaces for props
   - Implement proper error handling
   - Add loading states for async operations

2. **API Integration**:
   - Create custom hooks for API calls
   - Use TanStack Query for server state
   - Implement optimistic updates where appropriate
   - Add comprehensive error handling

3. **State Management**:
   - Use Zustand for global state
   - Keep component state local when possible
   - Implement proper state normalization
   - Use proper TypeScript types

4. **Testing**:
   - Write unit tests for business logic
   - Test user interactions
   - Mock external dependencies
   - Test error scenarios

### Code Quality Standards

- Follow the established architecture patterns
- Use proper TypeScript types throughout
- Implement comprehensive error handling
- Add proper logging for debugging
- Follow security best practices
- Write self-documenting code with clear naming

### Integration Points

- **Authentication**: All new features must respect authentication state
- **API**: Follow existing API patterns and error handling
- **UI**: Use HeroUI components for consistency
- **State**: Integrate with existing state management patterns
- **Routing**: Follow protected route patterns
- **Search**: Use the search context for any searchable content

### Working with Search Feature

When adding new searchable content or modifying existing search:

1. **Search Context**: Use `useSearch()` hook to access search state
2. **Search Utilities**: Use functions from `lib/search.ts` for consistent search behavior
3. **Searchable Fields**: Update search logic in `searchOTPs()` when adding new OTP fields
4. **Search Statistics**: Use `getSearchStats()` for consistent result counting
5. **Empty States**: Handle both "no data" and "no search results" scenarios
6. **Keyboard Shortcuts**: Maintain existing shortcuts (`Cmd/Ctrl+K`, `Escape`)

### Search Implementation Example

```typescript
// In a component that needs search functionality
import { useSearch } from "../providers/search-provider";
import { searchOTPs } from "../lib/search";

function MyComponent() {
  const { searchQuery, isSearchActive } = useSearch();
  const [data, setData] = useState([]);
  
  const filteredData = useMemo(() => {
    return searchOTPs(data, searchQuery);
  }, [data, searchQuery]);
  
  return (
    <div>
      {isSearchActive && (
        <p>Showing {filteredData.length} of {data.length} results</p>
      )}
      {/* Render filtered data */}
    </div>
  );
}
```

This documentation provides a comprehensive overview of all features in the 2FAir application. Use it as a reference when developing new features, debugging issues, or understanding the application architecture. 