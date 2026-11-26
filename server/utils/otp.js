const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Generate a secure random 6-digit OTP
function generateOtp() {
  // Use crypto for randomness — not Math.random()
  const buffer = crypto.randomBytes(4);
  const number = buffer.readUInt32BE(0) % 1000000;
  // Pad to 6 digits
  return String(number).padStart(6, '0');
}

// Hash the OTP before storing it in the database
async function hashOtp(otp) {
  const saltRounds = 10;
  return bcrypt.hash(otp, saltRounds);
}

// Compare a plain OTP against its stored hash
async function verifyOtp(plainOtp, hashedOtp) {
  return bcrypt.compare(plainOtp, hashedOtp);
}

// Returns a Date object for OTP expiry
function getOtpExpiry() {
  const minutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutes);
  return expiry;
}

module.exports = { generateOtp, hashOtp, verifyOtp, getOtpExpiry };
