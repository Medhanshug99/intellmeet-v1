
const sendSuccess = (res, statusCode, message, data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const successResponse = (res, statusCode, message, data = {}) =>
  sendSuccess(res, statusCode, message, data);

const errorResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = {
  sendSuccess,
  successResponse,
  errorResponse,
};
