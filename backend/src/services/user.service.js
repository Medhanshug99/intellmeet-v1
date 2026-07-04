const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Meeting = require('../models/Meeting');
const Task = require('../models/Task');
const OtpToken = require('../models/OtpToken');
const { AppError } = require('../middlewares/error.middleware');

const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('-__v');
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user;
};

const updateUserProfile = async (userId, updateData) => {
  const allowed = ['name', 'avatarUrl', 'displayName'];
  const cleanData = {};
  for (const key of allowed) {
    if (updateData[key] !== undefined) cleanData[key] = updateData[key];
  }

  if (updateData.password !== undefined) {
    throw new AppError('This route is not for password updates', 400);
  }
  if (updateData.role !== undefined) {
    throw new AppError('Role cannot be changed via this route', 403);
  }
  if (updateData.email !== undefined) {
    throw new AppError('Email change is not supported in v1', 400);
  }

  if (cleanData.name && !cleanData.displayName) {
    cleanData.displayName = cleanData.name;
  }

  const user = await User.findByIdAndUpdate(userId, cleanData, { new: true, runValidators: true }).select('-__v');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

const deleteUserAccount = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  const workspaces = await Workspace.find({ ownerId: userId }).select('_id');
  const workspaceIds = workspaces.map(w => w._id);

  const meetings = await Meeting.find({
    $or: [
      { hostId: userId },
      ...(workspaceIds.length > 0 ? [{ workspaceId: { $in: workspaceIds } }] : [])
    ]
  }).select('_id');
  const meetingIds = meetings.map(m => m._id);

  await Task.deleteMany({
    $or: [
      { assigneeId: userId },
      ...(workspaceIds.length > 0 ? [{ workspaceId: { $in: workspaceIds } }] : []),
      ...(meetingIds.length > 0 ? [{ meetingId: { $in: meetingIds } }] : [])
    ]
  });

  if (meetingIds.length > 0) {
    await Meeting.deleteMany({ _id: { $in: meetingIds } });
  }

  if (workspaceIds.length > 0) {
    await Workspace.deleteMany({ _id: { $in: workspaceIds } });
  }

  await OtpToken.deleteMany({ email: user.email });

  await User.findByIdAndDelete(userId);
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  deleteUserAccount
};
