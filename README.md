# 2FAir - E2E Encrypted TOTP Vault

2FAir is a modern, secure, end-to-end encrypted TOTP (Time-based One-Time Password) vault that helps you organize and manage your 2FA codes across multiple devices. Built with a React frontend and Go backend, 2FAir provides a zero-knowledge architecture for managing your 2FA tokens with strong cryptographic security.

## 🚧 **Current Development Status: Phase 2 Complete**

**✅ Phase 1: Backend Foundation** - Complete
- Clean architecture with Go/Gin
- PostgreSQL with E2E encryption schema
- SQLC for type-safe database operations
- Domain-driven design with repositories

**✅ Phase 2: Hybrid Authentication System** - Complete
- OAuth authentication (Google, GitHub)
- JWT token management
- Authentication middleware
- User management with secure sessions
- WebAuthn service layer & HTTP handlers implemented
- PRF extension support for vault key derivation

**🔄 Phase 3: E2E Vault Encryption** - In Progress
- WebAuthn repository integration (database layer)
- AES-256-GCM encryption implementation
- Multi-device key synchronization
- Encrypted TOTP seed storage

## ✨ Features

### 🔐 **Secure OTP Management**
- Add, edit, and manage OTP entries with validation
- Support for TOTP (Time-based) and HOTP (Counter-based) algorithms
- Secure secret storage with proper validation
- Real-time code generation with expiration tracking

### 📱 **QR Code Integration**
- Scan QR codes to quickly add new OTP entries
- Support for standard OTP URI format
- Camera-based scanning with fallback options

### 🌐 **Multi-Device Synchronization**
- Cloud-based storage for cross-device access
- Real-time synchronization across all your devices
- Secure user authentication with OAuth providers

### 🎨 **Modern User Interface**
- Clean, responsive design with HeroUI components
- Dark/Light theme support with system preference detection
- Mobile-first responsive design
- Intuitive drag-and-drop interface for OTP management

### 🔒 **Enterprise-Grade Security**
- OAuth authentication with Google and Microsoft
- JWT-based secure session management
- Input validation and sanitization
- Secure secret handling with proper encoding

## 🏗️ Architecture

### Frontend Stack
- **React 18** - Modern UI library with hooks
- **TypeScript** - Type safety and better developer experience
- **Vite** - Fast build tool and development server
- **HeroUI** - Comprehensive UI component library
- **TanStack Query** - Powerful data fetching and caching
- **Zustand** - Lightweight state management
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing

### Backend Stack
- **Go 1.22+** - High-performance backend language
- **Gin** - Fast HTTP web framework
- **Clean Architecture** - Separation of concerns with domain-driven design
- **MongoDB Atlas** - Cloud database for production
- **PostgreSQL** - Local development database with migrations
- **JWT** - Secure authentication tokens
- **Swagger** - API documentation
- **Docker** - Containerization support

## 🚀 Getting Started (Phase 2: OAuth Authentication)

### Prerequisites

