# 2FAir - Cloud Based Two-Factor Authentication Manager

2FAir is a modern, secure, and user-friendly two-factor authentication (2FA) manager that helps you organize and manage your OTP (One-Time Password) codes across multiple devices. Built with a React frontend and Go backend, 2FAir provides a seamless experience for managing your 2FA tokens with cloud synchronization.

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

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** with Yarn package manager
- **Go 1.22+** 
- **Docker** (optional, for containerized deployment)
- **MongoDB Atlas** account (for production) or **PostgreSQL** (for development)
- **OAuth Credentials** from Google Cloud Console and/or Microsoft Azure

### 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bug-breeder/2fair.git
   cd 2FAir
   ```

2. **Setup Frontend**
   ```bash
   cd client
   yarn install
   ```

3. **Setup Backend**
   ```bash
   cd ../server
   go mod tidy
   ```

### ⚙️ Configuration

#### Frontend Environment

Create `client/.env.local`:
```env
VITE_SERVER_URL=http://localhost:8080
```

#### Backend Environment

Create `server/.env` based on `server/.env.example`:
```env
# Server Configuration
PORT=8080
ENVIRONMENT=development

# Database Configuration
DATABASE_URL=mongodb://localhost:27017/2fair
# OR for PostgreSQL development
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=your_user
# DB_PASSWORD=your_password
# DB_NAME=2fair
# DB_SSL_MODE=disable

# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE_DURATION=24h
REFRESH_TOKEN_EXPIRE_DURATION=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

### 🏃‍♂️ Running the Application

#### Development Mode

1. **Start the Backend**
   ```bash
   cd server
   make run
   # or
   go run cmd/server/*.go
   ```

2. **Start the Frontend** (in a new terminal)
   ```bash
   cd client
   yarn dev
   ```

3. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080
   - API Documentation: http://localhost:8080/swagger/index.html

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

## 📚 API Documentation

The backend provides a comprehensive REST API with the following endpoints:

### Authentication
- `GET /auth/google` - Google OAuth login
- `GET /auth/microsoftonline` - Microsoft OAuth login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh JWT token

### OTP Management
- `GET /api/v1/otp` - List all user OTPs
- `POST /api/v1/otp` - Add new OTP
- `PUT /api/v1/otp/{id}` - Update existing OTP
- `POST /api/v1/otp/{id}/inactivate` - Deactivate OTP
- `GET /api/v1/otp/codes` - Generate current OTP codes

### User Management
- `GET /api/v1/user/profile` - Get user profile
- `PUT /api/v1/user/profile` - Update user profile

Visit `http://localhost:8080/swagger/index.html` when running the server for interactive API documentation.

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

## 🛠️ Development

### Frontend Development

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build

# Run tests
yarn test

# Lint and format code
yarn lint
```

### Backend Development

```bash
# Install dependencies
go mod tidy

# Run server locally
make run

# Build for production
make build

# Generate API documentation
make docs

# Run database migrations
make migrate-up

# Create new migration
make migrate-create name=migration_name

# Run tests
go test ./...
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
