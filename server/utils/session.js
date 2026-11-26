const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const SECRET = process.env.SESSION_SECRET || 'fallback_dev_secret';
const COOKIE_NAME = 'sa_session';

// Generate a unique session ID
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

// Sign a JWT containing the user id and a unique session id
function signToken(userId, sessionId) {
  return jwt.sign(
    { userId, sessionId },
    SECRET,
    { expiresIn: '7d' }
  );
}

// Verify and decode a JWT — returns null if invalid
function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

// Set an HTTP-only session cookie on the response
function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// Clear the session cookie
function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
}

// Read the session token from the request cookies
function getTokenFromRequest(req) {
  return req.cookies[COOKIE_NAME] || null;
}

module.exports = {
  generateSessionId,
  signToken,
  verifyToken,
  setSessionCookie,
  clearSessionCookie,
  getTokenFromRequest,
  COOKIE_NAME,
};
