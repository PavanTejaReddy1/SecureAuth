# SecureAuth

A production-quality authentication platform built with React, Node.js, Express, and MongoDB.

## Tech Stack

| Layer    | Technology                             |
|----------|----------------------------------------|
| Frontend | React 19, Vite, Tailwind CSS v4        |
| Backend  | Node.js, Express                       |
| Database | MongoDB, Mongoose                      |
| Auth     | OTP (bcrypt hashed), JWT, WebAuthn     |
| Icons    | Lucide React                           |

## Getting started

### Prerequisites

- Node.js 18+
- MongoDB running locally or a MongoDB Atlas connection string

### 1. Clone the repository

```bash
git clone https://github.com/PavanTejaReddy1/SecureAuth.git
cd SecureAuth
```

### 2. Backend setup

```bash
cd server
cp .env.example .env     # fill in your values
npm install
npm run dev
```

The API will start on `http://localhost:5000`.

### 3. Frontend setup

```bash
cd client
# .env is already set for development with VITE_DEMO_MODE=true
npm install
npm run dev
```

The app will open at `http://localhost:5173`.

## Demo mode

With `DEMO_MODE=true` (server) and `VITE_DEMO_MODE=true` (client), no real emails or SMS messages are sent. OTP codes appear in the browser and in the server console for easy evaluation.

## Project structure

```
SecureAuth/
  client/           React frontend (Vite + Tailwind)
    src/
      components/   Reusable UI and auth components
      context/      AuthContext — global auth state
      pages/        One file per screen
      services/     Axios API client
      utils/        Validators and formatting helpers
  server/           Express API
    config/         Database connection
    controllers/    Request handlers
    middleware/     Authentication middleware
    models/         Mongoose schemas
    routes/         Express routers
    services/       OTP delivery (demo / real)
    utils/          OTP generation and session helpers
```

## Development phases

| Phase | Feature                        | Status      |
|-------|--------------------------------|-------------|
| 1     | Project setup + UI             | ✅ Complete  |
| 2     | Registration + validation      | ✅ Complete  |
| 3     | OTP generation + demo mode     | ✅ Complete  |
| 4     | OTP login                      | ✅ Complete  |
| 5     | Account lockout (5 attempts)   | ✅ Complete  |
| 6     | Single active device           | ✅ Complete  |
| 7     | WebAuthn biometrics            | 🔜 Upcoming  |
| 8     | Testing + security review      | 🔜 Upcoming  |
