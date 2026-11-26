const express = require('express');
const router  = express.Router();
const rateLimit = require('express-rate-limit');

const {
  getRegistrationOptions,
  verifyRegistration,
  getAuthenticationOptions,
  verifyAuthentication,
} = require('../controllers/webauthnController');

const authenticate = require('../middleware/authenticate');

// Rate limiter — tighter limit for biometric endpoints
const webauthnLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      10,
  message: { message: 'Too many requests. Please wait a moment and try again.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// Registration — requires the user to already be authenticated (OTP login first)
router.get('/registration-options',  authenticate, getRegistrationOptions);
router.post('/verify-registration',  authenticate, verifyRegistration);

// Authentication — public endpoints (identifier passed in body)
router.post('/authentication-options', webauthnLimiter, getAuthenticationOptions);
router.post('/verify-authentication',  webauthnLimiter, verifyAuthentication);

module.exports = router;
