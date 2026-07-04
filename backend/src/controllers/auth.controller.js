const authService = require('../services/auth.service');
const otpService = require('../services/otp.service');
const { sendSuccess } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const result = await authService.registerUser({ name, email, password });
    return sendSuccess(res, 201, result.message, {
      user: result.user,
      emailVerificationSent: result.emailVerificationSent,
    });
  } catch (error) {
    next(error);
  }
};

const checkEmail = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'A valid email is required',
        data: { exists: null },
      });
    }
    const user = await authService.checkUserExists(email);
    return sendSuccess(res, 200, 'Email check complete', { exists: !!user });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const { accessToken, refreshToken, user } = await authService.loginUser(email, password);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return sendSuccess(res, 200, 'Logged in successfully.', { accessToken, user });
  } catch (error) {
    next(error);
  }
};

const sendOtp = async (req, res, next) => {
  try {
    const { email, type } = req.body;
    if (!email || !['signup', 'login'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Valid email and type required.' });
    }
    await otpService.generateAndSendOtp(email, type);
    return sendSuccess(res, 200, 'Verification code sent. Check your inbox.', { sent: true });
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, token, type } = req.body;
    if (!email || !token || !['signup', 'login'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Email, token, and type are required.' });
    }

    const { tokens, user } = await otpService.verifyOtpToken(email, token, type);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return sendSuccess(res, 200, 'Code verified successfully.', { accessToken: tokens.accessToken, user });
  } catch (error) {
    next(error);
  }
};

const resendOtp = async (req, res, next) => {
  return sendOtp(req, res, next);
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const { accessToken, newRefreshToken, user } = await authService.refreshAccessToken(refreshToken);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return sendSuccess(res, 200, 'Token refreshed successfully.', { accessToken, user });
  } catch (error) {
    res.clearCookie('refreshToken');
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    // req.user is set by auth middleware
    return sendSuccess(res, 200, 'User profile fetched successfully', req.user);
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    res.clearCookie('refreshToken');
    return sendSuccess(res, 200, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, checkEmail, sendOtp, verifyOtp, resendOtp, refresh, me, logout };
