const workspaceService = require('../services/workspace.service');
const { sendSuccess } = require('../utils/response');

const createWorkspace = async (req, res, next) => {
  try {
    const workspace = await workspaceService.createWorkspace(req.body, req.user.id);
    return sendSuccess(res, 201, 'Workspace created successfully', workspace);
  } catch (error) {
    next(error);
  }
};

const getWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await workspaceService.getWorkspacesForUser(req.user.id);
    return sendSuccess(res, 200, 'Workspaces retrieved successfully', workspaces);
  } catch (error) {
    next(error);
  }
};

const getWorkspace = async (req, res, next) => {
  try {
    const workspace = await workspaceService.getWorkspaceById(req.params.id, req.user.id);
    return sendSuccess(res, 200, 'Workspace retrieved successfully', workspace);
  } catch (error) {
    next(error);
  }
};

const inviteUser = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const workspace = await workspaceService.inviteUserToWorkspace(req.params.id, userId, req.user.id);
    return sendSuccess(res, 200, 'User invited successfully', workspace);
  } catch (error) {
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const data = await workspaceService.getAnalyticsForWorkspace(req.params.id, req.user.id);
    return sendSuccess(res, 200, 'Analytics retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  inviteUser,
  getAnalytics
};
