const Task = require('../models/Task');
const Workspace = require('../models/Workspace');
const { AppError } = require('../middlewares/error.middleware');

const isWorkspaceMember = (workspace, userId) => {
  const id = userId.toString();
  return workspace.memberIds.some((m) => m.userId.toString() === id);
};

const createTask = async (taskData, userId) => {
  const workspace = await Workspace.findById(taskData.workspace);

  if (!workspace || !isWorkspaceMember(workspace, userId)) {
    throw new AppError('Invalid workspace or unauthorized', 403);
  }

  const mongoData = {
    title: taskData.title || taskData.content,
    description: taskData.description,
    workspaceId: taskData.workspace,
    status: taskData.status || 'TODO',
    dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
    source: taskData.source || 'MANUAL',
  };

  if (taskData.meeting) mongoData.meetingId = taskData.meeting;
  if (taskData.owner || taskData.assignee) mongoData.assigneeId = taskData.owner || taskData.assignee;

  const task = await Task.create(mongoData);
  return task;
};

const getTasks = async (queryFilters, userId) => {
  if (!queryFilters.workspace) {
    throw new AppError('workspace ID is required to fetch tasks', 400);
  }

  const workspace = await Workspace.findById(queryFilters.workspace);

  if (!workspace || !isWorkspaceMember(workspace, userId)) {
    throw new AppError('Invalid workspace or unauthorized', 403);
  }

  const filter = { workspaceId: queryFilters.workspace };
  if (queryFilters.meeting) filter.meetingId = queryFilters.meeting;
  if (queryFilters.owner) filter.assigneeId = queryFilters.owner;
  if (queryFilters.status) filter.status = queryFilters.status;

  const tasks = await Task.find(filter)
    .populate('assigneeId', 'id displayName avatarUrl')
    .populate('meetingId', 'id title');

  return tasks;
};

const updateTask = async (taskId, updateData, userId) => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  const workspace = await Workspace.findById(task.workspaceId);

  if (!workspace || !isWorkspaceMember(workspace, userId)) {
    throw new AppError('Unauthorized to update this task', 403);
  }

  const mongoData = {};
  if (updateData.title !== undefined) mongoData.title = updateData.title;
  if (updateData.content !== undefined) mongoData.title = updateData.content; 
  if (updateData.description !== undefined) mongoData.description = updateData.description;
  if (updateData.status !== undefined) mongoData.status = updateData.status;
  if (updateData.dueDate !== undefined) mongoData.dueDate = new Date(updateData.dueDate);
  if (updateData.owner !== undefined) mongoData.assigneeId = updateData.owner || null;
  if (updateData.assignee !== undefined) mongoData.assigneeId = updateData.assignee || null;

  const updatedTask = await Task.findByIdAndUpdate(taskId, mongoData, { new: true, runValidators: true });

  return updatedTask;
};

const deleteTask = async (taskId, userId) => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  const workspace = await Workspace.findById(task.workspaceId);

  if (!workspace || !isWorkspaceMember(workspace, userId)) {
    throw new AppError('Unauthorized to delete this task', 403);
  }

  await Task.findByIdAndDelete(taskId);
  return null;
};

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask
};

