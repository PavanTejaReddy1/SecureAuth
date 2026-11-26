# SecureAuth

A production-quality authentication platform built as a company technical assessment.

SecureAuth implements OTP-based authentication, biometric passkeys (WebAuthn/Face ID), account lockout protection, and single active device enforcement — all in one clean, secure application.

---

## Features

| Feature | Details |
|---------|---------|
| Registration | Surname, email or phone, date of birth |
| OTP verification | 6-digit code, bcrypt hashed, 5-minute expiry |
| OTP login | Email or phone → OTP → session |
| Biometric login | WebAuthn passkeys (Face ID, fingerprint, security key) |
| Account lockout | Locked for 1 hour after 5 incorrect attempts |
| Single active device | Only one authenticated session per user at a time |
| Demo mode | OTP shown in UI for evaluators — no email/SMS needed |
| Secure sessions | HTTP-only cookies, JWT, server-side session validation |

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS v4 |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| OTP hashing | bcryptjs |
| Session tokens | jsonwebtoken |
| Email delivery | Nodemailer (Gmail SMTP) |
| SMS delivery | Twilio (optional) |
| Biometrics | @simplewebauthn/browser + @simplewebauthn/server |
| Icons | Lucide React |

---

## Project Structure

```
SecureAuth/
  client/                     React + Vite frontend
    src/
      components/
        auth/                 OtpInput, ProtectedRoute
        ui/                   Logo, Input, Button, Alert
      context/                AuthContext — global auth state
      pages/                  One file per screen
      services/               Axios API client (api.js)
      utils/                  validators.js, format.js
      App.jsx                 Routes
      main.jsx                Entry point

  server/
    config/                   db.js — MongoDB connection
    controllers/
      authController.js       Registration, OTP, login, logout
      webauthnController.js   Passkey registration and authentication
    middleware/
      authenticate.js         Session validation middleware
    models/
      User.js                 Mongoose schema
    routes/
      auth.js                 /api/auth/* routes
      webauthn.js             /api/webauthn/* routes
    services/
      otpDelivery.js          Routes to demo or real delivery
      emailService.js         Nodemailer email
      smsService.js           Twilio SMS
    utils/
      otp.js                  generateOtp, hashOtp, verifyOtp
      session.js              JWT sign/verify, cookie helpers
    server.js                 Express app entry point
```

---

## Installation

### Prerequisites

- Node.js 18 or later
- MongoDB (local or MongoDB Atlas)

### Clone the repository

```bash
git clone https://github.com/PavanTejaReddy1/SecureAuth.git
cd SecureAuth
```

---

## Backend Setup

```bash
cd server
cp .env.example .env
# Edit .env — see Environment Variables section below
npm install
npm run dev
```

The API starts on `http://localhost:5000`.

---

## Frontend Setup

```bash
cd client
# .env is already configured for development
npm install
npm run dev
```

The app opens at `http://localhost:5173`.

---

## MongoDB Configuration

**Local MongoDB:**
```
MONGODB_URI=mongodb://localhost:27017/secureauth
```

**MongoDB Atlas:**
```
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/secureauth
```

---

## Environment Variables

Copy `server/.env.example` to `server/.env` and fill in the values.

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/secureauth

# Session (use a long random string in production)
SESSION_SECRET=change_this_to_something_long_and_random

# OTP behaviour
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=60

# Demo mode — set true to show OTPs in the API response
# MUST be false in production
DEMO_MODE=true

# Email — Gmail SMTP
# Enable 2FA on your Google account, then create an App Password at:
# https://myaccount.google.com/apppasswords
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_address@gmail.com
EMAIL_PASS=your_app_password

# SMS — Twilio (optional)
# Sign up at https://www.twilio.com, then run: npm install twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# WebAuthn
RP_ID=localhost
RP_NAME=SecureAuth
RP_ORIGIN=http://localhost:5173
```

**Frontend** (`client/.env`):
```env
# Shows OTP in the UI during demo evaluation
VITE_DEMO_MODE=true
```

---

## Demo Mode (for evaluation)

Demo mode lets you test the full authentication flow without configuring email or SMS credentials.

**How it works:**
1. The backend generates a real OTP and stores its bcrypt hash normally.
2. Instead of sending an email or SMS, it returns the OTP in the API response.
3. The frontend displays it in a yellow "Demo mode" panel on the OTP verification screen.
4. You enter the displayed code and the backend verifies it through the same logic as production.

**To enable:**
- Set `DEMO_MODE=true` in `server/.env`
- Set `VITE_DEMO_MODE=true` in `client/.env`

**Production safety:**
- If `NODE_ENV=production` and `DEMO_MODE=true`, the server ignores demo mode and logs a warning.

---

## Email Configuration (production)

1. Enable 2-factor authentication on your Gmail account.
2. Go to https://myaccount.google.com/apppasswords and create an App Password.
3. Set `EMAIL_USER` and `EMAIL_PASS` in your `.env`.
4. Set `DEMO_MODE=false`.

For other SMTP providers, change `EMAIL_HOST` and `EMAIL_PORT` accordingly.

---

## SMS Configuration (optional)

1. Create a Twilio account at https://www.twilio.com.
2. Get your Account SID, Auth Token, and a Twilio phone number.
3. Run `npm install twilio` inside the `server` folder.
4. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` in `.env`.

