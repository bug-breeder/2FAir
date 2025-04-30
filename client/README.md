# 2FAir Client Application

The 2FAir client application provides a secure and user-friendly interface for managing two-factor authentication (2FA) codes. This web application allows users to add, manage, and use OTP (One-Time Password) codes for various online services.

## Features

- **Secure Authentication**: Login securely to access your OTP codes
- **OTP Management**: Add, edit, and remove OTP configurations
- **QR Code Support**: Scan or upload QR codes to easily add new services
- **Automatic Time Synchronization**: Ensures accurate OTP generation
- **Responsive Design**: Works on desktop and mobile devices

## Technologies Used

- [Next.js 14](https://nextjs.org/docs/getting-started) - React framework for building the UI
- [HeroUI](https://heroui.org/) - Modern UI component library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Framer Motion](https://www.framer.com/motion/) - Animation library

## Getting Started

### Prerequisites

- Node.js (v18 or newer)
- Yarn package manager

### Installation

1. Clone the repository
2. Navigate to the client directory
3. Install dependencies:

```bash
yarn install
```

### Development

Run the development server:

```bash
yarn dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
yarn build
```

### Run Production Build

```bash
yarn start
```

## Project Structure

- `app/` - Next.js application routes
- `components/` - Reusable UI components
- `config/` - Configuration files
- `hooks/` - Custom React hooks
- `libs/` - Utility functions and API clients
- `public/` - Static assets and images
- `styles/` - Global CSS styles
- `types/` - TypeScript type definitions

## License

Licensed under the [MIT license](LICENSE).
