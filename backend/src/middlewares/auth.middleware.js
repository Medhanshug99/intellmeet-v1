const jwt = require('jsonwebtoken');
const { AppError } = require('./error.middleware');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authorized to access this route. No token provided.', 401));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'fallback_secret');
      
      const dbUser = await User.findById(decoded.id).select('-__v');

      if (!dbUser) {
        return next(new AppError('The user belonging to this token no longer exists.', 401));
      }

      req.user = dbUser;
      next();
    } catch (error) {
      return next(new AppError('Not authorized to access this route. Token invalid or expired.', 401));
    }
  } catch (error) {
    next(error);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`User role ${req.user.role} is not authorized to access this route`, 403));
    }
    next();
  };
};

module.exports = { protect, authorize };