- **Go 1.23+** - [Install Go](https://golang.org/doc/install)
- **PostgreSQL 15+** - [Install PostgreSQL](https://www.postgresql.org/download/)
- **Docker & Docker Compose** - [Install Docker](https://docs.docker.com/get-docker/)
- **Make** - Usually pre-installed on Unix systems
- **OAuth Provider Credentials** - Google/GitHub OAuth applications (optional for testing)

### 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bug-breeder/2fair.git
   cd 2FAir/server
   ```

2. **Setup Backend Dependencies**
   ```bash
   go mod tidy
   ```

3. **Start Development Database**
   ```bash
   make docker-up
   ```

4. **Run Database Migrations**
   ```bash
   make migrate-up
   ```

5. **Build the Application**
   ```bash
   make build
   ```

### ⚙️ Configuration

Create a `.env` file in the `server/` directory:

```env
# Required Configuration
JWT_SIGNING_KEY=your_super_secure_jwt_signing_key_change_in_production
OAUTH_SESSION_SECRET=your_oauth_session_secret_change_in_production

# Database Configuration (using Docker Compose)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=2fair
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL_MODE=disable

# Server Configuration
SERVER_HOST=localhost
SERVER_PORT=8080
ENVIRONMENT=development

# OAuth Configuration (Optional - for full OAuth testing)
OAUTH_GOOGLE_ENABLED=false
OAUTH_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
OAUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret

OAUTH_GITHUB_ENABLED=false
OAUTH_GITHUB_CLIENT_ID=your_github_client_id
OAUTH_GITHUB_CLIENT_SECRET=your_github_client_secret

# WebAuthn Configuration (for Phase 3)
WEBAUTHN_RP_DISPLAY_NAME=2FAir
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_ORIGINS=http://localhost:3000,http://localhost:8080
```

> **Note**: The application will run without OAuth credentials for testing the API endpoints. OAuth providers can be enabled by setting the `OAUTH_*_ENABLED=true` and providing valid credentials.

### 🏃‍♂️ Running the Application

#### Development Mode

1. **Start the Development Database**
   ```bash
   make docker-up
   ```

2. **Run Database Migrations**
   ```bash
   make migrate-up
   ```

3. **Start the Backend Server**
   ```bash
   make run
   # or with custom environment
   JWT_SIGNING_KEY=test_key OAUTH_SESSION_SECRET=test_secret DB_PASSWORD=postgres make run
   ```

4. **Test the API**
   ```bash
   # Health check
   curl http://localhost:8080/health
   
   # Public status
   curl http://localhost:8080/v1/public/status
   
   # OAuth providers
   curl http://localhost:8080/v1/auth/providers
   
   # Protected endpoint (should require auth)
   curl http://localhost:8080/v1/api/vault/status
   ```

5. **Access the Application**
   - Backend API: http://localhost:8080
   - Health Check: http://localhost:8080/health
   - Public Status: http://localhost:8080/v1/public/status
   - OAuth Providers: http://localhost:8080/v1/auth/providers

#### Production Deployment

##### Using Docker

1. **Build and run with Docker Compose**
   ```bash
   cd server
   docker-compose up --build
   ```

2. **Build frontend for production**
   ```bash
   cd client
   yarn build
   ```

##### Manual Production Build

1. **Build Backend**
   ```bash
   cd server
   make build
   ```

2. **Build Frontend**
   ```bash
   cd client
   yarn build
   ```

## 📚 API Documentation (Phase 2: OAuth Authentication)

The backend provides a hybrid OAuth + WebAuthn authentication system with the following endpoints:

### Health & Status
- `GET /health` - Application health check
- `GET /v1/public/status` - Public API status and features

### Authentication (OAuth)
- `GET /v1/auth/providers` - List available OAuth providers
- `GET /v1/auth/google` - Google OAuth login initiation
- `GET /v1/auth/github` - GitHub OAuth login initiation
- `GET /v1/auth/google/callback` - Google OAuth callback
- `GET /v1/auth/github/callback` - GitHub OAuth callback
- `POST /v1/auth/logout` - User logout
- `POST /v1/auth/refresh` - Refresh JWT token
- `GET /v1/auth/profile` - Get current user profile (requires auth)

### Protected API (Requires Authentication)
- `GET /v1/api/vault/status` - Vault status (placeholder for Phase 3)

### Response Examples

**Public Status:**
```json
{
  "message": "2FAir API",
  "version": "1.0.0",
  "phase": "Phase 2 Complete - Hybrid Authentication System",
  "features": {
    "oauth": "enabled",
    "webauthn": "planned", 
    "vault": "planned"
  }
}
```

**OAuth Providers:**
```json
{
  "providers": [
    {
      "name": "Google",
      "provider": "google",
      "login_url": "localhost:8080/auth/google",
      "description": "Sign in with Google"
    },
    {
      "name": "GitHub", 
      "provider": "github",
      "login_url": "localhost:8080/auth/github",
      "description": "Sign in with GitHub"
    }
  ]
}
```

## 📋 Feature Documentation

For comprehensive technical documentation of all features, including implementation details, components, and API specifications, see **[FEATURES.md](FEATURES.md)**. This documentation is specifically designed to help:

- 🤖 **AI Agents & Tools** (like Cursor) understand the codebase structure
- 👨‍💻 **Developers** quickly understand existing features
- 🆕 **New Contributors** get up to speed with the architecture
- 🔧 **Maintainers** reference implementation patterns

The features documentation includes:
- Technical implementation details for each feature
- Component hierarchy and relationships  
- API endpoint specifications
- Development patterns and best practices
- Integration guidelines for new features

## 🛠️ Development (Phase 2)

### Project Structure
```
server/
├── cmd/server/          # Application entrypoint
├── internal/
│   ├── adapter/
│   │   ├── api/         # HTTP handlers and middleware  
│   │   └── database/    # Database repositories
│   ├── domain/
│   │   ├── entities/    # Domain models
│   │   ├── repositories/# Repository interfaces
│   │   └── services/    # Service interfaces
│   └── infrastructure/
│       ├── config/      # Configuration management
│       ├── database/    # Database connection & migrations
│       └── services/    # Service implementations
├── migrations/          # Database migration files
├── docker-compose.yml   # Development database
└── Makefile            # Development commands
```

### Available Make Commands

```bash
# Development
make run                 # Start the server
make build              # Build the application
make test               # Run tests
make generate           # Generate SQLC code

# Database
make docker-up          # Start PostgreSQL with Docker
make docker-down        # Stop Docker containers
make migrate-up         # Run database migrations
make migrate-down       # Rollback migrations
make migrate-create name=<name>  # Create new migration

# Code Quality
make lint               # Run linter
make format             # Format code
make deps               # Download dependencies
make clean              # Clean build artifacts

# Documentation
make docs               # Generate API documentation
```

### Backend Development

```bash
# Development workflow
make docker-up          # Start database
make migrate-up         # Apply migrations  
make generate           # Generate SQLC
make run               # Start server

# Testing
make test              # Run all tests
go test ./internal/... # Run specific package tests

# Building
make build             # Production build
```

### Database Management

The project supports both MongoDB (production) and PostgreSQL (development) databases.

#### MongoDB Setup
1. Create a MongoDB Atlas account
2. Create a new cluster and database
3. Add the connection string to your `.env` file

#### PostgreSQL Setup (Development)
1. Install PostgreSQL locally
2. Create a new database
3. Update the database configuration in `.env`
4. Run migrations: `make migrate-up`

## 🧪 Testing

### Frontend Tests
```bash
cd client
yarn test
```

### Backend Tests
```bash
cd server
go test ./...
```

## 📱 Usage

1. **Login**: Use Google or Microsoft OAuth to authenticate
2. **Add OTP**: Click the "+" button to add a new 2FA token
   - Scan QR code from your service provider
   - Or manually enter the secret key
3. **Manage Tokens**: View, edit, or delete your OTP entries
4. **Copy Codes**: Click on any OTP code to copy it to clipboard
5. **Sync**: Your tokens are automatically synchronized across devices

## 🔒 Security Considerations

- All secrets are validated and normalized before storage
- JWT tokens have configurable expiration times
- OAuth integration provides secure authentication
- Input validation prevents injection attacks
- CORS configuration restricts unauthorized access
- Secrets are stored securely with proper encoding

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Alan Nguyen** - *Initial work* - [@bug-breeder](https://github.com/bug-breeder)

## 📞 Support

For support, email [anhngw@gmail.com](mailto:anhngw@gmail.com) or create an issue on GitHub.

## 🎯 Roadmap

- [ ] Backup and restore functionality
- [ ] Import/export OTP data
- [ ] Biometric authentication
- [ ] Browser extension
- [ ] Mobile applications (iOS/Android)
- [ ] Advanced security features
- [ ] Team/organization management

## 📸 Screenshots

<div style="display: flex; justify-content: space-between; margin: 20px 0;">
    <img src="./screenshots/s4.png" alt="Main Dashboard" width="30%" />
    <img src="./screenshots/s5.png" alt="OTP Management" width="30%" />
    <img src="./screenshots/s9.png" alt="Add OTP" width="30%" />
</div>

<div style="display: flex; justify-content: space-between; margin: 20px 0;">
    <img src="./screenshots/s6.png" alt="QR Code Scanner" width="30%" />
    <img src="./screenshots/s7.png" alt="QR Code Processing" width="30%" />
    <img src="./screenshots/s8.png" alt="Settings" width="30%" />
</div>

<div style="display: flex; justify-content: space-between; align-items: center; margin: 20px 0;">
    <img src="./screenshots/tablet.jpeg" alt="Tablet View" width="45%" />
    <img src="./screenshots/pc.png" alt="Desktop View" width="45%" />
</div>

---

**2FAir** - Secure. Simple. Synchronized.
