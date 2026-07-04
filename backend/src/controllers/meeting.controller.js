const meetingService = require('../services/meeting.service');
const { sendSuccess } = require('../utils/response');
const { AccessToken } = require('livekit-server-sdk');

const createMeeting = async (req, res, next) => {
  try {
    const meeting = await meetingService.createMeeting(req.body, req.user.id);
    return sendSuccess(res, 201, 'Meeting created successfully', meeting);
  } catch (error) {
    next(error);
  }
};

const getMeetings = async (req, res, next) => {
  try {
    const { workspaceId } = req.query;
    if (!workspaceId) {
      return res.status(400).json({ success: false, message: 'workspaceId query param is required' });
    }
    const meetings = await meetingService.getMeetingsByWorkspace(workspaceId, req.user.id);
    return sendSuccess(res, 200, 'Meetings retrieved successfully', meetings);
  } catch (error) {
    next(error);
  }
};

const getMeeting = async (req, res, next) => {
  try {
    const meeting = await meetingService.getMeetingById(req.params.id, req.user.id);
    return sendSuccess(res, 200, 'Meeting retrieved successfully', meeting);
  } catch (error) {
    next(error);
  }
};

const updateMeeting = async (req, res, next) => {
  try {
    const meeting = await meetingService.updateMeeting(req.params.id, req.body, req.user.id);
    return sendSuccess(res, 200, 'Meeting updated successfully', meeting);
  } catch (error) {
    next(error);
  }
};

const deleteMeeting = async (req, res, next) => {
  try {
    await meetingService.deleteMeeting(req.params.id, req.user.id);
    return sendSuccess(res, 200, 'Meeting deleted successfully');
  } catch (error) {
    next(error);
  }
};

const joinMeeting = async (req, res, next) => {
  try {
    const meeting = await meetingService.joinMeeting(req.params.id, req.user.id);
    return sendSuccess(res, 200, 'Joined meeting successfully', meeting);
  } catch (error) {
    next(error);
  }
};

const leaveMeeting = async (req, res, next) => {
  try {
    await meetingService.leaveMeeting(req.params.id, req.user.id);
    return sendSuccess(res, 200, 'Left meeting successfully');
  } catch (error) {
    next(error);
  }
};

const processMeetingAI = async (req, res, next) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ success: false, message: 'Transcript is required' });
    }
    const result = await meetingService.processMeetingAI(req.params.id, transcript, req.user.id);
    return sendSuccess(res, 200, 'Meeting processed successfully with AI', result);
  } catch (error) {
    next(error);
  }
};

const updateSummary = async (req, res, next) => {
  try {
    const meeting = await meetingService.updateMeetingSummary(req.params.id, req.body, req.user.id);
    return sendSuccess(res, 200, 'Meeting summary updated successfully', meeting);
  } catch (error) {
    next(error);
  }
};

const generateToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const participantName = req.user?.name || req.user?.email?.split('@')[0] || 'User';
    const participantId = req.user?.id || `user_${Math.floor(Math.random() * 10000)}`;

    await meetingService.joinMeeting(id, req.user.id);

    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      return res.status(500).json({ success: false, message: 'LiveKit credentials not configured on server' });
    }

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: participantId,
        name: participantName,
      }
    );

        at.addGrant({ 
      roomJoin: true, 
      room: id, 
      canPublish: true, 
      canSubscribe: true 
    });

        const token = await at.toJwt();
    return sendSuccess(res, 200, 'LiveKit token generated', { token });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMeeting,
  getMeetings,
  getMeeting,
  updateMeeting,
  deleteMeeting,
  joinMeeting,
  leaveMeeting,
  processMeetingAI,
  updateSummary,
  generateToken
};