---

## Authentication Flow

### Registration

```
User fills form (surname, email/phone, DOB)
  → POST /api/auth/register
  → Server validates and checks for duplicates
  → Creates user (isVerified: false)
  → Generates OTP, stores bcrypt hash
  → Delivers OTP (or returns in demo mode)
  → User enters OTP
  → POST /api/auth/verify-otp (purpose: registration)
  → Server verifies hash, sets isVerified: true
  → Creates session, sets HTTP-only cookie
  → Redirects to dashboard
```

### Login

```
User enters email or phone
  → POST /api/auth/send-otp
  → Server checks account exists, not locked, no active session
  → Generates OTP, delivers it
  → User enters OTP
  → POST /api/auth/verify-otp (purpose: login)
  → Server verifies hash
  → Creates session, sets HTTP-only cookie
  → Redirects to dashboard
```

### Biometric login

```
User enters email or phone, clicks "Use Face ID / Fingerprint"
  → POST /api/webauthn/authentication-options
  → Server generates a challenge
  → Browser shows Face ID / fingerprint prompt
  → POST /api/webauthn/verify-authentication
  → Server verifies signed challenge against stored public key
  → Creates session, sets HTTP-only cookie
  → Redirects to dashboard
```

---

## Account Lockout

After 5 consecutive incorrect OTP attempts:
- The account is locked for 1 hour.
- Further login attempts are rejected with HTTP 423.
- The frontend redirects to the Account Locked screen showing the remaining time.
- After the hour expires, the user can try again.
- A successful login resets the failed attempt counter.

The lockout counter is stored on the user record. `failedLoginAttempts` increments on each wrong OTP. When it reaches `OTP_MAX_ATTEMPTS` (default 5), `lockedUntil` is set to `now + 60 minutes`.

---

## Single Active Device

Only one authenticated session is allowed per user at a time.

How it works:
- On successful authentication, a unique `sessionId` is generated and stored on the user record as `activeSessionId`.
- The same `sessionId` is embedded in the JWT stored in the HTTP-only cookie.
- Every protected API request verifies that the cookie's `sessionId` matches the `activeSessionId` in the database.
- When a user on Device A is logged in and Device B tries to log in, the server rejects the OTP send with HTTP 409.
- When Device A logs out, `activeSessionId` is cleared. Device B can then log in.

This is enforced entirely on the backend. No browser-generated device IDs are trusted.

---

## WebAuthn / Passkeys

WebAuthn allows users to authenticate using device biometrics (Face ID, fingerprint, Windows Hello) or hardware security keys without passwords.

**How it works:**
1. The user signs in with OTP first to establish their identity.
2. From the dashboard, they click "Register a passkey".
3. The server generates a registration challenge.
4. The browser shows the native biometric prompt. The browser creates a public/private key pair on the device.
5. The browser sends back the public key (not any biometric data).
6. The server stores the credential ID and public key.

For subsequent logins:
1. The user enters their email/phone and clicks "Use Face ID / Fingerprint".
2. The server sends a challenge signed with the stored public key.
3. The browser shows the biometric prompt and signs the challenge with the private key.
4. The server verifies the signature using the stored public key.

**Important:** No biometric data is ever stored. The device handles biometric verification internally. SecureAuth only stores a standard cryptographic public key.

Biometric availability depends on the user's device and browser. Supported on Chrome, Edge, Safari on devices with biometric hardware.

---

## API Endpoints

### Auth

| Method | Path | Auth required | Description |
|--------|------|--------------|-------------|
| POST | /api/auth/register | No | Register a new user |
| POST | /api/auth/send-otp | No | Send login OTP to existing user |
| POST | /api/auth/verify-otp | No | Verify OTP (registration or login) |
| POST | /api/auth/resend-otp | No | Resend OTP (60-second cooldown) |
| POST | /api/auth/logout | Yes | Revoke session |
| GET | /api/auth/me | Yes | Get current user |

### WebAuthn

