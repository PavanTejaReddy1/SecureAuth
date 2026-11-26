const express = require('express');
const router  = express.Router();
const rateLimit = require('express-rate-limit');

const {
  register,
  sendLoginOtp,
  verifyOtpHandler,
  resendOtp,
  logout,
  getMe,
} = require('../controllers/authController');

const authenticate = require('../middleware/authenticate');

// General limiter — 20 requests per minute per IP
// Covers register, send-otp, resend-otp
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { message: 'Too many requests. Please wait a moment and try again.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// Strict limiter for OTP verification — 10 per minute
// This is the endpoint that enforces the 5-attempt lockout.
// Keeping it separate means the general endpoints won't consume this budget.
const verifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Too many verification attempts. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

router.post('/register',   generalLimiter, register);
router.post('/send-otp',   generalLimiter, sendLoginOtp);
router.post('/verify-otp', verifyLimiter,  verifyOtpHandler);
router.post('/resend-otp', generalLimiter, resendOtp);
router.post('/logout',     authenticate,   logout);
router.get('/me',          authenticate,   getMe);

module.exports = router;
