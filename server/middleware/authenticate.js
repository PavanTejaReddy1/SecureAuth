const User = require('../models/User');
const { getTokenFromRequest, verifyToken } = require('../utils/session');

// Protects routes that require an authenticated session.
// Reads the HTTP-only cookie, verifies the JWT, checks the session
// is still the active one on the user record, then attaches the user to req.user.
async function authenticate(req, res, next) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ message: 'Not authenticated. Please sign in.' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Session expired. Please sign in again.' });
  }

  try {
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Account not found.' });
    }

    // Single active session check — reject if this is not the current session
    if (user.activeSessionId !== decoded.sessionId) {
      return res.status(401).json({ message: 'This session has been signed out from another device.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(500).json({ message: 'Server error during authentication.' });
  }
}

module.exports = authenticate;
