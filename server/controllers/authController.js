const User = require('../models/User');
const { generateOtp, hashOtp, verifyOtp, getOtpExpiry } = require('../utils/otp');
const { generateSessionId, signToken, setSessionCookie, clearSessionCookie } = require('../utils/session');
const { deliverOtp, isDemoMode } = require('../services/otpDelivery');

const MAX_ATTEMPTS     = parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10);
const LOCKOUT_MINUTES  = parseInt(process.env.LOCKOUT_DURATION_MINUTES || '60', 10);
const RESEND_COOLDOWN  = 60; // seconds — user must wait this long before requesting another OTP

// ─── POST /api/auth/register ─────────────────────────────────────────────────
async function register(req, res) {
  const { surname, email, phone, dob } = req.body;

  if (!surname || (!email && !phone) || !dob) {
    return res.status(400).json({ message: 'Please provide surname, email or phone, and date of birth.' });
  }

  // Basic server-side format check
  if (email && !email.includes('@')) {
    return res.status(400).json({ message: 'Please provide a valid email address.' });
  }

  // Check for duplicate registration before creating anything
  if (email) {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
  }

  if (phone) {
    const existing = await User.findOne({ phone: phone.trim() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this phone number already exists.' });
    }
  }

  // Create the user record — not verified until OTP is confirmed
  const otp = generateOtp();

  const user = new User({
    surname: surname.trim(),
    email:   email ? email.toLowerCase().trim() : undefined,
    phone:   phone ? phone.trim() : undefined,
    dob:     new Date(dob),
    isVerified:  false,
    otpHash:     await hashOtp(otp),
    otpExpiry:   getOtpExpiry(),
    otpAttempts: 0,
  });

  await user.save();

  const identifier = email || phone;
  const channel    = email ? 'email' : 'phone';

  const delivery = await deliverOtp(identifier, otp, channel);

  const response = { message: 'Account created. Please verify your contact details.' };
  if (delivery.demoOtp) response.demoOtp = delivery.demoOtp;

  return res.status(201).json(response);
}

// ─── POST /api/auth/send-otp ─────────────────────────────────────────────────
// Called at login — sends an OTP to an existing registered user.
async function sendLoginOtp(req, res) {
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({ message: 'Please provide an email or phone number.' });
  }

  const user = await findUserByIdentifier(identifier);

  if (!user) {
    // Don't reveal whether the account exists — always respond the same way
    return res.status(200).json({ message: 'If an account exists, a verification code has been sent.' });
  }

  // Reject the OTP request if the account is currently locked
  if (isAccountLocked(user)) {
    return res.status(423).json({
      message: 'Your account is locked due to too many failed attempts. Please try again later.',
      lockedUntil: user.lockedUntil,
    });
  }

  // Reject if the user already has a valid active session (single-device rule)
  // The user must log out from Device A before logging in on Device B
  if (user.activeSessionId) {
    return res.status(409).json({
      message: 'Your account is already active on another device. Please sign out from that device first.',
      alreadyActive: true,
    });
  }

  const otp = generateOtp();

  // Issuing a new OTP invalidates the previous one
  user.otpHash    = await hashOtp(otp);
  user.otpExpiry  = getOtpExpiry();
  user.otpAttempts = 0;

  await user.save();

  const channel  = user.email ? 'email' : 'phone';
  const delivery = await deliverOtp(identifier, otp, channel);

  const response = { message: 'Verification code sent.' };
  if (delivery.demoOtp) response.demoOtp = delivery.demoOtp;

  return res.status(200).json(response);
}