| Method | Path | Auth required | Description |
|--------|------|--------------|-------------|
| GET | /api/webauthn/registration-options | Yes | Get passkey registration challenge |
| POST | /api/webauthn/verify-registration | Yes | Verify and store passkey |
| POST | /api/webauthn/authentication-options | No | Get authentication challenge |
| POST | /api/webauthn/verify-authentication | No | Verify biometric login |

**Error codes:**
- `400` — Validation error or bad request
- `401` — Not authenticated
- `404` — Account not found
- `409` — Account already active on another device
- `423` — Account locked
- `429` — Rate limit exceeded

---

## Testing

### Running the backend tests

The project includes manual API tests verified against a live server. To run them:

```bash
# Start the server
cd server && npm run dev

# In a separate terminal, run the test script
# (or test manually with curl / Postman using the endpoint docs above)
```

**Test checklist verified:**

| Test | Status |
|------|--------|
| Registration — missing fields | ✅ PASS |
| Registration — invalid email | ✅ PASS |
| Registration — success (with demoOtp) | ✅ PASS |
| Registration — duplicate rejected (409) | ✅ PASS |
| OTP verification — wrong OTP rejected | ✅ PASS |
| OTP verification — correct OTP accepted | ✅ PASS |
| OTP verification — reuse rejected | ✅ PASS |
| Single device — second login blocked (409) | ✅ PASS |
| Protected route — accessible with valid session | ✅ PASS |
| Logout — session revoked | ✅ PASS |
| Protected route — rejected after logout (401) | ✅ PASS |
| OTP login — OTP sent after logout | ✅ PASS |
| OTP login — correct OTP creates session | ✅ PASS |
| Account lockout — locked after 5 failures (423) | ✅ PASS |
| Health endpoint | ✅ PASS |

### Testing in the browser

1. Open `http://localhost:5173`
2. Click **Create account**, fill the form
3. The OTP appears in the yellow demo panel
4. Enter the code — you are redirected to the dashboard
5. Sign out, then sign in again with the OTP flow
6. Test the **Account Locked** screen by entering the wrong OTP 5 times
7. Test **Single device**: sign in, then open a private window and try to sign in with the same account — you will see the "already active" message
8. Test **Passkey registration** from the dashboard (requires a device with biometric hardware)

---

## Known Limitations

1. **Biometric hardware required** — WebAuthn passkey registration and authentication require a device with Face ID, fingerprint, or a hardware security key. Chrome or Edge on Windows/macOS/Android are well-supported. Safari on iOS/macOS is also supported.

2. **SMS not configured by default** — SMS delivery via Twilio requires installing the `twilio` package and providing credentials. Demo mode works without it.

3. **Email requires Gmail App Password** — Standard Gmail passwords will not work. An App Password is required (see Email Configuration above).

4. **Single device does not auto-expire** — If a user's device crashes or the browser is closed without logging out, the session remains active in the database until it expires (7 days) or the user logs in again via OTP from a fresh flow. A session TTL index on MongoDB could be added to handle this automatically.

5. **WebAuthn origin must match** — The `RP_ORIGIN` in `.env` must exactly match the URL in the browser including protocol and port. `http://localhost:5173` and `http://127.0.0.1:5173` are treated as different origins.

---

## Implementation Decisions (for evaluation discussion)

**Why OTP instead of passwords?**
Passwordless authentication is simpler for users and eliminates password-related attacks (reuse, brute force, credential stuffing). OTPs are single-use and time-limited.

**Why bcrypt for OTP hashing?**
OTPs are short (6 digits, 1 million possible values). Without hashing, a database breach would expose all pending OTPs. bcrypt is the established standard for one-way hashing with a configurable work factor.

**Why HTTP-only cookies instead of localStorage?**
Tokens in localStorage are accessible to JavaScript, making them vulnerable to XSS attacks. HTTP-only cookies cannot be read by JavaScript and are sent automatically with every request.

**Why store sessionId in the JWT AND in the database?**
The JWT alone cannot be revoked without a denylist. By storing the current `activeSessionId` on the user record and comparing it on every request, we can invalidate sessions instantly on logout or when a new device logs in.

**Why reject the second device instead of replacing the session?**
The assignment explicitly requires this behaviour. It is also the safer default — silently replacing sessions could allow an attacker who obtained an OTP to kick a legitimate user off their device.

**Why @simplewebauthn?**
It is the most widely adopted WebAuthn library for Node.js, actively maintained, and handles the complex cryptographic verification correctly. Building this from scratch would introduce security risks.

**Why separate rate limiters for send-otp and verify-otp?**
The verify-otp endpoint is what attackers would target to brute-force OTPs. Using a tighter, separate rate limiter on that endpoint ensures the per-user lockout (5 attempts) is reached before the IP rate limit interferes with legitimate use.
