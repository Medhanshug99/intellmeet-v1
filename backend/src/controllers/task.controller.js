const taskService = require('../services/task.service');
const { sendSuccess } = require('../utils/response');

const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.body, req.user.id);
    return sendSuccess(res, 201, 'Task created successfully', task);
  } catch (error) {
    next(error);
  }
};

const getTasks = async (req, res, next) => {
  try {

    const queryFilters = {};
    if (req.query.workspace) queryFilters.workspace = req.query.workspace;
    if (req.query.meeting) queryFilters.meeting = req.query.meeting;
    if (req.query.status) queryFilters.status = req.query.status;

    const tasks = await taskService.getTasks(queryFilters, req.user.id);
    return sendSuccess(res, 200, 'Tasks retrieved successfully', tasks);
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.body, req.user.id);
    return sendSuccess(res, 200, 'Task updated successfully', task);
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    await taskService.deleteTask(req.params.id, req.user.id);
    return sendSuccess(res, 200, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask
};
