const { validationResult } = require('express-validator');
const { AppError } = require('./error.middleware');


const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {

    const extractedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));

        return next(new AppError('Validation failed', 400, extractedErrors));
  }
  next();
};

module.exports = { validate };
