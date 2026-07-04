const userService = require('../services/user.service');
const { sendSuccess } = require('../utils/response');


const getMe = async (req, res, next) => {
  try {
    const user = await userService.getUserProfile(req.user.id);
    return sendSuccess(res, 200, 'User profile retrieved successfully', user);
  } catch (error) {
    next(error);
  }
};


const updateMe = async (req, res, next) => {
  try {
    const updatedUser = await userService.updateUserProfile(req.user.id, req.body);
    return sendSuccess(res, 200, 'User profile updated successfully', updatedUser);
  } catch (error) {
    next(error);
  }
};

const deleteMe = async (req, res, next) => {
  try {
    await userService.deleteUserAccount(req.user.id);
    return sendSuccess(res, 200, 'User account deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMe,
  updateMe,
  deleteMe
};
