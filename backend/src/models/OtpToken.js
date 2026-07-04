const mongoose = require('mongoose');

const otpTokenSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  tokenHash: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5,
  },
}, { timestamps: true });

otpTokenSchema.index({ email: 1, type: 1 });

module.exports = mongoose.model('OtpToken', otpTokenSchema);
