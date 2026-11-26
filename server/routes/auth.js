const express      = require('express');
const router       = express.Router();
const rateLimit    = require('express-rate-limit');
const asyncHandler = require('../middleware/asyncHandler');

const {
  register,
  sendLoginOtp,
  verifyOtpHandler,
  resendOtp,
  logout,
  getMe,
} = require('../controllers/authController');

const authenticate = require('../middleware/authenticate');

// General limiter — covers register, send-otp, resend-otp
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      20,
  message:  { message: 'Too many requests. Please wait a moment and try again.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// Strict limiter for OTP verification only
const verifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      10,
  message:  { message: 'Too many verification attempts. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

router.post('/register',   generalLimiter, asyncHandler(register));
router.post('/send-otp',   generalLimiter, asyncHandler(sendLoginOtp));
router.post('/verify-otp', verifyLimiter,  asyncHandler(verifyOtpHandler));
router.post('/resend-otp', generalLimiter, asyncHandler(resendOtp));
router.post('/logout',     authenticate,   asyncHandler(logout));
router.get('/me',          authenticate,   asyncHandler(getMe));

module.exports = router;
