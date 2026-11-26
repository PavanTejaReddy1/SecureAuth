const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    surname: {
      type: String,
      required: true,
      trim: true,
    },

    // A user registers with either an email or a phone — not both required
    email: {
      type: String,
      unique: true,
      sparse: true,   // sparse allows multiple null values
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    dob: {
      type: Date,
      required: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    // OTP fields
    otpHash: {
      type: String,
      default: null,
    },
    otpExpiry: {
      type: Date,
      default: null,
    },
    otpAttempts: {
      type: Number,
      default: 0,
    },

    // Account lockout
    lockedUntil: {
      type: Date,
      default: null,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    // Single active session — store the current session token id
    activeSessionId: {
      type: String,
      default: null,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    // WebAuthn passkey credentials (added in Phase 7)
    passkeys: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
