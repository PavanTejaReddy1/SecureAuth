# SecureAuth

SecureAuth is a secure authentication platform that provides OTP-based login, WebAuthn-powered biometric authentication, automatic account lockout after multiple failed login attempts, and single-device session management to ensure only one active device per user at a time.

The stack is React on the frontend and Node.js with Express and MongoDB on the backend. No passwords are stored anywhere — users authenticate with a one-time code sent to their email or phone, or with a registered passkey (Face ID, fingerprint, etc.).

---

## What it does

**Registration** — A user signs up with their surname, email or phone number, and date of birth. After submitting the form they receive a 6-digit verification code. Until that code is verified, the account isn't active.

**OTP login** — The user enters their email or phone, receives a 6-digit code, and enters it to sign in. The code is valid for 5 minutes and can only be used once.

**Biometric login** — Once signed in, the user can register a passkey from the dashboard. After that they can sign in using Face ID, fingerprint, or a hardware security key — no code needed.

**Account lockout** — If someone enters the wrong OTP 5 times in a row, the account locks for 1 hour. This is tracked server-side and can't be bypassed by refreshing the page or switching browsers.

**Single active device** — Only one authenticated session is allowed per account at a time. If you're already signed in and try to sign in from another browser or device, the second login is blocked until you sign out from the first one.

**Demo mode** — Since this is an assessment, I added a demo mode that shows the OTP code directly on the verification screen. No email or SMS provider needs to be configured to test the full flow.

---

## Tech stack

- **Frontend**: React 19, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose
- **Authentication**: OTP via bcrypt-hashed codes, JWT in HTTP-only cookies
- **Biometrics**: @simplewebauthn/browser and @simplewebauthn/server
- **Email**: Nodemailer (Gmail SMTP)
- **SMS**: Twilio (optional, not required for demo)

---

## Project structure

```
SecureAuth/
  client/                   React frontend
    src/
      components/
        auth/               OtpInput, ProtectedRoute
        ui/                 Logo, Input, Button, Alert
      context/              AuthContext — holds the logged-in user state
      pages/                One file per screen
      services/             api.js — Axios client for all API calls
      utils/                validators.js, format.js

  server/                   Express backend
    config/                 db.js — MongoDB connection
    controllers/
      authController.js     Handles register, login, OTP, logout
      webauthnController.js Handles passkey registration and login
    middleware/
      authenticate.js       Verifies the session cookie on protected routes
      asyncHandler.js       Catches async errors so they don't crash the server
    models/
      User.js               Mongoose schema
    routes/
      auth.js               /api/auth/* routes
      webauthn.js           /api/webauthn/* routes
    services/
      otpDelivery.js        Routes to demo mode or real email/SMS
      emailService.js       Nodemailer
      smsService.js         Twilio
    utils/
      otp.js                OTP generation and hashing
      session.js            JWT creation, cookie helpers
    server.js               App entry point
```

---

## Getting started

You need Node.js 18+ and a MongoDB instance (local or Atlas).

### Clone the repo

```bash
git clone https://github.com/PavanTejaReddy1/SecureAuth.git
cd SecureAuth
```

### Start the backend

```bash
cd server
cp .env.example .env
# Edit .env — the defaults work for local development with demo mode on
npm install
npm run dev
```

The API runs on `http://localhost:5000`.

### Start the frontend

```bash
cd client
npm install
npm run dev
```

The app opens at `http://localhost:5173`.

---

## Environment variables

Copy `server/.env.example` to `server/.env`. The important ones:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/secureauth
SESSION_SECRET=pick-a-long-random-string-and-keep-it-secret

# How many wrong OTP attempts before lockout
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=60

# Set to true to show OTP codes in the API response instead of sending emails/SMS
# Never use this in production
DEMO_MODE=true

# Gmail SMTP — only needed if DEMO_MODE=false
# Create an App Password at https://myaccount.google.com/apppasswords
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your@gmail.com
EMAIL_PASS=your-app-password

