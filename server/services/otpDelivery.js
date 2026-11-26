const { sendOtpEmail } = require('./emailService');
const { sendOtpSms }   = require('./smsService');

// Demo mode is only allowed in development.
// In production, even if DEMO_MODE=true is set, we refuse and log a warning.
function isDemoMode() {
  if (process.env.NODE_ENV === 'production' && process.env.DEMO_MODE === 'true') {
    console.warn('[SECURITY] DEMO_MODE=true is not allowed in production. Ignoring.');
    return false;
  }
  return process.env.DEMO_MODE === 'true';
}

// Delivers an OTP to the user's email or phone.
// In demo mode: skip delivery and return the OTP in the response so evaluators can test.
// In production: send a real email or SMS.
async function deliverOtp(identifier, otp, channel) {
  if (isDemoMode()) {
    console.log(`[DEMO] OTP for ${identifier} → ${otp}`);
    // Return the OTP so the controller can include it in the response
    return { demoOtp: otp };
  }

  if (channel === 'email') {
    await sendOtpEmail(identifier, otp);
    return {};
  }

  if (channel === 'phone') {
    await sendOtpSms(identifier, otp);
    return {};
  }

  throw new Error('Unknown delivery channel: ' + channel);
}

module.exports = { deliverOtp, isDemoMode };
