# 2FAir Server

This is the back-end server for the 2FAir application, a 2-factor authentication (2FA) management system. The server is built using Go, Gin, and MongoDB Atlas and supports authentication with Google and Microsoft providers.

## Features

- User authentication using Google and Microsoft
- Secure JWT-based access and refresh tokens
- OTP (One-Time Password) management
  - Add OTP
  - Inactivate OTP
  - Edit OTP
  - List OTPs
  - Generate current and next OTP codes

## Technologies Used

- Go
- Gin
- MongoDB Atlas
- Goth
- Swagger for API documentation

## Setup

### Prerequisites

- Go 1.16+
- Docker
- MongoDB Atlas account
- Google Cloud Console account (for OAuth)
- Microsoft Azure account (for OAuth)

### Environment Variables

Create a `.env` file in the root directory with the same structure of `.env.example`

### Running the Server

1. **Install Dependencies:**

   ```sh
   go mod tidy
   ```

2. **Generate Swagger Documentation:**

   ```sh
   make docs
   ```

3. **Run the Server:**

   ```sh
   make run
   ```

### Docker

To build and run the server using Docker:

1. **Build the Docker Image:**

   ```sh
   make docker-build
   ```

2. **Run the Docker Container:**

   ```sh
   make docker-run
   ```

### API Documentation

The API documentation is generated using Swagger. After running the server, you can access the documentation at:

```
http://localhost:8080/swagger/index.html
```

## Usage

### Authentication

1. **Google Authentication:**

   ```
   GET /auth/google
   ```

2. **Microsoft Authentication:**

   ```
   GET /auth/microsoftonline
   ```

### OTP Management

1. **Add OTP:**

   ```
   POST /otps
   ```

2. **Inactivate OTP:**

   ```
   PUT /otps/{otpID}/inactivate
   ```

3. **Edit OTP:**

   ```
   PUT /otps/{otpID}
   ```

4. **List OTPs:**

   ```
   GET /otps
   ```

5. **Generate OTP Codes:**

   ```
   GET /otps/codes
   ```

## License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](https://www.gnu.org/licenses/gpl-3.0.en.html) file for more details.

## Contact

For support or inquiries, please contact [support@2fair.com](mailto:support@2fair.com).
