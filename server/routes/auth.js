const express = require('express');
const router = express.Router();
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

// Rate limiter for auth routes — 10 requests per minute per IP
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Too many requests. Please wait a moment and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register',    authLimiter, register);
router.post('/send-otp',    authLimiter, sendLoginOtp);
router.post('/verify-otp',  authLimiter, verifyOtpHandler);
router.post('/resend-otp',  authLimiter, resendOtp);
router.post('/logout',      authenticate, logout);
router.get('/me',           authenticate, getMe);

module.exports = router;
