const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

const User = require('../models/User');
const { generateSessionId, signToken, setSessionCookie } = require('../utils/session');

// Read WebAuthn config from environment
const RP_ID     = process.env.RP_ID     || 'localhost';
const RP_NAME   = process.env.RP_NAME   || 'SecureAuth';
const RP_ORIGIN = process.env.RP_ORIGIN || 'http://localhost:5173';

// ─── GET /api/webauthn/registration-options ───────────────────────────────────
// Generates a registration challenge for an authenticated user.
// The user must already be signed in (OTP login) to register a passkey.
async function getRegistrationOptions(req, res) {
  const user = req.user;

  // Build the list of existing credential IDs so the browser won't re-register them
  const excludeCredentials = user.passkeys.map((pk) => ({
    id:         pk.credentialID,
    type:       'public-key',
    transports: pk.transports,
  }));

  const options = await generateRegistrationOptions({
    rpName:               RP_NAME,
    rpID:                 RP_ID,
    userID:               user._id.toString(),
    userName:             user.email || user.phone,
    userDisplayName:      user.surname,
    attestationType:      'none',
    excludeCredentials,
    authenticatorSelection: {
      residentKey:        'preferred',
      userVerification:   'preferred',
      authenticatorAttachment: 'platform', // prefer built-in biometrics
    },
  });

  // Store the challenge — we'll verify it in the next step
  user.currentChallenge = options.challenge;
  await user.save();

  return res.status(200).json(options);
}

// ─── POST /api/webauthn/verify-registration ───────────────────────────────────
// Verifies the registration response from the browser and saves the credential.
async function verifyRegistration(req, res) {
  const user     = req.user;
  const { registrationResponse } = req.body;

  if (!registrationResponse) {
    return res.status(400).json({ message: 'Registration response is required.' });
  }

  if (!user.currentChallenge) {
    return res.status(400).json({ message: 'No active registration challenge. Please start over.' });
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response:             registrationResponse,
      expectedChallenge:    user.currentChallenge,
      expectedOrigin:       RP_ORIGIN,
      expectedRPID:         RP_ID,
      requireUserVerification: true,
    });
  } catch (err) {
    console.error('WebAuthn registration verification failed:', err.message);
    return res.status(400).json({ message: 'Passkey registration failed: ' + err.message });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return res.status(400).json({ message: 'Passkey registration could not be verified.' });
  }

  const { credential } = verification.registrationInfo;

  // Save the new credential to the user's passkeys array
  user.passkeys.push({
    credentialID:        credential.id,
    credentialPublicKey: Buffer.from(credential.publicKey).toString('base64url'),
    counter:             credential.counter,
    transports:          registrationResponse.response.transports || [],
  });

  user.currentChallenge = null;
  await user.save();

  return res.status(200).json({ message: 'Passkey registered successfully.' });
}

// ─── POST /api/webauthn/authentication-options ────────────────────────────────
// Generates an authentication challenge for a user who wants to sign in with biometrics.
async function getAuthenticationOptions(req, res) {
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({ message: 'Identifier is required.' });
  }

  const user = await findUserByIdentifier(identifier);
  if (!user || !user.isVerified) {
    // Don't reveal account existence
    return res.status(200).json({ message: 'If an account with a passkey exists, a challenge has been generated.' });
  }

  if (user.passkeys.length === 0) {
    return res.status(400).json({ message: 'No passkeys are registered for this account.' });
  }

  if (isAccountLocked(user)) {
    return res.status(423).json({
      message: 'Account is locked due to too many failed attempts.',
      lockedUntil: user.lockedUntil,
    });
  }

  if (user.activeSessionId) {
    return res.status(409).json({
      message: 'Your account is already active on another device.',
      alreadyActive: true,
    });
  }

  const allowCredentials = user.passkeys.map((pk) => ({
    id:         pk.credentialID,
    type:       'public-key',
    transports: pk.transports,
  }));

  const options = await generateAuthenticationOptions({
    rpID:                RP_ID,
    allowCredentials,
    userVerification:    'preferred',
  });

  user.currentChallenge = options.challenge;
  await user.save();

  return res.status(200).json(options);
}

// ─── POST /api/webauthn/verify-authentication ─────────────────────────────────
// Verifies the authentication response and creates a session.
async function verifyAuthentication(req, res) {
  const { identifier, authenticationResponse } = req.body;

  if (!identifier || !authenticationResponse) {
    return res.status(400).json({ message: 'Identifier and authentication response are required.' });
  }

  const user = await findUserByIdentifier(identifier);
  if (!user) {
    return res.status(404).json({ message: 'Account not found.' });
  }

  if (isAccountLocked(user)) {
    return res.status(423).json({
      message: 'Account is locked.',
      lockedUntil: user.lockedUntil,
    });
  }

  if (!user.currentChallenge) {
    return res.status(400).json({ message: 'No active authentication challenge.' });
  }

  if (user.activeSessionId) {
    return res.status(409).json({
      message: 'Your account is already active on another device.',
      alreadyActive: true,
    });
  }

  // Find the credential being used
  const passkey = user.passkeys.find(
    (pk) => pk.credentialID === authenticationResponse.id
  );

  if (!passkey) {
    return res.status(400).json({ message: 'This passkey is not registered on your account.' });
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response:          authenticationResponse,
      expectedChallenge: user.currentChallenge,
      expectedOrigin:    RP_ORIGIN,
      expectedRPID:      RP_ID,
      credential: {
        id:        passkey.credentialID,
        publicKey: Buffer.from(passkey.credentialPublicKey, 'base64url'),
        counter:   passkey.counter,
        transports: passkey.transports,
      },
      requireUserVerification: true,
    });
  } catch (err) {
    console.error('WebAuthn authentication verification failed:', err.message);
    return res.status(400).json({ message: 'Biometric authentication failed: ' + err.message });
  }

  if (!verification.verified) {
    return res.status(400).json({ message: 'Biometric authentication could not be verified.' });
  }

  // Update the counter to prevent replay attacks
  passkey.counter = verification.authenticationInfo.newCounter;
  user.currentChallenge    = null;
  user.failedLoginAttempts = 0;
  user.lockedUntil         = null;

  // Create a new session (enforces single-device rule)
  const sessionId       = generateSessionId();
  user.activeSessionId  = sessionId;
  user.lastLogin        = new Date();

  await user.save();

  const token = signToken(user._id.toString(), sessionId);
  setSessionCookie(res, token);

  return res.status(200).json({
    message: 'Signed in with biometrics successfully.',
    user: safeUser(user),
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
    hasPasskey: user.passkeys.length > 0,
    createdAt:  user.createdAt,
  };
}

module.exports = {
  getRegistrationOptions,
  verifyRegistration,
  getAuthenticationOptions,
  verifyAuthentication,
};
