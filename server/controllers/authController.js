const User = require('../models/User');
const { generateOtp, hashOtp, verifyOtp, getOtpExpiry } = require('../utils/otp');
const { generateSessionId, signToken, setSessionCookie, clearSessionCookie } = require('../utils/session');
const { sendOtp, isDemoMode } = require('../services/demoService');

const MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10);
const LOCKOUT_MINUTES = parseInt(process.env.LOCKOUT_DURATION_MINUTES || '60', 10);

// POST /api/auth/register
async function register(req, res) {
  const { surname, email, phone, dob } = req.body;

  if (!surname || (!email && !phone) || !dob) {
    return res.status(400).json({ message: 'Please provide surname, contact, and date of birth.' });
  }

  // Check for duplicate registration
  if (email) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
  }

  if (phone) {
    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(409).json({ message: 'An account with this phone number already exists.' });
    }
  }

  // Create the user record (unverified until OTP is confirmed)
  const user = new User({
    surname: surname.trim(),
    email: email ? email.toLowerCase().trim() : undefined,
    phone: phone ? phone.trim() : undefined,
    dob: new Date(dob),
    isVerified: false,
  });

  // Generate and store an OTP for email/phone verification
  const otp = generateOtp();
  user.otpHash = await hashOtp(otp);
  user.otpExpiry = getOtpExpiry();
  user.otpAttempts = 0;

  await user.save();

  const identifier = email || phone;
  const channel = email ? 'email' : 'phone';
  const result = await sendOtp(identifier, otp, channel);

  const response = { message: 'Account created. Please verify your contact details.' };
  if (isDemoMode() && result.otp) {
    response.demoOtp = result.otp;
  }

  return res.status(201).json(response);
}

// POST /api/auth/send-otp  (login — sends OTP to existing user)
async function sendLoginOtp(req, res) {
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({ message: 'Please provide an email or phone number.' });
  }

  const user = await findUserByIdentifier(identifier);
  if (!user) {
    // Don't reveal whether the account exists
    return res.status(200).json({ message: 'If an account exists, a code has been sent.' });
  }

  // Check if the account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return res.status(423).json({
      message: 'Account is locked due to too many failed attempts.',
      lockedUntil: user.lockedUntil,
    });
  }

  const otp = generateOtp();
  user.otpHash = await hashOtp(otp);
  user.otpExpiry = getOtpExpiry();
  user.otpAttempts = 0;

  await user.save();

  const channel = user.email ? 'email' : 'phone';
  const result = await sendOtp(identifier, otp, channel);

  const response = { message: 'Verification code sent.' };
  if (isDemoMode() && result.otp) {
    response.demoOtp = result.otp;
  }

  return res.status(200).json(response);
}

// POST /api/auth/verify-otp
async function verifyOtpHandler(req, res) {
  const { identifier, otp, purpose } = req.body;

  if (!identifier || !otp) {
    return res.status(400).json({ message: 'Identifier and OTP are required.' });
  }

  const user = await findUserByIdentifier(identifier);
  if (!user) {
    return res.status(404).json({ message: 'Account not found.' });
  }

  // Check lockout
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return res.status(423).json({
      message: 'Account is locked. Please try again later.',
      lockedUntil: user.lockedUntil,
    });
  }

  // Check OTP exists and hasn't expired
  if (!user.otpHash || !user.otpExpiry) {
    return res.status(400).json({ message: 'No active verification code. Please request a new one.' });
  }

  if (new Date() > user.otpExpiry) {
    return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
  }

  // Verify the OTP
  const isCorrect = await verifyOtp(otp, user.otpHash);

  if (!isCorrect) {
    user.otpAttempts += 1;
    user.failedLoginAttempts += 1;

    // Lock the account after too many failures
    if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
      user.failedLoginAttempts = 0;
      await user.save();

      return res.status(423).json({
        message: `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`,
        lockedUntil: user.lockedUntil,
      });
    }

    await user.save();

    const remaining = MAX_ATTEMPTS - user.failedLoginAttempts;
    return res.status(400).json({
      message: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
    });
  }

  // OTP is correct — clear it so it can't be reused
  user.otpHash = null;
  user.otpExpiry = null;
  user.otpAttempts = 0;
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;

  if (purpose === 'registration') {
    user.isVerified = true;
  }

  // Create a new session (invalidates any other active session on another device)
  const sessionId = generateSessionId();
  user.activeSessionId = sessionId;
  user.lastLogin = new Date();

  await user.save();

  const token = signToken(user._id.toString(), sessionId);
  setSessionCookie(res, token);

  return res.status(200).json({
    message: 'Signed in successfully.',
    user: safeUser(user),
  });
}

// POST /api/auth/resend-otp
async function resendOtp(req, res) {
  const { identifier, purpose } = req.body;

  if (!identifier) {
    return res.status(400).json({ message: 'Identifier is required.' });
  }

  const user = await findUserByIdentifier(identifier);
  if (!user) {
    return res.status(200).json({ message: 'If an account exists, a new code has been sent.' });
  }

  // Prevent resend spam — enforce a cooldown
  if (user.otpExpiry) {
    const secondsSinceLastOtp = (user.otpExpiry - new Date()) / 1000;
    // If the OTP still has more than 4 minutes left, it was just generated
    if (secondsSinceLastOtp > 240) {
      return res.status(429).json({ message: 'Please wait before requesting another code.' });
    }
  }

  const otp = generateOtp();
  user.otpHash = await hashOtp(otp);
  user.otpExpiry = getOtpExpiry();
  user.otpAttempts = 0;
  await user.save();

  const channel = user.email ? 'email' : 'phone';
  const result = await sendOtp(identifier, otp, channel);

  const response = { message: 'A new code has been sent.' };
  if (isDemoMode() && result.otp) {
    response.demoOtp = result.otp;
  }

  return res.status(200).json(response);
}

// POST /api/auth/logout
async function logout(req, res) {
  if (req.user) {
    req.user.activeSessionId = null;
    await req.user.save();
  }
  clearSessionCookie(res);
  return res.status(200).json({ message: 'Signed out successfully.' });
}

// GET /api/auth/me
async function getMe(req, res) {
  return res.status(200).json({ user: safeUser(req.user) });
}

// ─── Helpers ────────────────────────────────────────────────────

function findUserByIdentifier(identifier) {
  const looksLikeEmail = identifier.includes('@');
  if (looksLikeEmail) {
    return User.findOne({ email: identifier.toLowerCase().trim() });
  }
  return User.findOne({ phone: identifier.trim() });
}

// Return only safe fields to the client
function safeUser(user) {
  return {
    id: user._id,
    surname: user.surname,
    email: user.email,
    phone: user.phone,
    isVerified: user.isVerified,
    lastLogin: user.lastLogin,
    hasPasskey: user.passkeys && user.passkeys.length > 0,
    createdAt: user.createdAt,
  };
}

module.exports = { register, sendLoginOtp, verifyOtpHandler, resendOtp, logout, getMe };
