const nodemailer = require('nodemailer');

// Build the transporter once — reused for every email send
function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST   || 'smtp.gmail.com',
    port:   parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true', // true for port 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

// Send a plain-text + HTML OTP email
async function sendOtpEmail(toAddress, otp) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error(
      'Email credentials are not configured. Set EMAIL_USER and EMAIL_PASS in your .env file.'
    );
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"SecureAuth" <${process.env.EMAIL_USER}>`,
    to:   toAddress,
    subject: 'Your SecureAuth verification code',
    text: `Your SecureAuth verification code is: ${otp}\n\nThis code expires in 5 minutes. Do not share it with anyone.`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
        <h2 style="font-size: 20px; font-weight: 700; color: #111111; margin: 0 0 8px;">SecureAuth</h2>
        <p style="font-size: 14px; color: #555555; margin: 0 0 24px;">Your verification code</p>
        <div style="background: #f4f5f7; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #111111; font-family: monospace;">${otp}</span>
        </div>
        <p style="font-size: 13px; color: #888888; margin: 0;">
          This code expires in <strong>5 minutes</strong>. Do not share it with anyone.
        </p>
      </div>
    `,
  });
}

module.exports = { sendOtpEmail };