# Twilio SMS — optional, only needed for phone number login in production
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# WebAuthn — must match the URL you're running the app on
RP_ID=localhost
RP_NAME=SecureAuth
RP_ORIGIN=http://localhost:5173
```

The frontend also has a `.env` file at `client/.env`:

```env
VITE_DEMO_MODE=true
```

This controls whether the demo OTP panel appears in the browser.

---

## Demo mode

With `DEMO_MODE=true` on the server and `VITE_DEMO_MODE=true` on the client:

1. Register or sign in normally.
2. Instead of sending an email or SMS, the server returns the OTP code in the API response.
3. The OTP page shows a yellow panel with the actual code.
4. Enter it and the verification goes through the same backend logic as it would in production.

The demo OTP is the real generated code — it's not fake or hardcoded. The only difference from production is where it's delivered.

If you set `NODE_ENV=production`, demo mode is disabled automatically even if `DEMO_MODE=true` is set.

---

## How the authentication works

**OTP registration**

1. User submits the registration form.
2. Server creates an unverified user record and generates a 6-digit OTP.
3. The OTP is hashed with bcrypt and stored. The plain code is sent (or shown in demo mode).
4. User enters the code. Server compares it against the hash.
5. On success, the account is marked verified and a session is created.

**OTP login**

1. User enters their email or phone.
2. Server checks the account exists and is verified, not locked, and has no active session.
3. Generates a new OTP, invalidating any previous one.
4. User enters the code. Server verifies it.
5. On success, a session ID is generated and stored on the user record. A JWT containing that session ID is set in an HTTP-only cookie.

**Session validation**

Every protected API request reads the cookie, verifies the JWT, then checks that the session ID in the token matches the `activeSessionId` stored in the database. If someone logs in from another device, the session ID changes and the first device's requests start returning 401.

**Account lockout**

The failed attempt counter is stored on the user document. Each wrong OTP increments it. When it hits 5, `lockedUntil` is set to one hour from now. All further login attempts (including requesting a new OTP) are rejected with a 423 status until the lock expires.

**Biometric login (WebAuthn)**

1. User signs in with OTP first to establish their identity.
2. From the dashboard they click "Register a passkey".
3. The server sends a challenge. The browser shows the native Face ID/fingerprint prompt and creates a public/private key pair on the device.
4. The browser sends back the public key credential. The server stores the credential ID, public key, and counter.
5. For future logins, the user enters their email/phone and chooses biometric login. The server sends a challenge signed with the stored public key. The browser verifies it with the private key (using biometrics to unlock it). The signed response comes back to the server, which verifies the signature.
6. No biometric data is stored anywhere. The device handles all of that internally.

---

## API endpoints

**Auth**

```
POST /api/auth/register        — Create a new account (unverified)
POST /api/auth/send-otp        — Send a login OTP to an existing verified account
POST /api/auth/verify-otp      — Verify an OTP (registration or login)
POST /api/auth/resend-otp      — Request a new OTP (60-second cooldown)
POST /api/auth/logout          — Revoke the current session
GET  /api/auth/me              — Get the currently logged-in user (requires session)
```

**WebAuthn**

```
GET  /api/webauthn/registration-options    — Get passkey registration challenge (requires session)
POST /api/webauthn/verify-registration     — Save a registered passkey (requires session)
POST /api/webauthn/authentication-options  — Get authentication challenge for biometric login
POST /api/webauthn/verify-authentication   — Verify biometric login response
```

**HTTP status codes used**

- `400` — Missing or invalid input
- `401` — Not authenticated
- `403` — Account exists but not yet verified
- `404` — Account not found
- `409` — Account already active on another device
- `423` — Account locked
- `429` — Too many requests

---

## Running the tests

There are no automated test files in this repo — the testing was done manually against a live server during development. Here's how to test each feature:

**Registration**
- Fill the form and submit. The OTP panel should appear with the code.
- Try submitting with a missing field — the page should show an inline error.
- Try registering with the same email twice — the second attempt should fail with a 409.

**OTP login**
- Sign in with a registered email. Enter the code from the demo panel.
- Enter a wrong code — it should tell you how many attempts remain.

**Account lockout**
- Enter the wrong OTP 5 times. The account should lock and you should be redirected to the locked screen with a countdown.

**Single active device**
- Sign in on one browser. Open a private window and try to sign in with the same account — it should block you with a "already active on another device" message.
- Sign out from the first browser. The second login should now work.

**Biometric login**
- Sign in with OTP, then register a passkey from the dashboard (requires a device with Face ID or fingerprint hardware).
- Sign out, then choose "Use Face ID / Fingerprint" from the login screen.

---

## Known limitations

**Biometric hardware required** — WebAuthn passkeys need a device with built-in biometrics (Face ID, Windows Hello, Android fingerprint) or a hardware security key. The feature is fully implemented but won't work on devices that don't have this hardware.

**SMS not wired by default** — Phone number login works, but SMS delivery requires a Twilio account and credentials. Demo mode works fine without it.

**Email requires an App Password** — Standard Gmail passwords are blocked by Google. You need to enable 2FA on the account and generate an App Password.

**Session doesn't auto-expire on network failure** — If a device loses connection without logging out, the session stays active in the database until it naturally expires (7 days) or the user logs in again via OTP from a fresh flow.

---

## Why I made certain decisions

**OTP instead of passwords** — Passwordless auth is simpler for users and removes whole categories of risk (password reuse, weak passwords, credential stuffing). Time-limited single-use codes are genuinely more secure for many use cases.

**bcrypt for OTP hashing** — OTPs only have a million possible values. Without hashing, a database breach would expose every pending code. bcrypt makes them practically useless even if the hash is stolen.

**HTTP-only cookies instead of localStorage** — Tokens in localStorage are readable by JavaScript, which makes them vulnerable to XSS. HTTP-only cookies can't be accessed by scripts at all.

**Rejecting the second device rather than replacing the session** — Silently kicking someone off their active session could be used by an attacker who managed to get an OTP. The safer default is to block the new login and let the legitimate user stay in control.

**updateOne with $set for OTP writes** — Rather than loading a document and calling save(), I use atomic partial updates. This avoids Mongoose running full-document validation on fields that the OTP flow doesn't touch, and it's also safer under concurrent requests.
