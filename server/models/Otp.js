const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: [true, 'Please provide an OTP code'],
    },
    purpose: {
      type: String,
      enum: ['login', 'register', 'forgot-password'],
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300, // Document expires and auto-deletes in 5 minutes (300 seconds)
    },
  },
  {
    timestamps: true,
  }
);

// Add an index to speed up lookup by email and OTP code
otpSchema.index({ email: 1, otp: 1 });

const Otp = mongoose.model('Otp', otpSchema);
module.exports = Otp;