// ─── POST /api/auth/verify-otp ───────────────────────────────────────────────
// Verifies the OTP for both registration and login.
async function verifyOtpHandler(req, res) {
  const { identifier, otp, purpose } = req.body;

  if (!identifier || !otp) {
    return res.status(400).json({ message: 'Identifier and OTP are required.' });
  }

  const user = await findUserByIdentifier(identifier);
  if (!user) {
    return res.status(404).json({ message: 'Account not found.' });
  }

  // Reject locked accounts
  if (isAccountLocked(user)) {
    return res.status(423).json({
      message: 'Your account is locked. Please try again later.',
      lockedUntil: user.lockedUntil,
    });
  }

  // Reject if no OTP has been issued
  if (!user.otpHash || !user.otpExpiry) {
    return res.status(400).json({ message: 'No active verification code. Please request a new one.' });
  }

  // Reject expired OTPs
  if (new Date() > user.otpExpiry) {
    return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
  }

  // Check the OTP — bcrypt compare
  const isCorrect = await verifyOtp(otp, user.otpHash);

  if (!isCorrect) {
    user.otpAttempts        += 1;
    user.failedLoginAttempts += 1;

    // Lock the account after reaching the maximum allowed failures
    if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
      const lockExpiry = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
      user.lockedUntil         = lockExpiry;
      user.failedLoginAttempts = 0;  // reset counter after locking
      await user.save();

      return res.status(423).json({
        message: `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`,
        lockedUntil: lockExpiry,
      });
    }

    await user.save();

    const remaining = MAX_ATTEMPTS - user.failedLoginAttempts;
    return res.status(400).json({
      message: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      attemptsRemaining: remaining,
    });
  }

  // ── OTP is correct ──────────────────────────────────────────────────────────

  // For login: enforce single active device — reject if another session exists
  if (purpose === 'login' && user.activeSessionId) {
    return res.status(409).json({
      message: 'Your account is already active on another device. Please sign out from that device first.',
      alreadyActive: true,
    });
  }

  // Clear the OTP fields so it cannot be reused
  user.otpHash             = null;
  user.otpExpiry           = null;
  user.otpAttempts         = 0;
  user.failedLoginAttempts = 0;
  user.lockedUntil         = null;

  if (purpose === 'registration') {
    user.isVerified = true;
  }

  // Create a new session
  const sessionId          = generateSessionId();
  user.activeSessionId     = sessionId;
  user.lastLogin           = new Date();

  await user.save();

  const token = signToken(user._id.toString(), sessionId);
  setSessionCookie(res, token);

  return res.status(200).json({
    message: 'Signed in successfully.',
    user:    safeUser(user),
  });
}

// ─── POST /api/auth/resend-otp ───────────────────────────────────────────────
async function resendOtp(req, res) {
  const { identifier, purpose } = req.body;

  if (!identifier) {
    return res.status(400).json({ message: 'Identifier is required.' });
  }

  const user = await findUserByIdentifier(identifier);
  if (!user) {
    return res.status(200).json({ message: 'If an account exists, a new code has been sent.' });
  }

  // Reject locked accounts
  if (isAccountLocked(user)) {
    return res.status(423).json({
      message: 'Your account is locked. Please try again later.',
      lockedUntil: user.lockedUntil,
    });
  }

  // Enforce cooldown: check how much time is left on the current OTP
  if (user.otpExpiry) {
    const secondsRemaining = Math.floor((user.otpExpiry - Date.now()) / 1000);
    // OTP expires in 5 minutes (300s). Cooldown is 60s.
    // If more than (300 - 60) = 240 seconds remain, the OTP was issued too recently.
    if (secondsRemaining > 300 - RESEND_COOLDOWN) {
      return res.status(429).json({
        message: `Please wait ${RESEND_COOLDOWN} seconds before requesting another code.`,
      });
    }
  }

  const otp = generateOtp();

  user.otpHash     = await hashOtp(otp);
  user.otpExpiry   = getOtpExpiry();
  user.otpAttempts = 0;

  await user.save();

  const channel  = user.email ? 'email' : 'phone';
  const delivery = await deliverOtp(identifier, otp, channel);

  const response = { message: 'A new code has been sent.' };
  if (delivery.demoOtp) response.demoOtp = delivery.demoOtp;

  return res.status(200).json(response);
}

// ─── POST /api/auth/logout ───────────────────────────────────────────────────
async function logout(req, res) {
  // req.user is set by the authenticate middleware
  if (req.user) {
    req.user.activeSessionId = null;
    await req.user.save();
  }
  clearSessionCookie(res);
  return res.status(200).json({ message: 'Signed out successfully.' });
}

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
async function getMe(req, res) {
  return res.status(200).json({ user: safeUser(req.user) });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function findUserByIdentifier(identifier) {
  const looksLikeEmail = identifier.includes('@');
  if (looksLikeEmail) {
    return User.findOne({ email: identifier.toLowerCase().trim() });
  }
  return User.findOne({ phone: identifier.trim() });
}

function isAccountLocked(user) {
  return user.lockedUntil && user.lockedUntil > new Date();
}

// Only return safe fields to the client — never expose hashes or session IDs
function safeUser(user) {
  return {
    id:          user._id,
    surname:     user.surname,
    email:       user.email,
    phone:       user.phone,
    isVerified:  user.isVerified,
    lastLogin:   user.lastLogin,
    hasPasskey:  user.passkeys && user.passkeys.length > 0,
    createdAt:   user.createdAt,
  };
}

module.exports = { register, sendLoginOtp, verifyOtpHandler, resendOtp, logout, getMe };
