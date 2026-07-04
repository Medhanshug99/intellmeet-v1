const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { AppError } = require('../middlewares/error.middleware');

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_ACCESS_SECRET || 'fallback_secret',
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

const registerUser = async ({ name, email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new AppError(
      'An account with this email already exists. Please sign in instead.',
      409,
      [{ field: 'email', message: 'Email already registered' }]
    );
  }

  const userData = {
    name: name.trim(),
    displayName: name.trim(),
    email: normalizedEmail,
    role: 'MEMBER',
  };

  if (password) {
    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(password, salt);
  }

  const newUser = await User.create(userData);

  return {
    user: newUser,
    emailVerificationSent: false,
    message: 'Registration successful.',
  };
};

const checkUserExists = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('id email displayName');
  return user;
};

const loginUser = async (email, password) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.password) {
    throw new AppError('This account does not have a password set. Please log in with a code.', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const { accessToken, refreshToken } = generateTokens(user._id);

  const userObject = user.toObject();
  delete userObject.password;

  return { accessToken, refreshToken, user: userObject };
};

const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError('Refresh token required', 401);
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret');
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new AppError('Invalid token', 401);
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    return { accessToken, newRefreshToken, user };
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401);
  }
};

module.exports = {
  registerUser,
  loginUser,
  checkUserExists,
  generateTokens,
  refreshAccessToken,
};
