const crypto = require('crypto');
const OtpToken = require('../models/OtpToken');
const User = require('../models/User');
const { sendOtpEmail } = require('./mailer.service');
const { AppError } = require('../middlewares/error.middleware');
const { generateTokens } = require('./auth.service');

const OTP_EXPIRY_MINUTES = 10;
const OTP_COOLDOWN_SECONDS = 60; 

const generateNumericOtp = () => {
  const buf = crypto.randomInt(100000, 999999);
  return String(buf);
};

const generateAndSendOtp = async (email, type) => {
  const normalizedEmail = email.toLowerCase();

  if (type === 'login') {
    const user = await User.findOne({ email: normalizedEmail }).select('_id');
    if (!user) {
      throw new AppError('No account found with this email. Please sign up first.', 404);
    }
  }

  const recent = await OtpToken.findOne({
    email: normalizedEmail,
    type,
    createdAt: { $gte: new Date(Date.now() - OTP_COOLDOWN_SECONDS * 1000) },
  }).sort({ createdAt: -1 });

  if (recent) {
    const waitSec = Math.ceil(
      (recent.createdAt.getTime() + OTP_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000
    );
    throw new AppError(
      `Please wait ${waitSec} second(s) before requesting another code.`,
      429
    );
  }

  await OtpToken.updateMany(
    { email: normalizedEmail, type, isUsed: false },
    { $set: { isUsed: true } }
  );

  const token = generateNumericOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await OtpToken.create({
    email: normalizedEmail,
    tokenHash: token,
    type,
    expiresAt,
  });

  await sendOtpEmail(email, token, type);

  return { sent: true };
};

const verifyOtpToken = async (email, token, type) => {
  const normalizedEmail = email.toLowerCase();
  
  const record = await OtpToken.findOne({
    email: normalizedEmail,
    type,
    isUsed: false,
  }).sort({ createdAt: -1 });

  if (!record) {
    throw new AppError('Invalid verification code. Please check and try again.', 400);
  }

  if (record.attempts >= 5) {
    throw new AppError('Too many failed attempts. This code is now locked. Please request a new one.', 403);
  }

  if (record.expiresAt < new Date()) {
    throw new AppError('This code has expired. Please request a new one.', 400);
  }

  if (record.tokenHash !== token) {
    record.attempts += 1;
    await record.save();
    
    const remaining = 5 - record.attempts;
    throw new AppError(`Invalid code. ${remaining} attempts remaining.`, 400);
  }

  record.isUsed = true;
  await record.save();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
     throw new AppError('User not found. Please register first.', 404);
  }

  const tokens = generateTokens(user._id);

  return { tokens, user };
};

module.exports = { generateAndSendOtp, verifyOtpToken };
