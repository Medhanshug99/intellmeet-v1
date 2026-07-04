const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');
const taskController = require('../controllers/task.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .post(
    [
      body('content', 'Task content is required').trim().not().isEmpty(),
      body('workspace', 'Workspace ID is required').not().isEmpty()
    ],
    validate,
    taskController.createTask
  )
  .get(taskController.getTasks);

router.route('/:id')
  .patch(
    [
      body('status').optional().isIn(['Todo', 'InProgress', 'Done']).withMessage('Invalid status')
    ],
    validate,
    taskController.updateTask
  )
  .delete(taskController.deleteTask);

module.exports = router;
