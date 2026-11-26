const jwt    = require('jsonwebtoken');
const crypto = require('crypto');

const SECRET      = process.env.SESSION_SECRET || 'fallback_dev_secret';
const COOKIE_NAME = 'sa_session';

function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

function signToken(userId, sessionId) {
  return jwt.sign({ userId, sessionId }, SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

function setSessionCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    // In production (cross-origin between Vercel frontend and backend),
    // cookies must be Secure and SameSite=None to be sent cross-origin.
    // In development they stay SameSite=Strict so local testing works.
    secure:   isProduction,
    sameSite: isProduction ? 'none' : 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

function clearSessionCookie(res) {
  const isProduction = process.env.NODE_ENV === 'production';

  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure:   isProduction,
    sameSite: isProduction ? 'none' : 'strict',
  });
}

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
