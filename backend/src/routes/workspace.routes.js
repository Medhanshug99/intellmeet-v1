const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');
const workspaceController = require('../controllers/workspace.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .post(
    [
      body('name', 'Workspace name is required').trim().not().isEmpty(),
      body('name', 'Workspace name must be between 3 and 100 characters').isLength({ min: 3, max: 100 })
    ],
    validate,
    workspaceController.createWorkspace
  )
  .get(workspaceController.getWorkspaces);

router.route('/:id')
  .get(workspaceController.getWorkspace);

router.route('/:id/invites')
  .post(
    [body('userId', 'User ID is required to invite').not().isEmpty()],
    validate,
    workspaceController.inviteUser
  );

router.route('/:id/analytics')
  .get(workspaceController.getAnalytics);

module.exports = router;
