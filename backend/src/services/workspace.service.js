const mongoose = require('mongoose');
const Workspace = require('../models/Workspace');
const Meeting = require('../models/Meeting');
const Task = require('../models/Task');
const User = require('../models/User');
const { AppError } = require('../middlewares/error.middleware');

const isMember = (workspace, userId) => {
  const id = userId.toString();
  return workspace.memberIds.some((m) => m.userId.toString() === id);
};

const createWorkspace = async (workspaceData, userId) => {
  const workspace = await Workspace.create({
    name: workspaceData.name,
    ownerId: userId,
    memberIds: [{ userId, role: 'ADMIN' }]
  });
  
  await User.findByIdAndUpdate(userId, { $addToSet: { workspaceIds: workspace._id } });
  return workspace;
};

const getWorkspacesForUser = async (userId) => {
  const workspaces = await Workspace.find({ 'memberIds.userId': userId })
    .populate('ownerId', 'id displayName email')
    .populate('memberIds.userId', 'id displayName email avatarUrl');
  return workspaces;
};

const getWorkspaceById = async (workspaceId, userId) => {
  const workspace = await Workspace.findById(workspaceId)
    .populate('ownerId', 'id displayName email')
    .populate('memberIds.userId', 'id displayName email avatarUrl');

  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }

  if (!isMember(workspace, userId)) {
    throw new AppError('Not authorized to access this workspace', 403);
  }

  return workspace;
};

const inviteUserToWorkspace = async (workspaceId, userIdToInvite, requestUserId) => {
  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }

  if (workspace.ownerId.toString() !== requestUserId.toString()) {
    throw new AppError('Only workspace owner can invite members', 403);
  }

  if (isMember(workspace, userIdToInvite)) {
    throw new AppError('User is already a member', 400);
  }

  workspace.memberIds.push({ userId: userIdToInvite, role: 'MEMBER' });
  await workspace.save();

  await User.findByIdAndUpdate(userIdToInvite, { $addToSet: { workspaceIds: workspace._id } });

  return workspace.populate('memberIds.userId', 'id displayName email avatarUrl');
};

const getAnalyticsForWorkspace = async (workspaceId, userId) => {
  const workspace = await Workspace.findById(workspaceId);

  if (!workspace || !isMember(workspace, userId)) {
    throw new AppError('Not authorized', 403);
  }

  const [totalMeetings, completedMeetings, totalTasks, completedTasks] = await Promise.all([
    Meeting.countDocuments({ workspaceId }),
    Meeting.countDocuments({ workspaceId, status: 'COMPLETED' }),
    Task.countDocuments({ workspaceId }),
    Task.countDocuments({ workspaceId, status: 'DONE' }),
  ]);

  return {
    totalMeetings,
    completedMeetings,
    totalTasks,
    completedTasks,
    memberCount: workspace.memberIds.length,
  };
};

module.exports = {
  createWorkspace,
  getWorkspacesForUser,
  getWorkspaceById,
  inviteUserToWorkspace,
  getAnalyticsForWorkspace
};
