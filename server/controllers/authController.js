const User = require('../models/User');
const { generateOtp, hashOtp, verifyOtp, getOtpExpiry } = require('../utils/otp');
const { generateSessionId, signToken, setSessionCookie, clearSessionCookie } = require('../utils/session');
const { deliverOtp } = require('../services/otpDelivery');

const MAX_ATTEMPTS    = parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10);
const LOCKOUT_MINUTES = parseInt(process.env.LOCKOUT_DURATION_MINUTES || '60', 10);
const RESEND_COOLDOWN = 60; // seconds

// ─── POST /api/auth/register ──────────────────────────────────────────────────
async function register(req, res) {
  const { surname, email, phone, dob } = req.body;

  if (!surname || (!email && !phone) || !dob) {
    return res.status(400).json({ message: 'Please provide surname, email or phone, and date of birth.' });
  }

  if (email && !email.includes('@')) {
    return res.status(400).json({ message: 'Please provide a valid email address.' });
  }

  // Prevent duplicate registrations
  if (email) {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing && existing.isVerified) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    // If existing but unverified (incomplete earlier registration), delete and re-register
    if (existing && !existing.isVerified) {
      await User.deleteOne({ _id: existing._id });
    }
  }

  if (phone) {
    const existing = await User.findOne({ phone: phone.trim() });
    if (existing && existing.isVerified) {
      return res.status(409).json({ message: 'An account with this phone number already exists.' });
    }
    if (existing && !existing.isVerified) {
      await User.deleteOne({ _id: existing._id });
    }
  }

  const otp = generateOtp();

  const user = new User({
    surname:     surname.trim(),
    email:       email ? email.toLowerCase().trim() : undefined,
    phone:       phone ? phone.trim() : undefined,
    dob:         new Date(dob),
    isVerified:  false,
    otpHash:     await hashOtp(otp),
    otpExpiry:   getOtpExpiry(),
    otpAttempts: 0,
  });

  await user.save();

  const identifier = email || phone;
  const channel    = email ? 'email' : 'phone';
  const delivery   = await deliverOtp(identifier, otp, channel);

  const response = { message: 'Account created. Please verify your contact details.' };
  if (delivery.demoOtp) response.demoOtp = delivery.demoOtp;

  return res.status(201).json(response);
}

// ─── POST /api/auth/send-otp ──────────────────────────────────────────────────
async function sendLoginOtp(req, res) {
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({ message: 'Please provide an email or phone number.' });
  }

  const user = await findUserByIdentifier(identifier);

  if (!user) {
    return res.status(404).json({ message: 'No account found with this email or phone number. Please register first.' });
  }

  if (!user.isVerified) {
    return res.status(403).json({ message: 'This account has not been verified yet. Please complete registration.' });
  }

  if (isAccountLocked(user)) {
    return res.status(423).json({
      message: 'Your account is locked due to too many failed attempts. Please try again later.',
      lockedUntil: user.lockedUntil,
    });
  }

  if (user.activeSessionId) {
    return res.status(409).json({
      message: 'Your account is already active on another device. Please sign out from that device first.',
      alreadyActive: true,
    });
  }

  const otp = generateOtp();

  // Use $set to update only OTP fields — avoids Mongoose full-document validation
  // which would fail on any legacy document missing required fields
  await User.updateOne(
    { _id: user._id },
    { $set: { otpHash: await hashOtp(otp), otpExpiry: getOtpExpiry(), otpAttempts: 0 } }
  );

  const channel  = user.email ? 'email' : 'phone';
  const delivery = await deliverOtp(identifier, otp, channel);

  const response = { message: 'Verification code sent.' };
  if (delivery.demoOtp) response.demoOtp = delivery.demoOtp;

  return res.status(200).json(response);
}

