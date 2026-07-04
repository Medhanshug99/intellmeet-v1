const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { validate } = require('../middlewares/validate.middleware');
const { protect } = require('../middlewares/auth.middleware');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20, 
  message: { success: false, message: 'Too many authentication attempts from this IP, please try again after 15 minutes.' },
  standardHeaders: true, 
  legacyHeaders: false, 
});

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 10, 
  message: { success: false, message: 'Too many OTP requests from this IP, please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = express.Router();

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name can only contain letters, spaces, hyphens and apostrophes'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .isLength({ max: 254 }).withMessage('Email address is too long'),
];

const sendOtpValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address'),
  body('type')
    .notEmpty().withMessage('OTP type is required')
    .isIn(['signup', 'login']).withMessage('Type must be signup or login'),
];

const verifyOtpValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address'),
  body('token')
    .trim()
    .notEmpty().withMessage('Verification code is required')
    .isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits'),
  body('type')
    .notEmpty().withMessage('OTP type is required')
    .isIn(['signup', 'login']).withMessage('Type must be signup or login'),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

router.post('/register', authLimiter, registerValidation, validate, authController.register);
router.post('/login', authLimiter, loginValidation, validate, authController.login);
router.get('/check-email', authLimiter, authController.checkEmail);
router.post('/send-otp', otpLimiter, sendOtpValidation, validate, authController.sendOtp);
router.post('/verify-otp', authLimiter, verifyOtpValidation, validate, authController.verifyOtp);
router.post('/resend-otp', otpLimiter, sendOtpValidation, validate, authController.resendOtp);

router.post('/refresh', authController.refresh);
router.get('/me', protect, authController.me);
router.post('/logout', authController.logout);

module.exports = router;
