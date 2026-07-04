const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');
const meetingController = require('../controllers/meeting.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .post(
    [
      body('title', 'Title is required').not().isEmpty(),
      body('workspace', 'Workspace ID is required').not().isEmpty(),
      body('scheduledStartTime', 'Scheduled start time is required').isISO8601()
    ],
    validate,
    meetingController.createMeeting
  )
  .get(meetingController.getMeetings);

router.route('/:id')
  .get(meetingController.getMeeting)
  .patch(meetingController.updateMeeting)
  .delete(meetingController.deleteMeeting);

router.post('/:id/join', meetingController.joinMeeting);
router.post('/:id/leave', meetingController.leaveMeeting);
router.post('/:id/process-ai', meetingController.processMeetingAI);
router.patch('/:id/summary', meetingController.updateSummary);
router.get('/:id/token', meetingController.generateToken);

module.exports = router;