// ─── POST /api/auth/verify-otp ────────────────────────────────────────────────
async function verifyOtpHandler(req, res) {
  const { identifier, otp, purpose } = req.body;

  if (!identifier || !otp) {
    return res.status(400).json({ message: 'Identifier and OTP are required.' });
  }

  // Re-fetch the user freshly so we have the latest otpHash just set by updateOne
  const user = await findUserByIdentifier(identifier);
  if (!user) {
    return res.status(404).json({ message: 'Account not found.' });
  }

  if (isAccountLocked(user)) {
    return res.status(423).json({
      message: 'Your account is locked. Please try again later.',
      lockedUntil: user.lockedUntil,
    });
  }

  if (!user.otpHash || !user.otpExpiry) {
    return res.status(400).json({ message: 'No active verification code. Please request a new one.' });
  }

  if (new Date() > user.otpExpiry) {
    return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
  }

  const isCorrect = await verifyOtp(otp, user.otpHash);

  if (!isCorrect) {
    const newAttempts = (user.failedLoginAttempts || 0) + 1;

    if (newAttempts >= MAX_ATTEMPTS) {
      const lockExpiry = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
      await User.updateOne(
        { _id: user._id },
        { $set: { lockedUntil: lockExpiry, failedLoginAttempts: 0, otpAttempts: newAttempts } }
      );
      return res.status(423).json({
        message: `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`,
        lockedUntil: lockExpiry,
      });
    }

    await User.updateOne(
      { _id: user._id },
      { $set: { failedLoginAttempts: newAttempts, otpAttempts: newAttempts } }
    );

    const remaining = MAX_ATTEMPTS - newAttempts;
    return res.status(400).json({
      message: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      attemptsRemaining: remaining,
    });
  }

  // OTP is correct — enforce single active device for login
  if (purpose === 'login' && user.activeSessionId) {
    return res.status(409).json({
      message: 'Your account is already active on another device. Please sign out from that device first.',
      alreadyActive: true,
    });
  }

  // Create the new session
  const sessionId = generateSessionId();
  const now       = new Date();

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        otpHash:             null,
        otpExpiry:           null,
        otpAttempts:         0,
        failedLoginAttempts: 0,
        lockedUntil:         null,
        isVerified:          purpose === 'registration' ? true : user.isVerified,
        activeSessionId:     sessionId,
        lastLogin:           now,
      },
    }
  );

  // Fetch the updated user to return safe fields
  const updatedUser = await User.findById(user._id);

  const token = signToken(updatedUser._id.toString(), sessionId);
  setSessionCookie(res, token);

  return res.status(200).json({
    message: 'Signed in successfully.',
    user:    safeUser(updatedUser),
  });
}

// ─── POST /api/auth/resend-otp ────────────────────────────────────────────────
async function resendOtp(req, res) {
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({ message: 'Identifier is required.' });
  }

  const user = await findUserByIdentifier(identifier);
  if (!user) {
    return res.status(200).json({ message: 'If an account exists, a new code has been sent.' });
  }

  if (isAccountLocked(user)) {
    return res.status(423).json({
      message: 'Your account is locked. Please try again later.',
      lockedUntil: user.lockedUntil,
    });
  }

  // Enforce the 60-second cooldown
  if (user.otpExpiry) {
    const secondsRemaining = Math.floor((user.otpExpiry - Date.now()) / 1000);
    if (secondsRemaining > 300 - RESEND_COOLDOWN) {
      return res.status(429).json({
        message: `Please wait ${RESEND_COOLDOWN} seconds before requesting another code.`,
      });
    }
  }

  const otp = generateOtp();

  await User.updateOne(
    { _id: user._id },
    { $set: { otpHash: await hashOtp(otp), otpExpiry: getOtpExpiry(), otpAttempts: 0 } }
  );

  const channel  = user.email ? 'email' : 'phone';
  const delivery = await deliverOtp(identifier, otp, channel);

  const response = { message: 'A new code has been sent.' };
  if (delivery.demoOtp) response.demoOtp = delivery.demoOtp;

  return res.status(200).json(response);
}

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
async function logout(req, res) {
  if (req.user) {
    await User.updateOne({ _id: req.user._id }, { $set: { activeSessionId: null } });
  }
  clearSessionCookie(res);
  return res.status(200).json({ message: 'Signed out successfully.' });
}

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
async function getMe(req, res) {
  return res.status(200).json({ user: safeUser(req.user) });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findUserByIdentifier(identifier) {
  if (identifier.includes('@')) {
    return User.findOne({ email: identifier.toLowerCase().trim() });
  }
  return User.findOne({ phone: identifier.trim() });
}

function isAccountLocked(user) {
  return user.lockedUntil && user.lockedUntil > new Date();
}

function safeUser(user) {
  return {
    id:         user._id,
    surname:    user.surname,
    email:      user.email,
    phone:      user.phone,
    isVerified: user.isVerified,
    lastLogin:  user.lastLogin,
    hasPasskey: user.passkeys && user.passkeys.length > 0,
    createdAt:  user.createdAt,
  };
}

module.exports = { register, sendLoginOtp, verifyOtpHandler, resendOtp, logout, getMe };
