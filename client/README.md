# 2FAir - React Frontend

A secure and modern 2FA token management application built with React, Vite, HeroUI, and TanStack Query.

## Features

- 🔐 Secure 2FA token management
- 🎨 Modern UI with HeroUI components
- 🌙 Dark/Light theme support
- 📱 Responsive design
- ⚡ Fast development with Vite
- 🔄 Efficient data fetching with TanStack Query
- 🛡️ OAuth authentication (Google, Microsoft)

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **HeroUI** - UI component library
- **TanStack Query** - Server state management
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

## Getting Started

### Prerequisites

- Node.js 18+ 
- Yarn package manager

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   yarn install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env.local
   ```

4. Update environment variables in `.env.local`:
   ```
   VITE_SERVER_URL=http://localhost:8080
   ```

### Development

Start the development server:

```bash
yarn dev
```

The application will be available at `http://localhost:5173`

### Building

Build for production:

```bash
yarn build
```

### Linting

Run ESLint:

```bash
yarn lint
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
│   └── api/           # API client and functions
├── pages/              # Page components
├── providers/          # Context providers
├── styles/             # Global styles
├── types/              # TypeScript type definitions
├── App.tsx             # Main app component
├── main.tsx            # Application entry point
└── provider.tsx        # Root providers setup
```

## Environment Variables

- `VITE_SERVER_URL` - Backend API URL

## Authentication

The application supports OAuth authentication with:
- Google
- Microsoft

Users are redirected to the OAuth provider and then back to the application upon successful authentication.

## API Integration

The application communicates with a Go backend API for:
- User authentication
- OTP token management
- Code generation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
