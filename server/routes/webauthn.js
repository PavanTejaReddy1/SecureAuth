const express      = require('express');
const router       = express.Router();
const rateLimit    = require('express-rate-limit');
const asyncHandler = require('../middleware/asyncHandler');

const {
  getRegistrationOptions,
  verifyRegistration,
  getAuthenticationOptions,
  verifyAuthentication,
} = require('../controllers/webauthnController');

const authenticate = require('../middleware/authenticate');

const webauthnLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      10,
  message:  { message: 'Too many requests. Please wait a moment and try again.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// Registration requires the user to already be signed in
router.get('/registration-options',  authenticate,   asyncHandler(getRegistrationOptions));
router.post('/verify-registration',  authenticate,   asyncHandler(verifyRegistration));

// Authentication is public (identifier provided in body)
router.post('/authentication-options', webauthnLimiter, asyncHandler(getAuthenticationOptions));
router.post('/verify-authentication',  webauthnLimiter, asyncHandler(verifyAuthentication));

module.exports = router;
