// In demo mode we don't send real emails or SMS messages.
// Instead we log the OTP to the console and return it in the API response.
// This makes it easy for evaluators to test the full flow.

function isDemoMode() {
  return process.env.DEMO_MODE === 'true';
}

async function sendOtp(identifier, otp, channel) {
  if (isDemoMode()) {
    console.log(`[DEMO] OTP for ${identifier}: ${otp}`);
    return { demo: true, otp };
  }

  // Real delivery — to be implemented with an email/SMS provider
  if (channel === 'email') {
    // TODO: plug in an email provider (e.g. Nodemailer, SendGrid)
    throw new Error('Email delivery not configured for production.');
  }

  if (channel === 'phone') {
    // TODO: plug in an SMS provider (e.g. Twilio)
    throw new Error('SMS delivery not configured for production.');
  }

  throw new Error('Unknown delivery channel: ' + channel);
}

module.exports = { sendOtp, isDemoMode };
