# 2FAir

This project is an Authenticator Web App similar to Google Authenticator/Authy, built using Express.js and MongoDB. It supports time-based (TOTP), counter-based (HOTP), and Steam methods. The app allows users to log in with Google, Microsoft, and Apple accounts and manage multiple authentication codes.

## Table of Contents

1. [Features](#features)
2. [Installation](#installation)
   - [Prerequisites](#prerequisites)
   - [Clone the Repository](#clone-the-repository)
   - [Install Dependencies](#install-dependencies)
   - [Environment Variables](#environment-variables)
   - [Upload Providers to Database](#upload-providers-to-database)
   - [Start the Server](#start-the-server)
3. [API Endpoints](#api-endpoints)
   - [Authentication](#authentication)
   - [OTP Management](#otp-management)
4. [Example Requests](#example-requests)
5. [Done](#done)
6. [To-Do](#to-do)
7. [Contributing](#contributing)
8. [License](#license)

## Features

- Time-based (TOTP), Counter-based (HOTP), and Steam methods support
- Login with Google, Microsoft, and Apple
- Manage multiple authentication codes for each user
- Secure token-based authentication using JWT
- Provider information sourced from the GNOME Authenticator project

## Installation

### Prerequisites

- Node.js
- MongoDB

### Clone the Repository

```sh
git clone https://github.com/anh-ngn/fly2FAst.git
cd fly2FAst
```

### Install Dependencies

```sh
npm install
```

### Environment Variables

Copy the `.env.example` to `.env` and setup your environment variables

```plaintext
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
APPLE_CLIENT_ID=your_apple_client_id
APPLE_CLIENT_SECRET=your_apple_client_secret
```

### Upload Providers to Database

Providers data is extracted from the [GNOME Authenticator project](https://apps.gnome.org/Authenticator/). Ensure you have a `providers.json` file in the `utils` directory with the provider data.

Run the script to upload providers to the database:

```sh
node utils/uploadProviders.js
```

### Start the Server

```sh
npm start
```

## API Endpoints

### Authentication

#### Google Login

- **URL:** `/auth/google`
- **Method:** `GET`

#### Microsoft Login

- **URL:** `/auth/microsoft`
- **Method:** `GET`

#### Apple Login

- **URL:** `/auth/apple`
- **Method:** `GET`

### OTP Management

#### Add OTP

- **URL:** `/otp/add`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**

```json
{
  "otpauthUri": "otpauth://totp/Facebook:anh-ngn?secret=BAIKUGOSEFP2ATES&issuer=Facebook"
}
```

#### Get OTPs

- **URL:** `/otp`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`

#### Generate OTP Code

- **URL:** `/otp/:id/generate`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`

## Example Requests

### Add OTP

```sh
curl -X POST http://localhost:3000/otp/add -H "Content-Type: application/json" -H "Authorization: Bearer <your_jwt_token>" -d '{
  "otpauthUri": "otpauth://totp/Facebook:anh-ngn?secret=BAIKUGOSEFP2ATES&issuer=Facebook"
}'
```

### Get OTPs

```sh
curl -X GET http://localhost:3000/otp -H "Authorization: Bearer <your_jwt_token>"
```

### Generate OTP Code

```sh
curl -X GET http://localhost:3000/otp/<otp_id>/generate -H "Authorization: Bearer <your_jwt_token>"
```

## Task

- [x] Set up Express.js server
- [x] Configure Google authentication using Passport.js
- [ ] Configure Apple authentication using Passport.js (never, until it's free)
- [x] Configure Microsoft authentication using Passport.js
- [x] Create MongoDB models for User and OTP
- [x] Implement JWT-based authentication middleware
- [x] Add endpoints for adding, retrieving, and generating OTPs
- [x] Upload provider data from a JSON file to MongoDB
- [ ] Allow users to add custom providers
- [ ] Allow users to add profile pictures
- [ ] Implement user registration and login endpoints
- [ ] Enhance error handling and validation
- [ ] Add unit and integration tests
- [ ] Implement rate limiting to prevent abuse
- [ ] Dockerize the application for easier deployment
- [ ] Set up CI/CD pipeline for automated testing and deployment

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
