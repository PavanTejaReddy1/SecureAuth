// SMS delivery via Twilio
// To enable: set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER in .env
// then run: npm install twilio

async function sendOtpSms(phoneNumber, otp) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error(
      'SMS credentials are not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in your .env file.'
    );
  }

  // Dynamically require twilio so the app still starts if the package isn't installed
  let twilio;
  try {
    twilio = require('twilio');
  } catch {
    throw new Error(
      'Twilio package is not installed. Run: npm install twilio'
    );
  }

  const client = twilio(accountSid, authToken);

  await client.messages.create({
    body: `Your SecureAuth verification code is: ${otp}. It expires in 5 minutes.`,
    from: fromNumber,
    to:   phoneNumber,
  });
}

module.exports = { sendOtpSms };
