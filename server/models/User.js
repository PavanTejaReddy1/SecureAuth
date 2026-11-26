const mongoose = require('mongoose');

// Schema for a single WebAuthn passkey credential
const passkeySchema = new mongoose.Schema({
  credentialID:        { type: String, required: true },
  credentialPublicKey: { type: String, required: true }, // base64url encoded
  counter:             { type: Number, required: true, default: 0 },
  transports:          { type: [String], default: [] },
  createdAt:           { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    surname: {
      type:     String,
      required: true,
      trim:     true,
    },

    // A user registers with either an email or a phone number
    email: {
      type:      String,
      unique:    true,
      sparse:    true,  // sparse so multiple null values are allowed
      lowercase: true,
      trim:      true,
    },
    phone: {
      type:   String,
      unique: true,
      sparse: true,
      trim:   true,
    },

    dob: {
      type:     Date,
      required: true,
    },

    isVerified: {
      type:    Boolean,
      default: false,
    },

    // OTP fields — cleared after successful verification
    otpHash:     { type: String,  default: null },
    otpExpiry:   { type: Date,    default: null },
    otpAttempts: { type: Number,  default: 0    },

    // Account lockout
    lockedUntil:         { type: Date,   default: null },
    failedLoginAttempts: { type: Number, default: 0    },

    // Single active device — stores the current session ID
    activeSessionId: { type: String, default: null },

    lastLogin: { type: Date, default: null },

    // WebAuthn passkey credentials
    passkeys: { type: [passkeySchema], default: [] },

    // Temporary WebAuthn challenge — stored during registration/auth flow
    // Cleared after verification
    currentChallenge: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
